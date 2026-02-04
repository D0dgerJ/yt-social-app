import { useEffect } from "react";
import { ALLOWED } from "@/utils/moderation/postDetails.constants";

export function useModerationAccessGuard(
  user: unknown,
  role: string | undefined,
  navigate: (to: string) => void
) {
  useEffect(() => {
    if (!user || !role || !ALLOWED.has(role)) navigate("/");
  }, [user, role, navigate]);
}
