"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/ui/components/tabs"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { Slider } from "@workspace/ui/components/slider"
import { useToast } from "@workspace/ui/hooks/use-toast"

export function AdminGameSettings() {
  const { toast } = useToast()
  const [activeGame, setActiveGame] = useState("spin-wheel")
  const [isLoading, setIsLoading] = useState(false)

  // Spin wheel settings
  const [wheelSettings, setWheelSettings] = useState({
    isEnabled: true,
    maxDailySpins: 5,
    tokenCost: 1,
    winRate: 40, // percentage
    maxPrizeValue: 500,
    requiresApproval: false,
  })

  // Slot machine settings
  const [slotSettings, setSlotSettings] = useState({
    isEnabled: true,
    maxDailySpins: 5,
    tokenCost: 1,
    winRate: 30, // percentage
    maxPrizeValue: 500,
    requiresApproval: true,
  })

  const handleSaveSettings = () => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Settings saved",
        description: "Game settings have been updated successfully.",
      })
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="spin-wheel" value={activeGame} onValueChange={setActiveGame}>
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="spin-wheel">Spin the Wheel</TabsTrigger>
          <TabsTrigger value="slot-machine">Lucky Slots</TabsTrigger>
        </TabsList>

        <TabsContent value="spin-wheel">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Spin the Wheel Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="wheel-enabled" className="block mb-1">
                      Enable Game
                    </Label>
                    <p className="text-sm text-mid-gray">Make this game available to users</p>
                  </div>
                  <Switch
                    id="wheel-enabled"
                    checked={wheelSettings.isEnabled}
                    onCheckedChange={(checked) => setWheelSettings({ ...wheelSettings, isEnabled: checked })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="wheel-max-spins">Maximum Daily Spins</Label>
                    <Input
                      id="wheel-max-spins"
                      type="number"
                      min="1"
                      max="20"
                      value={wheelSettings.maxDailySpins}
                      onChange={(e) =>
                        setWheelSettings({ ...wheelSettings, maxDailySpins: Number.parseInt(e.target.value) })
                      }
                    />
                    <p className="text-xs text-mid-gray">Number of spins allowed per user per day</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wheel-token-cost">Token Cost</Label>
                    <Input
                      id="wheel-token-cost"
                      type="number"
                      min="1"
                      max="10"
                      value={wheelSettings.tokenCost}
                      onChange={(e) =>
                        setWheelSettings({ ...wheelSettings, tokenCost: Number.parseInt(e.target.value) })
                      }
                    />
                    <p className="text-xs text-mid-gray">Number of tokens required per spin</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="wheel-win-rate">Win Rate ({wheelSettings.winRate}%)</Label>
                    <span className="text-sm text-mid-gray">{wheelSettings.winRate}%</span>
                  </div>
                  <Slider
                    id="wheel-win-rate"
                    min={0}
                    max={100}
                    step={5}
                    value={[wheelSettings.winRate]}
                    onValueChange={(value) => setWheelSettings({ ...wheelSettings, winRate: value[0] })}
                  />
                  <p className="text-xs text-mid-gray">Percentage chance of winning any prize</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wheel-max-prize">Maximum Prize Value (Points)</Label>
                  <Input
                    id="wheel-max-prize"
                    type="number"
                    min="100"
                    max="10000"
                    value={wheelSettings.maxPrizeValue}
                    onChange={(e) =>
                      setWheelSettings({ ...wheelSettings, maxPrizeValue: Number.parseInt(e.target.value) })
                    }
                  />
                  <p className="text-xs text-mid-gray">Highest possible prize value in points</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="wheel-approval" className="block mb-1">
                      Require Approval for Big Wins
                    </Label>
                    <p className="text-sm text-mid-gray">Manually approve prizes over 200 points</p>
                  </div>
                  <Switch
                    id="wheel-approval"
                    checked={wheelSettings.requiresApproval}
                    onCheckedChange={(checked) => setWheelSettings({ ...wheelSettings, requiresApproval: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slot-machine">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lucky Slots Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="slots-enabled" className="block mb-1">
                      Enable Game
                    </Label>
                    <p className="text-sm text-mid-gray">Make this game available to users</p>
                  </div>
                  <Switch
                    id="slots-enabled"
                    checked={slotSettings.isEnabled}
                    onCheckedChange={(checked) => setSlotSettings({ ...slotSettings, isEnabled: checked })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="slots-max-spins">Maximum Daily Spins</Label>
                    <Input
                      id="slots-max-spins"
                      type="number"
                      min="1"
                      max="20"
                      value={slotSettings.maxDailySpins}
                      onChange={(e) =>
                        setSlotSettings({ ...slotSettings, maxDailySpins: Number.parseInt(e.target.value) })
                      }
                    />
                    <p className="text-xs text-mid-gray">Number of spins allowed per user per day</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slots-token-cost">Token Cost</Label>
                    <Input
                      id="slots-token-cost"
                      type="number"
                      min="1"
                      max="10"
                      value={slotSettings.tokenCost}
                      onChange={(e) => setSlotSettings({ ...slotSettings, tokenCost: Number.parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-mid-gray">Number of tokens required per spin</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="slots-win-rate">Win Rate ({slotSettings.winRate}%)</Label>
                    <span className="text-sm text-mid-gray">{slotSettings.winRate}%</span>
                  </div>
                  <Slider
                    id="slots-win-rate"
                    min={0}
                    max={100}
                    step={5}
                    value={[slotSettings.winRate]}
                    onValueChange={(value) => setSlotSettings({ ...slotSettings, winRate: value[0] })}
                  />
                  <p className="text-xs text-mid-gray">Percentage chance of winning any prize</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slots-max-prize">Maximum Prize Value (Points)</Label>
                  <Input
                    id="slots-max-prize"
                    type="number"
                    min="100"
                    max="10000"
                    value={slotSettings.maxPrizeValue}
                    onChange={(e) =>
                      setSlotSettings({ ...slotSettings, maxPrizeValue: Number.parseInt(e.target.value) })
                    }
                  />
                  <p className="text-xs text-mid-gray">Highest possible prize value in points</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="slots-approval" className="block mb-1">
                      Require Approval for Big Wins
                    </Label>
                    <p className="text-sm text-mid-gray">Manually approve prizes over 200 points</p>
                  </div>
                  <Switch
                    id="slots-approval"
                    checked={slotSettings.requiresApproval}
                    onCheckedChange={(checked) => setSlotSettings({ ...slotSettings, requiresApproval: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
