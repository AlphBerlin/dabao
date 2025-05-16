"use client";

import { ReactNode } from "react";
import { Card } from "@workspace/ui/components/card";

type AuthCardProps = {
  children: ReactNode;
  className?: string;
};

export default function AuthCard({ children, className = "" }: AuthCardProps) {
  return (
    <Card className={`w-full max-w-md ${className}`}>
      {children}
    </Card>
  );
}
