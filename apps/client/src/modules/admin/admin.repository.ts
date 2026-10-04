import { client } from "@/lib/db";
import { AdminPermission, UserRole } from "./admin.types";

export class AdminRepository {
  async findUserWithRoleAndPermissions(userId: string) {
    return client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        permissions: {
          select: {
            permission: true,
          },
        },
      },
    });
  }

  async getAllUsers(params?: {
    search?: string;
    role?: UserRole;
    skip?: number;
    take?: number;
  }) {
    const where: any = {};
    if (params?.search) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }
    if (params?.role) {
      where.role = params.role;
    }

    const [users, total] = await Promise.all([
      client.user.findMany({
        where,
        skip: params?.skip ?? 0,
        take: params?.take ?? 50,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          emailVerified: true,
          createdAt: true,
          permissions: {
            select: {
              permission: true,
            },
          },
        },
      }),
      client.user.count({ where }),
    ]);

    return {
      users: users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
        permissions: u.permissions.map((p) => p.permission as AdminPermission),
      })),
      total,
    };
  }

  async updateUserRole(userId: string, role: UserRole) {
    return client.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }

  async setUserPermissions(userId: string, permissions: AdminPermission[]) {
    return client.$transaction(async (tx) => {
      // Remove all current permissions
      await tx.userAdminPermission.deleteMany({
        where: { userId },
      });

      // Insert new permissions
      if (permissions.length > 0) {
        await tx.userAdminPermission.createMany({
          data: permissions.map((p) => ({
            userId,
            permission: p,
          })),
        });
      }

      return tx.userAdminPermission.findMany({
        where: { userId },
        select: { permission: true },
      });
    });
  }

  async getCountryById(countryId: string) {
    return client.country.findUnique({
      where: { id: countryId },
      select: {
        id: true,
        name: true,
        code: true,
        slug: true,
        totalUpvoteCount: true,
        totalDownvoteCount: true,
      },
    });
  }

  async adjustCountryVotes(
    countryId: string,
    upvotesDelta: number,
    downvotesDelta: number,
  ) {
    return client.$transaction(async (tx) => {
      const current = await tx.country.findUnique({
        where: { id: countryId },
        select: {
          id: true,
          name: true,
          code: true,
          slug: true,
          totalUpvoteCount: true,
          totalDownvoteCount: true,
        },
      });

      if (!current) {
        throw new Error("Country not found");
      }

      const prevUpvotes = Number(current.totalUpvoteCount);
      const prevDownvotes = Number(current.totalDownvoteCount);

      const targetUpvotes = Math.max(0, prevUpvotes + upvotesDelta);
      const targetDownvotes = Math.max(0, prevDownvotes + downvotesDelta);

      const updated = await tx.country.update({
        where: { id: countryId },
        data: {
          totalUpvoteCount: BigInt(targetUpvotes),
          totalDownvoteCount: BigInt(targetDownvotes),
        },
        select: {
          id: true,
          name: true,
          code: true,
          slug: true,
          totalUpvoteCount: true,
          totalDownvoteCount: true,
        },
      });

      return {
        country: updated,
        previousUpvotes: prevUpvotes,
        newUpvotes: Number(updated.totalUpvoteCount),
        previousDownvotes: prevDownvotes,
        newDownvotes: Number(updated.totalDownvoteCount),
      };
    });
  }

  async updateCountryDetails(
    countryId: string,
    data: { name?: string; flag?: string },
  ) {
    return client.country.update({
      where: { id: countryId },
      data,
      select: {
        id: true,
        name: true,
        code: true,
        slug: true,
        flag: true,
        totalUpvoteCount: true,
        totalDownvoteCount: true,
      },
    });
  }

  async getVoteLogs(params?: {
    search?: string;
    voteType?: "UPVOTE" | "DOWNVOTE";
    source?: "FREE" | "PURCHASED";
    skip?: number;
    take?: number;
  }) {
    const where: any = {};
    if (params?.voteType) {
      where.voteType = params.voteType;
    }
    if (params?.source) {
      where.voteIntentionType = params.source;
    }
    if (params?.search) {
      const q = params.search.trim();
      where.OR = [
        { country: { name: { contains: q, mode: "insensitive" } } },
        { country: { code: { contains: q, mode: "insensitive" } } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [logs, total] = await Promise.all([
      client.voteLog.findMany({
        where,
        skip: params?.skip ?? 0,
        take: params?.take ?? 50,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          count: true,
          voteType: true,
          voteIntentionType: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          country: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      }),
      client.voteLog.count({ where }),
    ]);

    return {
      logs: logs.map((l) => ({
        id: l.id,
        count: l.count,
        voteType: l.voteType as "UPVOTE" | "DOWNVOTE",
        voteIntentionType: l.voteIntentionType as "FREE" | "PURCHASED",
        createdAt: l.createdAt.toISOString(),
        userId: l.user.id,
        userName: l.user.name,
        userEmail: l.user.email,
        countryName: l.country.name,
        countryCode: l.country.code,
      })),
      total,
    };
  }

  async createAuditLog(params: {
    userId: string;
    action: string;
    targetType: string;
    targetId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
  }) {
    try {
      return await client.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          targetType: params.targetType,
          targetId: params.targetId,
          details: params.details as any,
          ipAddress: params.ipAddress,
        },
      });
    } catch (e) {
      console.error("Failed to write audit log:", e);
      return null;
    }
  }

  async getAuditLogs(params?: {
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const where: any = {};
    if (params?.search) {
      const q = params.search.trim();
      where.OR = [
        { action: { contains: q, mode: "insensitive" } },
        { targetType: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [logs, total] = await Promise.all([
      client.auditLog.findMany({
        where,
        skip: params?.skip ?? 0,
        take: params?.take ?? 50,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
        },
      }),
      client.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        user: l.user,
        action: l.action,
        targetType: l.targetType,
        targetId: l.targetId,
        details: l.details as Record<string, unknown> | null,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt.toISOString(),
      })),
      total,
    };
  }
}

export const adminRepository = new AdminRepository();
