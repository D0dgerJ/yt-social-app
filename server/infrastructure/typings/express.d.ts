import { User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: User["id"];
        role?: User["role"];

        sanction?: {
          type: "WARN" | "RESTRICT" | "TEMP_BAN" | "PERM_BAN";
          endsAt?: string | null;
          reason?: string | null;
          sanctionId?: number;
        };

        isRestricted?: boolean;
      };
    }
  }
}

export {};
