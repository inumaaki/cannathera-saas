import Image from "next/image";

/* Circular logo badge + Fraunces wordmark (Figma 3.2 / 3.3 header). */
export function BrandMark({
  wordmark = true,
  size = 48,
}: Readonly<{ wordmark?: boolean; size?: number }>) {
  return (
    <div className="flex items-center gap-3">
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
    </div>
  );
}
