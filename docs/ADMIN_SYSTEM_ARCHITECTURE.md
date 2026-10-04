# CountryRank Admin System & Zustand Architecture

## 1. Overview & Hierarchy

The CountryRank Admin Console is an RBAC (Role-Based Access Control) system built with Next.js, Zustand state management, and PostgreSQL. It enforces a strict authorization hierarchy between **SUPER ADMIN**, **ADMIN**, and standard **USER** accounts.

```
Sidebar collapsed
Adjustment modal open
Selected country
Filters panel open
     ↓
Zustand SUPER ADMIN
│
├── Full Access
│
├── Admin Management
│     ├── Create Admin
│     ├── Give Permissions
│     ├── Remove Permissions
│     └── Remove Admin
│
└── Everything Else


ADMIN
│
├── Countries
│   ├── View
│   └── Edit
│
├── Votes
│   ├── View
│   └── Adjust
│
├── Users
│   ├── View
│   └── Manage
│
└── Audit Logs
    └── View
```

---

## 2. Zustand State Architecture

The frontend state for layout, modals, selections, and filters is centrally managed in [`use-admin-store.ts`](file:///c:/Users/bhara/Pictures/coutnry/country-ranker/apps/client/src/stores/use-admin-store.ts).

### 2.1 State Model

```typescript
export type AdminTab = "countries" | "votes" | "users" | "admins" | "audit-logs";

interface AdminState {
  // Navigation & Layout
  activeTab: AdminTab;
  sidebarCollapsed: boolean;
  filtersPanelOpen: boolean;

  // Modals & Active Selections
  adjustmentModalOpen: boolean;
  selectedCountry: AdminCountryItem | null;
  editCountryModalOpen: boolean;
  createAdminModalOpen: boolean;
  permissionsModalOpen: boolean;
  selectedAdminUserId: string | null;

  // Filtering & Search
  countryFilters: {
    search: string;
    sortBy: "rank" | "name" | "upvotes" | "downvotes";
    sortOrder: "asc" | "desc";
  };
  voteFilters: {
    search: string;
    voteType: "ALL" | "UPVOTE" | "DOWNVOTE";
    source: "ALL" | "FREE" | "PURCHASED";
  };
  userSearch: string;
  auditSearch: string;

  // Actions
  setActiveTab: (tab: AdminTab) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleFiltersPanel: () => void;
  setFiltersPanelOpen: (open: boolean) => void;
  openAdjustmentModal: (country: AdminCountryItem) => void;
  closeAdjustmentModal: () => void;
  openEditCountryModal: (country: AdminCountryItem) => void;
  closeEditCountryModal: () => void;
  openCreateAdminModal: () => void;
  closeCreateAdminModal: () => void;
  openPermissionsModal: (userId: string) => void;
  closePermissionsModal: () => void;
  setCountrySearch: (search: string) => void;
  setCountrySort: (sortBy: any, sortOrder: any) => void;
  setVoteSearch: (search: string) => void;
  setVoteFilterType: (type: any) => void;
  setVoteFilterSource: (source: any) => void;
  setUserSearch: (search: string) => void;
  setAuditSearch: (search: string) => void;
}
```

### 2.2 RBAC Permission Evaluator

```typescript
export function hasAdminPermission(
  role: UserRole | undefined,
  userPermissions: AdminPermission[] | undefined,
  requiredPermission: AdminPermission
): boolean {
  if (role === "SUPER_ADMIN") return true;
  if (role !== "ADMIN") return false;
  return Boolean(userPermissions?.includes(requiredPermission));
}
```

- **SUPER_ADMIN**: Evaluates to `true` unconditionally across all routes and components.
- **ADMIN**: Evaluates against the specific permission array (`userPermissions`).

---

## 3. Roles & Permissions Matrix

### 3.1 Permissions List

| Permission Enum | Description | Accessible by Admin? | Accessible by Super Admin? |
| :--- | :--- | :---: | :---: |
| `COUNTRIES_VIEW` | Browse country catalog and view standings | Yes (if granted) | Yes |
| `COUNTRIES_EDIT` | Update country names, codes, and flag emojis | Yes (if granted) | Yes |
| `VOTES_VIEW` | Access real-time voting ledger stream | Yes (if granted) | Yes |
| `VOTES_ADJUST` | Manually increment or decrement country vote counts | Yes (if granted) | Yes |
| `USERS_VIEW` | Search and inspect registered user accounts | Yes (if granted) | Yes |
| `USERS_MANAGE` | Promote/demote users or manage account statuses | Yes (if granted) | Yes |
| `AUDIT_LOGS_VIEW`| Inspect administrative action trail and details | Yes (if granted) | Yes |
| `MANAGE_ADMINS` | Create new admins, grant/revoke permissions, remove admins | **No** (Super Admin Only) | Yes |

---

## 4. UI Components

### 4.1 Shell & Navigation

- **[`AdminSidebar`](file:///c:/Users/bhara/Pictures/coutnry/country-ranker/apps/client/src/components/admin/admin-sidebar.tsx)**:
  - Collapsible drawer toggled via `toggleSidebar()` (`sidebarCollapsed` state).
  - Filters navigation tabs dynamically based on caller's role and permissions.
  - Displays distinctive role badges (`SUPER ADMIN` vs `STAFF ADMIN`).
  - Includes a direct escape link back to the public website.
- **[`AdminFiltersPanel`](file:///c:/Users/bhara/Pictures/coutnry/country-ranker/apps/client/src/components/admin/admin-filters-panel.tsx)**:
  - Slide-out drawer on the right edge governed by `filtersPanelOpen`.
  - Dynamically switches filter controls based on the current `activeTab` (e.g., sort order for countries, vote direction and quota source for votes).

---

### 4.2 Dashboard Tabs

- **[`AdminCountriesTab`](file:///c:/Users/bhara/Pictures/coutnry/country-ranker/apps/client/src/components/admin/tabs/admin-countries-tab.tsx)**:
  - Displays the sovereign country ranking catalog.
  - Provides quick action triggers:
    - **Adjust**: Opens `AdjustmentModal` to apply score deltas.
    - **Edit**: Opens `EditCountryModal` to modify metadata.
- **[`AdminVotesTab`](file:///c:/Users/bhara/Pictures/coutnry/country-ranker/apps/client/src/components/admin/tabs/admin-votes-tab.tsx)**:
  - Real-time audit log of all individual incoming votes.
  - Displays voter identity, target country, direction (`▲ UPVOTE` vs `▼ DOWNVOTE`), and quota type (`FREE` vs `PURCHASED`).
- **[`AdminUsersTab`](file:///c:/Users/bhara/Pictures/coutnry/country-ranker/apps/client/src/components/admin/tabs/admin-users-tab.tsx)**:
  - Directory of all registered platform users.
  - Super Admins can promote regular users to Admin or customize permissions inline.
- **[`AdminManagementTab`](file:///c:/Users/bhara/Pictures/coutnry/country-ranker/apps/client/src/components/admin/tabs/admin-management-tab.tsx)**:
  - Restricted exclusively to `SUPER_ADMIN`.
  - Displays cards for all staff administrators with their active permissions.
  - Provides actions: Create Admin (`openCreateAdminModal`), Manage Permissions (`openPermissionsModal`), and Remove Admin (`handleRemoveAdmin`).
- **[`AdminAuditLogsTab`](file:///c:/Users/bhara/Pictures/coutnry/country-ranker/apps/client/src/components/admin/tabs/admin-audit-logs-tab.tsx)**:
  - Full immutable record of all administrative interventions, actor accounts, action keys, target entity IDs, and delta payloads.

---

### 4.3 Modals

1. **[`AdjustmentModal`](file:///c:/Users/bhara/Pictures/coutnry/country-ranker/apps/client/src/components/admin/adjustment-modal.tsx)**:
   - Modifies `totalUpvoteCount` and `totalDownvoteCount` for a selected country.
   - Requires an explicit reason field stored into the audit trail.
2. **[`EditCountryModal`](file:///c:/Users/bhara/Pictures/coutnry/country-ranker/apps/client/src/components/admin/edit-country-modal.tsx)**:
   - Updates country display name and flag emoji.
3. **[`CreateAdminModal`](file:///c:/Users/bhara/Pictures/coutnry/country-ranker/apps/client/src/components/admin/create-admin-modal.tsx)**:
   - Promotes a user by ID to `ADMIN` and assigns their initial permission set.
4. **[`PermissionsModal`](file:///c:/Users/bhara/Pictures/coutnry/country-ranker/apps/client/src/components/admin/permissions-modal.tsx)**:
   - Granular checkbox toggles for adding or revoking individual permissions for an administrator.

---

## 5. Backend Architecture & API Routes

### 5.1 Route Handlers

| Method | Path | Required Permission | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/me` | Logged In (`ADMIN` or `SUPER_ADMIN`) | Returns current user's role and permission array |
| `GET` | `/api/v1/admin/users` | `ADMIN` or `SUPER_ADMIN` | Lists users with search, role filters, and pagination |
| `POST`| `/api/v1/admin/users` | `SUPER_ADMIN` | Handles `CREATE_ADMIN`, `REMOVE_ADMIN`, and `SET_PERMISSIONS` |
| `GET` | `/api/v1/admin/votes` | `VOTES_VIEW` | Fetches filtered vote logs |
| `POST`| `/api/v1/admin/votes` | `VOTES_ADJUST` | Applies manual vote score adjustment to a country |
| `PATCH`| `/api/v1/admin/countries/[id]`| `COUNTRIES_EDIT` | Updates country name or flag |
| `GET` | `/api/v1/admin/audit-logs` | `AUDIT_LOGS_VIEW` | Fetches operational audit history |

---

### 5.2 Service Layer ([`admin.service.ts`](file:///c:/Users/bhara/Pictures/coutnry/country-ranker/apps/client/src/modules/admin/admin.service.ts))

The `AdminService` centralizes security checks and audit logging:

```typescript
async verifyAccess(userId: string, requiredPermission?: AdminPermission) {
  const context = await this.getAdminContext(userId);
  if (!context) return { authorized: false, error: "UNAUTHORIZED", status: 401 };

  if (context.role === "SUPER_ADMIN") return { authorized: true, user: context };
  if (context.role !== "ADMIN") return { authorized: false, error: "FORBIDDEN", status: 403 };

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
```

Whenever an admin action executes (`createAdmin`, `removeAdmin`, `setPermissions`, `adjustVotes`, `editCountry`), an audit record is created via `repo.createAuditLog(...)`.

---

## 6. Database Models ([`schema.prisma`](file:///c:/Users/bhara/Pictures/coutnry/country-ranker/apps/client/prisma/schema.prisma))

```prisma
enum UserRole {
  USER
  ADMIN
  SUPER_ADMIN
}

enum AdminPermission {
  MANAGE_ADMINS
  COUNTRIES_VIEW
  COUNTRIES_EDIT
  VOTES_VIEW
  VOTES_ADJUST
  USERS_VIEW
  USERS_MANAGE
  AUDIT_LOGS_VIEW
}

model UserAdminPermission {
  id         String          @id @default(uuid())
  userId     String
  permission AdminPermission
  createdAt  DateTime        @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, permission])
  @@index([userId])
  @@map("user_admin_permission")
}

model AuditLog {
  id         String   @id @default(uuid())
  userId     String
  action     String
  targetType String
  targetId   String?
  details    Json?
  ipAddress  String?
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([action])
  @@index([createdAt(sort: Desc)])
  @@map("audit_log")
}
```
