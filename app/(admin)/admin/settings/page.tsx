"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase"; // auth eklendi
import { logSecurityEvent } from "@/lib/logger"; // Loglama eklendi
import { Settings, Save, RefreshCw, AlertTriangle, Zap, Trophy, Flame } from "lucide-react";
import { toast } from "sonner";

// Ayar Tipleri
type GameRules = {
    xpPerHabit: number;      // Bir alışkanlık kaç XP? (Varsayılan: 10)
    baseLevelXP: number;     // 1. Seviye için kaç puan lazım? (Varsayılan: 100)
    levelMultiplier: number; // Her seviyede zorluk ne kadar artsın? (1.2 = %20 artış)
    dailyLoginBonus: number; // Günlük giriş bonusu (Varsayılan: 5)
    streakBonusMultiplier: number; // Seri yapınca puan kaçla çarpılsın?
};

const DEFAULT_RULES: GameRules = {
    xpPerHabit: 10,
    baseLevelXP: 100,
    levelMultiplier: 1.5,
    dailyLoginBonus: 5,
    streakBonusMultiplier: 0.5 // +%50 daha fazla puan
};

export default function SettingsPage() {
    const [rules, setRules] = useState<GameRules>(DEFAULT_RULES);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchRules = async () => {
            try {
                const docRef = doc(db, "system_config", "game_rules");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setRules({ ...DEFAULT_RULES, ...docSnap.data() } as GameRules);
                }
            } catch (error) {
                console.error("Ayar çekme hatası:", error);
                toast.error("Ayarlar yüklenemedi.");
            } finally {
                setLoading(false);
            }
        };

        fetchRules();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const docRef = doc(db, "system_config", "game_rules");
            await setDoc(docRef, {
                ...rules,
                updatedAt: serverTimestamp(),
                updatedBy: "admin" // Buraya auth user eklenebilir
            });

            // Güvenlik Logu Ekle
            await logSecurityEvent({
                type: "admin_action",
                message: "Oyun ayarları güncellendi",
                level: "warning", // Config değiştirmek kritik olabilir
                userId: auth.currentUser?.uid,
                userEmail: auth.currentUser?.email || undefined,
                metadata: { rules }
            });

            toast.success("Oyun kuralları güncellendi!");
        } catch (error) {
            console.error("Kaydetme hatası:", error);
            toast.error("Ayarlar kaydedilemedi.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Settings className="h-6 w-6 text-purple-600" />
                    Oyun Ayarları & Konfigürasyon
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Oyunun dengesini, puan sistemini ve zorluk seviyelerini buradan yönetebilirsiniz.
                </p>
            </div>

            <form onSubmit={handleSave} className="grid gap-6 md:grid-cols-2">

                {/* 1. Temel Puanlar */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30">
                            <Zap className="h-5 w-5" />
                        </div>
                        <h2 className="font-semibold text-slate-900 dark:text-white">XP ve Puanlama</h2>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Alışkanlık Başına XP
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                required
                                min="1"
                                value={rules.xpPerHabit}
                                onChange={(e) => setRules({ ...rules, xpPerHabit: Number(e.target.value) })}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-purple-500 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                            <span className="absolute right-4 top-2.5 text-xs text-slate-400 font-medium">XP</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                            Bir görevi tamamlayınca kazanılacak standart puan.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Günlük Giriş Bonusu
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                required
                                min="0"
                                value={rules.dailyLoginBonus}
                                onChange={(e) => setRules({ ...rules, dailyLoginBonus: Number(e.target.value) })}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-purple-500 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                            <span className="absolute right-4 top-2.5 text-xs text-slate-400 font-medium">XP</span>
                        </div>
                    </div>
                </div>

                {/* 2. Seviye Sistemi */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                            <Trophy className="h-5 w-5" />
                        </div>
                        <h2 className="font-semibold text-slate-900 dark:text-white">Seviye ve Zorluk</h2>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Başlangıç (Seviye 1) İçin XP
                        </label>
                        <input
                            type="number"
                            required
                            min="10"
                            value={rules.baseLevelXP}
                            onChange={(e) => setRules({ ...rules, baseLevelXP: Number(e.target.value) })}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-purple-500 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                        <p className="mt-1 text-xs text-slate-400">
                            İlk seviyeyi atlamak için gereken taban puan.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Seviye Zorluk Çarpanı (Multiplier)
                        </label>
                        <input
                            type="number"
                            required
                            min="1.0"
                            max="5.0"
                            step="0.1"
                            value={rules.levelMultiplier}
                            onChange={(e) => setRules({ ...rules, levelMultiplier: Number(e.target.value) })}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-purple-500 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                        <p className="mt-1 text-xs text-slate-400">
                            Her seviyede gereken puanın artış oranı. Örn: 1.5 ise her seviye %50 daha zorlaşır.
                        </p>
                    </div>
                </div>

                {/* 3. Seri (Streak) Sistemi */}
                <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30">
                            <Flame className="h-5 w-5" />
                        </div>
                        <h2 className="font-semibold text-slate-900 dark:text-white">Seri & Bonuslar</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Seri Bonusu Çarpanı
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                max="10"
                                step="0.1"
                                value={rules.streakBonusMultiplier}
                                onChange={(e) => setRules({ ...rules, streakBonusMultiplier: Number(e.target.value) })}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-purple-500 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                            <p className="mt-1 text-xs text-slate-400">
                                Ekstra puan hesaplaması için kullanılır.
                            </p>
                        </div>

                        <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                <span className="font-bold text-slate-900 dark:text-white block mb-1">Dikkat Edilmesi Gerekenler</span>
                                Bu ayarları değiştirmek, mevcut kullanıcıların seviye hesaplamalarını etkilemez ancak <strong>sonraki kazanımlarını</strong> etkiler. Seviye zorluk çarpanını çok yüksek tutmak ilerlemeyi imkansız kılabilir.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                    >
                        <RefreshCw className="h-5 w-5" />
                        Sıfırla
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-50 transition shadow-lg shadow-purple-200 dark:shadow-purple-900/20"
                    >
                        {saving ? (
                            <>
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                                Kaydediliyor...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                Değişiklikleri Kaydet
                            </>
                        )}
                    </button>
                </div>

            </form>
        </div>
    );
}
