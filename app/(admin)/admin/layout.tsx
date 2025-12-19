"use client";

import { useAdmin } from "@/hooks/use-admin";
import { AdminSidebar } from "@/components/admin/sidebar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Trophy } from "lucide-react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAdmin, loading } = useAdmin();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push("/");
        }
    }, [loading, isAdmin, router]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                        <Trophy className="h-6 w-6 animate-pulse text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-500 animate-pulse">Panel Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return null; // Redirecting...
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <AdminSidebar />
            <main className="ml-64 p-8">
                <div className="mx-auto max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    );
}
