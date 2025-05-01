"use client";

import { Plus } from "lucide-react";
import { Card } from "@workspace/ui/components/card";
import Link from "next/link";

export function CreateProjectCard() {
  return (
    <Card className="flex h-full min-h-[220px] flex-col items-center justify-center border-2 border-dashed border-neutral-200 bg-transparent p-8 text-center hover:border-primary-400 hover:bg-primary-50 dark:border-neutral-800 dark:hover:border-primary-800 dark:hover:bg-primary-950/20">
      <Link
        href="/dashboard/projects/new"
        className="flex h-full w-full flex-col items-center justify-center"
      >
        <div className="rounded-full bg-neutral-100 p-3 dark:bg-neutral-800">
          <Plus className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-neutral-900 dark:text-white">
          Create a new project
        </h3>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Set up a new loyalty program for your business
        </p>
      </Link>
    </Card>
  );
}
