"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Trophy, Plus, CheckCircle2, Zap } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type TutorialModalProps = {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
};

const STEPS = [
    {
        title: "Hoş Geldin! 👋",
        description: "DayByDay ile hayatını oyunlaştırarak düzene sokmaya hazır mısın? Kısa bir turla sana nasıl çalıştığını gösterelim.",
        icon: <Trophy className="h-12 w-12 text-purple-600" />,
        color: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
        title: "Alışkanlık Ekle 📝",
        description: "İlk adım: Takip etmek istediğin bir alışkanlık veya görev ekle. 'Spor Yap', 'Kitap Oku' veya 'Su İç' gibi hedefler belirle.",
        icon: <Plus className="h-12 w-12 text-blue-600" />,
        color: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
        title: "İlerlemeni Takip Et ✅",
        description: "Görevi tamamladığında üzerine tıkla! Bunu yaptığında XP kazanacak ve serini (streak) başlatacaksın.",
        icon: <CheckCircle2 className="h-12 w-12 text-green-600" />,
        color: "bg-green-100 dark:bg-green-900/30",
    },
    {
        title: "Seviye Atla 🚀",
        description: "XP kazandıkça seviye atlayacak ve yeni rozetlerin kilidini açacaksın. Bakalım ne kadar ileri gidebileceksin?",
        icon: <Zap className="h-12 w-12 text-yellow-600" />,
        color: "bg-yellow-100 dark:bg-yellow-900/30",
    },
];

export default function TutorialModal({ isOpen, onClose, userId }: TutorialModalProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    const handleNext = async () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // Tur bitti, veritabanına kaydet
            setLoading(true);
            try {
                const userRef = doc(db, "users", userId);
                await updateDoc(userRef, {
                    tutorialCompleted: true
                });
                onClose();
            } catch (error) {
                console.error("Tutorial save error:", error);
                onClose(); // Hata olsa bile kapat
            } finally {
                setLoading(false);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                >
                    {/* Üst Kısım: İlerleme Çubuğu */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 dark:bg-slate-800">
                        <div
                            className="h-full bg-purple-600 transition-all duration-300 ease-out"
                            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                        />
                    </div>

                    <div className="p-8 text-center">
                        {/* İkon */}
                        <motion.div
                            key={currentStep}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl ${STEPS[currentStep].color}`}
                        >
                            {STEPS[currentStep].icon}
                        </motion.div>

                        {/* Metin */}
                        <motion.div
                            key={`text-${currentStep}`}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="space-y-3"
                        >
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {STEPS[currentStep].title}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                                {STEPS[currentStep].description}
                            </p>
                        </motion.div>
                    </div>

                    {/* Alt Butonlar */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                        <div className="flex gap-1.5">
                            {STEPS.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-2 w-2 rounded-full transition-colors ${idx === currentStep ? "bg-purple-600" : "bg-slate-300 dark:bg-slate-700"
                                        }`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={handleNext}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
                        >
                            {loading ? (
                                "Kaydediliyor..."
                            ) : currentStep === STEPS.length - 1 ? (
                                "Başlayalım! 🚀"
                            ) : (
                                <>
                                    İlerle <ChevronRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
