import { notFound } from "next/navigation";

/** Red-flag monitoring is exclusively available in the administrator portal. */
export default function DoctorAlerts() {
  notFound();
}
