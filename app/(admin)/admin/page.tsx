"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, CheckCircle2, TrendingUp, Trophy, Activity, ArrowRight } from "lucide-react";
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

type DashboardStats = {
    totalUsers: number;
    totalActivities: number;
    totalBadgesEarned: number;
    newUsersToday: number;
};

type RecentActivity = {
    id: string;
    type: string;
    description: string;
    title?: string;
    userDisplayName?: string;
    timestamp: Timestamp;
};

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalActivities: 0,
        totalBadgesEarned: 0,
        newUsersToday: 0
    });
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Kullanıcı Sayısı
                const usersSnapshot = await getDocs(collection(db, "users"));
                const totalUsers = usersSnapshot.size;

                // 2. Aktiviteleri Analiz Et (Son 500 aktivite üzerinden istatistik çıkaralım)
                // Gerçek projede bunun için backend function veya aggregated counter kullanılır.
                const activitiesQuery = query(
                    collection(db, "global_activities"),
                    orderBy("timestamp", "desc"),
                    limit(500)
                );
                const activitiesSnapshot = await getDocs(activitiesQuery);

                let badgeCount = 0;
                let newUsersCount = 0;
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const recentList: RecentActivity[] = [];

                activitiesSnapshot.forEach((doc) => {
                    const data = doc.data();

                    // İstatistikler
                    if (data.type === 'badge_earned') badgeCount++;

                    const actDate = data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date();
                    if (data.type === 'user_signup' && actDate >= today) newUsersCount++;

                    // Listeye ekle (Sadece ilk 5 tanesini gösterelim dashboardda)
                    if (recentList.length < 5) {
                        recentList.push({ id: doc.id, ...data } as RecentActivity);
                    }
                });

                setStats({
                    totalUsers,
                    totalActivities: activitiesSnapshot.size, // Çekilen limit kadarını gösteriyoruz şimdilik
                    totalBadgesEarned: badgeCount,
                    newUsersToday: newUsersCount
                });

                setRecentActivities(recentList);

            } catch (error) {
                console.error("Dashboard veri hatası:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const statCards = [
        {
            title: "Toplam Kullanıcı",
            value: stats.totalUsers,
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-100 dark:bg-blue-900/30",
        },
        {
            title: "Toplam Hareket",
            value: stats.totalActivities >= 500 ? "500+" : stats.totalActivities,
            icon: Activity,
            color: "text-purple-600",
            bg: "bg-purple-100 dark:bg-purple-900/30",
        },
        {
            title: "Yeni Üyeler (Bugün)",
            value: stats.newUsersToday,
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-100 dark:bg-green-900/30",
        },
        {
            title: "Kazanılan Rozetler",
            value: stats.totalBadgesEarned,
            icon: Trophy,
            color: "text-orange-600",
            bg: "bg-orange-100 dark:bg-orange-900/30",
        },
    ];

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Panel Özeti
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Uygulama genelindeki canlı istatistikler.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="flex items-center justify-between">
                            <div className={`rounded-xl p-3 ${stat.bg}`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                {stat.title}
                            </h3>
                            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                                {stat.value}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Recent Activity Mini List */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-800">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Son Aktiviteler
                    </h2>
                    <Link href="/admin/activities" className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1">
                        Tümünü Gör <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
                <div className="p-6">
                    {recentActivities.length > 0 ? (
                        <div className="space-y-6">
                            {recentActivities.map((act) => (
                                <div key={act.id} className="flex items-start gap-3">
                                    <div className="mt-1.5 h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">
                                            <span className="font-semibold text-slate-900 dark:text-white mr-1">
                                                {act.userDisplayName || "Kullanıcı"}
                                            </span>
                                            {act.description}
                                            {act.title && <span className="font-medium text-slate-800 dark:text-slate-200 ml-1">"{act.title}"</span>}
                                        </p>
                                        <time className="text-xs text-slate-400">
                                            {act.timestamp ? formatDistanceToNow(act.timestamp.toDate(), { addSuffix: true, locale: tr }) : 'Az önce'}
                                        </time>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
                            <p className="text-sm text-slate-500">
                                Henüz aktivite verisi yok.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
