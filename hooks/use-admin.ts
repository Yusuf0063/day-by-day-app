"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function useAdmin() {
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    // Force token refresh to get the latest custom claims
                    const tokenResult = await user.getIdTokenResult(true);
                    const hasAdminClaim = !!tokenResult.claims.admin;

                    if (hasAdminClaim) {
                        setIsAdmin(true);
                    } else {
                        console.warn("Kullanıcı admin yetkisine sahip değil.");
                        setIsAdmin(false);
                    }
                } else {
                    setIsAdmin(false);
                }
            } catch (error) {
                console.error("Admin yetkisi kontrol edilirken hata oluştu:", error);
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    return { isAdmin, loading };
}
