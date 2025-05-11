import React from 'react';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import RewardSystemSettings from '@/components/rewards/reward-system-settings';
import MembershipTiersList from '@/components/rewards/membership-tiers-list';
import VouchersList from '@/components/rewards/vouchers-list';
import RedemptionRulesList from '@/components/rewards/redemption-rules-list';
import { requirePermission } from '@/lib/auth/server-auth';
import { ACTION_TYPES, RESOURCE_TYPES } from '@/lib/casbin/enforcer';

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
    RESOURCE_TYPES.REWARD,
    ACTION_TYPES.READ,
    `/projects/${projectId}`
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
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Rewards Management</h1>
        <p className="text-muted-foreground">
          Configure and manage your rewards system, vouchers, and membership tiers.
        </p>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Reward System</TabsTrigger>
          <TabsTrigger value="tiers">Membership Tiers</TabsTrigger>
          <TabsTrigger value="vouchers">Vouchers</TabsTrigger>
          <TabsTrigger value="rules">Redemption Rules</TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings" className="space-y-4">
          <RewardSystemSettings projectId={project.id} preferences={project.preferences} />
        </TabsContent>
        
        <TabsContent value="tiers" className="space-y-4">
          <MembershipTiersList projectId={project.id} rewardSystemType={project.preferences?.rewardSystemType || 'POINTS'} />
        </TabsContent>
        
        <TabsContent value="vouchers" className="space-y-4">
          <VouchersList projectId={project.id} />
        </TabsContent>
        
        <TabsContent value="rules" className="space-y-4">
          <RedemptionRulesList 
            projectId={project.id} 
            rewardSystemType={project.preferences?.rewardSystemType || 'POINTS'} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}