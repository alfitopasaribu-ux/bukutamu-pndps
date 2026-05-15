"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Shield, Scale, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { loginSchema, LoginFormData } from "@/lib/validations";
import LoginParticles from "../LoginParticles";


export default function LoginPage() {

  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message || "Login gagal");
        return;
      }

      toast.success(`Selamat datang, ${result.user.name}!`);
      router.push("/admin");
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(
            135deg,
            rgba(26, 47, 110, 0.92) 0%,
            rgba(15, 28, 70, 0.95) 50%,
            rgba(10, 20, 50, 0.97) 100%
          ), url('/gedung-pn.jpg')`,
        }}
      />

      {/* Animated particles (client-only to avoid hydration mismatch) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" suppressHydrationWarning>
        <LoginParticles />
      </div>



      {/* Decorative lines */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-60" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-60" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-8"
        >
          {/* Logo area */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Scale className="w-14 h-14 text-yellow-400 drop-shadow-lg" />
            </motion.div>
            <div className="h-16 w-px bg-gradient-to-b from-transparent via-yellow-400/50 to-transparent" />
            <div className="text-left">
              <p className="text-yellow-400/80 text-xs font-mono tracking-widest uppercase mb-1">
                Sistem Digital
              </p>
              <h1 className="font-display text-white text-2xl font-bold leading-tight">
                Pengadilan Negeri
              </h1>
              <h2 className="font-display text-yellow-400 text-2xl font-bold leading-tight">
                Denpasar
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-yellow-400/50" />
            <p className="text-white/50 text-sm tracking-widest font-mono uppercase">
              PTSP Admin Portal
            </p>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-yellow-400/50" />
          </div>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 via-yellow-400/20 to-blue-600/30 rounded-2xl blur-xl" />

            <div className="relative backdrop-blur-xl bg-white/[0.07] border border-white/10 rounded-2xl p-8 shadow-2xl">
              {/* Card header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-400/20">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg font-display">
                    Masuk ke Sistem
                  </h3>
                  <p className="text-white/40 text-xs">
                    Buku Tamu Digital — Versi 3.0
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Username field */}
                <div className="space-y-1.5">
                  <label className="text-white/60 text-xs font-medium tracking-wider uppercase">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      {...register("username")}
                      type="text"
                      autoComplete="username"
                      placeholder="Masukkan username"
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all"
                    />
                  </div>
                  <AnimatePresence>
                    {errors.username && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-1.5 text-red-400 text-xs"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {errors.username.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Password field */}
                <div className="space-y-1.5">
                  <label className="text-white/60 text-xs font-medium tracking-wider uppercase">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Masukkan password"
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-1.5 text-red-400 text-xs"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {errors.password.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Submit button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full relative overflow-hidden rounded-xl py-3.5 font-semibold text-sm tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #1a4fd6 0%, #2d6aff 100%)",
                    boxShadow: "0 4px 24px rgba(45, 106, 255, 0.4)",
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 text-white">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Memverifikasi...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Masuk ke Sistem
                      </>
                    )}
                  </span>
                  {!isLoading && (
                    <motion.div
                      className="absolute inset-0 bg-white/10"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.4 }}
                    />
                  )}
                </motion.button>
              </form>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <p className="text-white/25 text-xs">
                  © 2026 Pengadilan Negeri Denpasar
                </p>
                <p className="text-white/15 text-xs mt-0.5 font-mono">
                  Direktorat Jenderal Badan Peradilan Umum
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 flex items-center gap-2 text-white/20 text-xs font-mono"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Sistema Buku Tamu Digital v3.0 — Enterprise Edition
        </motion.div>
      </div>
    </div>
  );
}