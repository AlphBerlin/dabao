"use client";

import { createContext, useContext, useState } from "react";

type GamifyContextType = {
  xp: number;
  level: number;
  badges: string[];
  incrementXP: () => void;
};

const GamifyContext = createContext<GamifyContextType | undefined>(undefined);

export function GamifyProvider({ children }: { children: React.ReactNode }) {
  const [xp, setXP] = useState(750);
  const level = Math.floor(xp / 1000) + 1;
  const [badges] = useState(["Early Adopter", "Power User"]);

  const incrementXP = () => setXP((prev) => prev + 100);

  const contextValue = { xp, level, badges, incrementXP };

  return (
    <GamifyContext.Provider value={contextValue}>
      {children}
    </GamifyContext.Provider>
  );
}

export function useGamify() {
  const context = useContext(GamifyContext);
  if (context === undefined) {
    throw new Error("useGamify must be used within a GamifyProvider");
  }
  return context;
}