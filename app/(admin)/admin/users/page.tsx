"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { logSecurityEvent } from "@/lib/logger";
import { User as UserIcon, Calendar, Trophy, Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";

type UserData = {
    id: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
    level?: number;
    score?: number;
    hearts?: number;
    lastLoginDate?: string;
};

export default function UsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersRef = collection(db, "users");
                // Son giriş yapanları önce getir (en aktifler)
                // Not: Gerçek projede pagination gerekebilir, şimdilik ilk 50
                const q = query(usersRef, limit(50));

                const snapshot = await getDocs(q);
                const userList: UserData[] = [];

                snapshot.forEach((doc) => {
                    userList.push({ id: doc.id, ...doc.data() } as UserData);
                });

                setUsers(userList);
            } catch (error) {
                console.error("Kullanıcılar yüklenirken hata:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleDeleteUser = async (userId: string, userName: string) => {
        const confirmDelete = window.confirm(
            `⚠️ DİKKAT!\n\n"${userName}" kullanıcısını silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz ve kullanıcının tüm verileri (alışkanlıklar, puanlar, giriş yetkisi) kalıcı olarak silinecektir.`
        );

        if (!confirmDelete) return;

        const toastId = toast.loading("Kullanıcı siliniyor...");

        try {
            // 1. Admin Token al (Güvenlik için API'ye göndereceğiz)
            const token = await auth.currentUser?.getIdToken();

            if (!token) {
                toast.error("Oturum hatası: Lütfen tekrar giriş yapın.");
                return;
            }

            // 2. API'ye silme isteği gönder
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Silme işlemi başarısız");
            }

            // 3. Başarılı ise yerel listeden çıkar
            setUsers((prev) => prev.filter((u) => u.id !== userId));
            setUsers((prev) => prev.filter((u) => u.id !== userId));
            toast.success("Kullanıcı başarıyla silindi", { id: toastId });

            // Log Critical Action
            await logSecurityEvent({
                type: "data_deletion",
                message: `Kullanıcı silindi: ${userName} (${userId})`,
                level: "critical",
                userId: auth.currentUser?.uid,
                userEmail: auth.currentUser?.email || undefined,
                metadata: { deletedUserId: userId }
            });

        } catch (error: any) {
            console.error("Silme hatası:", error);
            toast.error(`Hata: ${error.message}`, { id: toastId });
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
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Kullanıcı Yönetimi
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Toplam {users.length} kullanıcı listeleniyor.
                    </p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Kullanıcı</th>
                                <th className="px-6 py-4 font-semibold">İstatistikler</th>
                                <th className="px-6 py-4 font-semibold">Durum</th>
                                <th className="px-6 py-4 font-semibold">Son Giriş</th>
                                <th className="px-6 py-4 font-semibold">ID</th>
                                <th className="px-6 py-4 font-semibold text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800">
                                                {user.photoURL ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={user.photoURL}
                                                        alt={user.displayName || "User"}
                                                        className="h-full w-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <UserIcon className="h-5 w-5" />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-900 dark:text-white">
                                                    {user.displayName || "İsimsiz Kullanıcı"}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {user.email || "E-posta yok"}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium dark:bg-yellow-900/30 dark:text-yellow-400">
                                                <Trophy className="h-3 w-3" />
                                                Lvl {user.level || 1}
                                            </div>
                                            <div className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-md dark:bg-slate-800">
                                                {user.score || 0} XP
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: 3 }).map((_, i) => (
                                                <Heart
                                                    key={i}
                                                    className={`h-4 w-4 ${i < (user.hearts ?? 3) ? "fill-red-500 text-red-500" : "fill-slate-200 text-slate-200 dark:fill-slate-800 dark:text-slate-800"}`}
                                                />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-slate-400" />
                                            {user.lastLoginDate || "-"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-500 dark:bg-slate-800">
                                            {user.id.slice(0, 8)}...
                                        </code>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDeleteUser(user.id, user.displayName || user.email || "Kullanıcı")}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-900/20 dark:text-red-400"
                                            title="Kullanıcıyı Sil"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        Hiç kullanıcı bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
