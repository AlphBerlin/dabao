"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { Input } from "@workspace/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@workspace/ui/components/accordion"
import { toast } from "sonner"
import { getUserSettings, updateUserSettings, updatePassword, UserSettings } from "@/lib/api/user-settings"
import { getProjects, Project, updateProjectSettings } from "@/lib/api/project"
import { Loader2 } from "lucide-react"

export function AccountSettingsForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<UserSettings>({
    language: 'en',
    currency: 'usd',
    notifications: {
      marketing: true,
      orderUpdates: true,
      loyaltyUpdates: true,
      pushNotifications: true,
    }
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  
  const [passwordError, setPasswordError] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProject, setActiveProject] = useState<string>('')

  useEffect(() => {
    // Load user settings and projects when component mounts
    const loadData = async () => {
      try {
        const userSettings = await getUserSettings()
        setSettings(userSettings)
        
        const userProjects = await getProjects()
        setProjects(userProjects)
        if (userProjects.length > 0) {
          setActiveProject(userProjects[0].id)
        }
      } catch (error) {
        toast.error("Failed to load your settings")
      }
    }
    
    loadData()
  }, [])
  
  const handleSettingsChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setSettings({
        ...settings,
        [parent]: {
          ...settings[parent as keyof UserSettings] as Record<string, any>,
          [child]: value
        }
      })
    } else {
      setSettings({
        ...settings,
        [field]: value
      })
    }
  }
  
  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData({
      ...passwordData,
      [field]: value
    })
    
    if (field === 'confirmPassword' || field === 'newPassword') {
      if (passwordData.newPassword !== value && field === 'confirmPassword') {
        setPasswordError("Passwords don't match")
      } else if (passwordData.confirmPassword !== value && field === 'newPassword') {
        setPasswordError("Passwords don't match")
      } else {
        setPasswordError('')
      }
    }
  }
  
  const handleProjectChange = (projectId: string) => {
    setActiveProject(projectId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Update account settings
      await updateUserSettings(settings)
      
      // If password fields are filled, update password too
      if (passwordData.currentPassword && passwordData.newPassword) {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          toast.error("Passwords don't match")
          setIsLoading(false)
          return
        }
        
        await updatePassword(passwordData.currentPassword, passwordData.newPassword)
        
        // Clear password fields after successful update
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
      
      // If project is selected, update project settings
      if (activeProject) {
        const currentProject = projects.find(project => project.id === activeProject)
        if (currentProject) {
          await updateProjectSettings(activeProject, currentProject.settings)
        }
      }
      
      toast.success("Settings updated successfully")
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Failed to update settings")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-none shadow-lg">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="language-region" className="border-none">
                <AccordionTrigger className="py-4 px-0">
                  <h3 className="text-lg font-medium text-tn-blue">Language & Region</h3>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select 
                        value={settings.language} 
                        onValueChange={(value) => handleSettingsChange('language', value)}
                      >
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
                      <Select 
                        value={settings.currency} 
                        onValueChange={(value) => handleSettingsChange('currency', value)}
                      >
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
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="communications" className="border-none">
                <AccordionTrigger className="py-4 px-0">
                  <h3 className="text-lg font-medium text-tn-blue">Communication Preferences</h3>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="marketing-emails" className="block mb-1">
                          Marketing Emails
                        </Label>
                        <p className="text-sm text-mid-gray">Receive emails about new products and promotions</p>
                      </div>
                      <Switch 
                        id="marketing-emails" 
                        checked={settings.notifications.marketing}
                        onCheckedChange={(checked) => handleSettingsChange('notifications.marketing', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="order-updates" className="block mb-1">
                          Order Updates
                        </Label>
                        <p className="text-sm text-mid-gray">Receive emails about your orders</p>
                      </div>
                      <Switch 
                        id="order-updates" 
                        checked={settings.notifications.orderUpdates}
                        onCheckedChange={(checked) => handleSettingsChange('notifications.orderUpdates', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="loyalty-updates" className="block mb-1">
                          Loyalty Program Updates
                        </Label>
                        <p className="text-sm text-mid-gray">Receive emails about points, rewards, and special offers</p>
                      </div>
                      <Switch 
                        id="loyalty-updates" 
                        checked={settings.notifications.loyaltyUpdates}
                        onCheckedChange={(checked) => handleSettingsChange('notifications.loyaltyUpdates', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="push-notifications" className="block mb-1">
                          Push Notifications
                        </Label>
                        <p className="text-sm text-mid-gray">Enable or disable all push notifications</p>
                      </div>
                      <Switch 
                        id="push-notifications" 
                        checked={settings.notifications.pushNotifications}
                        onCheckedChange={(checked) => handleSettingsChange('notifications.pushNotifications', checked)}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="project-settings" className="border-none">
                <AccordionTrigger className="py-4 px-0">
                  <h3 className="text-lg font-medium text-tn-blue">Project Settings</h3>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  {projects.length > 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="project">Select Project</Label>
                        <Select 
                          value={activeProject} 
                          onValueChange={handleProjectChange}
                        >
                          <SelectTrigger id="project">
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map(project => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {activeProject && (
                        <div className="space-y-4 pt-4">
                          {projects.find(p => p.id === activeProject) && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="points-name">Points Name</Label>
                                <Input 
                                  id="points-name" 
                                  value={projects.find(p => p.id === activeProject)?.settings.pointsName || 'Points'}
                                  onChange={(e) => {
                                    const updatedProjects = projects.map(p => {
                                      if (p.id === activeProject) {
                                        return {
                                          ...p,
                                          settings: {
                                            ...p.settings,
                                            pointsName: e.target.value
                                          }
                                        };
                                      }
                                      return p;
                                    });
                                    setProjects(updatedProjects);
                                  }}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="primary-color">Primary Color</Label>
                                <div className="flex items-center gap-2">
                                  <Input 
                                    id="primary-color"
                                    type="color"
                                    className="w-12 h-10 p-1 cursor-pointer"
                                    value={projects.find(p => p.id === activeProject)?.settings.primaryColor || '#000000'}
                                    onChange={(e) => {
                                      const updatedProjects = projects.map(p => {
                                        if (p.id === activeProject) {
                                          return {
                                            ...p,
                                            settings: {
                                              primaryColor: e.target.value
                                            }
                                          };
                                        }
                                        return p;
                                      });
                                      setProjects(updatedProjects);
                                    }}
                                  />
                                  <Input 
                                    value={projects.find(p => p.id === activeProject)?.settings.primaryColor || '#000000'}
                                    onChange={(e) => {
                                      const updatedProjects = projects.map(p => {
                                        if (p.id === activeProject) {
                                          return {
                                            ...p,
                                            settings: {
                                              primaryColor: e.target.value
                                            }
                                          };
                                        }
                                        return p;
                                      });
                                      setProjects(updatedProjects);
                                    }}
                                  />
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label htmlFor="referral-enabled" className="block mb-1">
                                    Enable Referral Program
                                  </Label>
                                  <p className="text-sm text-mid-gray">Allow users to earn points by referring others</p>
                                </div>
                                <Switch 
                                  id="referral-enabled" 
                                  checked={projects.find(p => p.id === activeProject)?.settings.referralEnabled || false}
                                  onCheckedChange={(checked) => {
                                    const updatedProjects = projects.map(p => {
                                      if (p.id === activeProject) {
                                        return {
                                          ...p,
                                          settings: {
                                            referralEnabled: checked
                                          }
                                        };
                                      }
                                      return p;
                                    });
                                    setProjects(updatedProjects);
                                  }}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-mid-gray">
                      <p>No projects available</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="password" className="border-none">
                <AccordionTrigger className="py-4 px-0">
                  <h3 className="text-lg font-medium text-tn-blue">Change Password</h3>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input 
                        id="current-password" 
                        type="password" 
                        value={passwordData.currentPassword}
                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input 
                        id="new-password" 
                        type="password" 
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input 
                        id="confirm-password" 
                        type="password" 
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      />
                      {passwordError && <p className="text-sm text-red-500 mt-1">{passwordError}</p>}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex justify-end gap-3 pt-4">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  type="submit"
                  className="bg-accent-teal hover:bg-accent-teal/90 text-white"
                  disabled={isLoading || !!passwordError}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : "Save Changes"}
                </Button>
              </motion.div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
