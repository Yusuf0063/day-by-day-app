import { create } from 'zustand';

// Tipler
export type Habit = {
    id: string;
    name: string; // Title -> Name
    description: string;
    category: string;
    completedDates: string[];
    streak: number;
    createdAt?: any;
    status: "active" | "archived" | string;
    // UI related
    targetDays: number;
    reminderTime?: string | null;
    isIndefinite?: boolean;
    createdAtKey?: string | null;
    // Icon ReactNode olamaz, o yuzden burada basit bir string tutuyoruz, UI'da render ediyoruz
    icon?: string;
};

export type UserStats = {
    level: number;
    score: number; // Level Progress
    hearts: number;
    gems: number;
    totalXP: number;
    inventory: string[];
    activeTheme: string | null;
    activeFrame: string | null;
    earnedBadges: string[];
};

interface GameState {
    // State
    user: UserStats;
    habits: Habit[];
    isLoading: boolean;

    // Actions
    setUser: (stats: Partial<UserStats>) => void;
    setHabits: (habits: Habit[]) => void;
    updateHabit: (id: string, updates: Partial<Habit>) => void;
    deleteHabit: (id: string) => void;

    // Game Logic Actions
    addXP: (amount: number) => void;
    loseHeart: () => void;
    refillHearts: () => void;
}

export const useGameStore = create<GameState>((set) => ({
    // Başlangıç Değerleri
    user: {
        level: 1,
        score: 0,
        hearts: 3,
        gems: 0,
        totalXP: 0,
        inventory: [],
        activeTheme: null,
        activeFrame: null,
        earnedBadges: [],
    },
    habits: [],
    isLoading: true,

    // Actions
    setUser: (stats) => set((state) => ({
        user: { ...state.user, ...stats },
        isLoading: false
    })),

    setHabits: (habits) => set({ habits }),

    updateHabit: (id, updates) => set((state) => ({
        habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    })),

    deleteHabit: (id) => set((state) => ({
        habits: state.habits.filter((h) => h.id !== id),
    })),

    addXP: (amount) => set((state) => {
        const newXP = state.user.score + amount;
        const newTotalXP = state.user.totalXP + amount;
        // Level up logic handled by server mostly, but optimistic update:
        return {
            user: {
                ...state.user,
                score: newXP,
                totalXP: newTotalXP,
            }
        };
    }),

    loseHeart: () => set((state) => ({
        user: { ...state.user, hearts: Math.max(0, state.user.hearts - 1) }
    })),

    refillHearts: () => set((state) => ({
        user: { ...state.user, hearts: 3 }
    })),
}));
