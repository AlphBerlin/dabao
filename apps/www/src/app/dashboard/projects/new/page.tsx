"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { OnboardingProgressBar } from "@/components/onboarding/ProgressBar"
import { MainLayout } from "@/components/layout/MainLayout"

export default function NewProjectPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    description: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would create the project here
    console.log("Creating project:", formData)
    router.push("/projects")
  }

  const steps = [
    {
      id: "step-1",
      title: "Project Info",
      completed: false,
      current: true,
    },
    {
      id: "step-2",
      title: "Branding",
      completed: false,
      current: false,
    },
    {
      id: "step-3",
      title: "Rewards",
      completed: false,
      current: false,
    },
    {
      id: "step-4",
      title: "Launch",
      completed: false,
      current: false,
    },
  ]

  return (
    <MainLayout>
      <div className="container mx-auto p-4 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Create New Project</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Project Setup</CardTitle>
            <CardDescription>
              Let's set up your new loyalty program. Fill in the basic information to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingProgressBar steps={steps} />

            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Coffee Rewards, Book Club Points, etc."
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
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
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/projects")}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Continue</Button>
          </CardFooter>
        </Card>

        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-medium mb-2">Need help?</h3>
          <p className="text-sm text-muted-foreground mb-2">Not sure where to start? Here are some tips:</p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>Choose a clear, memorable name for your loyalty program</li>
            <li>Consider using your brand name in the program name for recognition</li>
            <li>Your domain should be easy to remember and type</li>
            <li>The description helps your team understand the program's purpose</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  )
}
