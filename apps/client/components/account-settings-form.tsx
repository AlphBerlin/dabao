"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Input } from "@workspace/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"

export function AccountSettingsForm() {
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
        <Tabs defaultValue="preferences">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="preferences">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-tn-blue">Language & Region</h3>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select defaultValue="usd">
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usd">USD ($)</SelectItem>
                        <SelectItem value="eur">EUR (€)</SelectItem>
                        <SelectItem value="gbp">GBP (£)</SelectItem>
                        <SelectItem value="jpy">JPY (¥)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium text-tn-blue">Communication Preferences</h3>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketing-emails" className="block mb-1">
                        Marketing Emails
                      </Label>
                      <p className="text-sm text-mid-gray">Receive emails about new products and promotions</p>
                    </div>
                    <Switch id="marketing-emails" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="order-updates" className="block mb-1">
                        Order Updates
                      </Label>
                      <p className="text-sm text-mid-gray">Receive emails about your orders</p>
                    </div>
                    <Switch id="order-updates" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="loyalty-updates" className="block mb-1">
                        Loyalty Program Updates
                      </Label>
                      <p className="text-sm text-mid-gray">Receive emails about points, rewards, and special offers</p>
                    </div>
                    <Switch id="loyalty-updates" defaultChecked />
                  </div>
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
          </TabsContent>

          <TabsContent value="notifications">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-tn-blue">Push Notifications</h3>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-all" className="block mb-1">
                        All Notifications
                      </Label>
                      <p className="text-sm text-mid-gray">Enable or disable all push notifications</p>
                    </div>
                    <Switch id="push-all" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-points" className="block mb-1">
                        Points Updates
                      </Label>
                      <p className="text-sm text-mid-gray">Get notified when you earn or redeem points</p>
                    </div>
                    <Switch id="push-points" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-rewards" className="block mb-1">
                        New Rewards
                      </Label>
                      <p className="text-sm text-mid-gray">Get notified when new rewards are available</p>
                    </div>
                    <Switch id="push-rewards" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-orders" className="block mb-1">
                        Order Status
                      </Label>
                      <p className="text-sm text-mid-gray">Get notified about order updates</p>
                    </div>
                    <Switch id="push-orders" defaultChecked />
                  </div>
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
          </TabsContent>

          <TabsContent value="security">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-tn-blue">Change Password</h3>

                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium text-tn-blue">Two-Factor Authentication</h3>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="two-factor" className="block mb-1">
                        Enable Two-Factor Authentication
                      </Label>
                      <p className="text-sm text-mid-gray">Add an extra layer of security to your account</p>
                    </div>
                    <Switch id="two-factor" />
                  </div>
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
