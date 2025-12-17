import type { LucideIcon } from "lucide-react";

export type BadgeId = "first-step" | "streak-master" | "level-5" | "marathon";

export type BadgeIconName = "Rocket" | "Flame" | "Crown" | "Medal";

export type BadgeConditionContext = {
  totalCompleted: number;
  maxStreak: number;
  level: number;
};

export type BadgeDefinition = {
  id: BadgeId;
  name: string;
  description: string;
  icon: BadgeIconName;
  condition: (ctx: BadgeConditionContext) => boolean;
};

export const BADGES: BadgeDefinition[] = [
  {
    id: "first-step",
    name: "İlk Adım",
    description: "En az 1 görevi tamamladın.",
    icon: "Rocket",
    condition: ({ totalCompleted }) => totalCompleted > 0,
  },
  {
    id: "streak-master",
    name: "Seri Canavarı",
    description: "Herhangi bir alışkanlığın serisi 3 veya daha fazla gün.",
    icon: "Flame",
    condition: ({ maxStreak }) => maxStreak >= 3,
  },
  {
    id: "level-5",
    name: "Seviye 5",
    description: "Seviye 5 veya üzeri oldun.",
    icon: "Crown",
    condition: ({ level }) => level >= 5,
  },
  {
    id: "marathon",
    name: "Maratoncu",
    description: "Toplamda en az 50 görevi tamamladın.",
    icon: "Medal",
    condition: ({ totalCompleted }) => totalCompleted >= 50,
  },
];


