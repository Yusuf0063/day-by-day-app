"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Home as HomeIcon,
  User,
} from "lucide-react";
import { auth, db } from "../../lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Habit = {
  id: string;
  name: string;
  completedDates: string[];
};

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const weekdayLabels = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export default function StatsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const pathname = usePathname();

  // Auth: anonim giriş
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        return;
      }
      const cred = await signInAnonymously(auth);
      setUserId(cred.user.uid);
    });
    return () => unsubscribe();
  }, []);

  // Alışkanlıkları dinle
  useEffect(() => {
    if (!userId) return;

    const habitsRef = collection(db, "users", userId, "habits");
    const q = query(habitsRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nextHabits: Habit[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as {
          name?: string;
          completedDates?: string[];
        };

        return {
          id: docSnap.id,
          name: data.name ?? "",
          completedDates: Array.isArray(data.completedDates)
            ? (data.completedDates as string[])
            : [],
        };
      });

      setHabits(nextHabits);
    });

    return () => unsubscribe();
  }, [userId]);

  const today = useMemo(() => new Date(), []);

  // Son 7 gün için tarih anahtarlarını ve label'larını hazırla
  const last7Days = useMemo(() => {
    const days: {
      key: string;
      label: string;
    }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const key = getDateKey(d);
      const weekdayIndex = (d.getDay() + 6) % 7; // Pazarı sona at (0 => Paz)
      days.push({
        key,
        label: weekdayLabels[weekdayIndex],
      });
    }
    return days;
  }, [today]);

  // Haftalık başarı ve günlük tamamlanma verileri
  const { weeklyPieData, weeklySuccessPercent, barData } = useMemo(() => {
    const dateKeySet = new Set(last7Days.map((d) => d.key));

    let doneCount = 0;
    const barCounts: Record<string, number> = {};
    last7Days.forEach((d) => {
      barCounts[d.key] = 0;
    });

    habits.forEach((habit) => {
      habit.completedDates.forEach((dateStr) => {
        if (dateKeySet.has(dateStr)) {
          doneCount += 1;
          barCounts[dateStr] = (barCounts[dateStr] ?? 0) + 1;
        }
      });
    });

    const totalTasks = habits.length * last7Days.length;
    const successPercent =
      totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

    const pieData = [
      { name: "Tamamlandı", value: doneCount },
      { name: "Kalan", value: Math.max(totalTasks - doneCount, 0) },
    ];

    const barChartData = last7Days.map((d) => ({
      day: d.label,
      dateKey: d.key,
      done: barCounts[d.key] ?? 0,
    }));

    return {
      weeklyPieData: pieData,
      weeklySuccessPercent: successPercent,
      barData: barChartData,
    };
  }, [habits, last7Days]);

  const COLORS = ["#6B46C1", "#E2E8F0"];

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
              Haftalık Rapor
            </h1>
          </div>
        </header>

        <main className="flex-1 space-y-4 pb-4">
          {/* Haftalık Başarı Halkası */}
          <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Haftalık Başarı
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Son 7 günün genel performansı
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={weeklyPieData}
                      innerRadius={52}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {weeklyPieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-medium text-slate-400">
                    Başarı
                  </span>
                  <span className="text-2xl font-semibold text-purple-600">
                    {weeklySuccessPercent}%
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-600" />
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      Tamamlanan görevler
                    </span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-300">
                    {weeklyPieData[0].value} görev
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-100" />
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      Kalan görevler
                    </span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-300">
                    {weeklyPieData[1].value} görev
                  </span>
                </div>
                <p className="pt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  * Her alışkanlık için her gün bir görev kabul edilir.
                </p>
              </div>
            </div>
          </section>

          {/* Tamamlanma Grafiği */}
          <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Günlük Tamamlanma
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Son 7 günde kaç alışkanlık tamamladın?
                </p>
              </div>
            </div>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ left: -20 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#1E293B"
                  />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#64748B" }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#CBD5F5" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #E2E8F0",
                      fontSize: 11,
                    }}
                  />
                  <Bar
                    dataKey="done"
                    radius={[999, 999, 0, 0]}
                    fill="#6B46C1"
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
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


