import "server-only";
import { getTranslations } from "next-intl/server";
import { getSessionUser } from "./session";

/** Server-side gate: returns a "no permission" node when the user lacks `perm`. */
export async function requirePermission(perm: string) {
  const user = await getSessionUser();
  if (user?.permissions.includes(perm)) return null;

  const t = await getTranslations("doctor.settings");
  return (
    <div className="rounded-xl border border-hairline bg-white p-10 text-center">
      <span aria-hidden className="msym text-[36px] text-muted">
        lock
      </span>
      <p className="mt-3 font-semibold text-ink-strong">{t("noPermission")}</p>
    </div>
  );
}
