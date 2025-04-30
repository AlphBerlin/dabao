"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { fadeIn, staggerContainer } from "@/lib/animations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Button } from "@workspace/ui/components/button";
import { Progress } from "@workspace/ui/components/progress";
import { Gift, Trophy, Target } from "lucide-react";

const demoTabs = [
  {
    id: "points",
    label: "Points System",
    icon: Gift,
    content: {
      title: "Reward every interaction",
      description: "Automatically track and reward customer actions across all touchpoints.",
      preview: (
        <div className="glass p-6 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Gold Status Progress</h4>
              <p className="text-sm text-muted-foreground">450/1000 points</p>
            </div>
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <Progress value={45} />
          <div className="grid grid-cols-2 gap-4">
            <Button variant="secondary" size="sm">Redeem Points</Button>
            <Button variant="outline" size="sm">View History</Button>
          </div>
        </div>
      )
    }
  },
  {
    id: "quests",
    label: "Daily Quests",
    icon: Target,
    content: {
      title: "Gamified challenges",
      description: "Keep customers engaged with personalized daily missions.",
      preview: (
        <div className="glass p-6 rounded-lg space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-semibold">Today's Quests</h4>
            <span className="text-sm text-primary">2/3 Complete</span>
          </div>
          <div className="space-y-4">
            {[
              { name: "Make a purchase", reward: "50 pts", completed: true },
              { name: "Share on social", reward: "30 pts", completed: true },
              { name: "Write a review", reward: "100 pts", completed: false }
            ].map((quest) => (
              <div key={quest.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${quest.completed ? "bg-primary" : "bg-secondary"}`} />
                  <span className={quest.completed ? "line-through" : ""}>{quest.name}</span>
                </div>
                <span className="text-sm text-primary">{quest.reward}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
  }
];

export function Demo() {
  const [activeTab, setActiveTab] = useState("points");

  return (
    <section className="py-24 relative">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="container mx-auto px-6"
      >
        <div className="text-center mb-16">
          <motion.h2 
            variants={fadeIn}
            className="text-4xl font-bold mb-4 satoshi-bold"
          >
            See it in action
          </motion.h2>
          <motion.p 
            variants={fadeIn}
            className="text-muted-foreground"
          >
            Experience how Dabao Rewards transforms customer engagement
          </motion.p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-[400px] mx-auto grid-cols-2 mb-12">
            {demoTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {demoTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="grid md:grid-cols-2 gap-12 items-center"
              >
                <div>
                  <h3 className="text-2xl font-bold mb-4">{tab.content.title}</h3>
                  <p className="text-muted-foreground mb-8">{tab.content.description}</p>
                  <Button>Try it yourself</Button>
                </div>
                <div>{tab.content.preview}</div>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </section>
  );
}