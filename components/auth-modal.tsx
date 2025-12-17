"use client";

import React, { useState } from "react";
import {
  EmailAuthProvider,
  linkWithCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../lib/firebase";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AuthModal({ open, onClose }: Props) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleRegister = async () => {
    setError(null);
    if (!email || !password) return setError("E-posta ve şifre gerekli.");
    setLoading(true);
    try {
      const current = auth.currentUser;

      if (current && current.isAnonymous) {
        const credential = EmailAuthProvider.credential(email, password);
        await linkWithCredential(current, credential);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }

      setEmail("");
      setPassword("");
      onClose();
    } catch (err: any) {
      const code = err?.code ?? err?.message ?? "unknown";
      setError(code);
      console.error("Register error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) return setError("E-posta ve şifre gerekli.");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail("");
      setPassword("");
      onClose();
    } catch (err: any) {
      const code = err?.code ?? err?.message ?? "unknown";
      setError(code);
      console.error("Login error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          if (!loading) onClose();
        }}
      />

      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Hesap</h3>
          <button
            onClick={() => !loading && onClose()}
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            Kapat
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
              mode === "register"
                ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
            onClick={() => setMode("register")}
          >
            Kayıt Ol
          </button>
          <button
            className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
              mode === "login"
                ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
            onClick={() => setMode("login")}
          >
            Giriş Yap
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium">E-posta</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none ring-0 focus:border-purple-400"
              placeholder="you@ornek.com"
              type="email"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Şifre</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none ring-0 focus:border-purple-400"
              placeholder="Güçlü bir şifre"
              type="password"
            />
          </div>

          {error && (
            <div className="text-sm text-red-500">Hata: {String(error)}</div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={mode === "login" ? handleLogin : handleRegister}
              disabled={loading}
              className="rounded-full bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading
                ? "Bekleyin..."
                : mode === "login"
                ? "Giriş Yap"
                : "Hesap Oluştur"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
