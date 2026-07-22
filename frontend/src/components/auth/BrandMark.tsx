import Image from "next/image";
import { Link } from "@/i18n/navigation";

/* Circular logo badge + Fraunces wordmark (Figma 3.2 / 3.3 header). */
export function BrandMark({
  wordmark = true,
  size = 48,
}: Readonly<{ wordmark?: boolean; size?: number }>) {
  return (
    <Link href="/" className="inline-flex items-center gap-3 w-fit">
      <Image
        src="/brand/logo.png"
        alt="Cannathera"
        width={size}
        height={size}
        className="rounded-full"
        priority
      />
      {wordmark ? (
        <span className="font-display text-3xl font-bold text-pine">Cannathera</span>
      ) : null}
    </Link>
  );
}
