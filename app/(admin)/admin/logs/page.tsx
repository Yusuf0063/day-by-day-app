"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Shield, AlertTriangle, Info, XCircle, Search, Clock, Monitor } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

type SecurityLog = {
    id: string;
    type: string;
    message: string;
    level: "info" | "warning" | "critical";
    userId?: string;
    userEmail?: string;
    timestamp: Timestamp;
    userAgent?: string;
    path?: string;
};

export default function SecurityLogsPage() {
    const [logs, setLogs] = useState<SecurityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        // Gerçek zamanlı güvenlik loglarını dinle
        const q = query(
            collection(db, "security_logs"),
            orderBy("timestamp", "desc"),
            limit(100)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: SecurityLog[] = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as SecurityLog);
            });
            setLogs(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredLogs = filter === "all"
        ? logs
        : logs.filter(log => log.level === filter);

    const getLevelIcon = (level: string) => {
        switch (level) {
            case "critical": return <XCircle className="h-4 w-4 text-red-500" />;
            case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    const getLevelClass = (level: string) => {
        switch (level) {
            case "critical": return "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400";
            case "warning": return "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/10 dark:border-yellow-900/30 dark:text-yellow-400";
            default: return "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900/20 dark:border-slate-800 dark:text-slate-400";
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Shield className="h-6 w-6 text-purple-600" />
                        Güvenlik Denetimi
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Sistem girişleri, hatalar ve kritik işlemlerin kayıtları.
                    </p>
                </div>

                <div className="flex gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setFilter("all")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${filter === "all" ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                    >
                        Tümü
                    </button>
                    <button
                        onClick={() => setFilter("warning")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${filter === "warning" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" : "text-slate-500 hover:text-yellow-600"}`}
                    >
                        Uyarılar
                    </button>
                    <button
                        onClick={() => setFilter("critical")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${filter === "critical" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "text-slate-500 hover:text-red-600"}`}
                    >
                        Hatalar
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Olay / Mesaj</th>
                                <th className="px-6 py-4 font-medium">Kullanıcı</th>
                                <th className="px-6 py-4 font-medium">Zaman</th>
                                <th className="px-6 py-4 font-medium">Detay</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 flex-shrink-0 rounded-full p-1 ${getLevelClass(log.level)}`}>
                                                {getLevelIcon(log.level)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900 dark:text-white">
                                                    {log.type.replace(/_/g, " ").toUpperCase()}
                                                </div>
                                                <div className="text-slate-500 dark:text-slate-400 max-w-md break-words">
                                                    {log.message}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-900 dark:text-white font-medium">
                                            {log.userEmail || "Sistem / Bilinmiyor"}
                                        </div>
                                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                                            ID: {log.userId?.slice(0, 8)}...
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5" />
                                            {log.timestamp ? formatDistanceToNow(log.timestamp.toDate(), { addSuffix: true, locale: tr }) : '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs text-slate-400 dark:text-slate-500 font-mono max-w-[200px] truncate" title={log.userAgent}>
                                            <div className="flex items-center gap-1 mb-1">
                                                <Monitor className="h-3 w-3" />
                                                {log.path || '/'}
                                            </div>
                                            {log.userAgent}
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        <Shield className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                                        <p>Kayıtlı güvenlik olayı bulunamadı.</p>
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
