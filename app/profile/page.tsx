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
  User,
  UserCircle2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { onAuthStateChanged, signInAnonymously, signOut } from "firebase/auth";
import AuthModal from "../../components/auth-modal";
import { type User } from "firebase/auth";
import CalendarHeatmap from "react-calendar-heatmap";
import { BADGES, type BadgeDefinition, type BadgeId } from "../../lib/badges";

type Habit = {
  id: string;
  completedDates: string[];
};

type UserStats = {
  level: number;
  score: number;
};

const getBadgeIconElement = (badge: BadgeDefinition): JSX.Element => {
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
  const [userStats, setUserStats] = useState<UserStats>({ level: 1, score: 0 });
  const [habits, setHabits] = useState<Habit[]>([]);
  const pathname = usePathname();
  const [earnedBadges, setEarnedBadges] = useState<BadgeId[]>([]);

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setUserId(user.uid);
        return;
      }

      const cred = await signInAnonymously(auth);
      setCurrentUser(cred.user);
      setUserId(cred.user.uid);
    });

    return () => unsubscribe();
  }, []);

  // Kullanıcı seviye / puan
  useEffect(() => {
    if (!userId) return;

    const userRef = doc(db, "users", userId);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) {
        setUserStats({ level: 1, score: 0 });
        setEarnedBadges([]);
        return;
      }
      const data = snap.data() as {
        level?: number;
        score?: number;
        earnedBadges?: string[];
      };
      setUserStats({
        level: data.level ?? 1,
        score: data.score ?? 0,
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

  const progressPercent = Math.min(userStats.score, 100);

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
        </header>

        <main className="flex-1 space-y-4 pb-4">
          {/* Profil Kartı */}
          <section className="flex flex-col items-center rounded-3xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-purple-50 text-purple-500 shadow-sm dark:bg-purple-900/40 dark:text-purple-300">
              <UserCircle2 className="h-12 w-12" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {currentUser && !currentUser.isAnonymous
                ? currentUser.email
                : "Misafir Kullanıcı"}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {currentUser && !currentUser.isAnonymous
                ? "Gerçek hesap ile giriş yaptınız."
                : "Giriş yapmadan anonim olarak ilerliyorsun."}
            </p>

            {currentUser?.isAnonymous ? (
              <div className="mt-4 w-full max-w-xs">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full rounded-full bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-2 text-sm font-medium text-white"
                >
                  Verilerini Kaybetme! Hesap Oluştur
                </button>
              </div>
            ) : (
              <div className="mt-4 w-full max-w-xs space-y-1.5">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-sm text-slate-600 dark:text-slate-200">
                    {currentUser?.email}
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await signOut(auth);
                      } catch (e) {
                        console.error("Sign out error", e);
                      }
                    }}
                    className="rounded-full bg-slate-100 px-4 py-2 text-sm"
                  >
                    Çıkış Yap
                  </button>
                </div>
              </div>
            )}

            <AuthModal
              open={showAuthModal}
              onClose={() => setShowAuthModal(false)}
            />

            <div className="mt-4 w-full max-w-xs space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  Seviye {userStats.level}
                </span>
                <span className="text-slate-400 dark:text-slate-400">
                  {userStats.score} / 100 Puan
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-purple-100 dark:bg-purple-950/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Toplam tamamlanan görev:{" "}
                <span className="font-semibold text-slate-600 dark:text-slate-200">
                  {totalCompleted}
                </span>
              </p>
            </div>
          </section>

          {/* Yıllık Aktivite Isı Haritası */}
          <section className="overflow-x-auto rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Yıllık Aktivite
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Son 1 yılda hangi günlerde aktif oldun?
                </p>
              </div>
            </div>

            <div className="min-w-[520px] sm:min-w-0">
              <CalendarHeatmap
                startDate={oneYearAgo}
                endDate={today}
                values={activityValues}
                showWeekdayLabels
                classForValue={(value) => {
                  if (!value || !value.count) {
                    return "color-empty";
                  }

                  const count = value.count as number;

                  if (count >= 8) return "color-scale-4";
                  if (count >= 5) return "color-scale-3";
                  if (count >= 3) return "color-scale-2";
                  return "color-scale-1";
                }}
              />
            </div>
          </section>

          {/* Rozetler */}
          <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Rozetler
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  İlerlemeni gösteren küçük ödüller.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {BADGES.map((badge) => {
                const unlocked = earnedBadges.includes(badge.id);

                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => {
                      alert(badge.description);
                    }}
                    className={`relative flex flex-col items-center rounded-2xl border px-2.5 py-3 text-center text-xs shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                      unlocked
                        ? "border-purple-200 bg-gradient-to-b from-white to-purple-50 text-slate-800 dark:border-purple-500/60 dark:from-slate-900 dark:to-purple-950/40"
                        : "border-slate-100 bg-slate-50 text-slate-400 opacity-70 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500"
                    }`}
                  >
                    <div
                      className={`mb-1.5 flex h-9 w-9 items-center justify-center rounded-full ${
                        unlocked
                          ? "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-200"
                          : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                      }`}
                    >
                      {getBadgeIconElement(badge)}
                    </div>
                    <div className="mb-0.5 line-clamp-1 font-semibold">
                      {badge.name}
                    </div>
                    <div className="line-clamp-2 text-[11px]">
                      {badge.description}
                    </div>
                    {!unlocked && (
                      <div className="absolute right-1.5 top-1.5 rounded-full bg-white/80 p-1 text-slate-300 shadow-sm dark:bg-slate-900/80 dark:text-slate-500">
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
              className={`flex flex-col items-center gap-0.5 text-xs font-medium ${
                pathname === "/" ? "text-purple-600" : "text-slate-400"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  pathname === "/" ? "bg-purple-50" : ""
                }`}
              >
                <HomeIcon className="h-5 w-5" />
              </span>
              <span>Ana Ekran</span>
            </Link>

            {/* İstatistikler */}
            <Link
              href="/stats"
              className={`flex flex-col items-center gap-0.5 text-xs font-medium ${
                pathname === "/stats" ? "text-purple-600" : "text-slate-400"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  pathname === "/stats" ? "bg-purple-50" : ""
                }`}
              >
                <BarChart3 className="h-5 w-5" />
              </span>
              <span>İstatistikler</span>
            </Link>

            {/* Profil */}
            <Link
              href="/profile"
              className={`flex flex-col items-center gap-0.5 text-xs font-medium ${
                pathname === "/profile" ? "text-purple-600" : "text-slate-400"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  pathname === "/profile" ? "bg-purple-50" : ""
                }`}
              >
                <User className="h-5 w-5" />
              </span>
              <span>Profil</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
