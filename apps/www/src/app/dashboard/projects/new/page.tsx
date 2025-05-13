"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { MainLayout } from "@/components/layout/MainLayout"
import { toast } from "sonner"
import { ColorPicker } from "@workspace/ui/components/ColorPicker"
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Switch } from "@workspace/ui/components/switch"
import { Spinner } from "@workspace/ui/components/Spinner"
import { 
  CheckCircle2, 
  DollarSign, 
  GiftIcon, 
  Palette, 
  Settings, 
  Share2, 
  Trophy 
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"

export default function NewProjectPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeAccordion, setActiveAccordion] = useState("basics")
  
  const [formData, setFormData] = useState({
    // Basic info
    name: "",
    domain: "",
    description: "",
    projectType: "REWARDS", // Default to REWARDS
    
    // Theme settings
    theme: {
      primaryColor: "#6366F1", // Default indigo
      secondaryColor: "#EC4899", // Default pink
      borderRadius: "rounded",
      fontSize: "base",
    },
    
    // Reward preferences
    preferences: {
      pointsName: "Points",
      pointsAbbreviation: "pts",
      welcomeMessage: "",
      defaultCurrency: "USD",
      enableReferrals: true,
      enableTiers: false,
      enableGameification: false,
      rewardSystemType: "POINTS", // Default reward system type
      pointsCollectionMechanism: "TEN_PERCENT", // Default to 20% of purchase
      // customPointsRatio: 1.0,
    },
  })

  const handleChange = (e:any) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleThemeChange = (key:string, value:any) => {
    setFormData((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        [key]: value,
      },
    }))
  }

  const handlePreferenceChange = (key:string, value:any) => {
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }))
  }

  const handleAccordionChange = (value:string) => {
    // Update welcome message if empty and opening rewards section
    if (value === "rewards" && !formData.preferences.welcomeMessage && formData.name) {
      setFormData((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          welcomeMessage: `Welcome to ${formData.name}!`,
        },
      }))
    }
    
    setActiveAccordion(value)
  }

  const handleSubmit = async (e:any) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error("Project name is required")
      setActiveAccordion("basics")
      return
    }
    
    try {
      setIsSubmitting(true)
      
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create project")
      }
      
      toast.success("Project created successfully")
      
      // Redirect to the new project dashboard
      router.push(`/dashboard/projects/${data.project.id}`)
    } catch (error) {
      console.error("Error creating project:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create your project. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-4 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Create New Project</h1>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim()}
            className="flex items-center gap-2"
          >
            {isSubmitting ? <Spinner size="sm" /> : <CheckCircle2 className="h-4 w-4" />}
            Create Project
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Setup</CardTitle>
            <CardDescription>
              Let's set up your new loyalty program. Fill in the basic information to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Accordion 
                type="single" 
                collapsible 
                value={activeAccordion} 
                onValueChange={handleAccordionChange}
                className="w-full"
              >
                {/* Basics Section */}
                <AccordionItem value="basics">
                  <AccordionTrigger className="flex items-center">
                    <div className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" /> 
                      <span>Basic Information</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Project Name*</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Coffee Rewards, Book Club Points, etc."
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        This is what your customers will see when they interact with your loyalty program.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="projectType">Project Type</Label>
                      <RadioGroup
                        value={formData.projectType || "REWARDS"}
                        onValueChange={(value) => handleChange({ target: { name: "projectType", value } })}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="REWARDS" id="type-rewards" />
                          <Label htmlFor="type-rewards">Rewards</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="LOYALTY" id="type-loyalty" disabled={true} />
                          <Label htmlFor="type-loyalty">Loyalty (coming soon)</Label>
                        </div>
                      </RadioGroup>
                      <p className="text-xs text-muted-foreground">
                        Choose whether this is primarily a rewards program or a loyalty program.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="domain">Domain (Optional)</Label>
                      <Input
                        id="domain"
                        name="domain"
                        placeholder="rewards.yourbusiness.com"
                        value={formData.domain}
                        onChange={handleChange}
                      />
                      <p className="text-xs text-muted-foreground">
                        This will be the URL where your customers can access their loyalty program.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Describe your loyalty program..."
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        Help your team understand the purpose of this loyalty program.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Branding Section */}
                <AccordionItem value="branding">
                  <AccordionTrigger className="flex items-center">
                    <div className="flex items-center">
                      <Palette className="h-4 w-4 mr-2" /> 
                      <span>Branding (Optional)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <ColorPicker
                          color={formData.theme.primaryColor}
                          onChange={(color) => handleThemeChange("primaryColor", color)}
                        />
                        <p className="text-xs text-muted-foreground">
                          This color will be used for buttons and highlights.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="secondaryColor">Secondary Color</Label>
                        <ColorPicker
                          color={formData.theme.secondaryColor}
                          onChange={(color) => handleThemeChange("secondaryColor", color)}
                        />
                        <p className="text-xs text-muted-foreground">
                          This color will be used for accents and secondary elements.
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="borderRadius">Border Style</Label>
                      <RadioGroup
                        value={formData.theme.borderRadius}
                        onValueChange={(value) => handleThemeChange("borderRadius", value)}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="none" id="border-none" />
                          <Label htmlFor="border-none">Square</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="rounded" id="border-rounded" />
                          <Label htmlFor="border-rounded">Rounded</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="rounded-full" id="border-pill" />
                          <Label htmlFor="border-pill">Pill</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fontSize">Text Size</Label>
                      <RadioGroup
                        value={formData.theme.fontSize}
                        onValueChange={(value) => handleThemeChange("fontSize", value)}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sm" id="size-small" />
                          <Label htmlFor="size-small">Small</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="base" id="size-medium" />
                          <Label htmlFor="size-medium">Medium</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="lg" id="size-large" />
                          <Label htmlFor="size-large">Large</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Rewards Section */}
                <AccordionItem value="rewards">
                  <AccordionTrigger className="flex items-center">
                    <div className="flex items-center">
                      <GiftIcon className="h-4 w-4 mr-2" /> 
                      <span>Rewards Settings (Optional)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Reward System Type</Label>
                      <RadioGroup
                        value={formData.preferences.rewardSystemType}
                        onValueChange={(value) => handlePreferenceChange("rewardSystemType", value)}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="POINTS" id="system-points" />
                          <Label htmlFor="system-points">Points Only</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="STAMPS" id="system-stamps" />
                          <Label htmlFor="system-stamps">Stamps Only</Label>
                        </div>
                      </RadioGroup>
                      <p className="text-xs text-muted-foreground">
                        Choose whether to use points or stamps for your rewards program.
                      </p>
                    </div>
                    
                    {formData.preferences.rewardSystemType === 'POINTS' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="pointsName">Points Name</Label>
                          <Input
                            id="pointsName"
                            value={formData.preferences.pointsName}
                            onChange={(e) => handlePreferenceChange("pointsName", e.target.value)}
                            placeholder="Points, Stars, Credits, etc."
                          />
                          <p className="text-xs text-muted-foreground">
                            What would you like to call your reward points?
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="pointsAbbreviation">Points Abbreviation</Label>
                          <Input
                            id="pointsAbbreviation"
                            value={formData.preferences.pointsAbbreviation}
                            onChange={(e) => handlePreferenceChange("pointsAbbreviation", e.target.value)}
                            placeholder="pts, ⭐, etc."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="pointsCollectionMechanism">Points Collection Mechanism</Label>
                          <Select 
                            value={formData.preferences.pointsCollectionMechanism}
                            onValueChange={(value) => handlePreferenceChange("pointsCollectionMechanism", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select points collection mechanism" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="TEN_PERCENT">10% of purchase</SelectItem>
                              <SelectItem value="TWENTY_PERCENT">30% of purchase</SelectItem>
                              <SelectItem value="THIRTY_PERCENT">50% of purchase</SelectItem>
                              {/* <SelectItem value="CUSTOM">Custom percentage</SelectItem> */}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Choose how many points customers earn relative to their purchase amount
                          </p>
                        </div>

                        {/* {formData.preferences.pointsCollectionMechanism === 'CUSTOM' && (
                          <div className="space-y-2">
                            <Label htmlFor="customPointsRatio">Custom Points Ratio</Label>
                            <Input
                              id="customPointsRatio"
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={formData.preferences.customPointsRatio}
                              onChange={(e) => handlePreferenceChange("customPointsRatio", parseFloat(e.target.value))}
                              placeholder="1.0"
                            />
                            <p className="text-xs text-muted-foreground">
                              Define your custom points ratio (e.g., 1.0 = 100% of purchase amount)
                            </p>
                          </div>
                        )} */}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="defaultCurrency">Default Currency</Label>
                      <Select 
                        value={formData.preferences.defaultCurrency}
                        onValueChange={(value) => handlePreferenceChange("defaultCurrency", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="SGD">SGD (S$)</SelectItem>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                          <SelectItem value="AUD">AUD (A$)</SelectItem>
                          <SelectItem value="CAD">CAD (C$)</SelectItem>
                          <SelectItem value="JPY">JPY (¥)</SelectItem>
                          <SelectItem value="CNY">CNY (¥)</SelectItem>
                          <SelectItem value="MYR">MYR (RM)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="welcomeMessage">Welcome Message</Label>
                      <Textarea
                        id="welcomeMessage"
                        value={formData.preferences.welcomeMessage}
                        onChange={(e) => handlePreferenceChange("welcomeMessage", e.target.value)}
                        placeholder={`Welcome to ${formData.name || "our rewards program"}!`}
                        rows={2}
                      />
                    </div>
                    
                    {/* <div className="space-y-6 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium flex items-center">
                            <Share2 className="h-4 w-4 mr-2" />
                            Enable Referrals
                          </h3>
                          <p className="text-sm text-muted-foreground">Allow customers to earn rewards by referring friends</p>
                        </div>
                        <Switch
                          checked={formData.preferences.enableReferrals}
                          onCheckedChange={(checked) => handlePreferenceChange("enableReferrals", checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium flex items-center">
                            <Trophy className="h-4 w-4 mr-2" />
                            Enable Reward Tiers
                          </h3>
                          <p className="text-sm text-muted-foreground">Create VIP levels for your most loyal customers</p>
                        </div>
                        <Switch
                          checked={formData.preferences.enableTiers}
                          onCheckedChange={(checked) => handlePreferenceChange("enableTiers", checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium flex items-center">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Enable Gamification
                          </h3>
                          <p className="text-sm text-muted-foreground">Add challenges and achievements to engage customers</p>
                        </div>
                        <Switch
                          checked={formData.preferences.enableGameification}
                          onCheckedChange={(checked) => handlePreferenceChange("enableGameification", checked)}
                        />
                      </div>
                    </div> */}
                  </AccordionContent>
                </AccordionItem>

                {/* Summary Section */}
                <AccordionItem value="summary">
                  <AccordionTrigger className="flex items-center">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2" /> 
                      <span>Project Summary</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="bg-muted p-6 rounded-lg border">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Project Name</h4>
                            <p className="text-lg">{formData.name || "Not specified"}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Project Type</h4>
                            <p className="text-lg">{formData.projectType || "Rewards"}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                          <p>{formData.description || "No description provided"}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Rewards Currency</h4>
                            <p>
                              {formData.preferences.pointsName} ({formData.preferences.pointsAbbreviation})
                            </p>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Collection Mechanism</h4>
                            <p>
                              {formData.preferences.pointsCollectionMechanism === "LOW" ? "Low (10%)" :
                               formData.preferences.pointsCollectionMechanism === "MEDIUM" ? "Medium (30%)" :
                               formData.preferences.pointsCollectionMechanism === "HIGH" ? "High (50%)" :
                               `Custom (${formData.preferences.customPointsRatio * 100}%)`}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Money Currency</h4>
                            <p>{formData.preferences.defaultCurrency}</p>
                          </div>
                        </div>
                        
                        {/* <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Features</h4>
                          <ul className="mt-1 space-y-1">
                            <li className="flex items-center">
                              <CheckCircle2 className={`h-4 w-4 mr-2 ${formData.preferences.enableReferrals ? 'text-primary' : 'text-muted-foreground'}`} />
                              Referral Program {formData.preferences.enableReferrals ? '' : '(Disabled)'}
                            </li>
                            <li className="flex items-center">
                              <CheckCircle2 className={`h-4 w-4 mr-2 ${formData.preferences.enableTiers ? 'text-primary' : 'text-muted-foreground'}`} />
                              Reward Tiers {formData.preferences.enableTiers ? '' : '(Disabled)'}
                            </li>
                            <li className="flex items-center">
                              <CheckCircle2 className={`h-4 w-4 mr-2 ${formData.preferences.enableGameification ? 'text-primary' : 'text-muted-foreground'}`} />
                              Gamification {formData.preferences.enableGameification ? '' : '(Disabled)'}
                            </li>
                          </ul>
                        </div> */}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => router.push("/dashboard/projects")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.name.trim()}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Creating Project...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-medium mb-2">Need help?</h3>
          <p className="text-sm text-muted-foreground mb-2">Not sure where to start? Here are some tips:</p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>Choose a clear, memorable name for your Reward/loyalty program</li>
            <li>Consider using your brand name in the program name for recognition</li>
            <li>Your domain should be easy to remember and type</li>
            <li>Choose colors that match your brand identity</li>
            <li>Think about what rewards would best motivate your customers</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  )
}