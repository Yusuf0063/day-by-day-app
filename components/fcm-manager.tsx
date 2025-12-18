"use client";

import { useEffect, useState } from "react";
import { getMessagingInstance, db } from "../lib/firebase";
import { getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

export default function FcmManager({ userId }: { userId: string | null }) {
    const [permission, setPermission] = useState<NotificationPermission>("default");

    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            setPermission(Notification.permission);
        }

        // Ön plan (Foreground) bildirimlerini dinle
        const setupListener = async () => {
            try {
                const messaging = await getMessagingInstance();
                if (!messaging) return;

                onMessage(messaging, (payload) => {
                    console.log("FCM Ön Plan Mesajı:", payload);
                    toast.success(payload.notification?.title || "Day by Day", {
                        description: payload.notification?.body,
                        duration: 5000,
                    });
                });
            } catch (error) {
                console.error("FCM Listener Hatası:", error);
            }
        };

        setupListener();
    }, []);

    const requestPermission = async () => {
        const messaging = await getMessagingInstance();
        if (!messaging) {
            alert("Bildirim servisi (FCM) kullanılamıyor.");
            return;
        }

        try {
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult);

            if (permissionResult === "granted") {
                // VAPID key console'dan alınmalı: Project Settings > Cloud Messaging > Web configuration
                const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

                if (!vapidKey) {
                    console.warn("VAPID Key eksik! .env.local dosyasına NEXT_PUBLIC_FIREBASE_VAPID_KEY ekleyin.");
                }

                const currentToken = await getToken(messaging, {
                    vapidKey: vapidKey
                });

                if (currentToken) {
                    console.log("FCM Token Alındı:", currentToken);

                    if (userId) {
                        // Token'ı kullanıcı profiline kaydet
                        const userRef = doc(db, "users", userId);
                        await updateDoc(userRef, {
                            fcmTokens: arrayUnion(currentToken)
                        });
                        console.log("Token Firestore'a kaydedildi.");
                    }
                } else {
                    console.log("Token alınamadı.");
                }
            }
        } catch (err) {
            console.error("FCM Hatası:", err);
        }
    };

    if (permission === "granted") return null; // İzin verildiyse butonu gizle

    return (
        <div className="fixed bottom-24 left-6 z-40 sm:bottom-28">
            <button
                onClick={requestPermission}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition hover:scale-105 hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                title="Bildirimleri Aç"
            >
                <Bell className="h-5 w-5" />
            </button>
        </div>
    );
}
