import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { SignupShell } from "@/components/auth/SignupShell";
import { SignupForm } from "./SignupForm";
import { SIGNUP_ROLES, type SignupRole } from "./roles";

/* Figma 3.3 — role-specific signup (2 steps). */
export default function RoleSignupPage({
  params,
}: Readonly<{ params: Promise<{ locale: string; role: string }> }>) {
  const { locale, role } = use(params);
  setRequestLocale(locale);

  if (!SIGNUP_ROLES.includes(role as SignupRole)) notFound();

  return (
    <SignupShell>
      <SignupForm role={role as SignupRole} />
    </SignupShell>
  );
}
