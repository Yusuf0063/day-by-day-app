"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, addDoc, doc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trophy, Plus, Trash2, Edit2, X, Save } from "lucide-react";
import { toast } from "sonner";

// Rozet Veri Tipi
type Badge = {
    id: string;
    name: string;
    description: string;
    imageUrl?: string; // Rozet resmi (emoji veya URL)
    conditionType: "level_reached" | "total_habits" | "streak_days";
    conditionValue: number;
    xpReward: number; // Rozet kazanılınca verilecek XP
};

export default function BadgesPage() {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Badge>>({
        name: "",
        description: "",
        imageUrl: "🏆",
        conditionType: "total_habits",
        conditionValue: 1,
        xpReward: 50
    });

    useEffect(() => {
        // Rozetleri gerçek zamanlı dinle
        const q = query(collection(db, "badges"), orderBy("conditionValue", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: Badge[] = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as Badge);
            });
            setBadges(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleSaveBadge = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.conditionValue) {
            toast.error("Lütfen gerekli alanları doldurun.");
            return;
        }

        try {
            await addDoc(collection(db, "badges"), {
                ...formData,
                createdAt: serverTimestamp()
            });

            toast.success("Yeni rozet başarıyla oluşturuldu!");
            setIsModalOpen(false);
            setFormData({
                name: "",
                description: "",
                imageUrl: "🏆",
                conditionType: "total_habits",
                conditionValue: 1,
                xpReward: 50
            });
        } catch (error) {
            console.error("Rozet ekleme hatası:", error);
            toast.error("Rozet eklenirken bir hata oluştu.");
        }
    };

    const handleDeleteBadge = async (id: string) => {
        if (!window.confirm("Bu rozeti silmek istediğinize emin misiniz?")) return;

        try {
            await deleteDoc(doc(db, "badges", id));
            toast.success("Rozet silindi.");
        } catch (error) {
            console.error("Silme hatası:", error);
            toast.error("Silinemedi.");
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Rozet Yönetimi
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Kullanıcıların kazanabileceği ödülleri tanımlayın.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition"
                >
                    <Plus className="h-4 w-4" />
                    Yeni Rozet Ekle
                </button>
            </div>

            {/* Rozet Listesi Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {badges.map((badge) => (
                    <div key={badge.id} className="relative group bg-white p-6 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm hover:shadow-md transition">

                        <div className="flex justify-between items-start mb-4">
                            <div className="h-12 w-12 flex items-center justify-center text-3xl bg-slate-50 rounded-xl dark:bg-slate-800">
                                {badge.imageUrl}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                <button
                                    onClick={() => handleDeleteBadge(badge.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                            {badge.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 h-10 line-clamp-2">
                            {badge.description}
                        </p>

                        <div className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                            <div className="flex justify-between bg-slate-50 p-2 rounded-lg dark:bg-slate-800">
                                <span>Şart:</span>

                                <span className="text-purple-600 dark:text-purple-400">
                                    {badge.conditionType === "level_reached" && `Seviye ${badge.conditionValue}`}
                                    {badge.conditionType === "total_habits" && `${badge.conditionValue} Alışkanlık Tamamla`}
                                    {badge.conditionType === "streak_days" && `${badge.conditionValue} Gün Seri`}
                                </span>
                            </div>
                            <div className="flex justify-between bg-slate-50 p-2 rounded-lg dark:bg-slate-800">
                                <span>Ödül:</span>
                                <span className="text-yellow-600 dark:text-yellow-400">+{badge.xpReward} XP</span>
                            </div>
                        </div>
                    </div>
                ))}

                {badges.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl dark:border-slate-800">
                        <Trophy className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                        <p>Henüz tanımlanmış bir rozet yok.</p>
                        <button onClick={() => setIsModalOpen(true)} className="text-purple-600 hover:underline mt-2">İlk rozeti ekle</button>
                    </div>
                )}
            </div>

            {/* Yeni Rozet Modalı */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-800">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Yeni Rozet Oluştur</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveBadge} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rozet Adı</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Örn: Erken Kalkan Yol Alır"
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 placeholder:text-red-300 dark:placeholder:text-red-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Açıklama</label>
                                <textarea
                                    rows={2}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Rozetin hikayesi..."
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 placeholder:text-red-300 dark:placeholder:text-red-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">İkon (Emoji)</label>
                                    <div className="grid grid-cols-5 gap-2 border border-slate-200 dark:border-slate-700 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                        {["🏆", "🔥", "👑", "🚀", "⭐", "💎", "🦾", "🎯", "⚡", "🍀"].map((emoji) => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, imageUrl: emoji })}
                                                className={`flex items-center justify-center h-12 w-full text-2xl rounded-lg transition-all hover:scale-110 active:scale-95 ${formData.imageUrl === emoji
                                                    ? "bg-purple-100 dark:bg-purple-900/40 ring-2 ring-purple-500 shadow-sm"
                                                    : "hover:bg-white dark:hover:bg-slate-800"
                                                    }`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Custom Input (Optional fallback) */}
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            placeholder="veya kendin yaz..."
                                            value={formData.imageUrl}
                                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                            className="w-full px-3 py-1 text-sm text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ödül (XP)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.xpReward}
                                        onChange={(e) => setFormData({ ...formData, xpReward: Number(e.target.value) })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <hr className="border-slate-100 dark:border-slate-800" />

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kazanma Şartı</label>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <select
                                        value={formData.conditionType}
                                        onChange={(e) => setFormData({ ...formData, conditionType: e.target.value as any })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                    >
                                        <option value="total_habits">Toplam Tamamlama</option>
                                        <option value="streak_days">Seri (Streak)</option>
                                        <option value="level_reached">Seviye</option>
                                    </select>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.conditionValue}
                                        onChange={(e) => setFormData({ ...formData, conditionValue: Number(e.target.value) })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <p className="text-xs text-slate-500">
                                    {formData.conditionType === "total_habits" && `Kullanıcı toplam ${formData.conditionValue} kez herhangi bir hedefini tamamlayınca kazanır.`}
                                    {formData.conditionType === "streak_days" && `Kullanıcı bir hedefte ${formData.conditionValue} gün seri yapınca kazanır.`}
                                    {formData.conditionType === "level_reached" && `Kullanıcı ${formData.conditionValue}. seviyeye ulaşınca kazanır.`}
                                </p>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition shadow-lg shadow-purple-200 dark:shadow-none"
                            >
                                Rozeti Kaydet
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
