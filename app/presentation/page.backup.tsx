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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Fixed Navigation Bar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg shadow-sm dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
                                <Trophy className="h-6 w-6 text-white" />
                            </div>
                            <span className="font-bold text-lg text-slate-900 dark:text-white">Day by Day</span>
                        </div>

                        <div className="hidden lg:flex items-center gap-1">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${activeSection === section.id
                                            ? "bg-purple-600 text-white"
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
                            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
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
                                className="lg:hidden border-t border-slate-200 dark:border-slate-800"
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
                <section id="overview" className="px-4 py-20">
                    <div className="mx-auto max-w-6xl">
                        <div className="text-center">
                            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-2xl">
                                <Trophy className="h-12 w-12 text-white" />
                            </div>
                            <h1 className="mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-6xl font-black text-transparent">
                                Day by Day
                            </h1>
                            <p className="mb-8 text-xl text-slate-600 dark:text-slate-300">
                                Gamification Tabanlı Alışkanlık Takip Uygulaması
                            </p>
                            <Link href="/">
                                <button className="group flex items-center gap-2 mx-auto rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:scale-105">
                                    Uygulamayı Deneyin
                                    <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                                </button>
                            </Link>

                            <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
                                {[
                                    { value: "8+", label: "Ana Özellik", color: "purple" },
                                    { value: "10+", label: "Rozet Türü", color: "blue" },
                                    { value: "PWA", label: "Mobil Destek", color: "pink" },
                                    { value: "100%", label: "Responsive", color: "amber" }
                                ].map((stat, i) => (
                                    <div key={i} className="rounded-2xl bg-white/50 p-6 backdrop-blur dark:bg-slate-900/50">
                                        <div className={`text-4xl font-black text-${stat.color}-600`}>{stat.value}</div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. CONTEXT - Add full context section here */}
                <section id="context" className="px-4 py-20 bg-white/50 dark:bg-slate-900/50">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-8 text-4xl font-bold text-slate-900 dark:text-white">
                            📊 Bağlam bölümünü buraya ekleyin (PRESENTATION_SECTIONS.md'den)
                        </h2>
                    </div>
                </section>

                {/* 3. FUNCTIONAL */}
                <section id="functional" className="px-4 py-20">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-8 text-4xl font-bold text-slate-900 dark:text-white">
                            📋 İşlevsel gereksinimler bölümünü buraya ekleyin
                        </h2>
                    </div>
                </section>

                {/* 4. NON-FUNCTIONAL */}
                <section id="non-functional" className="px-4 py-20 bg-white/50 dark:bg-slate-900/50">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-8 text-4xl font-bold text-slate-900 dark:text-white">
                            ⚙️ Fonksiyonel olmayan gereksinimler buraya
                        </h2>
                    </div>
                </section>

                {/* 5. ARCHITECTURE */}
                <section id="architecture" className="px-4 py-20">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-8 text-4xl font-bold text-slate-900 dark:text-white">
                            🏗️ Mimari bölümünü buraya ekleyin
                        </h2>
                    </div>
                </section>

                {/* 6. TECH STACK */}
                <section id="tech" className="px-4 py-20 bg-white/50 dark:bg-slate-900/50">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-8 text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <Code className="h-10 w-10 text-purple-600" />
                            Teknolojik Altyapı
                        </h2>

                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-lg">
                                <h3 className="text-2xl font-bold text-purple-600 mb-6">Temel Teknolojiler</h3>

                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-black text-white rounded-xl p-6 text-center">
                                        <div className="text-3xl font-bold mb-2">Next.js 16</div>
                                        <div className="text-sm opacity-80">React Framework</div>
                                        <ul className="mt-4 text-xs space-y-1 text-left">
                                            <li>• App Router</li>
                                            <li>• Server Components</li>
                                            <li>• API Routes</li>
                                        </ul>
                                    </div>

                                    <div className="bg-blue-600 text-white rounded-xl p-6 text-center">
                                        <div className="text-3xl font-bold mb-2">TypeScript</div>
                                        <div className="text-sm opacity-80">Type Safety</div>
                                        <ul className="mt-4 text-xs space-y-1 text-left">
                                            <li>• Strong typing</li>
                                            <li>• Type inference</li>
                                        </ul>
                                    </div>

                                    <div className="bg-cyan-500 text-white rounded-xl p-6 text-center">
                                        <div className="text-3xl font-bold mb-2">Tailwind</div>
                                        <div className="text-sm opacity-80">CSS Framework</div>
                                        <ul className="mt-4 text-xs space-y-1 text-left">
                                            <li>• Utility-first</li>
                                            <li>• Dark mode</li>
                                        </ul>
                                    </div>

                                    <div className="bg-orange-500 text-white rounded-xl p-6 text-center">
                                        <div className="text-3xl font-bold mb-2">Firebase</div>
                                        <div className="text-sm opacity-80">Backend</div>
                                        <ul className="mt-4 text-xs space-y-1 text-left">
                                            <li>• Firestore</li>
                                            <li>• Auth</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 7. EVALUATION */}
                <section id="evaluation" className="px-4 py-20">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-8 text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <BarChart3 className="h-10 w-10 text-purple-600" />
                            Proje Değerlendirme
                        </h2>

                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-lg">
                            <h3 className="text-2xl font-bold text-green-600 mb-4">✅ Başarılı Yönler</h3>
                            <p className="text-slate-600 dark:text-slate-300">
                                Evaluation bölümünü buraya ekleyin...
                            </p>
                        </div>
                    </div>
                </section>

                {/* 8. REFERENCES */}
                <section id="references" className="px-4 py-20 bg-white/50 dark:bg-slate-900/50">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-8 text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <Database className="h-10 w-10 text-purple-600" />
                            Kaynaklar
                        </h2>

                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-lg">
                            <h3 className="text-xl font-bold text-purple-600 mb-4">📚 Resmi Dokümantasyonlar</h3>
                            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                <li>• Next.js Documentation. (2024). Next.js 16 Official Docs. https://nextjs.org/docs</li>
                                <li>• React Team. (2024). React Documentation. https://react.dev</li>
                                <li>• Firebase. (2024). Firebase Documentation. https://firebase.google.com/docs</li>
                            </ul>
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
                                © 2025 Day by Day - Dönem Projesi Akademik Sunumu
                            </p>

                            <p className="text-xs text-slate-500">
                                Made with ❤️ using Next.js, TypeScript, Tailwind CSS & Firebase
                            </p>

                            <div className="flex justify-center gap-6 mt-6">
                                <Link href="/" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                                    Uygulamayı Dene
                                </Link>
                                <button
                                    onClick={() => scrollToSection("overview")}
                                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-purple-600"
                                >
                                    Başa Dön
                                </button>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
