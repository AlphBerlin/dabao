"use client"

import React, { useCallback, useEffect, useState } from 'react'
import { Input } from '@workspace/ui/components/input'

interface ColorPickerProps {
  color: string
  onChange: (value: string) => void
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(color)

  // Update input value when color prop changes
  useEffect(() => {
    setInputValue(color)
  }, [color])

  // Only call onChange when the value is a valid hex color
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setInputValue(value)

      if (/^#[0-9A-F]{6}$/i.test(value)) {
        onChange(value)
      }
    },
    [onChange]
  )

  // Handle color picker change
  const handleColorPickerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setInputValue(value)
      onChange(value)
    },
    [onChange]
  )

  return (
    <div className="flex gap-2 items-center">
      <div 
        className="h-10 w-10 rounded-md border border-input flex items-center justify-center overflow-hidden" 
        style={{ backgroundColor: inputValue }}
      >
        <input 
          type="color" 
          value={inputValue}
          onChange={handleColorPickerChange}
          className="opacity-0 w-10 h-10 cursor-pointer"
          aria-label="Select color"
        />
      </div>
      <Input
        value={inputValue}
        onChange={handleChange}
        className="w-full font-mono"
        placeholder="#FFFFFF"
      />
    </div>
  )
}