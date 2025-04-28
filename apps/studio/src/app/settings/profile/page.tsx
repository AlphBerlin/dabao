"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Camera, Mail, Key, Globe, Bell, Shield, Trash2 } from "lucide-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Label } from "@workspace/ui/components/label"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { Switch } from "@workspace/ui/components/switch"
import { MainLayout } from "@/components/layout/MainLayout"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    company: "Acme Inc.",
    website: "https://example.com",
    bio: "Senior Product Manager with a passion for customer loyalty and engagement.",
    notifications: {
      email: true,
      push: true,
      updates: true,
      marketing: false,
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNotificationToggle = (key: keyof typeof formData.notifications) => {
    setFormData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }))
  }

  const handleSave = () => {
    setIsEditing(false)
    // Save changes to backend
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Profile Settings</h1>
              <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                Manage your account information and preferences
              </p>
            </div>

            {isEditing ? (
              <div className="flex space-x-3">
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </div>

          {/* Profile Information */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-start">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src="https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                      alt="User Profile"
                    />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors">
                      <Camera size={16} />
                    </button>
                  )}
                </div>

                <div className="ml-6 flex-1">
                  <div className="flex items-center mb-4">
                    <Badge className="mr-2">Admin</Badge>
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      Verified
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="mb-1">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <Label htmlFor="bio" className="mb-1">
                        Bio
                      </Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        disabled={!isEditing}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company" className="mb-1">
                          Company
                        </Label>
                        <Input
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div>
                        <Label htmlFor="website" className="mb-1">
                          Website
                        </Label>
                        <Input
                          id="website"
                          name="website"
                          value={formData.website}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">Contact Information</h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                      <Mail size={20} className="text-primary" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">{formData.email}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Primary Email</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    Verified
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg">
                      <Globe size={20} className="text-secondary-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">{formData.website}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Website</p>
                    </div>
                  </div>
                  {isEditing && (
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">Notification Preferences</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                      <Bell size={20} className="text-yellow-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">Email Notifications</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Receive updates via email</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.notifications.email}
                    onCheckedChange={() => handleNotificationToggle("email")}
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                      <Bell size={20} className="text-yellow-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">Push Notifications</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Receive push notifications</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.notifications.push}
                    onCheckedChange={() => handleNotificationToggle("push")}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">Security</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <Key size={20} className="text-red-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">Password</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Last changed 3 months ago</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Change Password
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <Shield size={20} className="text-red-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">Two-Factor Authentication</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Not enabled</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable 2FA
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-6">Danger Zone</h2>

              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <Trash2 size={20} className="text-red-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">Delete Account</p>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  )
}
