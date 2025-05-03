'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, Gift } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import { Switch } from '@workspace/ui/components/switch';
import { Badge } from '@workspace/ui/components/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';

// Define schema for redemption rule
const redemptionRuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  rewardType: z.enum(['POINTS', 'DISCOUNT', 'FREEBIE', 'CASH_BACK', 'TIER_UPGRADE', 'CUSTOM']),
  pointsCost: z.coerce.number().int().min(0, 'Must be non-negative'),
  stampsCost: z.coerce.number().int().min(0, 'Must be non-negative'),
  monetaryValue: z.coerce.number().min(0, 'Must be non-negative').optional(),
  minimumSpend: z.coerce.number().min(0, 'Must be non-negative'),
  maxRedemptionsPerCustomer: z.coerce.number().int().min(0, 'Must be non-negative').optional(),
  maxTotalRedemptions: z.coerce.number().int().min(0, 'Must be non-negative').optional(),
  isActive: z.boolean().default(true),
  applicationMethod: z.enum(['AUTOMATIC', 'CODE', 'QR_CODE']),
  membershipTierId: z.string().optional(),
});

type FormValues = z.infer<typeof redemptionRuleSchema>;

type RedemptionRule = FormValues & {
  id: string;
  createdAt: string;
  updatedAt: string;
  redemptionCount: number;
};

type MembershipTier = {
  id: string;
  name: string;
};

