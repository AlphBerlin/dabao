"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/ui/components/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Button } from "@workspace/ui/components/button"
import { Download, Calendar } from "lucide-react"

export function AdminGameStats() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Select defaultValue="7days">
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2 text-mid-gray" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" className="shrink-0">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-mid-gray">Total Games Played</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-tn-blue">1,248</div>
            <p className="text-sm text-green-600">+12.5% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-mid-gray">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-tn-blue">32.4%</div>
            <p className="text-sm text-red-600">-2.1% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-mid-gray">Points Awarded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-tn-blue">24,850</div>
            <p className="text-sm text-green-600">+8.3% from last period</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="games">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="prizes">Prizes</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="games">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Game Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md border border-gray-100">
                <p className="text-mid-gray">Game performance chart would be displayed here</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h3 className="font-medium mb-3">Spin the Wheel</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-mid-gray">Games Played</span>
                      <span className="font-medium">842</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-mid-gray">Win Rate</span>
                      <span className="font-medium">38.2%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-mid-gray">Points Awarded</span>
                      <span className="font-medium">16,450</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-mid-gray">Average Points per Win</span>
                      <span className="font-medium">51.2</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Lucky Slots</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-mid-gray">Games Played</span>
                      <span className="font-medium">406</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-mid-gray">Win Rate</span>
                      <span className="font-medium">29.8%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-mid-gray">Points Awarded</span>
                      <span className="font-medium">8,400</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-mid-gray">Average Points per Win</span>
                      <span className="font-medium">69.4</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prizes">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prize Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md border border-gray-100">
                <p className="text-mid-gray">Prize distribution chart would be displayed here</p>
              </div>

              <div className="mt-6">
                <h3 className="font-medium mb-3">Top Prizes Awarded</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div>
                      <div className="font-medium">50 Points</div>
                      <div className="text-sm text-mid-gray">Most common prize</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">182 times</div>
                      <div className="text-sm text-mid-gray">45.5% of wins</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div>
                      <div className="font-medium">100 Points</div>
                      <div className="text-sm text-mid-gray">Second most common</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">124 times</div>
                      <div className="text-sm text-mid-gray">31.0% of wins</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div>
                      <div className="font-medium">10% Off</div>
                      <div className="text-sm text-mid-gray">Most valuable discount</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">42 times</div>
                      <div className="text-sm text-mid-gray">10.5% of wins</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md border border-gray-100">
                <p className="text-mid-gray">User engagement chart would be displayed here</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h3 className="font-medium mb-3">User Statistics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-mid-gray">Unique Players</span>
                      <span className="font-medium">428</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-mid-gray">Average Games per User</span>
                      <span className="font-medium">2.9</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-mid-gray">Return Rate</span>
                      <span className="font-medium">68.4%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-mid-gray">Conversion to Purchase</span>
                      <span className="font-medium">12.3%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Top Players</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-mid-gray">Most Active User</span>
                      <span className="font-medium">user_58392 (24 games)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-mid-gray">Biggest Winner</span>
                      <span className="font-medium">user_12475 (1,250 pts)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-mid-gray">Most Consistent</span>
                      <span className="font-medium">user_39284 (14 days)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
