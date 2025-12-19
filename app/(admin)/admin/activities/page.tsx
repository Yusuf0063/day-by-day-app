"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Activity,
    CheckCircle2,
    UserPlus,
    Trophy,
    Star,
    Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";

type ActivityLog = {
    id: string;
    type: "habit_complete" | "habit_goal_reached" | "habit_progress" | "user_signup" | "level_up" | "badge_earned";
    title: string;
    description: string;
    userId: string;
    userDisplayName?: string;
    userPhoto?: string;
    timestamp: Timestamp;
};

export default function ActivitiesPage() {
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Gerçek zamanlı dinleyici (Realtime Listener)
        const q = query(
            collection(db, "global_activities"),
            orderBy("timestamp", "desc"),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logs: ActivityLog[] = [];
            snapshot.forEach((doc) => {
                logs.push({ id: doc.id, ...doc.data() } as ActivityLog);
            });
            setActivities(logs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case "habit_goal_reached":
                return <Trophy className="h-5 w-5 text-yellow-600" />;
            case "habit_progress":
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case "habit_complete":
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case "user_signup":
                return <UserPlus className="h-5 w-5 text-blue-500" />;
            case "level_up":
                return <Star className="h-5 w-5 text-yellow-500" />;
            case "badge_earned":
                return <Trophy className="h-5 w-5 text-purple-500" />;
            default:
                return <Activity className="h-5 w-5 text-slate-500" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case "habit_goal_reached": return "bg-yellow-100 dark:bg-yellow-900/30";
            case "habit_progress": return "bg-green-100 dark:bg-green-900/20";
            case "habit_complete": return "bg-green-100 dark:bg-green-900/20";
            case "user_signup": return "bg-blue-100 dark:bg-blue-900/20";
            case "level_up": return "bg-yellow-100 dark:bg-yellow-900/20";
            case "badge_earned": return "bg-purple-100 dark:bg-purple-900/20";
            default: return "bg-slate-100 dark:bg-slate-800";
        }
    };

    // Aktiviteleri Kullanıcıya Göre Grupla
    const groupedActivities = activities.reduce((acc, activity) => {
        const existingUser = acc.find(u => u.userId === activity.userId);

        if (existingUser) {
            existingUser.count += 1;
            // Eğer bu aktivite daha yeniyse (listemiz zaten desc olduğu için ilk gelen en yenidir, ama emin olalım)
            // Bizim sorgumuz desc olduğu için ilk karşılaştığımız zaten en son yapılan işlemdir.
            // Sadece count artırıp, detay sayfasına gitmesi için veriyi tutuyoruz.
            existingUser.allActivities.push(activity);
        } else {
            acc.push({
                userId: activity.userId,
                userDisplayName: activity.userDisplayName,
                userPhoto: activity.userPhoto,
                lastActivity: activity,
                count: 1,
                allActivities: [activity]
            });
        }
        return acc;
    }, [] as {
        userId: string,
        userDisplayName?: string,
        userPhoto?: string,
        lastActivity: ActivityLog,
        count: number,
        allActivities: ActivityLog[]
    }[]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Aktivite Özeti
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Son hareketliliği olan kullanıcılar.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groupedActivities.map((group) => (
                    <Link
                        key={group.userId}
                        href={`/admin/users/${group.userId}`}
                        className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all"
                    >
                        {/* Bildirim Badge (Eğer birden fazla işlem varsa) */}
                        {group.count > 1 && (
                            <span className="absolute top-4 right-4 bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300 text-xs font-bold px-2 py-1 rounded-full">
                                +{group.count - 1} işlem daha
                            </span>
                        )}

                        <div className="flex items-center gap-4 mb-4">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold border-2 border-white dark:border-slate-800 shadow-sm
                                ${getBgColor(group.lastActivity.type)}`}>
                                {getIcon(group.lastActivity.type)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                                    {group.userDisplayName || "Misafir Kullanıcı"}
                                </h3>
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {group.lastActivity.timestamp ? formatDistanceToNow(group.lastActivity.timestamp.toDate(), { addSuffix: true, locale: tr }) : 'Az önce'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                                <span className="text-slate-400 mr-2">Son:</span>
                                {group.lastActivity.description}
                                {group.lastActivity.title && <span className="font-medium text-slate-900 dark:text-white ml-1">"{group.lastActivity.title}"</span>}
                            </p>
                        </div>
                    </Link>
                ))}

                {groupedActivities.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl dark:border-slate-800">
                        <Activity className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                        <p>Henüz görünür bir aktivite yok.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
