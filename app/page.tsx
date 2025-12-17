"use client";
import { useEffect, useState } from "react";
import useSound from "use-sound";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Home as HomeIcon,
  Pencil,
  User,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth, db } from "../lib/firebase";
import { BADGES, type BadgeDefinition } from "../lib/badges";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";

const HABIT_CATEGORIES = [
  {
    id: "health",
    label: "Sağlık",
    borderClass: "border-green-500",
    pillClass:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
  {
    id: "work_school",
    label: "İş / Okul",
    borderClass: "border-blue-500",
    pillClass:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    id: "personal_growth",
    label: "Kişisel Gelişim",
    borderClass: "border-orange-500",
    pillClass:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  },
  {
    id: "social",
    label: "Sosyal",
    borderClass: "border-pink-500",
    pillClass:
      "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  },
  {
    id: "other",
    label: "Diğer",
    borderClass: "border-purple-600",
    pillClass:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  },
] as const;

type HabitCategoryId = (typeof HABIT_CATEGORIES)[number]["id"];

const getCategoryConfig = (category?: string) => {
  const fallback = HABIT_CATEGORIES[HABIT_CATEGORIES.length - 1];
  if (!category) return fallback;
  return HABIT_CATEGORIES.find((c) => c.id === category) ?? fallback;
};

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const calculateStreak = (completedDates: string[]): number => {
  if (!completedDates.length) return 0;

  const completedSet = new Set(completedDates);

  const today = new Date();
  const todayKey = getDateKey(today);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getDateKey(yesterday);

  let currentDate: Date | null = null;

  // Eğer bugün yapıldıysa bugünden başla
  if (completedSet.has(todayKey)) {
    currentDate = today;
  } else if (completedSet.has(yesterdayKey)) {
    // Bugün yapılmadı ama dün yapıldıysa dünden başla
    currentDate = yesterday;
  } else {
    // Ne bugün ne dün yapıldıysa seri yok
    return 0;
  }

  let streak = 0;

  while (currentDate) {
    const key = getDateKey(currentDate);
    if (!completedSet.has(key)) break;

    streak += 1;

    // Bir önceki güne geri git
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    currentDate = prev;
  }

  return streak;
};

type Habit = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  completedDates: string[];
  reminderTime?: string | null;
  category: HabitCategoryId;
};

const buildIconForHabit = (name: string): React.ReactNode => {
  const lower = name.toLowerCase();

  if (lower.includes("kitap") || lower.includes("oku")) {
    return <BookOpen className="h-6 w-6 text-purple-500" />;
  }

  const firstLetter = name.charAt(0).toUpperCase() || "+";

  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-50 text-[11px] font-semibold text-purple-500">
      {firstLetter}
    </div>
  );
};

