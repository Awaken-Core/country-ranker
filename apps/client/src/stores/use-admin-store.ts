import { create } from "zustand";
import { AdminPermission, UserRole, AdminCountryItem } from "@/modules/admin/admin.types";

export type AdminTab = "countries" | "votes" | "users" | "admins" | "audit-logs";

interface CountryFilters {
  search: string;
  sortBy: "rank" | "name" | "upvotes" | "downvotes";
  sortOrder: "asc" | "desc";
}

interface VoteFilters {
  search: string;
  voteType: "ALL" | "UPVOTE" | "DOWNVOTE";
  source: "ALL" | "FREE" | "PURCHASED";
}

interface AdminState {
  // Navigation & UI Layout
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

  // Search & Filter State
  countryFilters: CountryFilters;
  voteFilters: VoteFilters;
  userSearch: string;
  auditSearch: string;

  // Actions for UI & Modals
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

  // Filter Actions
  setCountrySearch: (search: string) => void;
  setCountrySort: (sortBy: CountryFilters["sortBy"], sortOrder: CountryFilters["sortOrder"]) => void;
  setVoteSearch: (search: string) => void;
  setVoteFilterType: (voteType: VoteFilters["voteType"]) => void;
  setVoteFilterSource: (source: VoteFilters["source"]) => void;
  setUserSearch: (search: string) => void;
  setAuditSearch: (search: string) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  // Defaults matching user specification
  activeTab: "countries",
  sidebarCollapsed: false,
  filtersPanelOpen: false,

  adjustmentModalOpen: false,
  selectedCountry: null,
  editCountryModalOpen: false,
  createAdminModalOpen: false,
  permissionsModalOpen: false,
  selectedAdminUserId: null,

  countryFilters: {
    search: "",
    sortBy: "upvotes",
    sortOrder: "desc",
  },
  voteFilters: {
    search: "",
    voteType: "ALL",
    source: "ALL",
  },
  userSearch: "",
  auditSearch: "",

  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleFiltersPanel: () => set((s) => ({ filtersPanelOpen: !s.filtersPanelOpen })),
  setFiltersPanelOpen: (open) => set({ filtersPanelOpen: open }),

  openAdjustmentModal: (country) => set({ selectedCountry: country, adjustmentModalOpen: true }),
  closeAdjustmentModal: () => set({ adjustmentModalOpen: false, selectedCountry: null }),

  openEditCountryModal: (country) => set({ selectedCountry: country, editCountryModalOpen: true }),
  closeEditCountryModal: () => set({ editCountryModalOpen: false, selectedCountry: null }),

  openCreateAdminModal: () => set({ createAdminModalOpen: true }),
  closeCreateAdminModal: () => set({ createAdminModalOpen: false }),

  openPermissionsModal: (userId) => set({ selectedAdminUserId: userId, permissionsModalOpen: true }),
  closePermissionsModal: () => set({ permissionsModalOpen: false, selectedAdminUserId: null }),

  setCountrySearch: (search) =>
    set((s) => ({ countryFilters: { ...s.countryFilters, search } })),
  setCountrySort: (sortBy, sortOrder) =>
    set((s) => ({ countryFilters: { ...s.countryFilters, sortBy, sortOrder } })),
  setVoteSearch: (search) =>
    set((s) => ({ voteFilters: { ...s.voteFilters, search } })),
  setVoteFilterType: (voteType) =>
    set((s) => ({ voteFilters: { ...s.voteFilters, voteType } })),
  setVoteFilterSource: (source) =>
    set((s) => ({ voteFilters: { ...s.voteFilters, source } })),
  setUserSearch: (userSearch) => set({ userSearch }),
  setAuditSearch: (auditSearch) => set({ auditSearch }),
}));

/**
 * Permission checker helper
 * SUPER_ADMIN has full access to everything.
 * ADMIN has granular permissions based on their assigned list.
 */
export function hasAdminPermission(
  role: UserRole | undefined,
  userPermissions: AdminPermission[] | undefined,
  requiredPermission: AdminPermission
): boolean {
  if (role === "SUPER_ADMIN") return true;
  if (role !== "ADMIN") return false;
  return Boolean(userPermissions?.includes(requiredPermission));
}