export default function RedemptionRulesList({
  projectId,
  rewardSystemType,
}: {
  projectId: string;
  rewardSystemType: string;
}) {
  const [rules, setRules] = useState<RedemptionRule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentRule, setCurrentRule] = useState<RedemptionRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [membershipTiers, setMembershipTiers] = useState<MembershipTier[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(redemptionRuleSchema),
    defaultValues: {
      name: '',
      description: '',
      rewardType: 'DISCOUNT',
      pointsCost: 0,
      stampsCost: 0,
      monetaryValue: 0,
      minimumSpend: 0,
      maxRedemptionsPerCustomer: undefined,
      maxTotalRedemptions: undefined,
      isActive: true,
      applicationMethod: 'AUTOMATIC',
      membershipTierId: undefined,
    },
  });

  // Form field watches
  const rewardType = form.watch('rewardType');
  const applicationMethod = form.watch('applicationMethod');

  // Fetch redemption rules and membership tiers on component mount
  useEffect(() => {
    fetchRedemptionRules();
    fetchMembershipTiers();
  }, [projectId]);

  const fetchRedemptionRules = async () => {
    setLoadingState('loading');
    try {
      const response = await axios.get(`/api/projects/${projectId}/redemption-rules`);
      setRules(response.data.rules);
      setLoadingState('success');
    } catch (error) {
      console.error('Failed to fetch redemption rules:', error);
      toast.error('Failed to load redemption rules');
      setLoadingState('error');
    }
  };

  const fetchMembershipTiers = async () => {
    try {
      const response = await axios.get(`/api/projects/${projectId}/memberships/tiers`);
      setMembershipTiers(response.data.tiers);
    } catch (error) {
      console.error('Failed to fetch membership tiers:', error);
    }
  };

  const openCreateDialog = () => {
    form.reset({
      name: '',
      description: '',
      rewardType: 'DISCOUNT',
      pointsCost: rewardSystemType !== 'STAMPS' ? 100 : 0,
      stampsCost: rewardSystemType !== 'POINTS' ? 1 : 0,
      monetaryValue: 0,
      minimumSpend: 0,
      maxRedemptionsPerCustomer: undefined,
      maxTotalRedemptions: undefined,
      isActive: true,
      applicationMethod: 'AUTOMATIC',
      membershipTierId: undefined,
    });
    setCurrentRule(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (rule: RedemptionRule) => {
    form.reset({
      name: rule.name,
      description: rule.description,
      rewardType: rule.rewardType,
      pointsCost: rule.pointsCost,
      stampsCost: rule.stampsCost,
      monetaryValue: rule.monetaryValue,
      minimumSpend: rule.minimumSpend,
      maxRedemptionsPerCustomer: rule.maxRedemptionsPerCustomer,
      maxTotalRedemptions: rule.maxTotalRedemptions,
      isActive: rule.isActive,
      applicationMethod: rule.applicationMethod,
      membershipTierId: rule.membershipTierId,
    });
    setCurrentRule(rule);
    setIsDialogOpen(true);
  };

  const handleDeleteRule = async () => {
    if (!currentRule) return;
    setIsLoading(true);
    try {
      await axios.delete(`/api/projects/${projectId}/redemption-rules/${currentRule.id}`);
      toast.success(`${currentRule.name} redemption rule deleted`);
      // Refresh data
      fetchRedemptionRules();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete redemption rule:', error);
      toast.error('Failed to delete redemption rule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDialogOpen = (rule: RedemptionRule) => {
    setCurrentRule(rule);
    setIsDeleteDialogOpen(true);
  };

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case 'POINTS': return 'Points';
      case 'DISCOUNT': return 'Discount';
      case 'FREEBIE': return 'Free Item';
      case 'CASH_BACK': return 'Cash Back';
      case 'TIER_UPGRADE': return 'Tier Upgrade';
      case 'CUSTOM': return 'Custom Reward';
      default: return type;
    }
  };

  const getApplicationMethodLabel = (method: string) => {
    switch (method) {
      case 'AUTOMATIC': return 'Automatic';
      case 'CODE': return 'Code Entry';
      case 'QR_CODE': return 'QR Code';
      default: return method;
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (currentRule) {
        // Update existing redemption rule
        await axios.patch(`/api/projects/${projectId}/redemption-rules/${currentRule.id}`, data);
        toast.success(`${data.name} redemption rule updated successfully`);
      } else {
        // Create new redemption rule
        await axios.post(`/api/projects/${projectId}/redemption-rules`, data);
        toast.success(`${data.name} redemption rule created successfully`);
      }
      
      // Refresh data and reset form
      fetchRedemptionRules();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to save redemption rule:', error);
      toast.error(error.response?.data?.error || 'Failed to save redemption rule');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Redemption Rules</CardTitle>
            <CardDescription>
              Define how customers can redeem their points or stamps for rewards
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Rule
          </Button>
        </CardHeader>
        <CardContent>
          {loadingState === 'loading' ? (
            <div className="py-8 text-center">Loading redemption rules...</div>
          ) : loadingState === 'error' ? (
            <div className="py-8 text-center text-red-500">
              Failed to load redemption rules. Please try again.
            </div>
          ) : rules.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No redemption rules created yet.</p>
              <Button onClick={openCreateDialog} className="mt-4">
                Create your first redemption rule
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="p-2 pl-4 font-medium">Name</th>
                      <th className="p-2 font-medium">Type</th>
                      <th className="p-2 font-medium">Cost</th>
                      <th className="p-2 font-medium">Method</th>
                      <th className="p-2 font-medium">Min. Spend</th>
                      <th className="p-2 font-medium">Status</th>
                      <th className="p-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule) => (
                      <tr key={rule.id} className="border-b">
                        <td className="p-2 pl-4">
                          <div>
                            <div className="font-medium">{rule.name}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-xs">{rule.description}</div>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">
                            {getRewardTypeLabel(rule.rewardType)}
                          </Badge>
                        </td>
                        <td className="p-2">
                          {rewardSystemType === 'POINTS' || rewardSystemType === 'BOTH' ? (
                            <div className="whitespace-nowrap">{rule.pointsCost} points</div>
                          ) : rewardSystemType === 'STAMPS' ? (
                            <div className="whitespace-nowrap">{rule.stampsCost} stamps</div>
                          ) : (
                            <div className="whitespace-nowrap">
                              {rule.pointsCost} points / {rule.stampsCost} stamps
                            </div>
                          )}
                        </td>
                        <td className="p-2">
                          <Badge variant="secondary">
                            {getApplicationMethodLabel(rule.applicationMethod)}
                          </Badge>
                        </td>
                        <td className="p-2">
                          {rule.minimumSpend > 0 ? `$${rule.minimumSpend.toFixed(2)}` : '-'}
                        </td>
                        <td className="p-2">
                          <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(rule)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteDialogOpen(rule)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentRule ? `Edit ${currentRule.name}` : 'Create a New Redemption Rule'}
            </DialogTitle>
            <DialogDescription>
              {currentRule
                ? 'Edit the details of this redemption rule'
                : 'Define how customers can redeem their points or stamps'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Free Coffee" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Get a free coffee when you redeem 10 stamps"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="rewardType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reward type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DISCOUNT">Discount</SelectItem>
                        <SelectItem value="FREEBIE">Free Item</SelectItem>
                        <SelectItem value="CASH_BACK">Cash Back</SelectItem>
                        <SelectItem value="POINTS">Points</SelectItem>
                        <SelectItem value="TIER_UPGRADE">Tier Upgrade</SelectItem>
                        <SelectItem value="CUSTOM">Custom Reward</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      What kind of reward will the customer receive
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                {(rewardSystemType === 'POINTS' || rewardSystemType === 'BOTH') && (
                  <FormField
                    control={form.control}
                    name="pointsCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points Cost</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Points needed to redeem
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {(rewardSystemType === 'STAMPS' || rewardSystemType === 'BOTH') && (
                  <FormField
                    control={form.control}
                    name="stampsCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stamps Cost</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Stamps needed to redeem
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              {(rewardType === 'DISCOUNT' || rewardType === 'CASH_BACK') && (
                <FormField
                  control={form.control}
                  name="monetaryValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {rewardType === 'DISCOUNT' ? 'Discount Amount' : 'Cash Back Amount'}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                            $
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="minimumSpend"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Spend</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                          $
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Minimum purchase amount required (0 for no minimum)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="applicationMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Method</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select application method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AUTOMATIC">Apply Automatically</SelectItem>
                        <SelectItem value="CODE">Code Entry Required</SelectItem>
                        <SelectItem value="QR_CODE">QR Code Scan Required</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How this reward will be applied
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="maxRedemptionsPerCustomer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Per Customer</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          placeholder="Unlimited"
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Max redemptions per customer
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maxTotalRedemptions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Total Redemptions</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          placeholder="Unlimited"
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Overall redemption limit
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {membershipTiers.length > 0 && (
                <FormField
                  control={form.control}
                  name="membershipTierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Membership Tier</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Available to all tiers" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Available to all tiers</SelectItem>
                          {membershipTiers.map((tier) => (
                            <SelectItem key={tier.id} value={tier.id}>
                              {tier.name} and above
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Restrict this redemption rule to specific membership tier(s)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Enable or disable this redemption rule
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : currentRule ? 'Update Rule' : 'Create Rule'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{currentRule?.name}" redemption rule.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRule} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}