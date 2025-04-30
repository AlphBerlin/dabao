"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { fadeIn, staggerContainer, slideUp, rotateIn, sectionEntrance } from "@/lib/animations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Button } from "@workspace/ui/components/button";
import { Progress } from "@workspace/ui/components/progress";
import { Gift, Trophy, Target, Users, Zap, Clock } from "lucide-react";
import { useGamify } from "@/hooks/use-gamify";

const demoTabs = [
  {
    id: "points",
    label: "Points System",
    icon: Gift,
    content: {
      title: "Reward every interaction",
      description: "Automatically track and reward customer actions across all touchpoints.",
      preview: (
        <div className="glass p-6 rounded-lg space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Gold Status Progress</h4>
              <p className="text-sm text-muted-foreground">450/1000 points</p>
            </div>
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <Progress value={45} className="h-2" />
          <div className="grid grid-cols-2 gap-4">
            <Button variant="secondary" size="sm" className="animate-all glow-effect">Redeem Points</Button>
            <Button variant="outline" size="sm" className="animate-all">View History</Button>
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
        <div className="glass p-6 rounded-lg space-y-4 shadow-xl">
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
              <div key={quest.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${quest.completed ? "bg-primary" : "bg-secondary border border-muted"} flex items-center justify-center`}>
                    {quest.completed && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className={quest.completed ? "line-through opacity-70" : ""}>{quest.name}</span>
                </div>
                <span className="text-sm text-primary font-medium">{quest.reward}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
  },
  {
    id: "community",
    label: "Community",
    icon: Users,
    content: {
      title: "Build a community",
      description: "Create a vibrant community around your brand with social features and leaderboards.",
      preview: (
        <div className="glass p-6 rounded-lg space-y-4 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-semibold">Top Members</h4>
            <span className="text-sm text-primary">This Week</span>
          </div>
          <div className="space-y-3">
            {[
              { name: "Sarah J.", points: 1250, rank: 1 },
              { name: "David M.", points: 980, rank: 2 },
              { name: "Alex T.", points: 820, rank: 3 },
              { name: "You", points: 780, rank: 4, isUser: true }
            ].map((member) => (
              <div key={member.name} className={`flex items-center justify-between p-3 rounded-lg ${member.isUser ? "bg-primary/10 border border-primary/20" : "bg-secondary/50"} transition-colors`}>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full bg-${member.rank <= 3 ? "amber" : "secondary"}-${member.rank === 1 ? "400" : member.rank === 2 ? "300" : "200"} flex items-center justify-center text-xs font-bold`}>
                    {member.rank}
                  </div>
                  <span className={member.isUser ? "font-medium text-primary" : ""}>{member.name}</span>
                </div>
                <span className="text-sm font-medium">{member.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
  },
  {
    id: "automation",
    label: "Automation",
    icon: Zap,
    content: {
      title: "AI-powered automation",
      description: "Automate reward distribution and engagement campaigns with intelligent AI.",
      preview: (
        <div className="glass p-6 rounded-lg space-y-4 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-semibold">Auto-Campaigns</h4>
            <span className="px-2 py-1 text-xs bg-primary/20 text-primary rounded-full">Active</span>
          </div>
          <div className="space-y-3">
            {[
              { name: "Birthday Rewards", trigger: "User birthday", status: "Scheduled", date: "May 15" },
              { name: "Winback Campaign", trigger: "Inactive 30 days", status: "Running", sent: 124 },
              { name: "Level Up Bonus", trigger: "Rank increase", status: "Active", sent: 58 }
            ].map((campaign) => (
              <div key={campaign.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
                <div className="flex-1">
                  <p className="font-medium">{campaign.name}</p>
                  <p className="text-xs text-muted-foreground">Trigger: {campaign.trigger}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{campaign.status}</p>
                  <p className="text-xs text-muted-foreground">
                    {campaign.date ? `Next: ${campaign.date}` : `Sent: ${campaign.sent}`}
                  </p>
                </div>
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
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { updateAchievement } = useGamify();
  
  // Track when section comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Update achievement progress when user views the demo section
          updateAchievement("feature_explorer", 1);
        }
      },
      { threshold: 0.2 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [updateAchievement]);

  // Update achievement progress when exploring different tabs
  useEffect(() => {
    if (activeTab !== "points") {
      updateAchievement("feature_explorer", 2);
    }
  }, [activeTab, updateAchievement]);

  return (
    <section ref={sectionRef} className="py-24 relative">
      <motion.div
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        variants={sectionEntrance}
        className="container mx-auto px-6"
      >
        <div className="text-center mb-16">
          <motion.h2 
            variants={slideUp}
            className="text-4xl font-bold mb-4 satoshi-bold"
          >
            See it in <span className="text-gradient">action</span>
          </motion.h2>
          <motion.p 
            variants={slideUp}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            Experience how Dabao Rewards transforms customer engagement with gamification, 
            automation, and community-building features.
          </motion.p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-5xl mx-auto">
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-4 mb-12">
            {demoTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground animate-all">
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {demoTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="grid md:grid-cols-2 gap-12 items-center"
              >
                <motion.div variants={slideUp}>
                  <h3 className="text-2xl font-bold mb-4">{tab.content.title}</h3>
                  <p className="text-muted-foreground mb-8">{tab.content.description}</p>
                  <Button size="lg" className="glow-effect animate-all">Try it yourself</Button>
                </motion.div>
                <motion.div
                  variants={rotateIn}
                  className="transform transition-all duration-500 hover:scale-105"
                >
                  {tab.content.preview}
                </motion.div>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
        
        <motion.div 
          variants={fadeIn} 
          className="mt-20 text-center"
        >
          <p className="text-muted-foreground mb-6">
            Ready to revolutionize your customer engagement?
          </p>
          <Button size="lg" className="glow-effect animate-all">
            Start for free
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}