"use client";

import { motion } from "framer-motion";
import { Users, CheckCircle2, TrendingUp, Trophy } from "lucide-react";

export default function AdminDashboard() {
    const stats = [
        {
            title: "Toplam Kullanıcı",
            value: "1,234",
            change: "+12%",
            trend: "up",
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-100 dark:bg-blue-900/30",
        },
        {
            title: "Bugün Tamamlanan",
            value: "856",
            change: "+23%",
            trend: "up",
            icon: CheckCircle2,
            color: "text-green-600",
            bg: "bg-green-100 dark:bg-green-900/30",
        },
        {
            title: "Aktif Seri",
            value: "128",
            change: "+4%",
            trend: "up",
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-purple-100 dark:bg-purple-900/30",
        },
        {
            title: "Kazanılan Rozetler",
            value: "45",
            change: "+8%",
            trend: "up",
            icon: Trophy,
            color: "text-orange-600",
            bg: "bg-orange-100 dark:bg-orange-900/30",
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Panel Özeti
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Uygulama genelindeki istatistikler ve aktiviteler.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
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
                            <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full dark:bg-green-900/20 dark:text-green-400">
                                {stat.change}
                                <TrendingUp className="h-3 w-3" />
                            </span>
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

            {/* Recent Activity Placeholder */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 p-6 dark:border-slate-800">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Son Aktiviteler
                    </h2>
                </div>
                <div className="p-6">
                    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
                        <p className="text-sm text-slate-500">
                            Henüz aktivite verisi yok.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
