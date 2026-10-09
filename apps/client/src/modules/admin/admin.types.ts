export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN" | "CUSTOMER";

export type AdminPermission =
  | "MANAGE_ADMINS"
  | "ADS_MANAGE"
  | "COUNTRIES_VIEW"
  | "COUNTRIES_EDIT"
  | "VOTES_VIEW"
  | "VOTES_ADJUST"
  | "USERS_VIEW"
  | "USERS_MANAGE"
  | "AUDIT_LOGS_VIEW";

export interface AdminUserDTO {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image: string | null;
  emailVerified: boolean;
  createdAt: string;
  permissions: AdminPermission[];
}

export interface AuditLogDTO {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
    image: string | null;
  };
  action: string;
  targetType: string;
  targetId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AdminCountryItem {
  id: string;
  name: string;
  code: string;
  slug: string;
  flag: string;
  totalUpvotes: number;
  totalDownvotes: number;
  createdAt: string;
}

export interface VoteLogItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  countryName: string;
  countryCode: string;
  voteType: "UPVOTE" | "DOWNVOTE";
  voteIntentionType: "FREE" | "PURCHASED";
  count: number;
  createdAt: string;
}
