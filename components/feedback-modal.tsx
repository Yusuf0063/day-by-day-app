"use client";

import { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { X, Send, MessageSquare, AlertCircle, Sparkles } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userEmail?: string;
}

export default function FeedbackModal({ isOpen, onClose, userId, userEmail }: FeedbackModalProps) {
    const [type, setType] = useState<"suggestion" | "bug" | "other">("suggestion");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!message.trim()) {
            toast.error("Lütfen mesajınızı yazın.");
            return;
        }

        setLoading(true);

        try {
            await addDoc(collection(db, "feedbacks"), {
                userId,
                userEmail: userEmail || "Anonim",
                type,
                message,
                status: "new", // new, read, resolved
                createdAt: serverTimestamp(),
            });

            toast.success("Geri bildiriminiz için teşekkürler! 🚀");
            setMessage("");
            setType("suggestion");
            onClose();
        } catch (error) {
            console.error("Geri bildirim hatası:", error);
            toast.error("Bir sorun oluştu. Lütfen daha sonra tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-slate-900">
                                <div className="flex items-center justify-between mb-4">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-bold leading-6 text-slate-900 dark:text-white flex items-center gap-2"
                                    >
                                        <MessageSquare className="h-5 w-5 text-purple-600" />
                                        Geri Bildirim Gönder
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-500 dark:hover:bg-slate-800"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">

                                    {/* Tür Seçimi */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Konu Nedir?
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setType("suggestion")}
                                                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-sm transition ${type === "suggestion"
                                                        ? "bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
                                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                                                    }`}
                                            >
                                                <Sparkles className="h-5 w-5 mb-1" />
                                                Öneri
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setType("bug")}
                                                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-sm transition ${type === "bug"
                                                        ? "bg-red-50 border-red-500 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                                                    }`}
                                            >
                                                <AlertCircle className="h-5 w-5 mb-1" />
                                                Hata
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setType("other")}
                                                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-sm transition ${type === "other"
                                                        ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                                                    }`}
                                            >
                                                <MessageSquare className="h-5 w-5 mb-1" />
                                                Diğer
                                            </button>
                                        </div>
                                    </div>

                                    {/* Mesaj */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Mesajınız
                                        </label>
                                        <textarea
                                            rows={4}
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Bize düşüncelerinden bahset..."
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>

                                    <div className="mt-6">
                                        <button
                                            type="submit"
                                            disabled={loading || !message.trim()}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <span className="block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            ) : (
                                                <>
                                                    <Send className="h-4 w-4" />
                                                    Gönder
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
