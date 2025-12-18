"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Crown,
  Flame,
  Home as HomeIcon,
  Lock,
  Medal,
  Rocket,
  User as UserIcon,
  UserCircle2,
  ShoppingBag,
  Zap,
} from "lucide-react";
import MarketModal from "../../components/market-modal";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import AuthModal from "../../components/auth-modal";
import CalendarHeatmap from "react-calendar-heatmap";
import { BADGES, type BadgeDefinition, type BadgeId } from "../../lib/badges";

type Habit = {
  id: string;
  completedDates: string[];
};

type UserStats = {
  level: number;
  score: number;
  totalXP?: number;
  inventory: string[];
  activeTheme?: string | null;
  activeFrame?: string | null;
};

const getBadgeIconElement = (badge: BadgeDefinition) => {
  switch (badge.icon) {
    case "Rocket":
      return <Rocket className="h-6 w-6" />;
    case "Flame":
      return <Flame className="h-6 w-6" />;
    case "Crown":
      return <Crown className="h-6 w-6" />;
    case "Medal":
      return <Medal className="h-6 w-6" />;
    default:
      return <Rocket className="h-6 w-6" />;
  }
};

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({ level: 1, score: 0, inventory: [] });
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [earnedBadges, setEarnedBadges] = useState<BadgeId[]>([]);

  // Auth: Kullanıcı kontrolü
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setUserId(user.uid);
      } else {
        // Giriş yoksa Login sayfasına yönlendir
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Kullanıcı seviye / puan
  useEffect(() => {
    if (!userId) return;

    const userRef = doc(db, "users", userId);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) {
        setUserStats({ level: 1, score: 0, inventory: [] });
        setEarnedBadges([]);
        return;
      }
      const data = snap.data() as {
        level?: number;
        score?: number;
        totalXP?: number;
        earnedBadges?: string[];
        inventory?: string[];
        activeTheme?: string;
        activeFrame?: string;
      };

      // Eğer totalXP yoksa, mevcut seviye ve puandan hesapla
      const calculatedTotalXP = typeof data.totalXP === 'number'
        ? data.totalXP
        : ((data.level ?? 1) - 1) * 100 + (data.score ?? 0);

      setUserStats({
        level: data.level ?? 1,
        score: data.score ?? 0,
        totalXP: calculatedTotalXP,
        inventory: data.inventory ?? [],
        activeTheme: data.activeTheme ?? null,
        activeFrame: data.activeFrame ?? null,
      });
      setEarnedBadges(
        Array.isArray(data.earnedBadges) ? (data.earnedBadges as BadgeId[]) : []
      );
    });

    return () => unsubscribe();
  }, [userId]);

  // Alışkanlıklar
  useEffect(() => {
    if (!userId) return;

    const habitsRef = collection(db, "users", userId, "habits");
    const q = query(habitsRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nextHabits: Habit[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as {
          completedDates?: string[];
        };
        return {
          id: docSnap.id,
          completedDates: Array.isArray(data.completedDates)
            ? (data.completedDates as string[])
            : [],
        };
      });
      setHabits(nextHabits);
    });

    return () => unsubscribe();
  }, [userId]);

  const totalCompleted = useMemo(
    () =>
      habits.reduce(
        (acc, habit) => acc + (habit.completedDates?.length ?? 0),
        0
      ),
    [habits]
  );

  // Heatmap için tarih bazlı toplam görev sayısını hazırla
  const activityValues = useMemo(() => {
    const counts: Record<string, number> = {};

    habits.forEach((habit) => {
      habit.completedDates.forEach((dateStr) => {
        counts[dateStr] = (counts[dateStr] ?? 0) + 1;
      });
    });

    return Object.entries(counts).map(([date, count]) => ({
      date,
      count,
    }));
  }, [habits]);

  const today = useMemo(() => new Date(), []);
  const oneYearAgo = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d;
  }, []);

  const progressPercent = Math.min(
    userStats.score, // 100 puan hedefli yüzde hesabı (score zaten 0-99 arası döner teorik olarak, veya artar)
    100
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (e) {
      console.error("Sign out error", e);
    }
  };

  if (!currentUser) {
    return null; // Yönlendirme olurken boş ekran göster
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-24 pt-6 sm:px-6">
        {/* Header */}
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-purple-500 dark:text-purple-300">
              Day by Day
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Profil
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsMarketOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
            >
              <ShoppingBag className="h-4 w-4" />
              Sanal Dükkan
            </button>
            <button
              onClick={handleLogout}
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
            >
              Çıkış Yap
            </button>
          </div>
        </header>

        <main className="flex-1 space-y-4 pb-4">
          {/* Profil Kartı */}
          {/* Profil & Seviye Kartı */}
          <section className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-lg shadow-purple-500/5 ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
            {/* Arka plan dekorasyonu */}
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl dark:bg-purple-500/20" />
            <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/20" />

            <div className="relative flex flex-col items-center text-center">
              {/* Avatar & Level Badge */}
              <div className="relative mb-4">
                <div className={`relative inline-flex rounded-full transition-all duration-300
                   ${userStats.activeFrame === 'gold' ? 'mt-4 ring-4 ring-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.6)]' : ''}
                   ${userStats.activeFrame === 'neon' ? 'mt-4 ring-[6px] ring-fuchsia-500 shadow-[0_0_40px_#d946ef,0_0_80px_#8b5cf6,0_0_15px_#ffffff] animate-pulse' : ''}
                   ${userStats.activeFrame === 'fire' ? 'mt-4 realistic-fire' : ''}
                `}>
                  {/* Crown for Gold Frame */}
                  {userStats.activeFrame === 'gold' && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 transform z-10">
                      <Crown className="h-10 w-10 text-yellow-500 fill-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] animate-bounce" />
                    </div>
                  )}

                  {/* Zap for Neon Frame */}
                  {userStats.activeFrame === 'neon' && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 transform z-10">
                      <Zap className="h-14 w-14 text-fuchsia-400 fill-violet-500 drop-shadow-[0_0_20px_#d946ef] animate-[bounce_1.5s_infinite]" />
                    </div>
                  )}

                  {/* Flame for Fire Frame */}
                  {userStats.activeFrame === 'fire' && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 transform z-10">
                      <Flame className="h-16 w-16 text-orange-500 fill-red-600 animate-flame" />
                    </div>
                  )}

                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-white shadow-xl ring-4 ring-white dark:from-slate-800 dark:to-slate-900 dark:ring-slate-800">
                    <UserCircle2 className="h-16 w-16 text-purple-600 dark:text-purple-400" />
                  </div>

                  <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-lg font-bold text-white shadow-lg ring-4 ring-white dark:ring-slate-900">
                    {userStats.level}
                  </div>
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                {currentUser.displayName || currentUser.email?.split('@')[0] || "Misafir"}
              </h2>
              <p className="text-xs font-medium uppercase tracking-wider text-purple-500 dark:text-purple-400">
                {userStats.level >= 5 ? "Alışkanlık Ustası" : "Yeni Başlayan"}
              </p>

              {/* XP Bar */}
              <div className="mt-6 w-full max-w-xs">
                <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-300">XP</span>
                  <span className="text-purple-600 dark:text-purple-400">{userStats.score} / 100</span>
                </div>
                <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all duration-1000"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* İstatistikler Grid */}
              <div className="mt-6 grid w-full max-w-xs grid-cols-3 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Tamamlanan</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {totalCompleted}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Seviye</div>
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {userStats.level}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Toplam XP</div>
                  <div className="text-lg font-bold text-fuchsia-600 dark:text-fuchsia-400">
                    {userStats.totalXP ?? 0}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Rozetler */}
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-50">
                <Medal className="h-5 w-5 text-yellow-500" />
                Başarımlar
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Görevleri tamamla, rozetleri topla!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {BADGES.map((badge) => {
                const unlocked = earnedBadges.includes(badge.id);

                return (
                  <button
                    key={badge.id}
                    onClick={() => {
                      // Basit alert yerine belki ilerde modal açılır
                      alert(`${badge.name}: ${badge.description}`);
                    }}
                    className={`group relative flex flex-col items-center overflow-hidden rounded-2xl border p-4 text-center transition-all hover:scale-[1.02] active:scale-95 ${unlocked
                      ? "border-purple-200 bg-gradient-to-br from-white to-purple-50 shadow-md shadow-purple-500/10 dark:border-purple-500/30 dark:from-slate-900 dark:to-purple-900/20"
                      : "border-slate-100 bg-slate-50 grayscale dark:border-slate-800 dark:bg-slate-900/50"
                      }`}
                  >
                    {/* Unlocked Glow Effect */}
                    {unlocked && (
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    )}

                    <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl shadow-sm ring-1 ring-inset transition-transform group-hover:rotate-6 ${unlocked
                      ? "bg-gradient-to-br from-purple-100 to-white text-purple-600 ring-purple-200 dark:from-purple-900 dark:to-slate-900 dark:text-purple-300 dark:ring-purple-800"
                      : "bg-slate-100 text-slate-300 ring-slate-200 dark:bg-slate-800 dark:text-slate-600 dark:ring-slate-700"
                      }`}>
                      {getBadgeIconElement(badge)}
                    </div>

                    <div className={`text-sm font-bold ${unlocked ? "text-slate-800 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}>
                      {badge.name}
                    </div>
                    <div className="mt-1 line-clamp-2 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                      {badge.description}
                    </div>

                    {!unlocked && (
                      <div className="absolute right-2 top-2 text-slate-300 dark:text-slate-600">
                        <Lock className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        </main>

        {/* Alt Navigasyon Barı */}
        <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-100 bg-white/95 pb-4 pt-2 shadow-[0_-4px_12px_rgba(15,23,42,0.06)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/90">
          <div className="mx-auto flex max-w-md items-center justify-around px-6">
            {/* Ana Ekran */}
            <Link
              href="/"
              className={`flex flex-col items-center gap-0.5 text-xs font-medium ${pathname === "/" ? "text-purple-600" : "text-slate-400"
                }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${pathname === "/" ? "bg-purple-50" : ""
                  }`}
              >
                <HomeIcon className="h-5 w-5" />
              </span>
              <span>Ana Ekran</span>
            </Link>

            {/* İstatistikler */}
            <Link
              href="/stats"
              className={`flex flex-col items-center gap-0.5 text-xs font-medium ${pathname === "/stats" ? "text-purple-600" : "text-slate-400"
                }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${pathname === "/stats" ? "bg-purple-50" : ""
                  }`}
              >
                <BarChart3 className="h-5 w-5" />
              </span>
              <span>İstatistikler</span>
            </Link>

            {/* Profil */}
            <Link
              href="/profile"
              className={`flex flex-col items-center gap-0.5 text-xs font-medium ${pathname === "/profile" ? "text-purple-600" : "text-slate-400"
                }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${pathname === "/profile" ? "bg-purple-50" : ""
                  }`}
              >
                <UserIcon className="h-5 w-5" />
              </span>
              <span>Profil</span>
            </Link>
          </div>
        </nav>
      </div>
      <MarketModal
        isOpen={isMarketOpen}
        onClose={() => setIsMarketOpen(false)}
        userId={userId}
        currentScore={userStats.score}
        ownedItems={userStats.inventory}
        activeTheme={userStats.activeTheme}
        activeFrame={userStats.activeFrame}
      />
    </div>
  );
}
