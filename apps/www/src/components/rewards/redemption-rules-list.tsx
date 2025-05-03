'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, Gift, Scroll } from 'lucide-react';
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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@workspace/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";

// Define schema for redemption rule
const redemptionRuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  ruleType: z.enum(['POINTS_TO_VOUCHER', 'STAMPS_TO_VOUCHER', 'POINTS_TO_PRODUCT', 'STAMPS_TO_TIER_UPGRADE']),
  pointsRequired: z.coerce.number().int().optional(),
  stampsRequired: z.coerce.number().int().optional(),
  outputType: z.enum(['VOUCHER', 'PRODUCT', 'TIER_UPGRADE']),
  voucherId: z.string().optional(),
  productId: z.string().optional(),
  tierUpgradeId: z.string().optional(),
  minimumSpend: z.coerce.number().min(0, 'Must be non-negative').default(0),
  isActive: z.boolean().default(true),
}).refine((data) => {
  // Validate that points are required for POINTS rules
  if (data.ruleType.includes('POINTS')) {
    return data.pointsRequired !== undefined && data.pointsRequired > 0;
  }
  return true;
}, {
  message: "Points are required and must be greater than 0 for points-based rules",
  path: ["pointsRequired"],
}).refine((data) => {
  // Validate that stamps are required for STAMPS rules
  if (data.ruleType.includes('STAMPS')) {
    return data.stampsRequired !== undefined && data.stampsRequired > 0;
  }
  return true;
}, {
  message: "Stamps are required and must be greater than 0 for stamp-based rules",
  path: ["stampsRequired"],
}).refine((data) => {
  // Validate output IDs based on outputType
  if (data.outputType === 'VOUCHER') {
    return !!data.voucherId;
  } else if (data.outputType === 'PRODUCT') {
    return !!data.productId;
  } else if (data.outputType === 'TIER_UPGRADE') {
    return !!data.tierUpgradeId;
  }
  return true;
}, {
  message: "You must select a value for the selected output type",
  path: ["outputType"],
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
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(redemptionRuleSchema),
    defaultValues: {
      name: '',
      description: '',
      ruleType: 'POINTS_TO_VOUCHER',
      pointsRequired: 0,
      stampsRequired: 0,
      outputType: 'VOUCHER',
      voucherId: undefined,
      productId: undefined,
      tierUpgradeId: undefined,
      minimumSpend: 0,
      isActive: true,
    },
  });

  // Form field watches
  const ruleType = form.watch('ruleType');
  const outputType = form.watch('outputType');

  // Fetch redemption rules and related data on component mount
  useEffect(() => {
    fetchRedemptionRules();
    fetchMembershipTiers();
    fetchVouchers();
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
  
  const fetchVouchers = async () => {
    try {
      const response = await axios.get(`/api/projects/${projectId}/vouchers`);
      setVouchers(response.data.vouchers);
    } catch (error) {
      console.error('Failed to fetch vouchers:', error);
    }
  };

  const openCreateDialog = () => {
    form.reset({
      name: '',
      description: '',
      ruleType: 'POINTS_TO_VOUCHER',
      pointsRequired: rewardSystemType !== 'STAMPS' ? 100 : 0,
      stampsRequired: rewardSystemType !== 'POINTS' ? 1 : 0,
      outputType: 'VOUCHER',
      voucherId: undefined,
      productId: undefined,
      tierUpgradeId: undefined,
      minimumSpend: 0,
      isActive: true,
    });
    setCurrentRule(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (rule: RedemptionRule) => {
    form.reset({
      name: rule.name,
      description: rule.description,
      ruleType: rule.ruleType,
      pointsRequired: rule.pointsRequired,
      stampsRequired: rule.stampsRequired,
      outputType: rule.outputType,
      voucherId: rule.voucherId,
      productId: rule.productId,
      tierUpgradeId: rule.tierUpgradeId,
      minimumSpend: rule.minimumSpend,
      isActive: rule.isActive,
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

  const getRuleTypeLabel = (type: string) => {
    switch (type) {
      case 'POINTS_TO_VOUCHER': return 'Points to Voucher';
      case 'STAMPS_TO_VOUCHER': return 'Stamps to Voucher';
      case 'POINTS_TO_PRODUCT': return 'Points to Product';
      case 'STAMPS_TO_TIER_UPGRADE': return 'Stamps to Tier Upgrade';
      default: return type;
    }
  };

  const getOutputTypeLabel = (type: string) => {
    switch (type) {
      case 'VOUCHER': return 'Voucher';
      case 'PRODUCT': return 'Product';
      case 'TIER_UPGRADE': return 'Tier Upgrade';
      default: return type;
    }
  };

  const onSubmit = async (data: FormValues) => {
    console.log("Form data:", data);
    setIsLoading(true);
    try {
      // Make sure we're correctly mapping rule type and output type
      const formData = {
        ...data,
        // Ensure we always send the required fields
        ruleType: data.ruleType,
        outputType: data.outputType,
        // Set points or stamps based on rule type
        pointsRequired: data.ruleType.includes('POINTS') ? data.pointsRequired : undefined,
        stampsRequired: data.ruleType.includes('STAMPS') ? data.stampsRequired : undefined,
        // Set the appropriate ID based on output type
        voucherId: data.outputType === 'VOUCHER' ? data.voucherId : undefined,
        productId: data.outputType === 'PRODUCT' ? data.productId : undefined,
        tierUpgradeId: data.outputType === 'TIER_UPGRADE' ? data.tierUpgradeId : undefined,
      };
      
      if (currentRule) {
        // Update existing redemption rule
        await axios.patch(`/api/projects/${projectId}/redemption-rules/${currentRule.id}`, formData);
        toast.success(`${data.name} redemption rule updated successfully`);
      } else {
        // Create new redemption rule
        await axios.post(`/api/projects/${projectId}/redemption-rules`, formData);
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
                      <th className="p-2 font-medium">Output</th>
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
                            {getRuleTypeLabel(rule.ruleType)}
                          </Badge>
                        </td>
                        <td className="p-2">
                          {rewardSystemType === 'POINTS' || rewardSystemType === 'BOTH' ? (
                            <div className="whitespace-nowrap">{rule.pointsRequired} points</div>
                          ) : rewardSystemType === 'STAMPS' ? (
                            <div className="whitespace-nowrap">{rule.stampsRequired} stamps</div>
                          ) : (
                            <div className="whitespace-nowrap">
                              {rule.pointsRequired} points / {rule.stampsRequired} stamps
                            </div>
                          )}
                        </td>
                        <td className="p-2">
                          <Badge variant="secondary">
                            {getOutputTypeLabel(rule.outputType)}
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
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
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
            <form onSubmit={(e) => {
              console.log("Form submitted");
              form.handleSubmit(onSubmit)(e);
            }} className="space-y-4">
              {/* Log form validation state */}
              <div className="text-xs text-red-500">
                {Object.keys(form.formState.errors).length > 0 && (
                  <div>Form has errors: {JSON.stringify(form.formState.errors)}</div>
                )}
              </div>
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
                name="ruleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rule type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="POINTS_TO_VOUCHER">Points to Voucher</SelectItem>
                        <SelectItem value="STAMPS_TO_VOUCHER">Stamps to Voucher</SelectItem>
                        <SelectItem value="POINTS_TO_PRODUCT">Points to Product</SelectItem>
                        <SelectItem value="STAMPS_TO_TIER_UPGRADE">Stamps to Tier Upgrade</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      What kind of rule will be applied
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                {(rewardSystemType === 'POINTS' || rewardSystemType === 'BOTH') && (
                  <FormField
                    control={form.control}
                    name="pointsRequired"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points Required</FormLabel>
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
                    name="stampsRequired"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stamps Required</FormLabel>
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
              
              <FormField
                control={form.control}
                name="outputType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Output Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select output type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="VOUCHER">Voucher</SelectItem>
                        <SelectItem value="PRODUCT">Product</SelectItem>
                        <SelectItem value="TIER_UPGRADE">Tier Upgrade</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      What kind of output will the customer receive
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {outputType === 'VOUCHER' && (
                <FormField
                  control={form.control}
                  name="voucherId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Select Voucher</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? vouchers.find((voucher) => voucher.id === field.value)?.name || "Select voucher"
                                : "Select voucher"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search vouchers..." />
                            <CommandEmpty>No voucher found.</CommandEmpty>
                            <CommandGroup className="max-h-[300px] overflow-y-auto">
                              {vouchers.map((voucher) => (
                                <CommandItem
                                  value={voucher.name}
                                  key={voucher.id}
                                  onSelect={() => {
                                    form.setValue("voucherId", voucher.id);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      voucher.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {voucher.name} ({voucher.code})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Select which voucher will be granted
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {outputType === 'PRODUCT' && (
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter product ID"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {outputType === 'TIER_UPGRADE' && (
                <FormField
                  control={form.control}
                  name="tierUpgradeId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Select Membership Tier</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? membershipTiers.find((tier) => tier.id === field.value)?.name || "Select membership tier"
                                : "Select membership tier"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search tiers..." />
                            <CommandEmpty>No membership tier found.</CommandEmpty>
                            <CommandGroup className="max-h-[300px] overflow-y-auto">
                              {membershipTiers.map((tier) => (
                                <CommandItem
                                  value={tier.name}
                                  key={tier.id}
                                  onSelect={() => {
                                    form.setValue("tierUpgradeId", tier.id);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      tier.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {tier.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Select which membership tier the customer will be upgraded to
                      </FormDescription>
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