'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Edit, Trash2, ChevronUp, ChevronDown, Award } from 'lucide-react';
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
import { Switch } from '@workspace/ui/components/switch';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Badge } from '@workspace/ui/components/badge';
import { EmptyState } from '@/components/empty-state';

// Schema for membership tier creation
const membershipTierSchema = z.object({
  name: z.string().min(1, 'Tier name is required').max(50),
  description: z.string().optional(),
  level: z.coerce.number().int().min(1, 'Level must be at least 1'),
  pointsThreshold: z.coerce.number().int().min(0).optional().nullable(),
  stampsThreshold: z.coerce.number().int().min(0).optional().nullable(),
  spendThreshold: z.coerce.number().min(0).optional().nullable(),
  subscriptionFee: z.coerce.number().min(0).optional().nullable(),
  autoUpgrade: z.boolean().optional().default(true),
  pointsMultiplier: z.coerce.number().min(1).optional().default(1.0),
});

type FormValues = z.infer<typeof membershipTierSchema>;

export default function MembershipTiersList({
  projectId,
  rewardSystemType
}: {
  projectId: string;
  rewardSystemType: string;
}) {
  const router = useRouter();
  const [tiers, setTiers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Load membership tiers
  const loadTiers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/projects/${projectId}/memberships/tiers`);
      setTiers(response.data.tiers || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load membership tiers');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(membershipTierSchema),
    defaultValues: {
      name: '',
      description: '',
      level: 1,
      pointsThreshold: rewardSystemType === 'POINTS' ? 0 : null,
      stampsThreshold: rewardSystemType === 'STAMPS' ? 0 : null,
      spendThreshold: null,
      subscriptionFee: null,
      autoUpgrade: true,
      pointsMultiplier: 1.0,
    },
  });

  // Load tiers on component mount
  useEffect(() => {
    loadTiers();
  }, [projectId]);

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      // Submit either pointsThreshold or stampsThreshold based on reward system type
      if (rewardSystemType === 'POINTS') {
        data.stampsThreshold = null;
      } else {
        data.pointsThreshold = null;
      }
      
      await axios.post(`/api/projects/${projectId}/memberships/tiers`, data);
      toast.success('Membership tier created successfully');
      setIsDialogOpen(false);
      form.reset();
      loadTiers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create membership tier');
    } finally {
      setIsLoading(false);
    }
  };

  // Format threshold display based on reward system type
  const formatThreshold = (tier: any) => {
    if (rewardSystemType === 'POINTS' && tier.pointsThreshold) {
      return `${tier.pointsThreshold} Points`;
    } else if (rewardSystemType === 'STAMPS' && tier.stampsThreshold) {
      return `${tier.stampsThreshold} Stamps`;
    } else if (tier.spendThreshold) {
      return `$${tier.spendThreshold} Spent`;
    } else if (tier.subscriptionFee) {
      return `$${tier.subscriptionFee} Subscription`;
    } else {
      return 'Default Tier';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Membership Tiers</CardTitle>
          <CardDescription>
            Define membership levels and progression rules for your customers.
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Tier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New Membership Tier</DialogTitle>
              <DialogDescription>
                Define a new membership level with progression requirements.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tier Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Silver" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tier Level</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormDescription>
                          Higher number = higher tier
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Benefits and details about this tier" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Progression requirements */}
                <div className="grid grid-cols-2 gap-4">
                  {rewardSystemType === 'POINTS' && (
                    <FormField
                      control={form.control}
                      name="pointsThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points Required</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="1000"
                              {...field}
                              value={field.value === null ? '' : field.value}
                              onChange={(e) => {
                                const value = e.target.value === '' ? null : parseInt(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Points needed to reach this tier
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {rewardSystemType === 'STAMPS' && (
                    <FormField
                      control={form.control}
                      name="stampsThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stamps Required</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="10"
                              {...field}
                              value={field.value === null ? '' : field.value}
                              onChange={(e) => {
                                const value = e.target.value === '' ? null : parseInt(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Stamps needed to reach this tier
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="spendThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Spend Threshold</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="500"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseFloat(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Amount spent to reach this tier
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subscriptionFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subscription Fee</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseFloat(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional fee to join this tier (0 for free)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="pointsMultiplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points Multiplier</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            step="0.1"
                            placeholder="1.0"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Points earning multiplier for this tier
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="autoUpgrade"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Auto-upgrade eligible customers
                        </FormLabel>
                        <FormDescription>
                          Automatically upgrade customers when they reach the requirements
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Tier'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {tiers.length === 0 ? (
          <EmptyState
            icon={<Award className="w-12 h-12 text-muted-foreground" />}
            title="No membership tiers created"
            description="Create your first membership tier to enable customer progression."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Requirement</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Multiplier</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell>{tier.level}</TableCell>
                  <TableCell>
                    <div className="font-medium">{tier.name}</div>
                    {tier.description && (
                      <div className="text-sm text-muted-foreground">{tier.description}</div>
                    )}
                  </TableCell>
                  <TableCell>{formatThreshold(tier)}</TableCell>
                  <TableCell>{tier._count?.customerMemberships || 0}</TableCell>
                  <TableCell>{tier.pointsMultiplier}x</TableCell>
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