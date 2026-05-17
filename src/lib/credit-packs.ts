export type CreditPack = {
  id: string;
  name: string;
  credits: number;
  bonusCredits: number;
  priceCents: number;
  currency: string;
  tagline?: string | null;
  badge?: string | null;
  icon: string;
  theme: string;
  highlight: boolean;
  active: boolean;
  sortOrder: number;
};

export const PACK_ICONS = ["sparkles", "wand", "gem", "crown", "flame", "waves", "leaf", "moon", "heart"] as const;
export const PACK_THEMES = ["pastel", "astro", "nature", "flame", "ocean"] as const;
