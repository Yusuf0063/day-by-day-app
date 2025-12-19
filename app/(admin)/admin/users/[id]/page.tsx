"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, Mail, Calendar, Trophy, Star, Shield, Activity, ArrowLeft, Target, Flame, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

type UserProfile = {
    displayName?: string;
    email?: string;
    photoURL?: string;
    level: number;
    score: number;
    totalXP: number;
    createdAt?: Timestamp;
    role?: string;
    inventory?: string[];
};

type UserHabit = {
    id: string;
    title: string;
    category: string;
    streak: number;
    icon?: string;
};

type UserActivity = {
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: Timestamp;
};

export default function UserDetailsPage() {
    const params = useParams();
    const userId = params.id as string;

    const [user, setUser] = useState<UserProfile | null>(null);
    const [activities, setActivities] = useState<UserActivity[]>([]);
    const [habits, setHabits] = useState<UserHabit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!userId) return;

            try {
                // 1. Kullanıcı Bilgilerini Çek
                const userDoc = await getDoc(doc(db, "users", userId));
                if (userDoc.exists()) {
                    setUser(userDoc.data() as UserProfile);
                }

                // 2. Kullanıcının Aktivitelerini Çek (Son 20)
                const q = query(
                    collection(db, "global_activities"),
                    where("userId", "==", userId),
                    orderBy("timestamp", "desc")
                    // limit(20) // İsteğe bağlı limit
                );

                const querySnapshot = await getDocs(q);
                const logs: UserActivity[] = [];
                querySnapshot.forEach((doc) => {
                    logs.push({ id: doc.id, ...doc.data() } as UserActivity);
                });
                setActivities(logs);

                // 3. Kullanıcının Alışkanlıklarını Çek
                const habitsSnapshot = await getDocs(collection(db, "users", userId, "habits"));
                const userHabits: UserHabit[] = [];
                habitsSnapshot.forEach((doc) => {
                    userHabits.push({ id: doc.id, ...doc.data() } as UserHabit);
                });
                setHabits(userHabits);

            } catch (error) {
                console.error("Veri çekme hatası:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Kullanıcı Bulunamadı</h2>
                <Link href="/admin/users" className="text-purple-600 hover:underline mt-2 inline-block">
                    Listeye Dön
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Üst Navigasyon */}
            <div className="flex items-center gap-4">
                <Link href="/admin/users" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    <ArrowLeft className="h-5 w-5 text-slate-500" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Kullanıcı Profili
                </h1>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Sol Taraf: Profil Kartı */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-purple-500 to-blue-500 opacity-10"></div>

                        <div className="relative">
                            <div className="w-24 h-24 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-4xl mb-4 border-4 border-white dark:border-slate-900 shadow-md">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User className="h-10 w-10 text-slate-400" />
                                )}
                            </div>

                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {user.displayName || "İsimsiz Kullanıcı"}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                {user.email || "E-posta yok"}
                            </p>

                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                    <div className="text-xs text-slate-500 mb-1">Seviye</div>
                                    <div className="flex items-center gap-2">
                                        <Trophy className="h-4 w-4 text-yellow-500" />
                                        <span className="font-bold text-slate-900 dark:text-white">{user.level || 1}</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                    <div className="text-xs text-slate-500 mb-1">Toplam XP</div>
                                    <div className="flex items-center gap-2">
                                        <Star className="h-4 w-4 text-purple-500" />
                                        <span className="font-bold text-slate-900 dark:text-white">{user.totalXP || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Meta Bilgiler */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Detaylar</h3>

                        <div className="flex items-center gap-3 text-sm">
                            <Shield className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-300">Rol:</span>
                            <span className="ml-auto font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                {user.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-300 truncate max-w-[150px]">{user.email}</span>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-300">Kayıt:</span>
                            <span className="ml-auto text-slate-500">
                                {user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString('tr-TR') : '-'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sağ Taraf: Tablı İçerik (Aktiviteler, Alışkanlıklar, Envanter) */}
                <div className="md:col-span-2 space-y-6">

                    {/* Alışkanlıklar */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-4">
                            <Target className="h-5 w-5 text-indigo-500" />
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Alışkanlıklar</h3>
                            <span className="ml-auto text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
                                {habits.length} adet
                            </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {habits.map((habit) => (
                                <div key={habit.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-2xl shadow-sm">
                                        {habit.icon || "📝"}
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900 dark:text-white line-clamp-1">{habit.title}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-2">
                                            <span className="flex items-center gap-1 text-orange-500">
                                                <Flame className="h-3 w-3" /> {habit.streak} Gün
                                            </span>
                                            <span className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                                                {habit.category}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {habits.length === 0 && (
                                <div className="col-span-2 text-center py-4 text-slate-500 text-sm">
                                    Kullanıcı henüz bir alışkanlık eklememiş.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Envanter */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-4">
                            <ShoppingBag className="h-5 w-5 text-green-500" />
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Çanta (Envanter)</h3>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {user.inventory && user.inventory.length > 0 ? (
                                user.inventory.map((itemId, idx) => (
                                    <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        {itemId === 'streak_freeze_1' && <Shield className="h-4 w-4 text-blue-500" />}
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {itemId === 'streak_freeze_1' ? "Seri Dondurucu" : itemId}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-slate-500 text-sm italic w-full text-center py-2">
                                    Çanta boş.
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Aktivite Geçmişi */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-6">
                            <Activity className="h-5 w-5 text-purple-600" />
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Aktivite Geçmişi</h3>
                            <span className="ml-auto text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
                                Son {activities.length} hareket
                            </span>
                        </div>

                        <div className="relative pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-8">
                            {activities.map((act) => (
                                <div key={act.id} className="relative group">
                                    {/* Nokta İşareti */}
                                    <div className={`absolute -left-[21px] top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 mr-2
                                        ${act.type === 'level_up' ? 'bg-yellow-500' :
                                            act.type === 'habit_goal_reached' ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'}
                                    `}></div>

                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                {act.description} <span className="text-purple-600 dark:text-purple-400">"{act.title}"</span>
                                            </p>
                                        </div>
                                        <time className="text-xs text-slate-400 whitespace-nowrap">
                                            {act.timestamp ? formatDistanceToNow(act.timestamp.toDate(), { addSuffix: true, locale: tr }) : ''}
                                        </time>
                                    </div>
                                </div>
                            ))}

                            {activities.length === 0 && (
                                <div className="text-center py-8 text-slate-500 text-sm">
                                    Bu kullanıcıya ait henüz bir aktivite kaydı yok.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
