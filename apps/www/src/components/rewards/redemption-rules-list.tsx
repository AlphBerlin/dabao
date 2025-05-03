'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Edit, Trash2, RefreshCw, Settings2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Badge } from '@workspace/ui/components/badge';
import { EmptyState } from '@/components/empty-state';
import { Switch } from '@workspace/ui/components/switch';

// Schema for redemption rule creation
const redemptionRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required').max(100),
  description: z.string().optional(),
  ruleType: z.string(),
  pointsRequired: z.coerce.number().int().min(1).optional(),
  stampsRequired: z.coerce.number().int().min(1).optional(),
  outputType: z.enum(['VOUCHER', 'PRODUCT', 'TIER_UPGRADE']),
  voucherId: z.string().optional(),
  productId: z.string().optional(),
  tierUpgradeId: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof redemptionRuleSchema>;

export default function RedemptionRulesList({
  projectId,
  rewardSystemType
}: {
  projectId: string;
  rewardSystemType: string;
}) {
  const router = useRouter();
  const [rules, setRules] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(redemptionRuleSchema),
    defaultValues: {
      name: '',
      description: '',
      ruleType: rewardSystemType === 'POINTS' ? 'POINTS_TO_VOUCHER' : 'STAMPS_TO_VOUCHER',
      pointsRequired: rewardSystemType === 'POINTS' ? 100 : undefined,
      stampsRequired: rewardSystemType === 'STAMPS' ? 10 : undefined,
      outputType: 'VOUCHER',
      isActive: true,
    },
  });

  // Load redemption rules
  const loadRules = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/projects/${projectId}/redemption-rules`);
      setRules(response.data.rules || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load redemption rules');
    } finally {
      setIsLoading(false);
    }
  };

  // Load vouchers
  const loadVouchers = async () => {
    try {
      const response = await axios.get(`/api/projects/${projectId}/vouchers`);
      setVouchers(response.data.vouchers || []);
    } catch (error) {
      console.error('Error loading vouchers', error);
    }
  };

  // Load membership tiers
  const loadTiers = async () => {
    try {
      const response = await axios.get(`/api/projects/${projectId}/memberships/tiers`);
      setTiers(response.data.tiers || []);
    } catch (error) {
      console.error('Error loading membership tiers', error);
    }
  };

  // Set the correct rule type options based on reward system type
  const getRuleTypeOptions = () => {
    if (rewardSystemType === 'POINTS') {
      return [
        { value: 'POINTS_TO_VOUCHER', label: 'Points for Voucher' },
        { value: 'POINTS_TO_PRODUCT', label: 'Points for Product' }
      ];
    } else {
      return [
        { value: 'STAMPS_TO_VOUCHER', label: 'Stamps for Voucher' },
        { value: 'STAMPS_TO_TIER_UPGRADE', label: 'Stamps for Tier Upgrade' }
      ];
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadRules();
    loadVouchers();
    loadTiers();
  }, [projectId]);

  // Handle rule type change
  const handleRuleTypeChange = (value: string) => {
    // Reset output-related fields when rule type changes
    form.setValue('voucherId', undefined);
    form.setValue('productId', undefined);
    form.setValue('tierUpgradeId', undefined);
    
    // Set output type based on rule type
    if (value === 'POINTS_TO_VOUCHER' || value === 'STAMPS_TO_VOUCHER') {
      form.setValue('outputType', 'VOUCHER');
    } else if (value === 'POINTS_TO_PRODUCT') {
      form.setValue('outputType', 'PRODUCT');
    } else if (value === 'STAMPS_TO_TIER_UPGRADE') {
      form.setValue('outputType', 'TIER_UPGRADE');
    }
  };

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      // Validate that required fields are present based on output type
      if (data.outputType === 'VOUCHER' && !data.voucherId) {
        toast.error('Please select a voucher');
        setIsLoading(false);
        return;
      }
      
      if (data.outputType === 'TIER_UPGRADE' && !data.tierUpgradeId) {
        toast.error('Please select a membership tier');
        setIsLoading(false);
        return;
      }
      
      await axios.post(`/api/projects/${projectId}/redemption-rules`, data);
      toast.success('Redemption rule created successfully');
      setIsDialogOpen(false);
      form.reset({
        name: '',
        description: '',
        ruleType: rewardSystemType === 'POINTS' ? 'POINTS_TO_VOUCHER' : 'STAMPS_TO_VOUCHER',
        pointsRequired: rewardSystemType === 'POINTS' ? 100 : undefined,
        stampsRequired: rewardSystemType === 'STAMPS' ? 10 : undefined,
        outputType: 'VOUCHER',
        isActive: true,
      });
      loadRules();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create redemption rule');
    } finally {
      setIsLoading(false);
    }
  };

  // Get a readable description of what users get when redeeming
  const getRewardDescription = (rule: any) => {
    const inputAmount = rule.pointsRequired || rule.stampsRequired;
    const inputType = rule.pointsRequired ? 'Points' : 'Stamps';
    
    if (rule.outputType === 'VOUCHER') {
      const voucher = vouchers.find(v => v.id === rule.voucherId);
      return voucher ? `${inputAmount} ${inputType} for ${voucher.name}` : `${inputAmount} ${inputType} for Voucher`;
    } else if (rule.outputType === 'PRODUCT') {
      return `${inputAmount} ${inputType} for Product`;
    } else if (rule.outputType === 'TIER_UPGRADE') {
      const tier = tiers.find(t => t.id === rule.tierUpgradeId);
      return tier ? `${inputAmount} ${inputType} for ${tier.name} membership` : `${inputAmount} ${inputType} for Tier Upgrade`;
    }
    return 'Unknown reward';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Redemption Rules</CardTitle>
          <CardDescription>
            Configure how customers can redeem their {rewardSystemType === 'POINTS' ? 'points' : 'stamps'} for rewards.
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create Redemption Rule</DialogTitle>
              <DialogDescription>
                Define how customers can redeem their {rewardSystemType === 'POINTS' ? 'points' : 'stamps'} for rewards.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rule Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Free Coffee Voucher" {...field} />
                      </FormControl>
                      <FormDescription>
                        A clear name for this redemption rule
                      </FormDescription>
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
                          placeholder="Details about this redemption rule" 
                          {...field}
                          value={field.value || ''}
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
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleRuleTypeChange(value);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select rule type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getRuleTypeOptions().map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {rewardSystemType === 'POINTS' && (
                  <FormField
                    control={form.control}
                    name="pointsRequired"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points Required</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="100"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Number of points needed for redemption
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {rewardSystemType === 'STAMPS' && (
                  <FormField
                    control={form.control}
                    name="stampsRequired"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stamps Required</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="10"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Number of stamps needed for redemption
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {form.watch('outputType') === 'VOUCHER' && (
                  <FormField
                    control={form.control}
                    name="voucherId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Voucher</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a voucher" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vouchers.length === 0 ? (
                              <SelectItem value="no_vouchers" disabled>
                                No vouchers available
                              </SelectItem>
                            ) : (
                              vouchers.map(voucher => (
                                <SelectItem key={voucher.id} value={voucher.id}>
                                  {voucher.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {vouchers.length === 0 ? (
                            <span className="text-red-500">Please create vouchers first</span>
                          ) : (
                            'The voucher to award when redeeming'
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {form.watch('outputType') === 'TIER_UPGRADE' && (
                  <FormField
                    control={form.control}
                    name="tierUpgradeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Membership Tier</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a tier" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tiers.length === 0 ? (
                              <SelectItem value="no_tiers" disabled>
                                No membership tiers available
                              </SelectItem>
                            ) : (
                              tiers.map(tier => (
                                <SelectItem key={tier.id} value={tier.id}>
                                  {tier.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {tiers.length === 0 ? (
                            <span className="text-red-500">Please create membership tiers first</span>
                          ) : (
                            'The tier to upgrade customers to when redeeming'
                          )}
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
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Make this rule available for customers to use
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Rule'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <EmptyState
            icon={<Settings2 className="w-12 h-12 text-muted-foreground" />}
            title="No redemption rules created"
            description={`Create your first rule to let customers redeem their ${rewardSystemType === 'POINTS' ? 'points' : 'stamps'} for rewards.`}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Redemption</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <div className="font-medium">{rule.name}</div>
                    {rule.description && (
                      <div className="text-sm text-muted-foreground">{rule.description}</div>
                    )}
                  </TableCell>
                  <TableCell>{getRewardDescription(rule)}</TableCell>
                  <TableCell>
                    {rule.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}