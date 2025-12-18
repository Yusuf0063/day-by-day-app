"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Trophy, Target, Users, Award, ShoppingBag, BarChart3, CheckCircle2, ArrowRight,
    GitBranch, FileText, Settings, Layout, Code, Database, Menu, X, Zap, Shield, Wifi, Bell
} from "lucide-react";
import Link from "next/link";

const sections = [
    { id: "overview", title: "Genel Bakış", icon: <Trophy className="h-4 w-4" /> },
    { id: "context", title: "Proje Bağlamı", icon: <GitBranch className="h-4 w-4" /> },
    { id: "functional", title: "İşlevsel Gereksinimler", icon: <FileText className="h-4 w-4" /> },
    { id: "non-functional", title: "Fonksiyonel Olmayan", icon: <Settings className="h-4 w-4" /> },
    { id: "architecture", title: "Yazılım Mimarisi", icon: <Layout className="h-4 w-4" /> },
    { id: "tech", title: "Teknolojik Altyapı", icon: <Code className="h-4 w-4" /> },
    { id: "evaluation", title: "Öz Değerlendirme", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "references", title: "Kaynaklar", icon: <Database className="h-4 w-4" /> },
];

export default function PresentationPage() {
    const [activeSection, setActiveSection] = useState("overview");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 150;

            for (const section of sections) {
                const element = document.getElementById(section.id);
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(section.id);
                        break;
                    }
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
        setMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-sans">
            {/* Fixed Navigation Bar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg shadow-sm dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection("overview")}>
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 shadow-md">
                                <Trophy className="h-6 w-6 text-white" />
                            </div>
                            <span className="font-bold text-lg text-slate-900 dark:text-white hidden sm:block">Day by Day</span>
                        </div>

                        <div className="hidden lg:flex items-center gap-1">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeSection === section.id
                                        ? "bg-purple-600 text-white shadow-md"
                                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                        }`}
                                >
                                    {section.icon}
                                    <span className="hidden xl:inline">{section.title}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>

                    <AnimatePresence>
                        {mobileMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="lg:hidden border-t border-slate-200 dark:border-slate-800 overflow-hidden"
                            >
                                <div className="py-2 space-y-1">
                                    {sections.map((section) => (
                                        <button
                                            key={section.id}
                                            onClick={() => scrollToSection(section.id)}
                                            className={`flex items-center gap-2 w-full px-4 py-3 text-left text-sm font-medium transition ${activeSection === section.id
                                                ? "bg-purple-600 text-white"
                                                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                                }`}
                                        >
                                            {section.icon}
                                            {section.title}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </nav>

            <div className="pt-16">
                {/* 1. OVERVIEW */}
                <section id="overview" className="px-4 py-20 min-h-[90vh] flex items-center justify-center">
                    <div className="mx-auto max-w-6xl w-full">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-center"
                        >
                            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-2xl origin-center hover:rotate-3 transition-transform duration-300">
                                <Trophy className="h-12 w-12 text-white" />
                            </div>
                            <h1 className="mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-6xl font-black text-transparent tracking-tight">
                                Day by Day
                            </h1>
                            <p className="mb-8 text-xl text-slate-600 dark:text-slate-300 font-light">
                                Gamification Tabanlı Akıllı Alışkanlık Takip Uygulaması
                            </p>
                            <Link href="/">
                                <button className="group flex items-center gap-2 mx-auto rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-purple-500/20 transition-all hover:scale-105 hover:shadow-purple-500/40">
                                    Uygulamayı Deneyin
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </button>
                            </Link>

                            <div className="mt-20 grid grid-cols-2 gap-6 md:grid-cols-4">
                                {[
                                    { value: "8+", label: "Ana Özellik", color: "purple" },
                                    { value: "10+", label: "Rozet Türü", color: "blue" },
                                    { value: "PWA", label: "Mobil Destek", color: "pink" },
                                    { value: "100%", label: "Responsive", color: "amber" }
                                ].map((stat, i) => (
                                    <div key={i} className="rounded-2xl bg-white/60 p-6 backdrop-blur-md dark:bg-slate-900/60 shadow-lg border border-white/20 dark:border-slate-700/30 hover:transform hover:-translate-y-1 transition-all duration-300">
                                        <div className={`text-4xl font-black text-${stat.color}-600 mb-1`}>{stat.value}</div>
                                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* 2. CONTEXT */}
                <section id="context" className="px-4 py-20 bg-white/50 dark:bg-slate-900/50">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-12 text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl"><GitBranch className="h-8 w-8 text-purple-600" /></div>
                            Proje Bağlamı (Context)
                        </h2>

                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800">
                            <h3 className="text-2xl font-bold mb-8 text-purple-600 flex items-center gap-2">
                                <span className="w-2 h-8 bg-purple-600 rounded-full"></span>
                                Bağlam Diyagramı
                            </h3>

                            {/* Context Diagram Visual */}
                            <div className="bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-950 dark:to-slate-900 rounded-3xl p-10 mb-10 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                <div className="flex flex-col items-center gap-8 relative z-10">
                                    {/* User */}
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-purple-100 dark:border-slate-700 w-48 text-center ring-4 ring-purple-50 dark:ring-purple-900/20">
                                        <Users className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                                        <div className="font-bold text-lg">Kullanıcı</div>
                                        <div className="text-xs text-slate-500 mt-1">Sistemi Kullanan Kişi</div>
                                    </div>

                                    {/* Arrow Down */}
                                    <div className="flex flex-col items-center">
                                        <div className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Veri Girişi & Etkileşim</div>
                                        <div className="h-12 w-0.5 bg-gradient-to-b from-purple-200 to-purple-600"></div>
                                        <div className="text-purple-600 -mt-1 transform rotate-90">➤</div>
                                    </div>

                                    {/* App Center */}
                                    <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-3xl p-8 shadow-2xl w-full max-w-md text-center relative">
                                        <div className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">CORE SYSTEM</div>
                                        <Trophy className="h-14 w-14 mx-auto mb-4 drop-shadow-md" />
                                        <div className="font-bold text-2xl tracking-wide">Day by Day App</div>
                                        <div className="text-sm opacity-90 mt-2 font-light">Gamification & Habit Tracking Logic</div>
                                    </div>

                                    {/* Arrow Down */}
                                    <div className="flex flex-col items-center">
                                        <div className="text-purple-600 transform rotate-90 mb-1">➤</div>
                                        <div className="h-12 w-0.5 bg-gradient-to-t from-purple-200 to-purple-600"></div>
                                        <div className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">API Çağrıları & Veri Saklama</div>
                                    </div>

                                    {/* External Services */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
                                        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 text-center shadow border-b-4 border-orange-500">
                                            <Database className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                                            <div className="text-sm font-bold">Firebase</div>
                                            <div className="text-xs text-slate-500">Veritabanı</div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 text-center shadow border-b-4 border-blue-500">
                                            <Shield className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                                            <div className="text-sm font-bold">Auth</div>
                                            <div className="text-xs text-slate-500">Kimlik Doğrulama</div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 text-center shadow border-b-4 border-green-500">
                                            <Bell className="h-6 w-6 text-green-600 mx-auto mb-2" />
                                            <div className="text-sm font-bold">FCM</div>
                                            <div className="text-xs text-slate-500">Bildirimler</div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 text-center shadow border-b-4 border-purple-500">
                                            <Wifi className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                                            <div className="text-sm font-bold">IndexedDB</div>
                                            <div className="text-xs text-slate-500">Offline Depo</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="font-bold text-lg mb-4 flex items-center gap-2"><Target className="h-5 w-5 text-purple-600" /> Proje Amacı</h4>
                                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                                        Day by Day, alışkanlık kazanımını eğlenceli ve sürdürülebilir hale getiren bir web uygulamasıdır.
                                        Kullanıcılar günlük hedeflerini tamamladıkça XP kazanır, seviye atlar ve başarılarını görsel rozetlerle taçlandırır.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-blue-600" /> Hedef Kitle</h4>
                                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span>Düzenli alışkanlık edinmek isteyen bireyler</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span>Oyunlaştırma ile motivasyon arayan öğrenciler</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. FUNCTIONAL */}
                <section id="functional" className="px-4 py-20">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-12 text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl"><FileText className="h-8 w-8 text-blue-600" /></div>
                            İşlevsel Gereksinimler
                        </h2>

                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800">
                            <h3 className="text-2xl font-bold mb-8 text-blue-600 flex items-center gap-2">
                                <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                                Use Case Diyagramı (Özet)
                            </h3>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center justify-center mb-6">
                                        <Users className="h-16 w-16 text-red-600 dark:text-red-400 p-2 border-2 border-red-600 dark:border-red-400 rounded-full" />
                                    </div>
                                    <h4 className="text-center font-bold text-xl mb-4 text-red-600 dark:text-red-400">Aktör: Standart Kullanıcı</h4>
                                    <div className="space-y-2">
                                        {[
                                            "Sisteme Kayıt Ol / Giriş Yap",
                                            "Yeni Alışkanlık Oluştur",
                                            "Alışkanlık Durumunu Güncelle (Tamamla)",
                                            "İstatistikleri ve İlerlemeyi Görüntüle",
                                            "Puan Dükkanından Öğe Satın Al",
                                            "Profile Rozet Kuşan",
                                            "Hesap Ayarlarını Düzenle"
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg shadow-sm border border-red-200 dark:border-red-900/30">
                                                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                                                <span className="text-sm font-medium text-red-700 dark:text-red-400">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border-l-4 border-blue-500">
                                        <h5 className="font-bold text-blue-800 dark:text-blue-300 mb-2">UC-01: Kayıt ve Giriş</h5>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            Kullanıcı Google OAuth veya E-posta/Şifre kombinasyonu ile sisteme güvenli bir şekilde giriş yapabilir. Yeni kayıt olanlara otomatik başlangıç veri seti atanır.
                                        </p>
                                    </div>
                                    <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-xl border-l-4 border-purple-500">
                                        <h5 className="font-bold text-purple-800 dark:text-purple-300 mb-2">UC-02: Gamification Motoru</h5>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            Her tamamlanan görev +10 XP ve Altın kazandırır. 100 XP'ye ulaşan kullanıcı seviye atlar. Kullanıcı yeterli puana sahipse marketten çerçeve satın alabilir.
                                        </p>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-xl border-l-4 border-green-500">
                                        <h5 className="font-bold text-green-800 dark:text-green-300 mb-2">UC-03: Veri Senkronizasyonu</h5>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            İnternet bağlantısı kopsa bile (PWA modu), yapılan işlemler IndexedDB'ye kaydedilir ve bağlantı geldiğinde otomatik olarak Firebase'e gönderilir.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. NON-FUNCTIONAL */}
                <section id="non-functional" className="px-4 py-20 bg-white/50 dark:bg-slate-900/50">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-12 text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl"><Settings className="h-8 w-8 text-amber-600" /></div>
                            Fonksiyonel Olmayan Gereksinimler
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            {[
                                { title: "Performans", icon: <Zap className="h-6 w-6 text-yellow-600" />, items: ["< 2sn İlk Açılış Süresi (FCP)", "60 FPS Animasyonlar", "Service Worker Önbellekleme"] },
                                { title: "Güvenlik", icon: <Shield className="h-6 w-6 text-blue-600" />, items: ["Firebase Auth ile Güvenli Oturum", "Firestore Security Rules ile Veri Koruma", "HTTPS Üzerinden Şifreli İletişim"] },
                                { title: "Kullanılabilirlik", icon: <Target className="h-6 w-6 text-red-600" />, items: ["Mobil Öncelikli (Mobile-First) Tasarım", "Karanlık Mod (Dark Mode) Desteği", "Erişilebilir Renk Kontrastları (WCAG)"] },
                                { title: "Güvenilirlik", icon: <Wifi className="h-6 w-6 text-purple-600" />, items: ["Offline Çalışma Yeteneği (PWA)", "%99.9 Uptime (Firebase SLA)", "Hata Durumunda Kullanıcı Bildirimi"] }
                            ].map((req, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">{req.icon}</div>
                                        <h3 className="text-xl font-bold">{req.title}</h3>
                                    </div>
                                    <ul className="space-y-3">
                                        {req.items.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 5. ARCHITECTURE */}
                <section id="architecture" className="px-4 py-20">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-12 text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl"><Layout className="h-8 w-8 text-indigo-600" /></div>
                            Yazılım Mimarisi
                        </h2>

                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800">
                            <h3 className="text-2xl font-bold mb-8 text-indigo-600 flex items-center gap-2">
                                <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
                                Katmanlı Mimari (Layered Architecture)
                            </h3>

                            <div className="space-y-6">
                                {/* Layer 1 */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border-l-8 border-blue-500 flex flex-col md:flex-row gap-4 items-start md:items-center">
                                    <div className="bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-lg whitespace-nowrap">1. Sunum Katmanı</div>
                                    <div className="flex-1">
                                        <div className="font-bold text-slate-900 dark:text-white mb-1">Next.js Client Components (UI)</div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">Kullanıcı arayüzü, animasyonlar (Framer Motion), sayfa yönlendirmeleri ve responsive tasarım. React state yönetimi burada gerçekleşir.</p>
                                    </div>
                                </div>

                                {/* Connection Line */}
                                <div className="hidden md:flex justify-center -my-4 z-0">
                                    <div className="h-8 w-0.5 bg-slate-300 dark:bg-slate-700"></div>
                                </div>

                                {/* Layer 2 */}
                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-2xl border-l-8 border-purple-500 flex flex-col md:flex-row gap-4 items-start md:items-center z-10 relative">
                                    <div className="bg-purple-500 text-white font-bold px-4 py-2 rounded-lg text-lg whitespace-nowrap">2. İş Mantığı</div>
                                    <div className="flex-1">
                                        <div className="font-bold text-slate-900 dark:text-white mb-1">Hooks & Utility Functions</div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">XP hesaplama, seviye atlama kontrolü, rozet kazanma algoritmaları, tarih/saat işlemleri ve veri doğrulama mantığı.</p>
                                    </div>
                                </div>

                                {/* Connection Line */}
                                <div className="hidden md:flex justify-center -my-4 z-0">
                                    <div className="h-8 w-0.5 bg-slate-300 dark:bg-slate-700"></div>
                                </div>

                                {/* Layer 3 */}
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border-l-8 border-green-500 flex flex-col md:flex-row gap-4 items-start md:items-center z-10 relative">
                                    <div className="bg-green-500 text-white font-bold px-4 py-2 rounded-lg text-lg whitespace-nowrap">3. Veri Katmanı</div>
                                    <div className="flex-1">
                                        <div className="font-bold text-slate-900 dark:text-white mb-1">Firebase & IndexedDB</div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">NoSQL veritabanı (Firestore), yerel depolama (Local Storage/IndexedDB) ve veri senkronizasyon servisleri.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6. TECH STACK (UPDATED) */}
                <section id="tech" className="px-4 py-20 bg-white/50 dark:bg-slate-900/50">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-12 text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                            <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-xl"><Code className="h-8 w-8 text-pink-600" /></div>
                            Teknolojik Altyapı
                        </h2>

                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800">
                                <h3 className="text-2xl font-bold text-pink-600 mb-6 flex items-center gap-2">
                                    <span className="w-2 h-8 bg-pink-600 rounded-full"></span>
                                    Core Stack
                                </h3>

                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="group bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 text-center hover:bg-black hover:text-white transition-all duration-300">
                                        <div className="text-xl font-bold mb-2">Next.js 16</div>
                                        <div className="text-xs font-mono opacity-60 mb-3 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded inline-block group-hover:bg-slate-800 group-hover:text-white">FRAMEWORK</div>
                                        <p className="text-sm opacity-80">App Router, Server Components ve API Routes altyapısı.</p>
                                    </div>

                                    <div className="group bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-6 text-center hover:bg-blue-600 hover:text-white transition-all duration-300">
                                        <div className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-400 group-hover:text-white">TypeScript</div>
                                        <div className="text-xs font-mono opacity-60 mb-3 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded inline-block group-hover:bg-blue-500 group-hover:text-white">LANGUAGE</div>
                                        <p className="text-sm opacity-80 text-blue-900 dark:text-blue-100 group-hover:text-white">Tam tip güvenliği ve interface tanımları.</p>
                                    </div>

                                    <div className="group bg-cyan-50 dark:bg-cyan-900/10 rounded-2xl p-6 text-center hover:bg-cyan-500 hover:text-white transition-all duration-300">
                                        <div className="text-xl font-bold mb-2 text-cyan-700 dark:text-cyan-400 group-hover:text-white">Tailwind CSS</div>
                                        <div className="text-xs font-mono opacity-60 mb-3 bg-cyan-100 dark:bg-cyan-900/50 px-2 py-1 rounded inline-block group-hover:bg-cyan-400 group-hover:text-white">STYLING</div>
                                        <p className="text-sm opacity-80 text-cyan-900 dark:text-cyan-100 group-hover:text-white">Utility-first modern tasarım sistemi.</p>
                                    </div>

                                    <div className="group bg-orange-50 dark:bg-orange-900/10 rounded-2xl p-6 text-center hover:bg-orange-500 hover:text-white transition-all duration-300">
                                        <div className="text-xl font-bold mb-2 text-orange-700 dark:text-orange-400 group-hover:text-white">Firebase</div>
                                        <div className="text-xs font-mono opacity-60 mb-3 bg-orange-100 dark:bg-orange-900/50 px-2 py-1 rounded inline-block group-hover:bg-orange-400 group-hover:text-white">BACKEND</div>
                                        <p className="text-sm opacity-80 text-orange-900 dark:text-orange-100 group-hover:text-white">Database, Auth ve Hosting çözümü.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800">
                                <h3 className="text-2xl font-bold text-purple-600 mb-6 flex items-center gap-2">
                                    <span className="w-2 h-8 bg-purple-600 rounded-full"></span>
                                    Kritik Kütüphaneler
                                </h3>

                                <div className="grid md:grid-cols-3 gap-4 text-sm">
                                    {[
                                        { name: "Framer Motion", type: "Animation", desc: "Sayfa geçişleri ve mikro etkileşimler" },
                                        { name: "Lucide React", type: "Icons", desc: "Hafif ve tutarlı SVG ikon seti" },
                                        { name: "Sonner", type: "Notifications", desc: "Modern toast bildirim yönetimi" },
                                        { name: "use-Sound", type: "Audio", desc: "Etkileşimli ses efektleri (SFX)" },
                                        { name: "Canvas Confetti", type: "Visual FX", desc: "Kutlama ve ödül animasyonları" },
                                        { name: "next-pwa", type: "PWA", desc: "Progressive Web App yapılandırması" }
                                    ].map((lib, i) => (
                                        <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            <div className={`mt-1 w-2 h-2 rounded-full ${['bg-pink-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-indigo-500'][i]}`}></div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white">{lib.name}</div>
                                                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">{lib.type}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">{lib.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 7. EVALUATION */}
                <section id="evaluation" className="px-4 py-20">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-12 text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl"><BarChart3 className="h-8 w-8 text-green-600" /></div>
                            Proje Değerlendirmesi
                        </h2>

                        <div className="space-y-8">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border-l-8 border-green-500">
                                <h3 className="text-2xl font-bold text-green-600 mb-6 flex items-center gap-2">
                                    <CheckCircle2 className="h-6 w-6" />
                                    Başarı Analizi
                                </h3>
                                <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                                    Proje, modern web teknolojilerini başarıyla entegre ederek, kullanıcı alışkanlıklarını takip etmeyi eğlenceli kılan bir platform sunma hedefine ulaşmıştır. Next.js ve Firebase'in sunduğu performans ve ölçeklenebilirlik, uygulamanın akıcı bir deneyim sunmasını sağlamıştır.
                                </p>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
                                        <div className="font-bold text-green-800 dark:text-green-300">UX Başarısı</div>
                                        <div className="text-sm text-green-600 dark:text-green-400 mt-1">Akıcı animasyonlar ve seslerle zenginleştirilmiş arayüz.</div>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
                                        <div className="font-bold text-green-800 dark:text-green-300">Teknik Altyapı</div>
                                        <div className="text-sm text-green-600 dark:text-green-400 mt-1">PWA desteği ile offline-first yaklaşımı.</div>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
                                        <div className="font-bold text-green-800 dark:text-green-300">Ölçeklenebilirlik</div>
                                        <div className="text-sm text-green-600 dark:text-green-400 mt-1">Firebase ile kolay kullanıcı ve veri büyümesi.</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border-l-8 border-amber-500">
                                <h3 className="text-2xl font-bold text-amber-600 mb-6 flex items-center gap-2">
                                    <Settings className="h-6 w-6" />
                                    Gelecek İyileştirmeler / Dersler
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold flex-shrink-0">1</div>
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white">Global State Yönetimi</div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">Context API yerine Zustand veya Redux kullanılarak prop drilling azaltılabilir.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold flex-shrink-0">2</div>
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white">Test Kapsamı</div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">Unit (Jest) ve E2E (Cypress) testleri eklenerek kod güvenilirliği artırılabilir.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold flex-shrink-0">3</div>
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white">Sosyal Özellikler</div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">Arkadaş ekleme ve liderlik tablosu (Leaderboard) gibi özelliklerle rekabet unsuru eklenebilir.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 8. REFERENCES */}
                <section id="references" className="px-4 py-20 bg-white/50 dark:bg-slate-900/50">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-12 text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl"><Database className="h-8 w-8 text-slate-600 dark:text-slate-300" /></div>
                            Kaynaklar
                        </h2>

                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-lg">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="font-bold text-lg mb-4 text-purple-600 border-b pb-2">Dokümantasyon</h4>
                                    <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                                        <li><a href="https://nextjs.org/docs" className="hover:text-purple-600 underline decoration-dotted">• Next.js Documentation</a> (2024)</li>
                                        <li><a href="https://react.dev" className="hover:text-purple-600 underline decoration-dotted">• React Official Docs</a> (2024)</li>
                                        <li><a href="https://firebase.google.com/docs" className="hover:text-purple-600 underline decoration-dotted">• Firebase Documentation</a> (2024)</li>
                                        <li><a href="https://tailwindcss.com/docs" className="hover:text-purple-600 underline decoration-dotted">• Tailwind CSS Docs</a> (2024)</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg mb-4 text-blue-600 border-b pb-2">Akademik & Literatür</h4>
                                    <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                                        <li>• Deterding, S. et al. (2011). <em>"Gamification: Toward a Definition"</em>. CHI 2011.</li>
                                        <li>• Fogg, B.J. (2009). <em>"A Behavior Model for Persuasive Design"</em>.</li>
                                        <li>• Clear, James. (2018). <em>Atomic Habits</em>. Avery.</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="mt-8 text-center text-xs text-slate-400">
                                Son erişim tarihi: Aralık 2024
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-slate-200 px-4 py-12 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="mx-auto max-w-6xl">
                        <div className="text-center space-y-4">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
                                    <Trophy className="h-6 w-6 text-white" />
                                </div>
                                <span className="font-bold text-xl text-slate-900 dark:text-white">Day by Day</span>
                            </div>

                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                © 2025 Day by Day - Üniversite Dönem Projesi Akademik Sunumu
                            </p>

                            <p className="text-xs text-slate-500">
                                Made with ❤️ using Next.js 16, TypeScript, Tailwind CSS & Firebase
                            </p>

                            <div className="flex justify-center gap-6 mt-8">
                                <Link href="/" className="px-6 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full text-sm font-medium transition-colors">
                                    Uygulamayı Dene
                                </Link>
                                <button
                                    onClick={() => scrollToSection("overview")}
                                    className="px-6 py-2 border border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 rounded-full text-sm font-medium transition-colors"
                                >
                                    Yukarı Çık
                                </button>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
