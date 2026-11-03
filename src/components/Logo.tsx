import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  dark?: boolean;
}

export function Logo({ className = "", showWordmark = true, dark = false }: LogoProps) {
  return (
    <Link href="/" aria-label="PromoLink home" className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src="/logo-mark.svg"
        alt=""
        width={40}
        height={40}
        priority
        className="h-9 w-9 shrink-0"
      />
      {showWordmark && (
        <span className={`text-[20px] font-extrabold tracking-[-.8px] ${dark ? "text-white" : "text-[#11251b]"}`}>
          Promo<span className={dark ? "text-[#c8f169]" : "text-[#08794e]"}>Link</span>
        </span>
      )}
    </Link>
  );
}
