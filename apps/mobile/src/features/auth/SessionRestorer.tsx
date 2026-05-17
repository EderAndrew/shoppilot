import { useRestoreSessionQuery } from "./auth.queries";

export function SessionRestorer() {
  useRestoreSessionQuery();
  return null;
}
