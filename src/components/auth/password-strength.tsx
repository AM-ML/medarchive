"use client"

import { motion } from "framer-motion"

interface PasswordStrengthProps {
  password: string
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const requirements = [
    { label: "At least 8 characters", test: (pwd: string) => pwd.length >= 8 },
    { label: "One uppercase letter", test: (pwd: string) => /[A-Z]/.test(pwd) },
    { label: "One lowercase letter", test: (pwd: string) => /[a-z]/.test(pwd) },
    { label: "One number", test: (pwd: string) => /[0-9]/.test(pwd) },
    { label: "One special character", test: (pwd: string) => /[^A-Za-z0-9]/.test(pwd) },
  ]

  const getStrength = () => {
    return requirements.filter((req) => req.test(password)).length
  }

  const strength = getStrength()

  const getStrengthColor = () => {
    if (strength <= 2) return "bg-red-500"
    if (strength <= 3) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStrengthText = () => {
    if (strength <= 2) return "Weak"
    if (strength <= 3) return "Medium"
    return "Strong"
  }

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Password strength</span>
          <span
            className={`text-sm font-medium ${strength <= 2 ? "text-red-500" : strength <= 3 ? "text-yellow-500" : "text-green-500"}`}
          >
            {getStrengthText()}
          </span>
        </div>
        <div className="flex space-x-1">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < strength ? getStrengthColor() : "bg-gray-200 dark:bg-gray-700"
              }`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
            />
          ))}
        </div>
      </div>
      <div className="space-y-1">
        {requirements.map((req, index) => (
          <motion.div
            key={index}
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <div
              className={`w-3 h-3 rounded-full flex items-center justify-center ${
                req.test(password) ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              {req.test(password) && (
                <motion.svg
                  className="w-2 h-2 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </motion.svg>
              )}
            </div>
            <span
              className={`text-xs ${
                req.test(password) ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
              }`}
            >
              {req.label}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}