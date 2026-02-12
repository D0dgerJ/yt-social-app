export type ModerationUsersStatusFilter =
  | "ALL"
  | "BANNED"
  | "RESTRICTED"
  | "SANCTIONED"
  | "CLEAN";

export type ModerationUsersSortBy = "id" | "username" | "email" | "role";
export type ModerationUsersOrder = "asc" | "desc";

export type ModerationUserActiveSanction = {
  id: number;
  type: "WARN" | "RESTRICT" | "TEMP_BAN" | "PERM_BAN";
  status: "ACTIVE" | "LIFTED" | "EXPIRED";
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
};

export type ModerationUsersListItem = {
  id: number;
  username: string;
  email: string;
  profilePicture: string | null;
  role: string;

  activeSanctions: ModerationUserActiveSanction[];
  isBanned: boolean;
  isRestricted: boolean;
  lastSanctionAt: string | null;
};

export type ModerationUsersPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type GetModerationUsersResponse = {
  ok: boolean;
  items: ModerationUsersListItem[];
  pagination: ModerationUsersPagination;
};

export type ModerationUserDetails = {
  user: {
    id: number;
    username: string;
    email: string;
    role: string;

    desc: string | null;
    profilePicture: string | null;
    coverPicture: string | null;

    from: string | null;
    city: string | null;
    relationship: number | null;
  };

  activeSanctions: Array<{
    id: number;
    type: "WARN" | "RESTRICT" | "TEMP_BAN" | "PERM_BAN";
    status: "ACTIVE" | "LIFTED" | "EXPIRED";
    reason: string;
    message: string | null;
    startsAt: string;
    endsAt: string | null;
    createdAt: string;
    createdById: number;
  }>;

  recentSanctions: Array<{
    id: number;
    type: "WARN" | "RESTRICT" | "TEMP_BAN" | "PERM_BAN";
    status: "ACTIVE" | "LIFTED" | "EXPIRED";
    reason: string;
    message: string | null;
    startsAt: string;
    endsAt: string | null;
    createdAt: string;
    createdById: number;

    liftedAt: string | null;
    liftedById: number | null;
    liftReason: string | null;
  }>;

  sanctionsSummary: {
    total: number;
    active: number;
    isBanned: boolean;
    isRestricted: boolean;
    lastSanctionAt: string | null;
  };

  recentActions: Array<{
    id: number;
    actionType: string;
    targetType: string;
    targetId: string;
    reason: string | null;
    createdAt: string;
    actor: { id: number; username: string; role: string } | null;
  }>;
};

export type GetModerationUserByIdResponse = {
  ok: boolean;
  user: ModerationUserDetails["user"];
  activeSanctions: ModerationUserDetails["activeSanctions"];
  recentSanctions: ModerationUserDetails["recentSanctions"];
  sanctionsSummary: ModerationUserDetails["sanctionsSummary"];
  recentActions: ModerationUserDetails["recentActions"];
};
