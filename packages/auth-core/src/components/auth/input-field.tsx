"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@workspace/ui/lib/utils"

type InputFieldProps = {
  label: string
  name: string
  type?: string
  placeholder?: string
  required?: boolean
  error?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
}

export function InputField({
  label,
  name,
  type = "text",
  placeholder,
  required = false,
  error,
  value,
  onChange,
  className,
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <motion.div
      className={cn("mb-4 relative", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.label
        htmlFor={name}
        className={cn(
          "block text-sm font-medium transition-all duration-200 mb-1",
          isFocused ? "text-primary" : "text-foreground/80",
          error ? "text-destructive" : "",
        )}
        animate={{
          y: isFocused ? -2 : 0,
          scale: isFocused ? 1.02 : 1,
        }}
      >
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </motion.label>

      <motion.div
        className="relative"
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "w-full px-4 py-2 rounded-lg border bg-background transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary/50",
            error ? "border-destructive focus:ring-destructive/40" : "border-input hover:border-primary/50",
            isFocused ? "border-primary shadow-sm" : "",
          )}
        />

        {isFocused && (
          <motion.span
            className="absolute bottom-0 left-0 h-0.5 bg-primary rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>

      {error && (
        <motion.p
          className="text-destructive text-sm mt-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  )
}
