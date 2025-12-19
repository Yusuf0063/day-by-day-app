"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    Trophy,
    Activity,
    ShieldAlert
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const menuItems = [
    {
        title: "Ana Panel",
        href: "/admin",
        icon: LayoutDashboard
    },
    {
        title: "Kullanıcılar",
        href: "/admin/users",
        icon: Users
    },
    {
        title: "Aktiviteler",
        href: "/admin/activities",
        icon: Activity
    },
    {
        title: "Rozet Yönetimi",
        href: "/admin/badges",
        icon: Trophy
    },
    {
        title: "Güvenlik Logları",
        href: "/admin/logs",
        icon: ShieldAlert
    },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast.success("Çıkış yapıldı");
            router.push("/login");
        } catch (error) {
            toast.error("Çıkış yapılırken hata oluştu");
        }
    };

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <div className="flex h-full flex-col px-3 py-4">
                {/* Logo */}
                <div className="mb-8 flex items-center gap-3 px-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white">
                        <Trophy className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                            DayByDay
                        </span>
                        <span className="text-xs font-medium text-slate-500 text-purple-600 dark:text-purple-400">
                            Admin Paneli
                        </span>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="flex-1 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                                        ? "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                                    }`}
                            >
                                <item.icon className={`h-5 w-5 ${isActive ? "text-purple-600 dark:text-purple-300" : ""}`} />
                                {item.title}
                            </Link>
                        );
                    })}
                </div>

                {/* Bottom Actions */}
                <div className="mt-auto border-t border-slate-200 pt-4 dark:border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                        <LogOut className="h-5 w-5" />
                        Çıkış Yap
                    </button>
                </div>
            </div>
        </aside>
    );
}
