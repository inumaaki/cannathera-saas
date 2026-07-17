import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js standard middleware for internationalization
// Handles locale detection + /de|/en|/tr|/bg|/ar prefix routing.
export default createMiddleware(routing);

export const config = {
  // All paths except API, Next internals, and files with an extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
