"use client";

import { WifiOff, Wifi } from "lucide-react";
import { useOnlineStatus } from "../hooks/use-online-status";
import { motion, AnimatePresence } from "framer-motion";

export default function OfflineIndicator() {
    const isOnline = useOnlineStatus();

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 shadow-lg"
                >
                    <div className="max-w-md mx-auto flex items-center justify-center gap-2">
                        <WifiOff className="h-4 w-4 animate-pulse" />
                        <span className="text-sm font-semibold">
                            Çevrimdışı Mod - Değişiklikler daha sonra senkronize edilecek
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export function OnlineIndicator() {
    const isOnline = useOnlineStatus();

    if (isOnline) return null;

    return (
        <div className="fixed bottom-20 right-4 z-40 flex items-center gap-2 bg-slate-900 text-white px-3 py-2 rounded-full shadow-lg text-xs">
            <WifiOff className="h-3 w-3 text-orange-400" />
            <span>Çevrimdışı</span>
        </div>
    );
}
