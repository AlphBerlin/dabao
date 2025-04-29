"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Upload } from "lucide-react"

export function ProfileSettingsForm() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
    }, 1500)
  }

  return (
    <Card className="border-none shadow-lg">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 pb-6 border-b">
              <div className="relative">
                <Avatar className="h-24 w-24 border-2 border-accent-teal">
                  <AvatarImage src="/placeholder.svg?height=96&width=96" alt="Profile" />
                  <AvatarFallback className="text-2xl bg-accent-teal text-white">JD</AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
                >
                  <Upload className="h-4 w-4" />
                  <span className="sr-only">Upload avatar</span>
                </Button>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-medium text-tn-blue mb-1">Profile Picture</h3>
                <p className="text-sm text-mid-gray mb-3">Upload a new profile picture</p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <Button type="button" size="sm" variant="outline">
                    Upload Image
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="text-red-500 hover:text-red-600">
                    Remove
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" defaultValue="Jordan" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" defaultValue="Doe" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue="jordan.doe@example.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" defaultValue="123 Main Street, Apt 4B&#10;New York, NY 10001" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthdate">Date of Birth</Label>
              <Input id="birthdate" type="date" defaultValue="1990-01-15" />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline">
                Cancel
              </Button>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  type="submit"
                  className="bg-accent-teal hover:bg-accent-teal/90 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </motion.div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
