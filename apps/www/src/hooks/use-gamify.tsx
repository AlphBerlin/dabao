"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

type BadgeType = {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
};

type Achievement = {
  id: string;
  name: string;
  description: string;
  requirement: number;
  progress: number;
  completed: boolean;
};

type GamifyContextType = {
  xp: number;
  level: number;
  badges: BadgeType[];
  achievements: Achievement[];
  incrementXP: (amount?: number) => void;
  progress: number;
  showConfetti: () => void;
  addBadge: (badge: BadgeType) => void;
  updateAchievement: (id: string, progress: number) => void;
  nextLevelXP: number;
};

const defaultBadges: BadgeType[] = [
  {
    id: "early_adopter",
    name: "Early Adopter",
    description: "Joined Dabao in its early days",
    icon: "🚀",
    unlocked: true
  },
  {
    id: "power_user",
    name: "Power User",
    description: "Used Dabao features extensively",
    icon: "⚡",
    unlocked: true
  },
  {
    id: "explorer",
    name: "Explorer",
    description: "Visited all sections of the platform",
    icon: "🧭",
    unlocked: false
  },
  {
    id: "social_butterfly",
    name: "Social Butterfly",
    description: "Connected your social accounts",
    icon: "🦋",
    unlocked: false
  }
];

const defaultAchievements: Achievement[] = [
  {
    id: "scroll_master",
    name: "Scroll Master",
    description: "Scroll through the entire landing page",
    requirement: 100,
    progress: 0,
    completed: false
  },
  {
    id: "feature_explorer",
    name: "Feature Explorer",
    description: "Explore all features on the demo section",
    requirement: 3,
    progress: 0,
    completed: false
  },
  {
    id: "quick_learner",
    name: "Quick Learner",
    description: "Understand how Dabao rewards work",
    requirement: 1,
    progress: 0,
    completed: false
  }
];

// Create a default context with empty implementations
const defaultGamifyContext: GamifyContextType = {
  xp: 0,
  level: 1,
  badges: [],
  achievements: [],
  incrementXP: () => {},
  progress: 0,
  showConfetti: () => {},
  addBadge: () => {},
  updateAchievement: () => {},
  nextLevelXP: 1000,
};

// Initialize context with default values
const GamifyContext = createContext<GamifyContextType>(defaultGamifyContext);

export function GamifyProvider({ children }: { children: React.ReactNode }) {
  const [xp, setXP] = useLocalStorage<number>("dabao_xp", 750);
  const [badges, setBadges] = useLocalStorage<BadgeType[]>("dabao_badges", defaultBadges);
  const [achievements, setAchievements] = useLocalStorage<Achievement[]>("dabao_achievements", defaultAchievements);
  
  const level = Math.floor(xp / 1000) + 1;
  const nextLevelXP = (level * 1000);
  const progress = ((xp % 1000) / 1000) * 100;

  // Track scroll progress for the scroll master achievement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleScroll = () => {
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = document.documentElement.scrollTop;
        const clientHeight = document.documentElement.clientHeight;
        
        // Calculate scroll percentage
        const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;
        
        // Update the scroll master achievement
        updateAchievement("scroll_master", scrollPercentage);
      };
      
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Watch for achievement completion
  useEffect(() => {
    achievements.forEach(achievement => {
      if (achievement.progress >= achievement.requirement && !achievement.completed) {
        // Mark as completed
        const updatedAchievements = achievements.map(a => 
          a.id === achievement.id ? { ...a, completed: true } : a
        );
        setAchievements(updatedAchievements);
        
        // Award XP and show confetti
        incrementXP(250);
        showConfetti();
      }
    });
  }, [achievements]);

  const incrementXP = (amount: number = 100) => {
    setXP(prev => prev + amount);
    
    // Check if leveled up
    const newLevel = Math.floor((xp + amount) / 1000) + 1;
    if (newLevel > level) {
      showConfetti();
    }
  };

  const showConfetti = () => {
    // Simple confetti effect using CSS
    // In a production app, you would use a library like canvas-confetti
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);

    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
      confetti.style.animationDelay = `${Math.random() * 2}s`;
      confettiContainer.appendChild(confetti);
    }

    setTimeout(() => {
      document.body.removeChild(confettiContainer);
    }, 3000);
  };

  const addBadge = (badge: BadgeType) => {
    if (!badges.some(b => b.id === badge.id)) {
      setBadges([...badges, badge]);
      incrementXP(200);
      showConfetti();
    }
  };

  const updateAchievement = (id: string, progress: number) => {
    const updatedAchievements = achievements.map(achievement => {
      if (achievement.id === id && !achievement.completed) {
        return {
          ...achievement,
          progress: Math.max(achievement.progress, progress)
        };
      }
      return achievement;
    });
    
    setAchievements(updatedAchievements);
  };

  const contextValue = { 
    xp, 
    level, 
    badges, 
    achievements,
    incrementXP, 
    progress,
    showConfetti,
    addBadge,
    updateAchievement,
    nextLevelXP
  };

  return (
    <GamifyContext.Provider value={contextValue}>
      {children}
    </GamifyContext.Provider>
  );
}

export function useGamify(): GamifyContextType {
  const context = useContext(GamifyContext);
  
  // For client-side, we still want to warn developers if they're using the hook outside the provider
  if (process.env.NODE_ENV !== 'production' && context === defaultGamifyContext) {
    console.warn(
      "useGamify hook was called outside of GamifyProvider. " +
      "Make sure the component is wrapped in a <GamifyProvider>."
    );
  }
  
  return context;
}