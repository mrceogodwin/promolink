import Link from "next/link";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  dark?: boolean;
}

export function Logo({ className = "", showWordmark = true, dark = false }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/logo-mark.svg"
        alt="PromoLink"
        width={32}
        height={32}
        className="w-8 h-8"
      />
      {showWordmark && (
        <span className={`font-semibold text-lg tracking-tight ${dark ? "text-white" : "text-near-black"}`}>
          Promo<span className="text-primary">Link</span>
        </span>
      )}
    </Link>
  );
}
