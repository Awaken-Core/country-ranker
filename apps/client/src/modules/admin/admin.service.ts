import { adminRepository, AdminRepository } from "./admin.repository";
import { AdminPermission, UserRole } from "./admin.types";

export class AdminService {
  constructor(private repo: AdminRepository = adminRepository) {}

  async getAdminContext(userId: string) {
    const user = await this.repo.findUserWithRoleAndPermissions(userId);
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      image: user.image,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      permissions: user.permissions.map((p) => p.permission as AdminPermission),
    };
  }

  async verifyAccess(userId: string, requiredPermission?: AdminPermission) {
    const context = await this.getAdminContext(userId);
    if (!context) {
      return { authorized: false, error: "UNAUTHORIZED", status: 401 };
    }

    if (context.role === "SUPER_ADMIN") {
      return { authorized: true, user: context };
    }

    if (context.role !== "ADMIN") {
      return { authorized: false, error: "FORBIDDEN", status: 403 };
    }

    if (requiredPermission && !context.permissions.includes(requiredPermission)) {
      return {
        authorized: false,
        error: "INSUFFICIENT_PERMISSIONS",
        status: 403,
        message: `Missing required permission: ${requiredPermission}`,
      };
    }

    return { authorized: true, user: context };
  }

  // Super Admin: Admin Management
  async createAdmin(actorId: string, targetUserId: string, initialPermissions: AdminPermission[] = []) {
    const authCheck = await this.verifyAccess(actorId);
    if (!authCheck.authorized || authCheck.user?.role !== "SUPER_ADMIN") {
      throw new Error("Only SUPER_ADMIN can create new admins");
    }

    const updated = await this.repo.updateUserRole(targetUserId, "ADMIN");
    if (initialPermissions.length > 0) {
      await this.repo.setUserPermissions(targetUserId, initialPermissions);
    }

    await this.repo.createAuditLog({
      userId: actorId,
      action: "CREATE_ADMIN",
      targetType: "USER",
      targetId: targetUserId,
      details: { initialPermissions },
    });

    return updated;
  }

  async removeAdmin(actorId: string, targetUserId: string) {
    const authCheck = await this.verifyAccess(actorId);
    if (!authCheck.authorized || authCheck.user?.role !== "SUPER_ADMIN") {
      throw new Error("Only SUPER_ADMIN can remove admins");
    }

    const updated = await this.repo.updateUserRole(targetUserId, "USER");
    await this.repo.setUserPermissions(targetUserId, []);

    await this.repo.createAuditLog({
      userId: actorId,
      action: "REMOVE_ADMIN",
      targetType: "USER",
      targetId: targetUserId,
    });

    return updated;
  }

  async setPermissions(actorId: string, targetUserId: string, permissions: AdminPermission[]) {
    const authCheck = await this.verifyAccess(actorId);
    if (!authCheck.authorized || authCheck.user?.role !== "SUPER_ADMIN") {
      throw new Error("Only SUPER_ADMIN can grant or revoke admin permissions");
    }

    const updated = await this.repo.setUserPermissions(targetUserId, permissions);

    await this.repo.createAuditLog({
      userId: actorId,
      action: "UPDATE_PERMISSIONS",
      targetType: "USER",
      targetId: targetUserId,
      details: { permissions },
    });

    return updated;
  }

  // Admin Actions: Vote Adjustments
  async adjustVotes(
    actorId: string,
    countryId: string,
    upvotesDelta: number,
    downvotesDelta: number,
    reason: string
  ) {
    const authCheck = await this.verifyAccess(actorId, "VOTES_ADJUST");
    if (!authCheck.authorized) {
      throw new Error(authCheck.error || "Forbidden");
    }

    if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
      throw new Error("Reason is mandatory and must be at least 5 characters long");
    }

    const result = await this.repo.adjustCountryVotes(
      countryId,
      upvotesDelta,
      downvotesDelta
    );

    await this.repo.createAuditLog({
      userId: actorId,
      action: "ADJUST_VOTES",
      targetType: "COUNTRY",
      targetId: countryId,
      details: {
        upvotesDelta,
        downvotesDelta,
        previousUpvotes: result.previousUpvotes,
        newUpvotes: result.newUpvotes,
        previousDownvotes: result.previousDownvotes,
        newDownvotes: result.newDownvotes,
        reason: reason.trim(),
        countryCode: result.country.code,
        countryName: result.country.name,
      },
    });

    return result.country;
  }

  // Admin Actions: Edit Country
  async editCountry(actorId: string, countryId: string, data: { name?: string; flag?: string }) {
    const authCheck = await this.verifyAccess(actorId, "COUNTRIES_EDIT");
    if (!authCheck.authorized) {
      throw new Error(authCheck.error || "Forbidden");
    }

    const updated = await this.repo.updateCountryDetails(countryId, data);

    await this.repo.createAuditLog({
      userId: actorId,
      action: "EDIT_COUNTRY",
      targetType: "COUNTRY",
      targetId: countryId,
      details: data,
    });

    return updated;
  }
}

export const adminService = new AdminService();