export default function Home() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitDescription, setNewHabitDescription] = useState("");
  const [newHabitReminderTime, setNewHabitReminderTime] = useState("");
  const [newHabitCategory, setNewHabitCategory] =
    useState<HabitCategoryId>("other");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const pathname = usePathname();
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [playPop] = useSound("/sounds/pop.mp3");
  const [playSuccess] = useSound("/sounds/success.mp3");
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("all");

  const [unlockedBadge, setUnlockedBadge] =
    useState<BadgeDefinition | null>(null);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);

  const selectedDateKey = getDateKey(selectedDate);
  const todayKey = getDateKey(new Date());
  const isTodaySelected = selectedDateKey === todayKey;

  // Auth: anonim giriş ve kullanıcı takibi
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        return;
      }

      // Kullanıcı yoksa anonim giriş
      const cred = await signInAnonymously(auth);
      setUserId(cred.user.uid);
    });

    return () => unsubscribe();
  }, []);

  // Realtime: kullanıcı seviye / puan
  useEffect(() => {
    if (!userId) return;

    const userRef = doc(db, "users", userId);

    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) {
        // Varsayılan değerler
        setLevel(1);
        setScore(0);
        setEarnedBadges([]);
        return;
      }

      const data = snap.data() as {
        level?: number;
        score?: number;
        earnedBadges?: string[];
      };
      setLevel(data.level ?? 1);
      setScore(data.score ?? 0);
      setEarnedBadges(
        Array.isArray(data.earnedBadges)
          ? (data.earnedBadges as string[])
          : []
      );
    });

    return () => unsubscribe();
  }, [userId]);

  // Realtime: alışkanlık listesi
  useEffect(() => {
    if (!userId) return;

    const habitsRef = collection(db, "users", userId, "habits");
    const q = query(habitsRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nextHabits: Habit[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as {
          name?: string;
          description?: string;
          completedDates?: string[];
          reminderTime?: string;
          category?: HabitCategoryId;
        };

        const name = data.name ?? "";
        const description =
          data.description ?? "Hedefini buraya ekleyebilirsin";
        const completedDates = Array.isArray(data.completedDates)
          ? (data.completedDates as string[])
          : [];
        const reminderTime = data.reminderTime ?? null;
        const category = data.category ?? "other";

        return {
          id: docSnap.id,
          name,
          description,
          completedDates,
          reminderTime,
          category,
          icon: buildIconForHabit(name),
        };
      });

      setHabits(nextHabits);
    });

    return () => unsubscribe();
  }, [userId]);

  // Bildirim izni iste (bir kez)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof Notification === "undefined") return;

    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {
        // izin reddedilirse sessizce geç
      });
    }
  }, []);

  // Hatırlatıcı saati izleyen sistem (her 60 saniyede bir)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;

    const intervalId = window.setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const currentTime = `${hours}:${minutes}`;

      const todayKeyNow = getDateKey(new Date());

      habits.forEach((habit) => {
        if (!habit.reminderTime) return;
        if (habit.reminderTime !== currentTime) return;

        const isDoneToday = habit.completedDates.includes(todayKeyNow);
        if (isDoneToday) return;

        // Bildirimi gönder
        try {
          new Notification(`Hatırlatıcı: ${habit.name}`, {
            body: "Hadi, hedefine ulaşmak için bir adım at!",
          });
        } catch {
          // bazı tarayıcılarda hata olabilir, sessiz geç
        }
      });
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, [habits]);

  const toggleHabit = async (id: string) => {
    if (!userId) return;

    const targetHabit = habits.find((habit) => habit.id === id);
    if (!targetHabit) return;

    const wasCompletedForSelectedDate = targetHabit.completedDates.includes(
      selectedDateKey
    );
    const isCompletedNow = !wasCompletedForSelectedDate;

    let didLevelUp = false;
    let nextLevelForAlert = level;

    const userRef = doc(db, "users", userId);
    const habitRef = doc(db, "users", userId, "habits", id);

    await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);

      let currentLevel = 1;
      let currentScore = 0;

      if (userSnap.exists()) {
        const data = userSnap.data() as { level?: number; score?: number };
        currentLevel = data.level ?? 1;
        currentScore = data.score ?? 0;
      }

      let newLevel = currentLevel;
      let newScore = currentScore;

      // Puanlama sadece bugün için geçerli
      if (isTodaySelected) {
        if (!wasCompletedForSelectedDate) {
          // Bugün için ilk kez işaretleme -> +10 puan
          newScore = currentScore + 10;
          if (newScore >= 100) {
            newLevel = currentLevel + 1;
            newScore = newScore - 100;
            didLevelUp = true;
            nextLevelForAlert = newLevel;
          }
        } else {
          // Bugün için işareti kaldırma -> -10 (0 altına düşmesin)
          newScore = Math.max(0, currentScore - 10);
        }
      }

      transaction.set(
        userRef,
        { level: newLevel, score: newScore },
        { merge: true }
      );

      // Tarihsel tamamlama: arrayUnion / arrayRemove
      if (!wasCompletedForSelectedDate) {
        transaction.set(
          habitRef,
          { completedDates: arrayUnion(selectedDateKey) },
          { merge: true }
        );
      } else {
        transaction.set(
          habitRef,
          { completedDates: arrayRemove(selectedDateKey) },
          { merge: true }
        );
      }
    });

    if (isCompletedNow) {
      playPop();
    }

    // Rozet kontrolü: puan/güncelleme sonrası çalıştır
    checkForNewBadges();

    if (didLevelUp && typeof window !== "undefined") {
      window.alert(`Tebrikler! Seviye ${nextLevelForAlert} oldunuz!`);
    }
  };

  const checkForNewBadges = async () => {
    if (!userId) return;

    // Toplam tamamlanan görev sayısı
    const totalCompleted = habits.reduce(
      (acc, habit) => acc + habit.completedDates.length,
      0
    );

    // Maksimum streak değeri
    const maxStreak = habits.reduce((max, habit) => {
      const s = calculateStreak(habit.completedDates);
      return s > max ? s : max;
    }, 0);

    const ctx = {
      totalCompleted,
      maxStreak,
      level,
    };

    const userRef = doc(db, "users", userId);

    for (const badge of BADGES) {
      if (earnedBadges.includes(badge.id)) continue;
      if (!badge.condition(ctx)) continue;

      // Yeni rozet kazandı
      await updateDoc(userRef, {
        earnedBadges: arrayUnion(badge.id),
      });

      setEarnedBadges((prev) => [...prev, badge.id]);
      setUnlockedBadge(badge);
      setIsBadgeModalOpen(true);

      // Konfeti ve başarı sesi
      try {
        confetti({
          spread: 70,
          particleCount: 120,
          origin: { y: 0.6 },
        });
      } catch {
        // canvas-confetti bazı ortamlarda çalışmayabilir, sessizce geç
      }

      playSuccess();

      // Aynı anda birden fazla rozet kutlamayalım, ilkini göster
      break;
    }
  };

  const openModal = () => {
    // Yeni ekleme moduna geç
    setEditingHabit(null);
    setNewHabitName("");
    setNewHabitDescription("");
    setNewHabitReminderTime("");
    setNewHabitCategory("other");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewHabitName("");
    setNewHabitDescription("");
    setEditingHabit(null);
    setNewHabitReminderTime("");
    setNewHabitCategory("other");
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setNewHabitName(habit.name);
    setNewHabitDescription(habit.description);
    setNewHabitReminderTime(habit.reminderTime ?? "");
    setNewHabitCategory(habit.category ?? "other");
    setIsModalOpen(true);
  };

  const handleSaveHabit = async () => {
    if (!userId) return;

    const name = newHabitName.trim();
    const description = newHabitDescription.trim();

    if (!name) return;

    const basePayload = {
      name,
      description: description || "Hedefini buraya ekleyebilirsin",
      reminderTime: newHabitReminderTime || null,
      category: newHabitCategory,
    };

    // Düzenleme varsa mevcut kaydı güncelle
    if (editingHabit) {
      const habitRef = doc(db, "users", userId, "habits", editingHabit.id);
      await updateDoc(habitRef, basePayload);
    } else {
      // Yeni kayıt oluştur
      const habitsRef = collection(db, "users", userId, "habits");
      await addDoc(habitsRef, {
        ...basePayload,
        completedDates: [],
        createdAt: serverTimestamp(),
      });
    }

    closeModal();
  };

  const handleDeleteHabit = async (id: string) => {
    if (!userId) return;

    const ok = window.confirm(
      "Bu alışkanlığı silmek istediğinize emin misiniz?"
    );
    if (!ok) return;

    const habitRef = doc(db, "users", userId, "habits", id);
    await deleteDoc(habitRef);
  };

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
              Alışkanlıklar
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end rounded-2xl bg-purple-50 px-3 py-2 text-right shadow-sm dark:bg-purple-900/40">
              <span className="text-xs font-medium text-purple-600 dark:text-purple-300">
                Seviye {level}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-300">
                {score} / 100 Puan
              </span>
              <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-purple-100 dark:bg-purple-950/60">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all"
                  style={{ width: `${Math.min(score, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Tarih Seçici */}
        <section className="mb-4 flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-900/60">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() =>
              setSelectedDate(
                (prev) => new Date(prev.getTime() - 24 * 60 * 60 * 1000)
              )
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-[11px] font-medium uppercase tracking-[0.25em] text-purple-500 dark:text-purple-300">
              Bugün
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-300">
              {selectedDate.toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <button
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() =>
              setSelectedDate(
                (prev) => new Date(prev.getTime() + 24 * 60 * 60 * 1000)
              )
            }
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </section>

        {/* Gövde / Alışkanlık Listesi */}
        <main className="flex-1 pb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Bugünün alışkanlıkları
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-400">
              {
                habits.filter((h) =>
                  h.completedDates.includes(selectedDateKey)
                ).length
              }
              /{habits.length} tamamlandı
            </span>
          </div>

          {/* Kategori Filtre Çubuğu */}
          <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter("all")}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedCategoryFilter === "all"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              Tümü
            </button>
            {HABIT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                  selectedCategoryFilter === cat.id
                    ? `${cat.pillClass} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-950`
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {habits
                .filter((habit) =>
                  selectedCategoryFilter === "all"
                    ? true
                    : (habit.category ?? "other") === selectedCategoryFilter
                )
                .map((habit) => {
                  const categoryConfig = getCategoryConfig(habit.category);
                  const streak = calculateStreak(habit.completedDates);
                  const hasStreak = streak > 0;
                  const isCompletedForSelectedDate =
                    habit.completedDates.includes(selectedDateKey);

                  return (
                    <motion.button
                      key={habit.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -40, scale: 0.9 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      whileHover={{
                        scale: 1.02,
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleHabit(habit.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 shadow-sm ring-1 ring-slate-100 transition dark:bg-slate-900 dark:ring-slate-800 border-l-4 ${categoryConfig.borderClass}`}
                    >
                      {/* Checkbox */}
                      <motion.div
                        layout
                        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                          isCompletedForSelectedDate
                            ? "border-purple-500 bg-purple-500/10 dark:bg-purple-900/40"
                            : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                        }`}
                      >
                        {isCompletedForSelectedDate ? (
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 20,
                            }}
                          >
                            <CheckCircle2 className="h-6 w-6 text-purple-500" />
                          </motion.div>
                        ) : (
                          <motion.div layout>
                            <div className="h-4 w-4 rounded-full border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900" />
                          </motion.div>
                        )}
                      </motion.div>

                      {/* İçerik */}
                      <div className="flex flex-1 items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800">
                          {habit.icon}
                        </div>

                        <div className="flex flex-1 flex-col items-start text-left">
                          <span className="mb-0.5 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                            {categoryConfig.label}
                          </span>
                          <motion.span
                            animate={
                              isCompletedForSelectedDate
                                ? { x: 5 }
                                : { x: 0 }
                            }
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                            }}
                            className={`text-sm font-semibold ${
                              isCompletedForSelectedDate
                                ? "text-slate-400 line-through dark:text-slate-500"
                                : "text-slate-900 dark:text-slate-100"
                            }`}
                          >
                            {habit.name}
                          </motion.span>
                          <motion.span
                            animate={
                              isCompletedForSelectedDate
                                ? { x: 5 }
                                : { x: 0 }
                            }
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                            }}
                            className={`text-xs ${
                              isCompletedForSelectedDate
                                ? "text-slate-300 line-through dark:text-slate-600"
                                : "text-slate-500 dark:text-slate-300"
                            }`}
                          >
                            {habit.description}
                          </motion.span>
                        </div>

                        {/* Streak / Zincir Göstergesi */}
                        <div
                          className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold"
                          title={
                            hasStreak ? `${streak} Günlük Seri` : "Henüz seri yok"
                          }
                        >
                          <Flame
                            className={`h-4 w-4 ${
                              hasStreak
                                ? "text-orange-500"
                                : "text-slate-300 dark:text-slate-600"
                            }`}
                          />
                          <span
                            className={
                              hasStreak
                                ? "text-slate-700 dark:text-slate-100"
                                : "text-slate-300 dark:text-slate-600"
                            }
                          >
                            {streak}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditHabit(habit);
                          }}
                          className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-100 hover:text-slate-500 active:scale-95 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          aria-label="Alışkanlığı düzenle"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteHabit(habit.id);
                          }}
                          className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition hover:bg-red-50 hover:text-red-500 active:scale-95 dark:text-slate-500 dark:hover:bg-red-950/40"
                          aria-label="Alışkanlığı sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.button>
                  );
                })}
            </AnimatePresence>
          </div>
        </main>

        {/* Floating Yeni Ekle Butonu */}
        <button
          onClick={openModal}
          className="fixed bottom-20 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-purple-500 text-white shadow-lg shadow-purple-500/40 transition hover:bg-purple-600 active:scale-95 dark:bg-purple-600 dark:hover:bg-purple-500 sm:bottom-24"
        >
          <Plus className="h-6 w-6" />
        </button>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl shadow-slate-900/10 dark:bg-slate-900 dark:shadow-slate-900/60">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    {editingHabit ? "Alışkanlığı Düzenle" : "Yeni alışkanlık ekle"}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Günlük rutinine yeni bir adım daha ekle.
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:scale-95 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Kapat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    Alışkanlık Adı
                  </label>
                  <input
                    type="text"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder="Örn. Sabah yürüyüşü"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    Açıklama / Hedef
                  </label>
                  <textarea
                    value={newHabitDescription}
                    onChange={(e) => setNewHabitDescription(e.target.value)}
                    placeholder="Örn. En az 15 dakika yürüyüş"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    Hatırlatıcı Saati{" "}
                    <span className="font-normal text-slate-400 dark:text-slate-400">
                      (opsiyonel)
                    </span>
                  </label>
                  <input
                    type="time"
                    value={newHabitReminderTime}
                    onChange={(e) => setNewHabitReminderTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-purple-500"
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Belirlediğin saatte, alışkanlık tamamlanmadıysa küçük bir
                    bildirim alırsın.
                  </p>
                </div>

                {/* Kategori Seçimi */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    Kategori Seç
                  </label>
                  <div className="-mx-1 flex flex-wrap gap-2">
                    {HABIT_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setNewHabitCategory(cat.id)}
                        className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition ${
                          newHabitCategory === cat.id
                            ? `${cat.pillClass} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900`
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            cat.id === "health"
                              ? "bg-green-500"
                              : cat.id === "work_school"
                              ? "bg-blue-500"
                              : cat.id === "personal_growth"
                              ? "bg-orange-500"
                              : cat.id === "social"
                              ? "bg-pink-500"
                              : "bg-purple-600"
                          }`}
                        />
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full px-4 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleSaveHabit}
                  className="rounded-full bg-purple-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm shadow-purple-500/30 transition hover:bg-purple-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-purple-300 dark:bg-purple-600 dark:hover:bg-purple-500"
                  disabled={!newHabitName.trim()}
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rozet Tebrik Modali */}
        {isBadgeModalOpen && unlockedBadge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl shadow-slate-900/20">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-orange-400 text-white shadow-lg">
                {/* Basit bir yıldız/rozet efekti */}
                <span className="text-3xl">🏅</span>
              </div>
              <h2 className="mb-2 text-lg font-bold text-slate-900">
                Tebrikler!
              </h2>
              <p className="mb-1 text-sm font-semibold text-slate-800">
                {unlockedBadge.name} rozetini kazandın!
              </p>
              <p className="mb-4 text-xs text-slate-500">
                {unlockedBadge.description}
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsBadgeModalOpen(false);
                  setUnlockedBadge(null);
                }}
                className="inline-flex items-center justify-center rounded-full bg-purple-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm shadow-purple-500/40 transition hover:bg-purple-600 active:scale-95"
              >
                Harika!
              </button>
            </div>
          </div>
        )}

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
