"use client";

import { useEffect, useState } from "react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, BarChart, Bar
} from "recharts";
import { collection, getDocs, collectionGroup, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Activity, TrendingUp, Users, Target } from "lucide-react";

// Renk Paleti
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#FF8042', '#00C49F', '#0088FE'];

// Veri Tipleri
type ChartData = {
    name: string;
    value: number;
};

export default function AnalyticsPage() {
    const [userGrowthData, setUserGrowthData] = useState<ChartData[]>([]);
    const [habitDistribution, setHabitDistribution] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            // 1. Kullanıcı Büyüme Verisi (createdAt tarihine göre)
            const usersSnapshot = await getDocs(collection(db, "users"));
            const usersByDate: Record<string, number> = {};

            usersSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.createdAt) {
                    const date = data.createdAt.toDate();
                    // Ay bazlı gruplama: "Oca 2024"
                    const key = date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
                    usersByDate[key] = (usersByDate[key] || 0) + 1;
                }
            });

            // Obje -> Array dönüşümü ve Sıralama
            const growthChartData = Object.entries(usersByDate).map(([name, value]) => ({
                name,
                value
            }));
            // Geleceğe yönelik not: Tarihler string olduğu için sıralama karışabilir, şimdilik basit tutuyoruz.

            setUserGrowthData(growthChartData);


            // 2. Popüler Alışkanlıklar (Tüm kullanıcıların tüm alışkanlıkları)
            const habitsSnapshot = await getDocs(collectionGroup(db, "habits"));
            const habitCounts: Record<string, number> = {};

            habitsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.title) {
                    // İsimleri normalize et (küçük harf, boşlukları temizle)
                    const title = data.title.trim().toLowerCase();
                    // Sadece ana başlığı alalım ki varyasyonlar birleşsin (örn: "Spor" ve "Spor Yapmak" ayrı kalabilir ama olsun)
                    habitCounts[title] = (habitCounts[title] || 0) + 1;
                }
            });

            // En popüler 5 alışkanlığı al
            const popularHabitsData = Object.entries(habitCounts)
                .map(([name, value]) => ({
                    name: name.charAt(0).toUpperCase() + name.slice(1), // İlk harf büyük
                    value
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);

            setHabitDistribution(popularHabitsData);
            setLoading(false);
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                    Analizler & Raporlar
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Kullanıcı büyümesi ve popüler trendler için görsel veriler.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* 1. Kullanıcı Büyüme Grafiği (Line Chart) */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-500" />
                                Kullanıcı Artışı
                            </h2>
                            <p className="text-xs text-slate-500">Aylık yeni kayıt olan kullanıcı sayıları</p>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={userGrowthData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#64748b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#8884d8"
                                    strokeWidth={3}
                                    dot={{ r: 4, strokeWidth: 2 }}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Popüler Alışkanlıklar (Pie Chart) */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Target className="h-5 w-5 text-green-500" />
                                Popüler Alışkanlıklar
                            </h2>
                            <p className="text-xs text-slate-500">En çok takip edilen ilk 5 alışkanlık</p>
                        </div>
                    </div>

                    <div className="h-[300px] w-full flex items-center justify-center">
                        {habitDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={habitDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {habitDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                        }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-slate-400">Yeterli veri yok</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Alt Bilgi Kartı (Opsiyonel) */}
            <div className="rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                        <Activity className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Veri Analizi İpucu</h3>
                        <p className="text-purple-100 text-sm">
                            Kullanıcı alışkanlıklarını analiz ederek rozet ödüllerini popüler kategorilere (örneğin {habitDistribution[0]?.name || "Spor"}) göre optimize edebilirsiniz.
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
}
