"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MessageSquare, CheckCircle, Trash2, AlertCircle, Sparkles, Mail } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";

type Feedback = {
    id: string;
    userId: string;
    userEmail: string;
    type: "suggestion" | "bug" | "other";
    message: string;
    status: "new" | "read" | "resolved";
    createdAt: any;
};

export default function FeedbacksPage() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFeedbacks = async () => {
        try {
            const q = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
            setFeedbacks(data);
        } catch (error) {
            console.error("Feedback fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const handleStatusUpdate = async (id: string, newStatus: "read" | "resolved") => {
        try {
            await updateDoc(doc(db, "feedbacks", id), { status: newStatus });
            setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
            toast.success("Durum güncellendi.");
        } catch (error) {
            toast.error("Hata oluştu.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Silmek istediğine emin misin?")) return;
        try {
            await deleteDoc(doc(db, "feedbacks", id));
            setFeedbacks(prev => prev.filter(f => f.id !== id));
            toast.success("Silindi.");
        } catch (error) {
            toast.error("Hata oluştu.");
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <MessageSquare className="h-6 w-6 text-purple-600" />
                        Geri Bildirimler
                    </h1>
                    <p className="text-sm text-slate-500">Kullanıcılardan gelen öneri ve hata bildirimleri.</p>
                </div>
                <div className="text-sm font-medium px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                    {feedbacks.length} Mesaj
                </div>
            </div>

            <div className="grid gap-4">
                {feedbacks.map((item) => (
                    <div
                        key={item.id}
                        className={`bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border transition-all ${item.status === 'new'
                                ? 'border-purple-500 shadow-purple-100 dark:shadow-purple-900/20'
                                : 'border-slate-200 dark:border-slate-800 opacity-80'
                            }`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${item.type === 'bug' ? 'bg-red-50 text-red-600' :
                                        item.type === 'suggestion' ? 'bg-purple-50 text-purple-600' :
                                            'bg-blue-50 text-blue-600'
                                    }`}>
                                    {item.type === 'bug' ? <AlertCircle className="h-5 w-5" /> :
                                        item.type === 'suggestion' ? <Sparkles className="h-5 w-5" /> :
                                            <MessageSquare className="h-5 w-5" />}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${item.type === 'bug' ? 'bg-red-100 text-red-700' :
                                                item.type === 'suggestion' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {item.type === 'bug' ? 'Hata' : item.type === 'suggestion' ? 'Öneri' : 'Diğer'}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {item.createdAt ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true, locale: tr }) : ''}
                                        </span>
                                        {item.status === 'new' && (
                                            <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                                        )}
                                    </div>
                                    <p className="text-slate-800 dark:text-slate-100 font-medium text-lg leading-relaxed">
                                        {item.message}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                                        <Mail className="h-3 w-3" />
                                        {item.userEmail}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                {item.status !== 'resolved' && (
                                    <button
                                        onClick={() => handleStatusUpdate(item.id, 'resolved')}
                                        className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition"
                                        title="Çözüldü Olarak İşaretle"
                                    >
                                        <CheckCircle className="h-5 w-5" />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                    title="Sil"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {feedbacks.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        Henüz hiç geri bildirim yok.
                    </div>
                )}
            </div>
        </div>
    );
}
