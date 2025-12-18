"use client";

import { useEffect, useMemo, useState } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import {
  BarChart3,
  Home as HomeIcon,
  User,
  Medal,
  CalendarCheck,
  CheckCircle2,
  PieChart as PieChartIcon,
  Activity,
} from "lucide-react";
import { auth, db } from "../../lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
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
import { usePathname, useRouter } from "next/navigation";

type Habit = {
  id: string;
  name: string;
  completedDates: string[];
  status?: string;
  completedAt?: string;
  targetDays?: number;
  category?: string;
};

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const weekdayLabels = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const CATEGORY_COLORS: Record<string, string> = {
  health: "#22c55e",       // Green
  work_school: "#3b82f6",  // Blue
  personal_growth: "#f97316", // Orange
  social: "#ec4899",       // Pink
  other: "#9333ea",        // Purple
};

const CATEGORY_LABELS: Record<string, string> = {
  health: "Sağlık",
  work_school: "İş/Okul",
  personal_growth: "Kişisel",
  social: "Sosyal",
  other: "Diğer",
};

export default function StatsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  // Auth: Kullanıcı kontrolü
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        router.push("/login"); // Giriş yoksa yönlendir
      }
    });
    return () => unsubscribe();
  }, [router]);

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
          status?: string;
          completedAt?: string;
          targetDays?: number;
          category?: string;
        };

        return {
          id: docSnap.id,
          name: data.name ?? "",
          completedDates: Array.isArray(data.completedDates)
            ? (data.completedDates as string[])
            : [],
          status: data.status,
          completedAt: data.completedAt,
          targetDays: data.targetDays ?? 21,
          category: data.category ?? "other",
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

  const { barData } = useMemo(() => {
    // 2. ÇUBUK GRAFİK: SON 7 GÜN PERFORMANSI
    const activeHabits = habits.filter(h => h.status !== 'completed');
    const dateKeySet = new Set(last7Days.map((d) => d.key));
    const barCounts: Record<string, number> = {};
    last7Days.forEach((d) => {
      barCounts[d.key] = 0;
    });

    activeHabits.forEach((habit) => {
      habit.completedDates.forEach((dateStr) => {
        if (barCounts[dateStr] !== undefined) {
          barCounts[dateStr] += 1;
        }
      });
    });

    const barChartData = last7Days.map((d) => ({
      day: d.label,
      dateKey: d.key,
      done: barCounts[d.key] ?? 0,
    }));

    return {
      barData: barChartData,
    };
  }, [habits, last7Days]);

  // HEATMAP VERİSİ
  const heatmapValues = useMemo(() => {
    const counts: Record<string, number> = {};

    habits.forEach(h => {
      h.completedDates.forEach(date => {
        counts[date] = (counts[date] || 0) + 1;
      });
    });

    return Object.entries(counts).map(([date, count]) => ({
      date,
      count
    }));
  }, [habits]);

  // KATEGORİ VERİSİ (Pasta Grafik için)
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};

    habits.forEach(h => {
      const cat = h.category || "other";
      // Sadece tamamlanma sayılarına göre mi yoksa alışkanlık sayısına göre mi?
      // "Odak Alanları" için tamamlanma sayısı (Action) daha mantıklı.
      const actionCount = h.completedDates.length;
      counts[cat] = (counts[cat] || 0) + actionCount;
    });

    return Object.entries(counts)
      .map(([key, value]) => ({
        name: CATEGORY_LABELS[key] || "Diğer",
        value: value,
        color: CATEGORY_COLORS[key] || "#9333ea"
      }))
      .filter(x => x.value > 0);
  }, [habits]);


  const activeHabits = habits.filter(h => h.status !== 'completed');
  const finishedHabits = habits.filter(h => h.status === 'completed');

  const COLORS = ["#6B46C1", "#E2E8F0"];

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50 relative overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed -right-32 -top-32 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none dark:bg-purple-900/20" />
      <div className="fixed -left-32 top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none dark:bg-blue-900/20" />

      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-24 pt-6 sm:px-6 relative z-10">
        {/* Header */}
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-purple-500 dark:text-purple-300">
              Day by Day
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              İstatistikler
            </h1>
          </div>
        </header>

        <main className="flex-1 space-y-6 pb-4">

          {/* Aktif Hedefler İlerleme Listesi */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Hedef İlerlemeleri
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Her alışkanlık için detaylı durum
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {activeHabits.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 dark:border-slate-800">
                  Henüz aktif bir alışkanlığın yok.
                </div>
              ) : (
                activeHabits.map(habit => {
                  const total = habit.targetDays || 21;
                  const current = habit.completedDates.length;
                  const percent = Math.min(100, Math.round((current / total) * 100));

                  return (
                    <div key={habit.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {habit.name}
                        </span>
                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                          %{percent}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full bg-purple-500 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Hedef: {total} Gün</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {current} / {total} Tamamlandı
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Heatmap (Aktivite Haritası) */}
          <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Aktivite Haritası
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Geçen ay, bu ay ve gelecek ay
                </p>
              </div>
              <Activity className="h-5 w-5 text-slate-400" />
            </div>

            <div className="flex gap-6 overflow-x-auto pb-4 pt-2 justify-center">
              {[-1, 0, 1].map((offset) => {
                const d = new Date();
                d.setMonth(d.getMonth() + offset);
                const year = d.getFullYear();
                const month = d.getMonth();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const firstDayDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0

                const monthLabel = d.toLocaleDateString("tr-TR", { month: "short" }); // Kısaltılmış ay adı (Oca, Şub)

                return (
                  <div key={offset} className="flex-shrink-0">
                    <h3 className="mb-2 text-center text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                      {monthLabel}
                    </h3>
                    <div className="grid grid-cols-7 gap-1">
                      {/* Empty cells for padding */}
                      {Array.from({ length: firstDayDow }).map((_, padI) => (
                        <div key={`pad-${padI}`} className="h-5 w-5" />
                      ))}

                      {/* Days */}
                      {Array.from({ length: daysInMonth }).map((_, dayI) => {
                        const dayNum = dayI + 1;
                        const dateKey = getDateKey(new Date(year, month, dayNum));
                        const data = heatmapValues.find(v => v.date === dateKey);
                        const count = data ? data.count : 0;

                        // Color Logic
                        let bgClass = "bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600";
                        if (count > 0) {
                          if (count >= 4) bgClass = "bg-purple-700 text-purple-100 dark:bg-purple-600";
                          else if (count >= 3) bgClass = "bg-purple-500 text-white dark:bg-purple-500";
                          else if (count >= 2) bgClass = "bg-purple-400 text-purple-50 dark:bg-purple-400";
                          else bgClass = "bg-purple-300 text-purple-100 dark:bg-purple-300 dark:text-purple-700";
                        }

                        return (
                          <div
                            key={dayNum}
                            className={`flex h-5 w-5 items-center justify-center rounded-md text-[8px] font-medium transition-colors ${bgClass}`}
                            title={`${dateKey}: ${count} işlem`}
                          >
                            {dayNum}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend / Açıklama */}
            <div className="mt-2 flex items-center justify-end gap-2 text-[10px] text-slate-400">
              <span>Az</span>
              <div className="flex gap-1">
                <div className="h-2.5 w-2.5 rounded-sm bg-[#f3f4f6]"></div>
                <div className="h-2.5 w-2.5 rounded-sm bg-[#d8b4fe]"></div>
                <div className="h-2.5 w-2.5 rounded-sm bg-[#c084fc]"></div>
                <div className="h-2.5 w-2.5 rounded-sm bg-[#a855f7]"></div>
                <div className="h-2.5 w-2.5 rounded-sm bg-[#7e22ce]"></div>
              </div>
              <span>Çok</span>
            </div>
          </section>

          {/* Kategori Dağılımı (Pie Chart) */}
          {categoryData.length > 0 && (
            <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Odak Alanları
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hangi kategorilere daha çok zaman ayırıyorsun?
                </p>
              </div>

              <div className="flex h-48 w-full items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        fontSize: 12,
                        backgroundColor: "#fff",
                        color: "#0f172a"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend for Categories */}
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {categoryData.map((cat, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span>{cat.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tamamlanan Hedefler Listesi */}
          {finishedHabits.length > 0 && (
            <section className="rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50 p-4 shadow-sm ring-1 ring-green-100 dark:from-green-900/10 dark:to-emerald-900/10 dark:ring-green-900/30">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <Medal className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-green-900 dark:text-green-100">
                    Tamamlanan Hedefler
                  </h2>
                  <p className="text-xs text-green-700/70 dark:text-green-300/70">
                    Başarıyla bitirdiğin alışkanlıklar
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {finishedHabits.map(habit => (
                  <div key={habit.id} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {habit.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <CalendarCheck className="h-3 w-3" />
                          <span>
                            {habit.completedAt
                              ? new Date(habit.completedAt).toLocaleDateString("tr-TR")
                              : "Tamamlandı"}
                          </span>
                          <span>•</span>
                          <span>{habit.targetDays} Günlük Hedef</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-green-600 dark:text-green-400">
                      BAŞARILDI
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

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
