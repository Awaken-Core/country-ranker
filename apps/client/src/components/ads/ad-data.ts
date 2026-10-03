export interface AdItem {
  id: string;
  slot: string; // e.g. "LEFT_1", "RIGHT_1"
  brand: string;
  tagline: string;
  description: string;
  logoText?: string;
  logoBg?: string; // Tailwind background or color
  logoTextColor?: string;
  badge?: string;
  url?: string;
  cardBg?: string; // background tint like in reference screenshot
  accentColor?: string;
  isAvailableSlot?: boolean;
}

export const LEFT_ADS: AdItem[] = [
  {
    id: "left-1",
    slot: "LEFT_1",
    brand: "BUNCH",
    tagline: "AI Evaluation",
    description: "We set up and manage human teams validating your AI.",
    logoText: "B",
    logoBg: "bg-red-500",
    logoTextColor: "text-white",
    cardBg: "bg-[#181313] hover:border-red-500/30",
    accentColor: "border-red-900/40",
  },
  {
    id: "left-2",
    slot: "LEFT_2",
    brand: "Higgsfield",
    tagline: "Video Generation",
    description: "Create AI videos and images with Higgsfield world model.",
    logoText: "⚡",
    logoBg: "bg-lime-400",
    logoTextColor: "text-black",
    cardBg: "bg-[#121814] hover:border-lime-500/30",
    accentColor: "border-lime-900/40",
  },
  {
    id: "left-3",
    slot: "LEFT_3",
    brand: "Blotato",
    tagline: "Social Media API",
    description: "Social Media API & MCP for Claude and AI agents.",
    logoText: "🔮",
    logoBg: "bg-purple-600",
    logoTextColor: "text-white",
    cardBg: "bg-[#16121a] hover:border-purple-500/30",
    accentColor: "border-purple-900/40",
  },
  {
    id: "left-4",
    slot: "LEFT_4",
    brand: "Ecom Tools",
    tagline: "SEO & Growth",
    description: "30+ Premium Ecom, AI and SEO Tools for global reach.",
    logoText: "🛡️",
    logoBg: "bg-blue-600",
    logoTextColor: "text-white",
    cardBg: "bg-[#10141a] hover:border-blue-500/30",
    accentColor: "border-blue-900/40",
  },
  {
    id: "left-5",
    slot: "LEFT_5",
    brand: "CREEM",
    tagline: "Global Software",
    description: "Sell Software globally, grow your revenue with 0 code.",
    logoText: "V",
    logoBg: "bg-pink-600",
    logoTextColor: "text-white",
    cardBg: "bg-[#181215] hover:border-pink-500/30",
    accentColor: "border-pink-900/40",
  },
];

export const RIGHT_ADS: AdItem[] = [
  {
    id: "right-1",
    slot: "RIGHT_1",
    brand: "Higgsfield",
    tagline: "Video Generation",
    description: "Create AI videos and images with Higgsfield.",
    logoText: "⚡",
    logoBg: "bg-emerald-500",
    logoTextColor: "text-black",
    cardBg: "bg-[#111915] hover:border-emerald-500/30",
    accentColor: "border-emerald-900/40",
  },
  {
    id: "right-2",
    slot: "RIGHT_2",
    brand: "Hermoso.ai",
    tagline: "Creative Suite",
    description: "AI video & images, social media scheduling & ads 🚀.",
    logoText: "🔥",
    logoBg: "bg-amber-600",
    logoTextColor: "text-white",
    cardBg: "bg-[#161411] hover:border-amber-500/30",
    accentColor: "border-amber-900/40",
  },
  {
    id: "right-3",
    slot: "RIGHT_3",
    brand: "Chatbase",
    tagline: "AI Support",
    description: "AI agent for customer support & automated sales.",
    logoText: "B",
    logoBg: "bg-zinc-700",
    logoTextColor: "text-white",
    cardBg: "bg-[#141414] hover:border-zinc-500/30",
    accentColor: "border-zinc-800",
  },
  {
    id: "right-4",
    slot: "RIGHT_4",
    brand: "Virlo",
    tagline: "Short-Form Data",
    description: "Track, manage, leverage short-form video data.",
    logoText: "V",
    logoBg: "bg-fuchsia-600",
    logoTextColor: "text-white",
    cardBg: "bg-[#191217] hover:border-fuchsia-500/30",
    accentColor: "border-fuchsia-900/40",
  },
  {
    id: "right-5",
    slot: "RIGHT_5",
    brand: "Advertise",
    tagline: "Promote Product",
    description: "1/20 spots left. Reach 250k+ monthly global viewers.",
    logoText: "📢",
    logoBg: "bg-zinc-800",
    logoTextColor: "text-zinc-300",
    cardBg: "bg-[#0f0f0f] border-dashed hover:border-white/30",
    accentColor: "border-white/10",
    isAvailableSlot: true,
  },
];
