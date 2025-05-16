import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import RewardSystemSettings from '@/components/rewards/reward-system-settings';
import MembershipTiersList from '@/components/rewards/membership-tiers-list';
import VouchersList from '@/components/rewards/vouchers-list';
import RedemptionRulesList from '@/components/rewards/redemption-rules-list';
import { requirePermission } from '@/lib/auth/server-auth';
import { ACTION_TYPES, RESOURCE_TYPES } from '@/lib/casbin/enforcer';
import DomainManagement from '@/components/domain-management';

export const metadata: Metadata = {
  title: 'Rewards Management',
  description: 'Configure and manage your rewards system.',
};

export default async function RewardsPage({
  params,
}: {
  params: { projectId: string };
}) {
  const { projectId } = await params;
  
  await requirePermission(
    projectId,
    RESOURCE_TYPES.ALL,
    ACTION_TYPES.MANAGE,
    `/dashboard/projects/${projectId}`
  );
  // Get project by ID instead of slug
  const project = await db.project.findUnique({
    where: { id: projectId }, // Fixed: search by ID instead of slug
    include: {
      preferences: true,
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <DomainManagement projectId={projectId} />
    </div>
  );
}