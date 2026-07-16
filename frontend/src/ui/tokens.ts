// Cannathera brand tokens — exact values from client brand guide
// (Desktop/Work - UMAR/00. chat with client 1.txt). Single source for JS/TS
// consumers; the CSS side lives in apps/web globals.css (@theme).

export const brand = {
  green900: "#0B4D34", // primary — logo, headers, footers
  green700: "#1F7A4D", // secondary — hover, gradient mid, leaf, watermark
  green950: "#0A3626", // gradient end
  orange500: "#F97316", // accent — CTAs, bullets, dividers
  orange600: "#E66A12", // print-alt accent
  bg: "#F8F8F6", // off-white background
  text: "#1F2937", // dark gray body text
  line: "#D9D9D9", // light gray borders/boxes
} as const;

// 135° brand gradient (client "typical Cannathera look").
export const brandGradient =
  "linear-gradient(135deg, #0B4D34 0%, #1F7A4D 50%, #0A3626 100%)";

export type BrandColor = keyof typeof brand;
