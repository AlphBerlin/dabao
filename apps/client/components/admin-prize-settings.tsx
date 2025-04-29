"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { Slider } from "@workspace/ui/components/slider"
import { Badge } from "@workspace/ui/components/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Pencil, Trash2, Plus, AlertTriangle } from "lucide-react"
import { useToast } from "@workspace/ui/hooks/use-toast"

export function AdminPrizeSettings() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  // Sample prize data
  const [prizes, setPrizes] = useState([
    {
      id: "prize-1",
      name: "50 Points",
      type: "points",
      value: 50,
      probability: 20,
      isEnabled: true,
      maxDaily: 100,
    },
    {
      id: "prize-2",
      name: "100 Points",
      type: "points",
      value: 100,
      probability: 15,
      isEnabled: true,
      maxDaily: 50,
    },
    {
      id: "prize-3",
      name: "200 Points",
      type: "points",
      value: 200,
      probability: 5,
      isEnabled: true,
      maxDaily: 25,
    },
    {
      id: "prize-4",
      name: "500 Points",
      type: "points",
      value: 500,
      probability: 1,
      isEnabled: true,
      maxDaily: 5,
    },
    {
      id: "prize-5",
      name: "10% Off",
      type: "discount",
      value: 10,
      probability: 5,
      isEnabled: true,
      maxDaily: 20,
    },
    {
      id: "prize-6",
      name: "Free Shipping",
      type: "shipping",
      value: 0,
      probability: 5,
      isEnabled: true,
      maxDaily: 15,
    },
  ])

  const handleSaveSettings = () => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Prize settings saved",
        description: "Prize configuration has been updated successfully.",
      })
    }, 1000)
  }

  const togglePrize = (id: string) => {
    setPrizes(prizes.map((prize) => (prize.id === id ? { ...prize, isEnabled: !prize.isEnabled } : prize)))
  }

  // Calculate total probability
  const totalProbability = prizes.reduce((sum, prize) => sum + prize.probability, 0)
  const hasWarning = totalProbability !== 100

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Prize Configuration</CardTitle>
          {hasWarning && (
            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Total probability: {totalProbability}%
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hasWarning && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-600 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Warning</span>
                </div>
                <p>
                  The total probability of all prizes should equal 100%. Current total: {totalProbability}%.
                  {totalProbability < 100 ? " Increase some probabilities." : " Decrease some probabilities."}
                </p>
              </div>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prize Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Probability</TableHead>
                    <TableHead>Daily Limit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prizes.map((prize) => (
                    <TableRow key={prize.id}>
                      <TableCell className="font-medium">{prize.name}</TableCell>
                      <TableCell className="capitalize">{prize.type}</TableCell>
                      <TableCell>
                        {prize.type === "points" ? prize.value : prize.type === "discount" ? `${prize.value}%` : "-"}
                      </TableCell>
                      <TableCell>{prize.probability}%</TableCell>
                      <TableCell>{prize.maxDaily}</TableCell>
                      <TableCell>
                        <Switch
                          checked={prize.isEnabled}
                          onCheckedChange={() => togglePrize(prize.id)}
                          className="data-[state=checked]:bg-accent-teal"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Button variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add New Prize
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Global Prize Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="approval-threshold" className="block mb-1">
                  Approval Threshold
                </Label>
                <p className="text-sm text-mid-gray">Prizes above this value require manual approval</p>
              </div>
              <div className="w-32">
                <Input id="approval-threshold" type="number" defaultValue="200" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="max-daily-wins" className="block mb-1">
                  Maximum Daily Wins Per User
                </Label>
                <p className="text-sm text-mid-gray">Limit how many prizes a user can win per day</p>
              </div>
              <div className="w-32">
                <Input id="max-daily-wins" type="number" defaultValue="3" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="fraud-protection" className="block mb-1">
                  Fraud Protection
                </Label>
                <p className="text-sm text-mid-gray">Block suspicious activity patterns</p>
              </div>
              <Switch id="fraud-protection" defaultChecked />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="win-rate-cap">System Win Rate Cap (40%)</Label>
                <span className="text-sm text-mid-gray">40%</span>
              </div>
              <Slider id="win-rate-cap" min={0} max={100} step={5} defaultValue={[40]} />
              <p className="text-xs text-mid-gray">Maximum percentage of plays that can result in wins</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline">Reset to Defaults</Button>
        <Button
          onClick={handleSaveSettings}
          disabled={isLoading}
          className="bg-accent-teal hover:bg-accent-teal/90 text-white"
        >
          {isLoading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
