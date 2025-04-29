"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/ui/components/tabs"
import { SpinWheel } from "@/components/spin-wheel"
import { SlotMachine } from "@/components/slot-machine"

interface GamesListProps {
  onWin: () => void
}

export function GamesList({ onWin }: GamesListProps) {
  const [activeGame, setActiveGame] = useState("spin-wheel")

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-tn-blue">Play & Win</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="spin-wheel" value={activeGame} onValueChange={setActiveGame}>
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="spin-wheel">Spin the Wheel</TabsTrigger>
            <TabsTrigger value="slot-machine">Lucky Slots</TabsTrigger>
          </TabsList>

          <TabsContent value="spin-wheel" className="mt-0">
            <SpinWheel onWin={onWin} />
          </TabsContent>

          <TabsContent value="slot-machine" className="mt-0">
            <SlotMachine onWin={onWin} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
