"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import LoginForm from "../components/auth/login-form"
import RegisterForm from "../components/auth/register-form"
import { Button } from "../components/ui/button"
import { useAuthStore } from "@/components/context/authStore"
import ParticlesBackground from "@/components/particles"
import { useThemeStore } from "@/components/theme-store"


export default function AuthRoute() {
    const theme = useThemeStore((s) => s.theme);
  const [isLogin, setIsLogin] = useState(true);
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  const navigate = useNavigate();

  // Redirect if already signed in
  useEffect(() => {
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  // Don't render the form until we've checked authentication
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If user is authenticated, don't render anything (will be redirected)
  if (user) {
    return null;
  }

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {theme === "dark" && (
        <ParticlesBackground className="fixed inset-0 w-full h-full z-[-1]" />
      )}
      {theme === "light" && (
        <ParticlesBackground
          area={300}
          className="fixed inset-0 w-full h-full z-[-1]"
        />
      )}
      <div className="w-full max-w-md space-y-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-16 h-16 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-900 rounded-full w-12 h-12 flex items-center justify-center">
                <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-8 h-8"></div>
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isLogin
              ? "Sign in to access the latest medical research"
              : "Join our community of medical professionals and researchers"}
          </p>
        </motion.div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden ">
          <div className="flex">
            <Button
              variant="ghost"
              className={`flex-1 py-4 rounded-none border-b-2 transition-all ${
                isLogin
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                  : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              onClick={() => setIsLogin(true)}
            >
              Sign In
            </Button>
            <Button
              variant="ghost"
              className={`flex-1 py-4 rounded-none border-b-2 transition-all ${
                !isLogin
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                  : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </Button>
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <LoginForm />
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <RegisterForm />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <p className="text-sm text-muted-foreground">
            By continuing, you agree to our{" "}
            <a
              href="#"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Privacy Policy
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}