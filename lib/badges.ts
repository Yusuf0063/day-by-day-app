export type BadgeId = string; // Artık dinamik string ID

export type BadgeConditionContext = {
  totalCompleted: number;
  maxStreak: number;
  level: number;
};

// Dinamik Rozet Tanımı (Firebase ile uyumlu)
export type BadgeDefinition = {
  id: string;
  name: string;
  description: string;
  icon?: string; // Emoji veya URL
  xpReward?: number;

  // Dinamik Koşullar
  conditionType: "total_habits" | "streak_days" | "level_reached";
  conditionValue: number;
};
