"use client";

import { useState } from "react";
import { auth, googleProvider } from "../../lib/firebase";
import {
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    getAdditionalUserInfo
} from "firebase/auth";
import { logSecurityEvent } from "../../lib/logger";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, ArrowRight, Mail, ArrowLeft, User } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<"google" | "email">("google");
    const [isRegister, setIsRegister] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState(""); // Yeni state: Ad Soyad

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await signInWithPopup(auth, googleProvider);

            if (!result.user) {
                throw new Error("Kullanıcı bilgisi alınamadı");
            }

            console.log("Google giriş başarılı:", result.user.uid);

            // Yeni kullanıcı mı kontrol et ve logla
            const additionalInfo = getAdditionalUserInfo(result);
            if (additionalInfo?.isNewUser) {
                try {
                    const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
                    const { db } = await import("../../lib/firebase");
                    await addDoc(collection(db, "global_activities"), {
                        type: "user_signup",
                        title: "Google ile katıldı!",
                        description: "aramıza katıldı.",
                        userId: result.user.uid,
                        userDisplayName: result.user.displayName || "Google Kullanıcısı",
                        userPhoto: result.user.photoURL,
                        timestamp: serverTimestamp(),
                    });
                } catch (e) {
                    console.error("Activity log error:", e);
                }
            }

            // Auth state'in güncellenmesini bekle
            await new Promise(resolve => setTimeout(resolve, 500));

            // Log Success
            await logSecurityEvent({
                type: "auth_login",
                message: "Google ile giriş yapıldı",
                userId: result.user.uid,
                userEmail: result.user.email || undefined,
                level: "info",
                metadata: { provider: "google" }
            });

            router.push("/"); // Başarılı olursa ana sayfaya git
        } catch (err: any) {
            console.error("Login failed:", err);

            // Firebase hata kodlarına göre özel mesajlar
            const errorCode = err?.code;
            let userMessage = "Giriş yapılırken bir hata oluştu.";

            switch (errorCode) {
                case "auth/popup-closed-by-user":
                    userMessage = "Giriş penceresi kapatıldı. Lütfen tekrar deneyin.";
                    break;
                case "auth/cancelled-popup-request":
                    userMessage = "Giriş işlemi iptal edildi.";
                    break;
                case "auth/popup-blocked":
                    userMessage = "Popup engellendi. Lütfen tarayıcınızın popup ayarlarını kontrol edin.";
                    break;
                case "auth/account-exists-with-different-credential":
                    userMessage = "Bu e-posta adresi farklı bir giriş yöntemiyle kullanılıyor.";
                    break;
                case "auth/network-request-failed":
                    userMessage = "Ağ hatası. İnternet bağlantınızı kontrol edin.";
                    break;
                case "auth/too-many-requests":
                    userMessage = "Çok fazla deneme yapıldı. Lütfen bir süre bekleyin.";
                    break;
                default:
                    userMessage = `Giriş hatası: ${err.message || "Bilinmeyen hata"}`;
            }

            // Log Failure
            await logSecurityEvent({
                type: "auth_failure",
                message: `Google girişi başarısız: ${userMessage}`,
                level: "warning",
                metadata: { errorCode: errorCode }
            });

            setError(userMessage);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!email) {
            setError("Lütfen şifre sıfırlama bağlantısı için e-postanızı girin.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await sendPasswordResetEmail(auth, email);
            toast.success("Şifre sıfırlama bağlantısı e-postanıza gönderildi!", { duration: 5000 });
            // İsteğe bağlı: E-posta gönderildikten sonra kullanıcıyı bilgilendir
        } catch (err: any) {
            console.error("Reset password failed:", err);
            const errorCode = err?.code;
            let userMessage = "Şifre sıfırlama işlemi sırasında bir hata oluştu.";

            if (errorCode === "auth/user-not-found") {
                userMessage = "Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.";
            } else if (errorCode === "auth/invalid-email") {
                userMessage = "Geçersiz e-posta adresi.";
            }

            setError(userMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailAuth = async () => {
        setLoading(true);
        setError(null);

        if (!email || !password) {
            setError("Lütfen e-posta ve şifre giriniz.");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Şifre en az 6 karakter olmalıdır.");
            setLoading(false);
            return;
        }

        try {
            if (isRegister) {
                if (!displayName.trim()) {
                    setError("Lütfen ad ve soyad giriniz.");
                    setLoading(false);
                    return;
                }

                // Kayıt ol
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);

                // Profil İsmini Güncelle
                await updateProfile(userCredential.user, {
                    displayName: displayName
                });

                console.log("Kayıt başarılı:", userCredential.user.uid);

                // Log Activity
                try {
                    const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
                    const { db } = await import("../../lib/firebase");
                    await addDoc(collection(db, "global_activities"), {
                        type: "user_signup",
                        title: "Yeni üye!",
                        description: "aramıza katıldı.",
                        userId: userCredential.user.uid,
                        userDisplayName: displayName || userCredential.user.email?.split("@")[0] || "Yeni Kullanıcı",
                        timestamp: serverTimestamp(),
                    });
                } catch (e) {
                    console.error("Activity log error:", e);
                }

                // Kayıt sonrası çıkış yap
                await signOut(auth);

                // Başarı mesajı
                toast.success("Hesap oluşturuldu! Şimdi giriş yapabilirsiniz.", { duration: 5000 });

                // Giriş moduna geç
                setIsRegister(false);
                setPassword(""); // Şifreyi temizle
                setError(null);

                // Yönlendirme yok - kullanıcı burada kalıp giriş yapacak
            } else {
                // Giriş yap
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log("Giriş başarılı:", userCredential.user.uid);

                // Auth state'in güncellenmesini bekle
                await new Promise(resolve => setTimeout(resolve, 500));

                // Log Success
                await logSecurityEvent({
                    type: "auth_login",
                    message: "Email ile giriş yapıldı",
                    userId: userCredential.user.uid,
                    userEmail: email,
                    level: "info",
                    metadata: { provider: "password" }
                });

                router.push("/");
            }
        } catch (err: any) {
            console.error("Email auth failed:", err);

            const errorCode = err?.code;
            let userMessage = "Bir hata oluştu.";

            switch (errorCode) {
                case "auth/email-already-in-use":
                    userMessage = "Bu e-posta adresi zaten kullanılıyor.";
                    break;
                case "auth/invalid-email":
                    userMessage = "Geçersiz e-posta adresi.";
                    break;
                case "auth/weak-password":
                    userMessage = "Şifre çok zayıf. En az 6 karakter kullanın.";
                    break;
                case "auth/user-not-found":
                    userMessage = "Bu e-posta ile kayıtlı kullanıcı bulunamadı.";
                    break;
                case "auth/wrong-password":
                    userMessage = "E-posta veya şifre hatalı.";
                    break;
                case "auth/invalid-credential":
                    userMessage = "E-posta veya şifre hatalı.";
                    break;
                default:
                    userMessage = err.message || "Bilinmeyen hata";
            }

            setError(userMessage);

            // Log Failure
            if (!isRegister && !showForgotPassword) {
                await logSecurityEvent({
                    type: "auth_failure",
                    message: `Email girişi başarısız: ${userMessage}`,
                    userEmail: email,
                    level: "warning",
                    metadata: { errorCode: errorCode }
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
            <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">

                {/* Header / Logo */}
                <div className="flex flex-col items-center text-center">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300"
                    >
                        <Trophy className="h-10 w-10" />
                    </motion.div>

                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                        Day by Day
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Alışkanlıklarını oyunlaştır, hedeflerine ulaş!
                    </p>
                </div>

                {/* Login Area */}
                <div className="mt-8 space-y-4">
                    {showForgotPassword ? (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                                    <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Şifrenizi mi Unuttunuz?</h3>
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    Endişelenmeyin! E-posta adresinizi girin, size şifre sıfırlama talimatlarını gönderelim.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    E-posta Adresiniz
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="E-posta adresinizi giriniz"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-red-600 placeholder:text-slate-400"
                                />
                            </div>

                            <button
                                onClick={handlePasswordReset}
                                disabled={loading}
                                className="w-full py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm transition disabled:opacity-50"
                            >
                                {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
                            </button>

                            <button
                                onClick={() => {
                                    setShowForgotPassword(false);
                                    setError(null);
                                }}
                                className="flex w-full items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Giriş Ekranına Dön
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Tabs */}
                            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl dark:bg-slate-800">
                                <button
                                    onClick={() => {
                                        setMode("google");
                                        setError(null);
                                    }}
                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${mode === "google"
                                        ? "bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white"
                                        : "text-slate-600 dark:text-slate-400"
                                        }`}
                                >
                                    Google
                                </button>
                                <button
                                    onClick={() => {
                                        setMode("email");
                                        setError(null);
                                    }}
                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${mode === "email"
                                        ? "bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white"
                                        : "text-slate-600 dark:text-slate-400"
                                        }`}
                                >
                                    <Mail className="h-4 w-4 inline mr-1" />
                                    E-posta
                                </button>
                            </div>

                            {mode === "google" ? (
                                <button
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                    className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-lg active:scale-95 disabled:opacity-50 dark:bg-purple-600 dark:hover:bg-purple-500"
                                >
                                    {loading ? (
                                        <span className="block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    ) : (<>
                                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                                            <path
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                fill="#4285F4"
                                            />
                                            <path
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                fill="#34A853"
                                            />
                                            <path
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                fill="#FBBC05"
                                            />
                                            <path
                                                d="M12 4.6c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                fill="#EA4335"
                                            />
                                        </svg>
                                        Google ile Devam Et
                                    </>
                                    )}
                                    <ArrowRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    {/* Giriş / Kayıt Toggle */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setIsRegister(false);
                                                setError(null);
                                            }}
                                            className={`flex-1 py-2 text-sm font-medium transition ${!isRegister
                                                ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600"
                                                : "text-slate-500"
                                                }`}
                                        >
                                            Giriş Yap
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsRegister(true);
                                                setError(null);
                                            }}
                                            className={`flex-1 py-2 text-sm font-medium transition ${isRegister
                                                ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600"
                                                : "text-slate-500"
                                                }`}
                                        >
                                            Kayıt Ol
                                        </button>
                                    </div>

                                    {/* Ad Soyad Input (Sadece Kayıt Olurken) */}
                                    {isRegister && (
                                        <div className="mb-4">
                                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Ad Soyad
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={displayName}
                                                    onChange={(e) => setDisplayName(e.target.value)}
                                                    placeholder="Adınız ve Soyadınız"
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-400 text-slate-900 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Email Input */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            E-posta
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleEmailAuth()}
                                            placeholder="E-posta adresinizi giriniz"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-red-600 placeholder:text-slate-400"
                                        />
                                    </div>

                                    {/* Password Input */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Şifre
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleEmailAuth()}
                                            placeholder="••••••••"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-red-600 placeholder:text-slate-400"
                                        />
                                        {!isRegister && (
                                            <div className="flex justify-end mt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowForgotPassword(true);
                                                        setError(null);
                                                    }}
                                                    className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                                                >
                                                    Şifremi Unuttum?
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleEmailAuth}
                                        disabled={loading}
                                        className="w-full py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm transition disabled:opacity-50"
                                    >
                                        {loading
                                            ? "Bekleyin..."
                                            : isRegister
                                                ? "Hesap Oluştur"
                                                : "Giriş Yap"}
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl bg-red-50 border border-red-200 p-4 dark:bg-red-900/20 dark:border-red-800"
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                        Giriş Hatası
                                    </p>
                                    <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                <div className="mt-8 border-t border-slate-100 pt-6 text-center dark:border-slate-800">
                    <p className="text-xs text-slate-400">
                        Devam ederek Hizmet Şartları ve Gizlilik Politikasını kabul etmiş olursunuz.
                    </p>
                </div>
            </div>
        </div>
    );
}
