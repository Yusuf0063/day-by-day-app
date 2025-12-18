"use client";

import { useEffect, useState } from "react";
import {
    X,
    ShoppingBag,
    Shield,
    Palette,
    User,
    Check,
    Lock,
    Ticket
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, updateDoc, increment, arrayUnion } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "sonner";

type ShopItem = {
    id: string;
    name: string;
    description: string;
    cost: number;
    type: "item" | "theme" | "frame" | "lottery";
    icon: React.ReactNode;
    value?: string; // Theme color or Frame ID
};

const SHOP_ITEMS: ShopItem[] = [
    {
        id: "streak_freeze_1",
        name: "Seri Dondurucu",
        description: "Bir günlük devamsızlık hakkı. Serin bozulmaz.",
        cost: 100, // Kolay
        type: "item",
        icon: <Shield className="h-6 w-6 text-blue-500" />
    },
    {
        id: "lucky_ticket",
        name: "Şans Bileti",
        description: "Çark çevir! 1000, 200 puan veya boş çıkabilir.",
        cost: 100,
        type: "lottery",
        icon: <Ticket className="h-6 w-6 text-yellow-500" />
    },
    {
        id: "frame_gold",
        name: "Altın Çerçeve",
        description: "Parlak sarı bir halka. Klasik ve şık.",
        cost: 500,
        type: "frame",
        value: "gold",
        icon: <User className="h-6 w-6 text-yellow-500" />
    },
    {
        id: "frame_neon",
        name: "Neon Çerçeve",
        description: "Gecenin içinde parlayan mavi-mor ışık.",
        cost: 750,
        type: "frame",
        value: "neon",
        icon: <User className="h-6 w-6 text-purple-500" />
    },
    {
        id: "frame_fire",
        name: "Alevli Çerçeve",
        description: "Profilinizi saran gerçekçi, hareketli alev çemberi.",
        cost: 1000,
        type: "frame",
        value: "fire",
        icon: <User className="h-6 w-6 text-orange-500" />
    }
];

interface MarketModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string | null;
    currentScore: number;
    ownedItems: string[];
    activeTheme?: string | null;
    activeFrame?: string | null;
}

