import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin, type AdminRole, type AuthorizedAdminSession } from "../../../../lib/auth";
import {
  isDisposablePreviewAuthBypassEnabled,
  isDisposablePreviewRequestHost,
} from "../../../../lib/auth/development-bypass";

export function canMutateMediaKitInCurrentEnvironment(
  session: AuthorizedAdminSession,
  environment: NodeJS.ProcessEnv = process.env,
) {
  if (session.source === "session") return true;
  return (
    session.source === "development-auth-bypass" &&
    isDisposablePreviewAuthBypassEnabled(environment)
  );
}

export async function requireMediaKitMutationAdmin(
  minimumRole: AdminRole = "editor",
): Promise<AuthorizedAdminSession> {
  const session = await requireAdmin(minimumRole);
  if (session.source === "session") return session;

  const host = (await headers()).get("host");
  if (
    session.source === "development-auth-bypass" &&
    isDisposablePreviewAuthBypassEnabled(process.env) &&
    isDisposablePreviewRequestHost(host)
  ) {
    return session;
  }

  redirect("/admin?error=development-read-only");
}
