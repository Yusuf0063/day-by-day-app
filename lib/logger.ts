import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type SecurityLogType =
    | "auth_login"
    | "auth_failure"
    | "auth_logout"
    | "admin_action"
    | "data_deletion"
    | "security_alert";

type LogOptions = {
    type: SecurityLogType;
    message: string;
    userId?: string; // İşlemi yapan kişi (varsa)
    userEmail?: string;
    level: "info" | "warning" | "critical";
    ip?: string; // Client side'da zor ama API route'larda alınabilir
    metadata?: Record<string, any>;
};

export const logSecurityEvent = async (options: LogOptions) => {
    try {
        // Sadece client-side'da çalışırken userAgent alabiliriz
        const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'Server';
        const path = typeof window !== 'undefined' ? window.location.pathname : '';

        await addDoc(collection(db, "security_logs"), {
            ...options,
            timestamp: serverTimestamp(),
            userAgent,
            path
        });

    } catch (error) {
        // Loglama hatası uygulamayı kırmamalı
        console.error("Güvenlik logu yazılamadı:", error);
    }
};
