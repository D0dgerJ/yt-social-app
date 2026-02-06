import type { Prisma, UserSanctionStatus, UserSanctionType } from "@prisma/client";
import { UserSanctionStatus as UserSanctionStatusEnum } from "@prisma/client";
import prisma from "../../../infrastructure/database/prismaClient.ts";

export type ModerationUsersStatusFilter = "ALL" | "BANNED" | "RESTRICTED" | "SANCTIONED" | "CLEAN";
export type ModerationUsersSortBy = "id" | "username" | "email" | "role";
export type ModerationUsersOrder = "asc" | "desc";

export type GetModerationUsersParams = {
  q?: string;
  status?: ModerationUsersStatusFilter;
  sortBy?: ModerationUsersSortBy;
  order?: ModerationUsersOrder;
  page?: number; // 1-based
  limit?: number;
};

export type ModerationUserListItem = {
  id: number;
  username: string;
  email: string;
  profilePicture: string | null;
  role: string;
  activeSanctions: Array<{
    id: number;
    type: UserSanctionType;
    status: UserSanctionStatus;
    startsAt: Date;
    endsAt: Date | null;
    createdAt: Date;
  }>;
  isBanned: boolean;
  isRestricted: boolean;
  lastSanctionAt: Date | null;
};

export type GetModerationUsersResult = {
  items: ModerationUserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function normalizeQuery(q?: string): { id?: number; text?: string } {
  const raw = typeof q === "string" ? q.trim() : "";
  if (!raw) return {};

  const asNumber = Number(raw);
  if (Number.isFinite(asNumber) && asNumber > 0 && String(asNumber) === raw) {
    return { id: asNumber };
  }

  return { text: raw };
}

function buildWhere(params: GetModerationUsersParams): Prisma.UserWhereInput {
  const now = new Date();
  const { id, text } = normalizeQuery(params.q);
  const status = params.status ?? "ALL";

  const activeSanctionFilter: Prisma.UserSanctionWhereInput = {
    status: UserSanctionStatusEnum.ACTIVE,
    OR: [{ endsAt: null }, { endsAt: { gt: now } }],
  };

  const where: Prisma.UserWhereInput = {
    ...(id ? { id } : {}),
    ...(text
      ? {
          OR: [
            { username: { contains: text, mode: "insensitive" } },
            { email: { contains: text, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  if (status === "BANNED") {
    where.sanctions = {
      some: {
        ...activeSanctionFilter,
        type: { in: ["TEMP_BAN", "PERM_BAN"] },
      },
    };
  }

  if (status === "RESTRICTED") {
    where.sanctions = {
      some: {
        ...activeSanctionFilter,
        type: "RESTRICT",
      },
    };
  }

  if (status === "SANCTIONED") {
    where.sanctions = {
      some: activeSanctionFilter,
    };
  }

  if (status === "CLEAN") {
    where.NOT = {
      sanctions: {
        some: activeSanctionFilter,
      },
    };
  }

  return where;
}

function buildOrderBy(sortBy: ModerationUsersSortBy, order: ModerationUsersOrder): Prisma.UserOrderByWithRelationInput {
  // В модели User нет createdAt/lastLoginAt, поэтому сортируем только по тем полям, которые реально есть.
  if (sortBy === "username") return { username: order };
  if (sortBy === "email") return { email: order };
  if (sortBy === "role") return { role: order };
  return { id: order };
}

export async function getModerationUsers(params: GetModerationUsersParams = {}): Promise<GetModerationUsersResult> {
  const pageRaw = Number.isFinite(params.page as number) ? (params.page as number) : 1;
  const limitRaw = Number.isFinite(params.limit as number) ? (params.limit as number) : 20;

  const page = Math.max(1, Math.floor(pageRaw));
  const limit = Math.min(100, Math.max(1, Math.floor(limitRaw)));
  const skip = (page - 1) * limit;

  const sortBy = params.sortBy ?? "id";
  const order = params.order ?? "desc";
  const where = buildWhere(params);
  const orderBy = buildOrderBy(sortBy, order);

  const now = new Date();
  const activeSanctionsWhere: Prisma.UserSanctionWhereInput = {
    status: UserSanctionStatusEnum.ACTIVE,
    OR: [{ endsAt: null }, { endsAt: { gt: now } }],
  };

  const [itemsRaw, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        username: true,
        email: true,
        profilePicture: true,
        role: true,
        sanctions: {
          where: activeSanctionsWhere,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            type: true,
            status: true,
            startsAt: true,
            endsAt: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const items: ModerationUserListItem[] = itemsRaw.map((u) => {
    const activeSanctions = u.sanctions;

    const isBanned = activeSanctions.some((s) => s.type === "TEMP_BAN" || s.type === "PERM_BAN");
    const isRestricted = activeSanctions.some((s) => s.type === "RESTRICT");
    const lastSanctionAt = activeSanctions.length ? activeSanctions[0].createdAt : null;

    return {
      id: u.id,
      username: u.username,
      email: u.email,
      profilePicture: u.profilePicture ?? null,
      role: String(u.role),
      activeSanctions,
      isBanned,
      isRestricted,
      lastSanctionAt,
    };
  });

  const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}
