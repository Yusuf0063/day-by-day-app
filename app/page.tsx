"use client";

import { useEffect, useState, useRef } from "react";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  addDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Plus,
  Trash2,
  X,
  Heart,
  Briefcase,
  Zap,
  Users,
  Star,
  Home as HomeIcon,
  BarChart3,
  User,
  BookOpen,
  Infinity,
  Crown,
  Sun,
  Moon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BadgeDefinition } from "../lib/badges";
import confetti from "canvas-confetti";
import useSound from "use-sound";
import { motion, AnimatePresence } from "framer-motion";
import FcmManager from "../components/fcm-manager";
import OfflineIndicator from "../components/offline-indicator";
import { toast } from "sonner";

const HABIT_CATEGORIES = [
  {
    id: "health",
    label: "Sağlık",
    icon: <Heart className="h-4 w-4" />,
    borderClass: "border-green-500",
    pillClass:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
  {
    id: "work_school",
    label: "İş/Okul",
    icon: <Briefcase className="h-4 w-4" />,
    borderClass: "border-blue-500",
    pillClass:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    id: "personal_growth",
    label: "Kişisel",
    icon: <Zap className="h-4 w-4" />,
    borderClass: "border-orange-500",
    pillClass:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  },
  {
    id: "social",
    label: "Sosyal",
    icon: <Users className="h-4 w-4" />,
    borderClass: "border-pink-500",
    pillClass:
      "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  },
  {
    id: "other",
    label: "Diğer",
    icon: <Star className="h-4 w-4" />,
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

const calculateStreak = (completedDates: string[], referenceDate: Date = new Date()): number => {
  if (!completedDates.length) return 0;

  const completedSet = new Set(completedDates);

  const currentRef = new Date(referenceDate);
  const currentKey = getDateKey(currentRef);

  const yesterday = new Date(currentRef);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getDateKey(yesterday);

  let currentDate: Date | null = null;

  if (completedSet.has(currentKey)) {
    currentDate = currentRef;
  } else if (completedSet.has(yesterdayKey)) {
    currentDate = yesterday;
  } else {
    return 0;
  }

  let streak = 0;
  while (currentDate) {
    const key = getDateKey(currentDate);
    if (!completedSet.has(key)) break;
    streak += 1;

    const prevDate: Date = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    currentDate = prevDate;
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
  targetDays: number;
  status?: string;
  createdAtKey?: string | null;
  isIndefinite?: boolean;
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
  const [newHabitTargetDays, setNewHabitTargetDays] = useState(21);
  const [newHabitIsIndefinite, setNewHabitIsIndefinite] = useState(false);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const pathname = usePathname();
  const router = useRouter();
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  // const [playPop] = useSound("/sounds/pop.mp3");
  // const [playSuccess] = useSound("/sounds/success.mp3");

  // Geçici dummy fonksiyonlar
  const playPop = () => { };
  const playSuccess = () => { };
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("all");
  const [focusedHabitId, setFocusedHabitId] = useState<string | null>(null);

  const [unlockedBadge, setUnlockedBadge] =
    useState<BadgeDefinition | null>(null);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);

  const selectedDateKey = getDateKey(selectedDate);
  const todayKey = getDateKey(new Date());
  const [dynamicBadges, setDynamicBadges] = useState<BadgeDefinition[]>([]);
  const isTodaySelected = selectedDateKey === todayKey;

  // Rozetleri Firebase'den Çek
  useEffect(() => {
    const q = query(collection(db, "badges"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const badgeList: BadgeDefinition[] = [];
      snapshot.forEach(doc => {
        const d = doc.data();
        badgeList.push({
          id: doc.id,
          name: d.name,
          description: d.description,
          icon: d.imageUrl || "Trophy",
          xpReward: d.xpReward || 50,
          conditionType: d.conditionType,
          conditionValue: d.conditionValue
        } as any);
      });
      setDynamicBadges(badgeList);
    });
    return () => unsubscribe();
  }, []);

  // Auth: Kullanıcı kontrolü (Giriş yapmamışsa Login'e at)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null); // State'i temizle
        router.push("/login"); // Giriş sayfasına yönlendir
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Hatırlatıcı kontrol referansı (spam'i önlemek için)
  const lastCheckedTimeRef = useRef<string | null>(null);

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
        hearts?: number;
        earnedBadges?: string[];
        inventory?: string[];
        activeTheme?: string;
      };
      setLevel(data.level ?? 1);
      setScore(data.score ?? 0);
      setHearts(data.hearts ?? 3);
      setActiveTheme(data.activeTheme ?? null);
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
          targetDays?: number;
          status?: string;
          createdAt?: Timestamp;
          isIndefinite?: boolean;
        };

        const name = data.name ?? "";
        const description =
          data.description ?? "Hedefini buraya ekleyebilirsin";
        const completedDates = Array.isArray(data.completedDates)
          ? (data.completedDates as string[])
          : [];
        const reminderTime = data.reminderTime ?? null;
        const category = data.category ?? "other";
        const targetDays = data.targetDays ?? 21;
        const status = data.status || "active";
        const isIndefinite = data.isIndefinite ?? false;

        // CreatedAt handling
        let createdAtKey: string | null = null;
        if (data.createdAt && typeof data.createdAt.toDate === "function") {
          createdAtKey = getDateKey(data.createdAt.toDate());
        }

        return {
          id: docSnap.id,
          name,
          description,
          completedDates,
          reminderTime,
          category,
          icon: buildIconForHabit(name),
          targetDays,
          status,
          createdAtKey,
          isIndefinite,
        };
      });

      setHabits(nextHabits);
    });

    return () => unsubscribe();
  }, [userId]);

  // Günlük Kalp/HP Kontrolü (Giriş yapıldığında)
  useEffect(() => {
    if (!userId) return;

    const checkDailyStatus = async () => {
      const userRef = doc(db, "users", userId);
      try {
        await runTransaction(db, async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) return;

          const data = userDoc.data();
          const today = new Date().toISOString().split("T")[0];
          const lastLogin = data.lastLoginDate;

          // Bugün zaten giriş yaptıysa VE kullanıcı bilgileri zaten kayıtlıysa işlem yapma
          // (Eğer email yoksa, bugün girmiş olsa bile güncelle ki Admin Panelinde isimler görünsün)
          if (lastLogin === today && data.email && data.displayName) return;

          let newHearts = data.hearts ?? 3;
          let newLevel = data.level ?? 1;
          let inventory = data.inventory ?? [];

          if (lastLogin) {
            const lastDate = new Date(lastLogin);
            const currDate = new Date(today);
            const diffTime = Math.abs(currDate.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Eğer fark 1 günden fazlaysa (dün girmediyse)
            if (diffDays > 1) {
              // Seri Dondurucu kontrolü
              const hasFreeze = inventory.includes("streak_freeze_1");

              if (hasFreeze) {
                // Seri Dondurucu kullan - kalp kaybını engelle
                inventory = inventory.filter((id: string) => id !== "streak_freeze_1");
                toast.success("🛡️ Seri Dondurucu kullanıldı! Kalbiniz korundu.", { duration: 5000 });
              } else {
                // Seri Dondurucu yok - kalp kaybet
                newHearts = Math.max(0, newHearts - 1);
              }
            }
          }

          // Kalp bittiyse ceza: Seviye düş, canları yenile
          if (newHearts === 0) {
            newLevel = Math.max(1, newLevel - 1);
            newHearts = 3;
          }

          transaction.set(
            userRef,
            {
              lastLoginDate: today,
              hearts: newHearts,
              level: newLevel,
              inventory: inventory,
              email: auth.currentUser?.email, // Admin paneli için
              displayName: auth.currentUser?.displayName, // Admin paneli için
              photoURL: auth.currentUser?.photoURL, // Admin paneli için
            },
            { merge: true }
          );
        });
      } catch (e) {
        console.error("Günlük kontrol hatası:", e);
      }
    };

    checkDailyStatus();
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

  // Hatırlatıcı saati izleyen sistem (her 5 saniyede bir kontrol eder, dakikayı kaçırmaz)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof Notification === "undefined") return;
    // İzin yoksa hiç çalışma
    if (Notification.permission !== "granted") return;

    const checkReminders = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const currentTime = `${hours}:${minutes}`;

      // Eğer bu dakikayı zaten kontrol ettiysek tekrar etme
      if (lastCheckedTimeRef.current === currentTime) return;

      lastCheckedTimeRef.current = currentTime;
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
          playPop(); // Sesli uyarı da ver
        } catch (e) {
          console.error("Bildirim hatası:", e);
        }
      });
    };

    // 5 saniyede bir kontrol et (daha hassas)
    const intervalId = window.setInterval(checkReminders, 5000);

    return () => window.clearInterval(intervalId);
  }, [habits, playPop]);

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

      let currentTotalXP = 0;

      if (userSnap.exists()) {
        const data = userSnap.data() as { level?: number; score?: number; totalXP?: number };
        currentLevel = data.level ?? 1;
        currentScore = data.score ?? 0;

        // Eğer totalXP yoksa, mevcut seviye ve puandan hesapla (Geriye dönük düzeltme)
        if (typeof data.totalXP === 'number') {
          currentTotalXP = data.totalXP;
        } else {
          currentTotalXP = (currentLevel - 1) * 100 + currentScore;
        }
      }

      let newLevel = currentLevel;
      let newScore = currentScore;
      let newTotalXP = currentTotalXP;

      // Puanlama her tarih için geçerlidir (Geçmiş günler dahil)
      if (!wasCompletedForSelectedDate) {
        // İşaretleme -> +10 puan
        newScore = currentScore + 10;
        newTotalXP = currentTotalXP + 10;

        if (newScore >= 100) {
          newLevel = currentLevel + 1;
          // Fazla puanı bir sonraki seviyeye aktar (örn: 105 -> 5)
          newScore = newScore - 100;
          didLevelUp = true;
          nextLevelForAlert = newLevel;
        }
      } else {
        // İşareti kaldırma -> -10 (0 altına düşmesin)
        newScore = Math.max(0, currentScore - 10);
        newTotalXP = Math.max(0, currentTotalXP - 10);
      }

      transaction.set(
        userRef,
        { level: newLevel, score: newScore, totalXP: newTotalXP },
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


      // Log Habit Activity (Only if completing)
      if (!wasCompletedForSelectedDate) {
        const activitiesRef = collection(db, "global_activities");
        const newActivityRef = doc(activitiesRef);

        // Check if this action completes the goal
        const currentCount = targetHabit.completedDates.length + 1;
        const isFinalDay = !targetHabit.isIndefinite && currentCount === targetHabit.targetDays;

        if (isFinalDay) {
          transaction.set(newActivityRef, {
            type: "habit_goal_reached", // Özel tip
            title: targetHabit.name,
            description: "hedefini BAŞARIYLA TAMAMLADI! 🏆",
            userId,
            userDisplayName: auth.currentUser?.displayName || "Kullanıcı",
            userPhoto: auth.currentUser?.photoURL,
            timestamp: serverTimestamp(),
          });
        } else {
          transaction.set(newActivityRef, {
            type: "habit_progress", // Günlük tip
            title: targetHabit.name,
            description: "günlük görevini yaptı:",
            userId,
            userDisplayName: auth.currentUser?.displayName || "Kullanıcı",
            userPhoto: auth.currentUser?.photoURL,
            timestamp: serverTimestamp(),
          });
        }
      }
    });

    if (isCompletedNow) {
      // Şu anki completion sayısı + 1
      const currentCount = targetHabit.completedDates.length + 1;

      // Sadece süreli alışkanlıklarda kutlama yap
      if (!targetHabit.isIndefinite && currentCount === targetHabit.targetDays) {
        // Hedefe tam bu tıklamayla ulaşıldı!
        setTimeout(async () => {
          const keepGoing = window.confirm(
            `🏆 TEBRİKLER! "${targetHabit.name}" için ${targetHabit.targetDays} günlük hedefine ulaştın!\n\nBu harika bir başarı! 🎉\n\nBu alışkanlığı sürdürmeye devam etmek ister misin?\n("İptal" dersen alışkanlık tamamlanmış sayılarak listenden silinecek.)`
          );

          if (keepGoing) {
            // Kullanıcı devam etmek istiyor
            playSuccess();
            confetti({ spread: 100, particleCount: 200 });
          } else {
            // Kullanıcı devam etmek istemiyor, ARŞİVLİYORUZ (statü: completed).
            const habitRef = doc(db, "users", userId, "habits", id);
            await updateDoc(habitRef, {
              status: "completed",
              completedAt: new Date().toISOString(),
            });

            alert("Harika! Bu hedefi başarıyla tamamladın. İstatistikler sayfasında zaferlerini görebilirsin! 🚀");
          }
        }, 500);
      }

      playPop();
    }

    // Rozet kontrolü
    checkForNewBadges();

    if (didLevelUp) {
      if (typeof window !== "undefined") {
        window.alert(`Tebrikler! Seviye ${nextLevelForAlert} oldunuz!`);
      }

      // Log Level Up Activity
      try {
        const activitiesRef = collection(db, "global_activities");
        await addDoc(activitiesRef, {
          type: "level_up",
          title: `Seviye ${nextLevelForAlert}!`,
          description: "yeni bir seviyeye ulaştı.",
          userId,
          userDisplayName: auth.currentUser?.displayName || "Kullanıcı",
          userPhoto: auth.currentUser?.photoURL,
          timestamp: serverTimestamp(),
        });
      } catch (e) {
        console.error("Log error:", e);
      }
    }
  };

  const checkForNewBadges = async () => {
    if (!userId) return;

    const totalCompleted = habits.reduce(
      (acc, habit) => acc + habit.completedDates.length,
      0
    );

    const maxStreak = habits.reduce((max, habit) => {
      const s = calculateStreak(habit.completedDates);
      return s > max ? s : max;
    }, 0);

    // --- Rozet Kontrol ---
    if (!dynamicBadges || dynamicBadges.length === 0) return;

    const newlyEarned: BadgeDefinition[] = [];

    dynamicBadges.forEach((badge: any) => {
      // ... döngü devamı ...
      // Zaten kazanılmış mı?
      if (earnedBadges.includes(badge.id)) return;

      let earned = false;

      // Dinamik Koşul Kontrolü
      if (badge.conditionType === "total_habits") {
        if (totalCompleted >= badge.conditionValue) earned = true;
      } else if (badge.conditionType === "streak_days") {
        if (maxStreak >= badge.conditionValue) earned = true;
      } else if (badge.conditionType === "level_reached") {
        if (level >= badge.conditionValue) earned = true;
      }

      if (earned) {
        newlyEarned.push(badge);

        // Admin Log
        try {
          const { addDoc, collection, serverTimestamp } = require("firebase/firestore"); // Lazy import
          addDoc(collection(db, "global_activities"), {
            type: "badge_earned",
            title: badge.name,
            description: "yeni bir rozet kazandı!",
            userId,
            userDisplayName: auth.currentUser?.displayName || "Kullanıcı",
            timestamp: serverTimestamp(),
          }).catch((err: any) => console.error("Log error", err));
        } catch (e) { }
      }
    });

    if (newlyEarned.length > 0) {
      // İlkini göster (modal için)
      setUnlockedBadge(newlyEarned[0]);
      setIsBadgeModalOpen(true);
      playSuccess();
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Firestore'a kaydet (User dokümanına)
      // Burada sadece ID'leri ekliyoruz
      const newBadgeIds = newlyEarned.map((b) => b.id);

      // State güncelle
      setEarnedBadges((prev) => [...prev, ...newBadgeIds]);

      if (userId) {
        const userRef = doc(db, "users", userId);
        updateDoc(userRef, {
          earnedBadges: arrayUnion(...newBadgeIds),
          // Varsa XP ödülü de verilebilir
          score: score + (newlyEarned[0].xpReward || 50)
        });
      }
    }
  };

  const openModal = () => {
    setEditingHabit(null);
    setNewHabitName("");
    setNewHabitDescription("");
    setNewHabitReminderTime("");
    setNewHabitCategory("other");
    setNewHabitTargetDays(21);
    setNewHabitIsIndefinite(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewHabitName("");
    setNewHabitDescription("");
    setEditingHabit(null);
    setNewHabitReminderTime("");
    setNewHabitCategory("other");
    setNewHabitTargetDays(21);
    setNewHabitIsIndefinite(false);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setNewHabitName(habit.name);
    setNewHabitDescription(habit.description);
    setNewHabitReminderTime(habit.reminderTime ?? "");
    setNewHabitCategory(habit.category ?? "other");
    setNewHabitTargetDays(habit.targetDays ?? 21);
    setNewHabitIsIndefinite(habit.isIndefinite ?? false);
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
      targetDays: newHabitTargetDays,
      isIndefinite: newHabitIsIndefinite,
    };

    if (editingHabit) {
      const habitRef = doc(db, "users", userId, "habits", editingHabit.id);
      await updateDoc(habitRef, basePayload);
    } else {
      const habitsRef = collection(db, "users", userId, "habits");
      await addDoc(habitsRef, {
        ...basePayload,
        completedDates: [],
        createdAt: serverTimestamp(),
        status: "active",
      });
    }

    closeModal();
  };

  const handleDeleteHabit = async (id: string) => {
    if (!userId) return;
    const ok = window.confirm("Bu alışkanlığı silmek istediğine emin misin?");
    if (!ok) return;

    const habitRef = doc(db, "users", userId, "habits", id);
    await deleteDoc(habitRef);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50 relative overflow-hidden">
      {/* Çevrimdışı Göstergesi */}
      <OfflineIndicator />

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
              Alışkanlıklar
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Can Barı (HP) */}
            <div className="flex items-center gap-1 rounded-2xl bg-white/80 p-2 shadow-sm ring-1 ring-red-100 dark:bg-slate-900/80 dark:ring-red-900/30">
              {[1, 2, 3].map((i) => (
                <Heart
                  key={i}
                  className={`h-5 w-5 transition-all ${i <= hearts ? "fill-red-500 text-red-500" : "fill-slate-200 text-slate-200 dark:fill-slate-800 dark:text-slate-800"}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white/80 p-2 pr-4 shadow-lg shadow-purple-500/5 backdrop-blur-md ring-1 ring-slate-100 dark:bg-slate-900/80 dark:ring-slate-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-inner shadow-purple-300/20">
                <Crown className="h-5 w-5 text-white" />
              </div>

              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-wider text-purple-500 dark:text-purple-400">
                  {level < 3 ? "Çırak" : level < 6 ? "Kâşif" : level < 10 ? "Usta" : "Efsane"}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold leading-tight text-slate-900 dark:text-slate-50">Seviye {level}</span>
                  <span className="text-[10px] text-slate-400">({score}/100)</span>
                </div>
                <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500"
                    style={{ width: `${Math.min(score, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Debug / Test Amaçlı Bildirim Butonu (Sadece geliştirme aşamasında veya sorun varsa görünür olabilir) */}
        <div className="mb-2 flex justify-end">
          <button
            onClick={() => {
              if (!("Notification" in window)) {
                alert("Bu tarayıcı bildirimleri desteklemiyor.");
                return;
              }

              if (Notification.permission === "granted") {
                try {
                  new Notification("Test Bildirimi", { body: "Bildirimler sorunsuz çalışıyor! 🎉" });
                  toast.success("Bildirimler çalışıyor! 🎉 (Uygulama İçi)");
                  playPop();
                } catch (err) {
                  alert("Bildirim gönderilemedi. Mobil cihazda iseniz HTTPS bağlantısı gerekebilir.");
                }
              } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(permission => {
                  if (permission === "granted") {
                    new Notification("Test Bildirimi", { body: "Harika! İzin verildi." });
                    toast.success("İzin verildi ve bildirim test edildi!");
                    playPop();
                  } else {
                    alert("İzin verilmedi.");
                  }
                });
              } else {
                alert("Bildirim izni daha önce reddedilmiş. Tarayıcı ayarlarından sıfırlamalısınız.");
              }
            }}
            className="text-[10px] text-slate-400 underline hover:text-purple-500"
          >
            Bildirimleri Test Et
          </button>

          <button
            onClick={async () => {
              if (!userId) return;

              // Önce kullanıcının envanterini kontrol et
              const userSnap = await getDoc(doc(db, "users", userId));
              if (!userSnap.exists()) return;

              const userData = userSnap.data();
              let inventory = userData.inventory ?? [];
              const hasFreeze = inventory.includes("streak_freeze_1");

              if (hasFreeze) {
                // Seri Dondurucu varsa kullan
                inventory = inventory.filter((id: string) => id !== "streak_freeze_1");
                await updateDoc(doc(db, "users", userId), {
                  inventory: inventory,
                  lastLoginDate: new Date().toISOString().split('T')[0],
                });
                toast.success("🛡️ Seri Dondurucu kullanıldı! Kalbiniz korundu.", { duration: 5000 });
                return;
              }

              // Seri Dondurucu yoksa normal kalp kaybı
              let newHearts = hearts - 1;
              let newLevel = level;

              if (newHearts <= 0) {
                newLevel = Math.max(1, level - 1);
                newHearts = 3;
                toast.error("Kalplerin tükendi! Bir seviye düştün.", { duration: 4000 });
              } else {
                toast.warning("Test Modu: Dün giriş yapılmadı varsayıldı. 1 Kalp silindi.", { duration: 3000 });
              }

              await updateDoc(doc(db, "users", userId), {
                lastLoginDate: new Date().toISOString().split('T')[0],
                hearts: newHearts,
                level: newLevel
              });
            }}
            className="text-[10px] text-red-400 underline hover:text-red-600 ml-2"
          >
            Zaman Makinesi (Can Kaybet)
          </button>

          <button
            onClick={async () => {
              if (!userId) return;
              if (!window.confirm("Seviyen 1'e, puanın 0'a düşürülecek. Emin misin?")) return;

              await updateDoc(doc(db, "users", userId), {
                level: 1,
                score: 0,
                totalXP: 0,
              });
              toast.success("Geliştirici: Seviye sıfırlandı!");
            }}
            className="text-[10px] text-orange-400 underline hover:text-orange-600 ml-4"
          >
            Seviye Sıfırla (DEV)
          </button>

          <button
            onClick={async () => {
              if (!userId) return;
              const userSnap = await getDoc(doc(db, "users", userId));
              if (userSnap.exists()) {
                const data = userSnap.data();
                alert(`VERİTABANI DURUMU:\nLevel: ${data.level}\nScore: ${data.score}\nTotalXP: ${data.totalXP}\n\nSTATE DURUMU:\nLevel: ${level}\nScore: ${score}`);
              }
            }}
            className="text-[10px] text-blue-400 underline hover:text-blue-600 ml-4"
          >
            DB Durumu (DEV)
          </button>

          <button
            onClick={async () => {
              if (!userId) return;
              const userSnap = await getDoc(doc(db, "users", userId));
              if (!userSnap.exists()) return;

              const data = userSnap.data();
              const currentScore = data.score ?? 0;
              const currentLevel = data.level ?? 1;

              // Score'u normalize et (100'e böl)
              const levelsToAdd = Math.floor(currentScore / 100);
              const normalizedScore = currentScore % 100;
              const newLevel = currentLevel + levelsToAdd;

              await updateDoc(doc(db, "users", userId), {
                level: newLevel,
                score: normalizedScore,
              });

              toast.success(`Düzeltme: Seviye ${currentLevel} → ${newLevel}, Puan ${currentScore} → ${normalizedScore}`);
            }}
            className="text-[10px] text-green-400 underline hover:text-green-600 ml-4"
          >
            Puanı Düzelt (DEV)
          </button>
        </div>

        {/* Tarih Seçici (Yatay Takvim) */}
        <section className="mb-6">
          {(() => {
            const focusedHabit = habits.find(h => h.id === focusedHabitId);
            const isFiniteHabit = focusedHabit && !focusedHabit.isIndefinite && focusedHabit.createdAtKey && focusedHabit.targetDays;

            type CalendarGroup = { id: string; label: string; dates: Date[] };
            let groups: CalendarGroup[] = [];
            let headerContent = null;

            if (isFiniteHabit) {
              const [y, m, d] = focusedHabit.createdAtKey!.split('-').map(Number);
              const startDate = new Date(y, m - 1, d);
              const allDates = Array.from({ length: focusedHabit.targetDays! }).map((_, i) => {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                return date;
              });

              // Group by Month
              const grouped = allDates.reduce((acc, date) => {
                const key = `${date.getFullYear()}-${date.getMonth()}`;
                if (!acc[key]) acc[key] = [];
                acc[key].push(date);
                return acc;
              }, {} as Record<string, Date[]>);

              groups = Object.keys(grouped).map(key => {
                const dates = grouped[key];
                const label = dates[0].toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
                return { id: key, label, dates };
              });

              // Header Text
              const startMonth = allDates[0].toLocaleDateString("tr-TR", { month: "long" });
              const endMonth = allDates[allDates.length - 1].toLocaleDateString("tr-TR", { month: "long" });
              const monthRange = startMonth === endMonth ? startMonth : `${startMonth} - ${endMonth}`;

              headerContent = (
                <div className="flex flex-col items-center justify-center gap-1 py-1">
                  <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full dark:bg-purple-900/30 dark:text-purple-300">
                    Hedef Süreci: {monthRange} ({allDates.length} Gün)
                  </span>
                </div>
              );

            } else {
              // Standard View
              const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
              const dates = Array.from({ length: daysInMonth }).map((_, i) =>
                new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i + 1)
              );
              const label = selectedDate.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

              groups = [{ id: 'current', label, dates }];

              headerContent = (
                <div className="flex items-center justify-between">
                  <button
                    className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                    onClick={() => setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {label}
                  </span>
                  <button
                    className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                    onClick={() => setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              );
            }

            return (
              <>
                <div className="mb-2 px-2">
                  {headerContent}
                </div>

                <div className="space-y-4 px-1">
                  {groups.map((group) => (
                    <div key={group.id}>
                      {/* Show label above grid ONLY if it's a Finite Habit (Distinct months). 
                            For Standard view, label is already in header. 
                        */}
                      {isFiniteHabit && (
                        <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                          {group.label}
                        </h4>
                      )}

                      <div className="grid grid-cols-7 gap-1">
                        {group.dates.map((date) => {
                          const dKey = getDateKey(date);
                          const isSelected = dKey === selectedDateKey;
                          const isToday = dKey === todayKey;

                          // Odaklanılan alışkanlık durumu
                          let habitStatus: 'none' | 'completed' | 'missed' | 'pending' = 'none';

                          if (focusedHabit) {
                            let startKey = focusedHabit.createdAtKey || null;

                            if (startKey && dKey >= startKey) {
                              let isWithinDuration = true;
                              if (!focusedHabit.isIndefinite) {
                                const startDate = new Date(startKey);
                                const diffTime = date.getTime() - startDate.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                if (diffDays >= focusedHabit.targetDays!) {
                                  isWithinDuration = false;
                                }
                              }

                              if (isWithinDuration) {
                                if (focusedHabit.completedDates.includes(dKey)) {
                                  habitStatus = 'completed';
                                } else if (dKey < todayKey && !isToday) {
                                  habitStatus = 'missed';
                                } else {
                                  habitStatus = 'pending';
                                }
                              }
                            }
                          }

                          return (
                            <button
                              key={dKey}
                              onClick={() => setSelectedDate(date)}
                              className={`group relative flex h-12 flex-col items-center justify-center rounded-2xl border transition-all 
                                ${isSelected
                                  ? habitStatus === 'completed'
                                    ? "border-green-500 bg-green-500 text-white shadow-md shadow-green-500/25 ring-2 ring-green-200 dark:ring-green-900"
                                    : "border-purple-500 bg-purple-500 text-white shadow-md shadow-purple-500/25 ring-2 ring-purple-200 dark:ring-purple-900"
                                  : habitStatus === 'completed'
                                    ? "border-green-200 bg-green-100 text-green-700 hover:border-green-300 dark:border-green-800 dark:bg-green-900/40 dark:text-green-300"
                                    : "border-slate-200 bg-white hover:border-purple-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-700"
                                } 
                                ${habitStatus === 'missed' ? 'opacity-60 bg-slate-50 dark:bg-slate-800/50' : ''}`}
                            >
                              <span className={`text-[9px] font-medium uppercase ${isSelected
                                ? (habitStatus === 'completed' ? "text-green-100" : "text-purple-100")
                                : (habitStatus === 'completed' ? "text-green-600 dark:text-green-400" : "text-slate-400")
                                }`}>
                                {date.toLocaleDateString("tr-TR", { weekday: "short" })}
                              </span>
                              <span className={`text-sm font-bold ${isSelected
                                ? "text-white"
                                : (habitStatus === 'completed' ? "text-green-800 dark:text-green-100" : "text-slate-700 dark:text-slate-200")
                                }`}>
                                {date.getDate()}
                              </span>

                              {/* Odaklanılan Alışkanlık Göstergesi (Sadece Eksik/Bekleyen) */}
                              {habitStatus !== 'none' && habitStatus !== 'completed' && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                                  {habitStatus === 'missed' && (
                                    <div className="h-1 w-1 rounded-full bg-red-300 ring-1 ring-white dark:ring-slate-900" />
                                  )}
                                  {habitStatus === 'pending' && (
                                    <div className="h-1 w-1 rounded-full bg-purple-200 ring-1 ring-white dark:bg-purple-700 dark:ring-slate-900" />
                                  )}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </section>

        {/* Kategoriler */}
        <section className="mb-4 grid grid-cols-3 gap-2">
          <button
            onClick={() => setSelectedCategoryFilter("all")}
            className={`flex w-full justify-center items-center gap-1.5 rounded-full border px-2 py-1.5 text-xs font-medium transition active:scale-95 ${selectedCategoryFilter === "all"
              ? "border-slate-800 bg-slate-800 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-slate-900"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
              }`}
          >
            Tümü
          </button>
          {HABIT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`flex w-full justify-center items-center gap-1.5 rounded-full border px-2 py-1.5 text-xs font-medium transition active:scale-95 ${selectedCategoryFilter === cat.id
                ? cat.pillClass +
                " ring-1 ring-inset ring-black/5 dark:ring-white/10"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                }`}
            >
              {cat.icon}
              <span className="truncate">{cat.label}</span>
            </button>
          ))}
        </section>

        {/* Alışkanlık Listesi */}
        <main className="flex-1 space-y-3 pb-20">
          <AnimatePresence mode="popLayout">
            {habits
              .filter((h) => {
                if (h.status === 'completed') return false;

                // Eğer alışkanlık daha sonraki bir tarihte oluşturulmuşsa geçmişte gösterme
                if (h.createdAtKey && h.createdAtKey > selectedDateKey) {
                  return false;
                }

                return (
                  selectedCategoryFilter === "all" ||
                  h.category === selectedCategoryFilter
                );
              })
              .map((habit) => {
                const isCompleted = habit.completedDates.includes(selectedDateKey);
                const streak = calculateStreak(habit.completedDates, selectedDate);
                const categoryConfig = getCategoryConfig(habit.category);

                let PotionBadge = null;
                if (habit.reminderTime) {
                  const [h] = habit.reminderTime.split(':').map(Number);
                  if (h < 8) {
                    PotionBadge = (
                      <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-600 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-400">
                        <Sun className="h-3 w-3" />
                        Sabah İlacı
                      </span>
                    );
                  } else if (h >= 20) {
                    PotionBadge = (
                      <span className="flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-600 dark:border-indigo-900/30 dark:bg-indigo-900/20 dark:text-indigo-400">
                        <Moon className="h-3 w-3" />
                        Akşam İlacı
                      </span>
                    );
                  }
                }

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={habit.id}
                    onClick={() => setFocusedHabitId(prev => prev === habit.id ? null : habit.id)}
                    className={`group relative flex items-center justify-between overflow-hidden rounded-3xl border p-4 shadow-sm transition-all hover:scale-[1.01] hover:shadow-lg cursor-pointer ${focusedHabitId === habit.id
                      ? "ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-slate-950"
                      : ""
                      } ${isCompleted
                        ? "border-purple-200 bg-gradient-to-r from-purple-50 to-white dark:border-purple-500/30 dark:from-purple-900/20 dark:to-slate-900"
                        : "border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
                      }`}
                  >
                    <div className="flex flex-1 items-center gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleHabit(habit.id);
                        }}
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl transition-all active:scale-95 ${isCompleted
                          ? "bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-lg shadow-purple-500/40 scale-105"
                          : "bg-slate-100 text-slate-400 hover:bg-white hover:text-purple-500 hover:shadow-md ring-1 ring-slate-100 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700"
                          }`}
                      >
                        {isCompleted ? <Check className="h-6 w-6" /> : habit.icon}
                      </button>

                      <div className="flex-1">
                        <h3
                          className={`font-semibold transition-all ${isCompleted
                            ? "text-purple-900 line-through decoration-purple-300 dark:text-purple-100 dark:decoration-purple-600"
                            : "text-slate-900 dark:text-slate-100"
                            }`}
                        >
                          {habit.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1 font-medium text-purple-600 dark:text-purple-400">
                            {habit.isIndefinite ? (
                              <>
                                <Infinity className="h-3 w-3" />
                                <span className="tabular-nums">{habit.completedDates.length}</span>
                                <span>Gün</span>
                              </>
                            ) : (
                              <>
                                <span className="tabular-nums">{habit.completedDates.length}</span>
                                <span className="text-slate-300 dark:text-slate-600">/</span>
                                <span className="tabular-nums">{habit.targetDays}</span>
                                <span>Gün</span>
                              </>
                            )}
                          </div>

                          <span>•</span>

                          <span className="flex items-center gap-1">
                            {streak} gün seri
                          </span>

                          <span
                            className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] ${categoryConfig.pillClass}`}
                          >
                            {categoryConfig.icon}
                            {categoryConfig.label}
                          </span>
                          {PotionBadge}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (editingHabit?.id === habit.id) {
                              setEditingHabit(null); // Menüyü kapat
                            } else {
                              handleEditHabit(habit); // Düzenleme penceresini aç
                            }
                          }}
                          className="p-2 text-slate-400 opacity-0 transition hover:text-slate-600 group-hover:opacity-100 dark:hover:text-slate-200"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteHabit(habit.id);
                          }}
                          className="absolute right-8 top-1/2 -translate-y-1/2 p-2 text-red-300 opacity-0 hover:text-red-500 group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </AnimatePresence>

          {habits.filter(h => h.status !== 'completed').length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <div className="mb-4 rounded-full bg-slate-50 p-4 dark:bg-slate-900">
                <Plus className="h-8 w-8 opacity-20" />
              </div>
              <p>Aktif bir alışkanlığın yok.</p>
              <button
                onClick={openModal}
                className="mt-2 font-medium text-purple-500 underline decoration-2 underline-offset-4"
              >
                Yeni bir tane ekle!
              </button>
            </div>
          )}
        </main>

        {/* FCM Bildirim Yönetimi */}
        <FcmManager userId={userId} />

        {/* Floating Action Button */}
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
                    {editingHabit
                      ? "Alışkanlığı Düzenle"
                      : "Yeni alışkanlık ekle"}
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
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-red-600 placeholder:text-gray-500 outline-none transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 dark:border-slate-700 dark:bg-slate-900 dark:text-red-400 dark:placeholder:text-gray-400 dark:focus:border-purple-500 dark:focus:bg-slate-900"
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
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-red-600 placeholder:text-gray-500 outline-none transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 dark:border-slate-700 dark:bg-slate-900 dark:text-red-400 dark:placeholder:text-gray-400 dark:focus:border-purple-500 dark:focus:bg-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    Hatırlatıcı Saati{" "}
                    <span className="font-normal text-slate-400 dark:text-slate-400">
                      (opsiyonel)
                    </span>
                  </label>
                  <p className="mb-2 text-[11px] text-slate-400 dark:text-slate-500">
                    Belirlediğin saatte, alışkanlık tamamlanmadıysa bir bildirim gönderilir.
                  </p>
                  <input
                    type="time"
                    value={newHabitReminderTime}
                    onChange={(e) => {
                      setNewHabitReminderTime(e.target.value);
                      if (Notification.permission === "default") {
                        Notification.requestPermission();
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Kategori Seçimi */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Kategori
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {HABIT_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() =>
                          setNewHabitCategory(cat.id as HabitCategoryId)
                        }
                        className={`flex flex-shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${newHabitCategory === cat.id
                          ? "border-purple-500 bg-purple-50 text-purple-600 dark:border-purple-400 dark:bg-purple-900/30 dark:text-purple-300"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                      >
                        {cat.icon}
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hedef / Süre Ayarları */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Süresiz Alışkanlık</span>
                      <span className="text-[10px] text-slate-400">Bitiş tarihi olmadan devam et</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setNewHabitIsIndefinite(!newHabitIsIndefinite)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${newHabitIsIndefinite ? 'bg-purple-500' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${newHabitIsIndefinite ? 'translate-x-5' : 'translate-x-0'
                          }`}
                      />
                    </button>
                  </div>

                  {!newHabitIsIndefinite && (
                    <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
                      <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                        Hedef Gün Sayısı
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          value={newHabitTargetDays}
                          onChange={(e) =>
                            setNewHabitTargetDays(parseInt(e.target.value) || 21)
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleSaveHabit}
                  className="rounded-xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 hover:bg-purple-600 active:scale-95 dark:bg-purple-600 dark:hover:bg-purple-500"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        )}

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
    </div >
  );
}
