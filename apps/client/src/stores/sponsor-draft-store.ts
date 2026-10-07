import { create } from "zustand";

export interface SponsorDraft {
  name: string;
  description: string;
  website: string;
  logo: string;
  logoFile: File | null;
  bgColor: string;
  textColor: string;
}

interface SponsorDraftStore extends SponsorDraft {
  initialize: (draft: Partial<SponsorDraft>) => void;
  update: <Key extends keyof SponsorDraft>(
    key: Key,
    value: SponsorDraft[Key],
  ) => void;
}

const defaults: SponsorDraft = {
  name: "",
  description: "",
  website: "",
  logo: "",
  logoFile: null,
  bgColor: "#171717",
  textColor: "#ffffff",
};

export const useSponsorDraftStore = create<SponsorDraftStore>((set) => ({
  ...defaults,
  initialize: (draft) => set({ ...defaults, ...draft, logoFile: null }),
  update: (key, value) => set({ [key]: value }),
}));
