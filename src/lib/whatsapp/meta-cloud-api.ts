/**
 * Official Meta WhatsApp Cloud API adapter.
 *
 * This adapter sends approved WhatsApp template messages only. Marketing
 * templates must be approved by Meta before use. Recipient numbers must come
 * from an audience owner's consented, server-side contact source; this module
 * never reads or returns contact lists and must never be called from a browser.
 */

export type MetaTemplateComponentParameter =
  | { type: "text"; text: string }
  | { type: "currency"; currency: { fallback_value: string; code: string; amount_1000: number } }
  | { type: "date_time"; date_time: { fallback_value: string } };

export type MetaTemplateComponent = {
  type: "body" | "header" | "button";
  sub_type?: "quick_reply" | "url";
  index?: string;
  parameters: MetaTemplateComponentParameter[];
};

export type MetaTemplateMessage = {
  recipient: string;
  templateName: string;
  languageCode: string;
  components?: MetaTemplateComponent[];
};

export type MetaSendResult =
  | { ok: true; messageId: string; providerStatus: "accepted" }
  | { ok: false; retryable: boolean; errorCode: string; httpStatus?: number };

type MetaResponse = {
  messages?: Array<{ id?: string; message_status?: string }>;
  error?: { code?: number; error_subcode?: number; message?: string; type?: string };
};

function configuration() {
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN || "";
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID || "";
  const version = process.env.META_GRAPH_API_VERSION || "";
  if (!accessToken || !phoneNumberId || !/^v\\d+\\.\\d+$/.test(version)) {
    throw new Error("Meta WhatsApp Cloud API credentials are not configured.");
  }
  return { accessToken, phoneNumberId, version };
}

function normalizeRecipient(value: string) {
  // E.164 digits only, without a leading plus sign, as expected by the API.
  const digits = value.replace(/^\\+/, "");
  if (!/^\\d{8,15}$/.test(digits)) throw new Error("Recipient must be a valid E.164 phone number.");
  return digits;
}

/**
 * Submits one pre-approved template message.
 * Only call from a trusted server-side worker after consent and campaign checks.
 */
export async function sendMetaTemplateMessage(input: MetaTemplateMessage): Promise<MetaSendResult> {
  const config = configuration();
  const recipient = normalizeRecipient(input.recipient);
  if (!/^[a-z0-9_]{1,512}$/.test(input.templateName)) {
    throw new Error("Invalid Meta-approved template name.");
  }
  if (!/^[a-z]{2,3}(?:_[A-Z]{2})?$/.test(input.languageCode)) {
    throw new Error("Invalid WhatsApp template language code.");
  }
  if (input.components && input.components.length > 10) {
    throw new Error("Too many template components.");
  }

  const response = await fetch(
    `https://graph.facebook.com/${config.version}/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "template",
        template: {
          name: input.templateName,
          language: { code: input.languageCode },
          ...(input.components?.length ? { components: input.components } : {}),
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    },
  );

  let payload: MetaResponse | null = null;
  try {
    payload = await response.json() as MetaResponse;
  } catch {
    return { ok: false, retryable: response.status >= 500, errorCode: "META_INVALID_RESPONSE", httpStatus: response.status };
  }

  const messageId = payload?.messages?.[0]?.id;
  if (response.ok && typeof messageId === "string" && messageId.length > 0) {
    return { ok: true, messageId, providerStatus: "accepted" };
  }

  const code = typeof payload?.error?.code === "number"
    ? `META_${payload.error.code}`
    : "META_SEND_REJECTED";
  // Do not retry rate limits, policy/permission/template/recipient errors.
  // A 5xx may be transient, but a timeout/network failure is ambiguous and
  // must be reconciled before retrying to avoid duplicate promotional sends.
  const retryable = response.status >= 500 || response.status === 429;
  return { ok: false, retryable, errorCode: code, httpStatus: response.status };
}