export default function MarketModal({
    isOpen,
    onClose,
    userId,
    currentScore,
    ownedItems = [],
    activeTheme,
    activeFrame
}: MarketModalProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleBuy = async (item: ShopItem) => {
        if (!userId) return;
        if (currentScore < item.cost) {
            toast.error("Yetersiz Puan!");
            return;
        }

        setLoadingId(item.id);

        try {
            const userRef = doc(db, "users", userId);

            // Eğer lottery tipindeyse çark çevir
            if (item.type === "lottery") {
                // Önce parayı al
                await updateDoc(userRef, {
                    score: increment(-item.cost),
                    totalXP: increment(-item.cost),
                });

                // Çark döndür
                const random = Math.random() * 100;
                let prize = 0;
                let message = "";

                if (random < 1) {
                    // %1 - Büyük İkramiye
                    prize = 1000;
                    message = "🎉 MUCİZE! 1000 PUAN KAZANDIN!";
                } else if (random < 21) {
                    // %20 - Orta İkramiye
                    prize = 200;
                    message = "🎊 Tebrikler! 200 Puan kazandın!";
                } else if (random < 50) {
                    // %29 - Küçük İkramiye
                    prize = 50;
                    message = "✨ İyi! 50 Puan kazandın!";
                } else {
                    // %50 - Kaybettin
                    message = "😢 Bu sefer olmadı! Tekrar dene!";
                }

                // Kazancı ekle
                if (prize > 0) {
                    await updateDoc(userRef, {
                        score: increment(prize),
                        totalXP: increment(prize),
                    });
                }

                // 1 saniye bekle (heyecan için)
                await new Promise(resolve => setTimeout(resolve, 1000));
                toast.success(message, { duration: 5000 });
            } else {
                // Normal item satın alma
                await updateDoc(userRef, {
                    score: increment(-item.cost),
                    totalXP: increment(-item.cost),
                    inventory: arrayUnion(item.id)
                });
                toast.success(`${item.name} satın alındı!`);
            }
        } catch (error) {
            console.error("Satın alma hatası:", error);
            toast.error("İşlem başarısız oldu.");
        } finally {
            setLoadingId(null);
        }
    };

    const handleEquip = async (item: ShopItem) => {
        if (!userId) return;
        setLoadingId(item.id);

        try {
            const userRef = doc(db, "users", userId);
            const updateData: any = {};

            if (item.type === "theme") {
                updateData.activeTheme = item.value === "default" ? null : item.value;
                toast.success(`${item.name} uygulandı!`);
            } else if (item.type === "frame") {
                updateData.activeFrame = item.value;
                toast.success(`${item.name} takıldı!`);
            }

            await updateDoc(userRef, updateData);
        } catch (error) {
            console.error("Uygulama hatası:", error);
            toast.error("Hata oluştu.");
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                                <ShoppingBag className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                Puan Dükkanı
                            </h2>
                            <button
                                onClick={async () => {
                                    if (!userId) return;
                                    const userRef = doc(db, "users", userId);
                                    await updateDoc(userRef, { score: increment(1000) });
                                    toast.success("Geliştirici Bonusu: +1000 Puan!");
                                }}
                                className="ml-2 flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 opacity-30 hover:bg-slate-200 hover:opacity-100 dark:bg-slate-800"
                                title="Geliştirici Bonusu"
                            >
                                DEV
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                {currentScore} Puan
                            </span>
                            <button
                                onClick={onClose}
                                className="rounded-full p-1 hover:bg-slate-200 dark:hover:bg-slate-800"
                            >
                                <X className="h-5 w-5 text-slate-500" />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[60vh] overflow-y-auto p-4">
                        <div className="space-y-3">
                            {SHOP_ITEMS.map((item) => {
                                const isOwned = (ownedItems.includes(item.id) || item.id === "theme_default") && item.type !== "item" && item.type !== "lottery";
                                const isActive =
                                    (item.type === "theme" && (activeTheme === item.value || (item.value === "default" && !activeTheme))) ||
                                    (item.type === "frame" && activeFrame === item.value);
                                const canAfford = currentScore >= item.cost;

                                return (
                                    <div
                                        key={item.id}
                                        className={`flex items-center justify-between rounded-xl border p-3 shadow-sm transition-all 
                                            ${isActive
                                                ? "border-green-500 bg-green-50 dark:border-green-900 dark:bg-green-900/20"
                                                : "border-slate-100 bg-white hover:border-purple-200 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-purple-900"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-900">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                    {item.name}
                                                </h3>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    {item.description}
                                                </p>
                                                <div className="mt-1 flex items-center gap-1">
                                                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                                                        💎 {item.cost} Puan
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            disabled={loadingId === item.id || (!canAfford && !isOwned) || isActive}
                                            onClick={() => isOwned ? handleEquip(item) : handleBuy(item)}
                                            className={`flex h-9 min-w-[90px] items-center justify-center gap-1 rounded-lg px-3 text-xs font-semibold shadow-sm transition-all
                                                ${isActive
                                                    ? "bg-green-100 text-green-700 cursor-default dark:bg-green-900/30 dark:text-green-400"
                                                    : isOwned
                                                        ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                                                        : canAfford
                                                            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 active:scale-95"
                                                            : "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
                                                }
                                            `}
                                        >
                                            {loadingId === item.id ? (
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            ) : isActive ? (
                                                <>
                                                    <Check className="h-3 w-3" />
                                                    Aktif
                                                </>
                                            ) : isOwned ? (
                                                "Kullan"
                                            ) : (
                                                <>
                                                    {canAfford ? (
                                                        <span>{item.cost}</span>
                                                    ) : (
                                                        <Lock className="h-3 w-3" />
                                                    )}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
