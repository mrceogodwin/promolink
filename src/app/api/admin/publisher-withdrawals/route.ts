import { sameOriginError } from "@/lib/request-security";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
 const user=await getSessionUser(); if(!user)return NextResponse.json({error:"Sign in required."},{status:401});
 if(user.role!=="admin")return NextResponse.json({error:"Administrator access required."},{status:403});
 if(!process.env.DATABASE_URL)return NextResponse.json({error:"Database is not configured."},{status:503});
 try { const sql=neon(process.env.DATABASE_URL);
 const requests=await sql`SELECT r.id,r.publisher_id,r.amount_minor::text,r.currency,r.status,r.publisher_note,r.admin_note,r.created_at,r.reviewed_at,u.name AS publisher_name,u.email AS publisher_email FROM publisher_withdrawal_requests r JOIN users u ON u.id=r.publisher_id ORDER BY CASE WHEN r.status='requested' THEN 0 WHEN r.status='approved' THEN 1 ELSE 2 END,r.created_at ASC LIMIT 250`;
 return NextResponse.json({requests}); } catch(e) { console.error("Withdrawal queue read failed",e instanceof Error?e.message:"unknown"); return NextResponse.json({error:"Could not load withdrawal queue. Confirm migration 011 is applied."},{status:503}); }
}
export async function PATCH(request:Request) {
 const originError=sameOriginError(request); if(originError)return originError;
 const user=await getSessionUser(); if(!user)return NextResponse.json({error:"Sign in required."},{status:401});
 if(user.role!=="admin")return NextResponse.json({error:"Administrator access required."},{status:403});
 if(!process.env.DATABASE_URL)return NextResponse.json({error:"Database is not configured."},{status:503});
 const raw=await request.text(); if(Buffer.byteLength(raw,"utf8")>4096)return NextResponse.json({error:"Request body too large."},{status:413});
 let body:{request_id?:unknown;decision?:unknown;admin_note?:unknown}; try{body=JSON.parse(raw);}catch{return NextResponse.json({error:"Invalid JSON."},{status:400});}
 const id=typeof body.request_id==="string"?body.request_id:"", decision=body.decision, note=typeof body.admin_note==="string"?body.admin_note.trim():"";
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))return NextResponse.json({error:"Valid request_id required."},{status:400});
 if(decision!=="approve"&&decision!=="reject")return NextResponse.json({error:"Decision must be approve or reject."},{status:400});
 if(note.length>1000)return NextResponse.json({error:"Admin note too long."},{status:400});
 try { const sql=neon(process.env.DATABASE_URL);
 const rows=await sql`WITH changed AS (
 UPDATE publisher_withdrawal_requests SET status=${decision==="approve"?"approved":"rejected"},admin_note=NULLIF(${note},''),reviewed_by=${user.id},reviewed_at=now(),updated_at=now()
 WHERE id=${id}::uuid AND status='requested' RETURNING id,publisher_id,amount_minor,currency,status
 ), logged AS (
 INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
 SELECT ${user.id},CASE WHEN status='approved' THEN 'publisher_withdrawal_approved' ELSE 'publisher_withdrawal_rejected' END,'publisher_withdrawal_request',id::text,
 jsonb_build_object('publisher_id',publisher_id,'amount_minor',amount_minor,'currency',currency,'admin_note',NULLIF(${note},'')) FROM changed RETURNING entity_id
 ) SELECT c.id,c.amount_minor::text,c.currency,c.status FROM changed c JOIN logged l ON l.entity_id=c.id::text`;
 if(!rows.length)return NextResponse.json({error:"Request not found or already reviewed."},{status:409});
 return NextResponse.json({request:rows[0]}); } catch(e) { console.error("Withdrawal review failed",e instanceof Error?e.message:"unknown"); return NextResponse.json({error:"Could not review withdrawal request."},{status:503}); }
}
