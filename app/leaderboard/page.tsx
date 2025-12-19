"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Trophy, Medal, User, Crown, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

type LeaderboardUser = {
    id: string;
    displayName: string;
    photoURL?: string;
    totalXP: number;
    level: number;
    badgesCount: number;
};

export default function LeaderboardPage() {
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                // En yüksek puana göre ilk 50 kullanıcıyı getir
                // Not: totalXP alanı olmayan eski kullanıcılar için level*100 kullanılabilir ama şimdilik totalXP varsayalım.
                const q = query(
                    collection(db, "users"),
                    orderBy("totalXP", "desc"),
                    limit(50)
                );

                const snapshot = await getDocs(q);

                const leaderboardData: LeaderboardUser[] = [];
                let rank = 1;

                snapshot.forEach((doc) => {
                    const data = doc.data();
                    // Basit bir veri temizliği
                    const user: LeaderboardUser = {
                        id: doc.id,
                        displayName: data.displayName || "İsimsiz Kahraman",
                        photoURL: data.photoURL,
                        totalXP: data.totalXP || (data.level || 1) * 100 + (data.score || 0), // Fallback hesaplama
                        level: data.level || 1,
                        badgesCount: data.earnedBadges?.length || 0
                    };
                    leaderboardData.push(user);

                    // Eğer giriş yapmış kullanıcı ise sırasını kaydet
                    if (auth.currentUser && auth.currentUser.uid === doc.id) {
                        setCurrentUserRank(rank);
                    }
                    rank++;
                });

                setUsers(leaderboardData);

                // Konfeti Patlat! 🎉
                const duration = 3 * 1000;
                const animationEnd = Date.now() + duration;
                const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

                const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

                const interval: any = setInterval(function () {
                    const timeLeft = animationEnd - Date.now();

                    if (timeLeft <= 0) {
                        return clearInterval(interval);
                    }

                    const particleCount = 50 * (timeLeft / duration);
                    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
                }, 250);

            } catch (error) {
                console.error("Liderlik tablosu hatası:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="h-12 w-12 animate-bounce rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50"></div>
            </div>
        );
    }

    const topThree = users.slice(0, 3);
    const otherUsers = users.slice(3);

    return (
        <div className="min-h-screen bg-slate-50 pb-20 dark:bg-slate-950 text-slate-900 dark:text-white">

            {/* Header */}
            <div className="sticky top-0 z-30 flex items-center gap-4 bg-white/80 p-4 backdrop-blur-md dark:bg-slate-900/80">
                <Link href="/" className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                    Liderlik Tablosu
                </h1>
            </div>

            {/* Podyum (İlk 3) */}
            <div className="relative overflow-hidden bg-gradient-to-b from-purple-600 to-indigo-900 px-4 pb-24 pt-12 text-center text-white shadow-2xl rounded-b-[3rem]">
                {/* Arka Plan Efektleri */}
                <div className="absolute top-0 left-0 h-full w-full opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-400 via-transparent to-transparent pointer-events-none"></div>

                <h2 className="mb-8 text-2xl font-bold tracking-tight opacity-90">Haftanın Şampiyonları</h2>

                <div className="flex items-end justify-center gap-4">
                    {/* 2. Sıra (Gümüş) */}
                    {topThree[1] && (
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col items-center"
                        >
                            <div className="relative mb-2">
                                <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-slate-300 bg-slate-200 shadow-lg">
                                    {topThree[1].photoURL ? (
                                        <img src={topThree[1].photoURL} alt={topThree[1].displayName} className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-full w-full p-4 text-slate-400" />
                                    )}
                                </div>
                                <div className="absolute -bottom-2 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 text-xs font-bold text-slate-800 shadow-md">2</div>
                            </div>
                            <span className="max-w-[80px] truncate text-sm font-medium">{topThree[1].displayName}</span>
                            <span className="text-xs font-bold text-slate-300">{topThree[1].totalXP} XP</span>
                        </motion.div>
                    )}

                    {/* 1. Sıra (Altın) */}
                    {topThree[0] && (
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="flex flex-col items-center z-10 -mb-4" // Biraz yukarı taşı ve öne çıkar
                        >
                            <div className="relative mb-3">
                                <Crown className="absolute -top-6 left-1/2 h-8 w-8 -translate-x-1/2 text-yellow-300 animate-pulse" />
                                <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-yellow-400 bg-yellow-100 shadow-xl shadow-yellow-500/30">
                                    {topThree[0].photoURL ? (
                                        <img src={topThree[0].photoURL} alt={topThree[0].displayName} className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-full w-full p-6 text-yellow-600" />
                                    )}
                                </div>
                                <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full bg-yellow-400 px-3 py-1 text-sm font-bold text-yellow-900 shadow-lg">
                                    #1
                                </div>
                            </div>
                            <span className="max-w-[120px] truncate text-lg font-bold">{topThree[0].displayName}</span>
                            <span className="text-sm font-bold text-yellow-300">{topThree[0].totalXP} XP</span>
                            <span className="mt-1 rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] text-yellow-200">Seviye {topThree[0].level}</span>
                        </motion.div>
                    )}

                    {/* 3. Sıra (Bronz) */}
                    {topThree[2] && (
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-col items-center"
                        >
                            <div className="relative mb-2">
                                <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-amber-600 bg-amber-100 shadow-lg">
                                    {topThree[2].photoURL ? (
                                        <img src={topThree[2].photoURL} alt={topThree[2].displayName} className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-full w-full p-4 text-amber-700" />
                                    )}
                                </div>
                                <div className="absolute -bottom-2 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white shadow-md">3</div>
                            </div>
                            <span className="max-w-[80px] truncate text-sm font-medium">{topThree[2].displayName}</span>
                            <span className="text-xs font-bold text-slate-300">{topThree[2].totalXP} XP</span>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Liste */}
            <div className="mx-auto max-w-2xl px-4 -mt-6 relative z-10 pb-24">
                <div className="space-y-3">
                    {otherUsers.map((user, index) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index }}
                            key={user.id}
                            className={`flex items-center justify-between rounded-2xl p-4 shadow-sm transition hover:shadow-md ${auth.currentUser?.uid === user.id
                                    ? "bg-purple-50 border-2 border-purple-500 dark:bg-purple-900/20"
                                    : "bg-white dark:bg-slate-900/50"
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <span className="flex h-8 w-8 items-center justify-center font-bold text-slate-400">
                                    {index + 4}
                                </span>

                                <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt={user.displayName} className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-full w-full p-2 text-slate-400" />
                                    )}
                                </div>

                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                        {user.displayName}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span className="flex items-center gap-0.5">
                                            <Shield className="h-3 w-3" /> Seviye {user.level}
                                        </span>
                                        {user.badgesCount > 0 && (
                                            <span className="flex items-center gap-0.5 text-yellow-600 dark:text-yellow-500">
                                                <Medal className="h-3 w-3" /> {user.badgesCount} Rozet
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="font-bold text-purple-600 dark:text-purple-400">{user.totalXP}</div>
                                <div className="text-[10px] uppercase font-bold text-slate-400">XP</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Sticky User Bar (En Alt) */}
            {auth.currentUser && currentUserRank && (
                <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/90 p-4 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="mx-auto flex max-w-2xl items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 font-bold text-white shadow-lg shaodw-purple-500/30">
                                #{currentUserRank}
                            </div>
                            <div>
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Senin Sıralaman</div>
                                <div className="font-bold text-slate-900 dark:text-white">
                                    {users.find(u => u.id === auth.currentUser?.uid)?.displayName || "Ben"}
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="font-bold text-purple-600 dark:text-purple-400">
                                {users.find(u => u.id === auth.currentUser?.uid)?.totalXP}
                            </div>
                            <div className="text-[10px] uppercase font-bold text-slate-400">XP</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
