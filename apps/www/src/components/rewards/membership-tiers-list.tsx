'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
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
  DialogTitle
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
import { Label } from '@workspace/ui/components/label';

// Schema for membership tier
const membershipTierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  thresholdPoints: z.coerce.number().int().min(0, 'Must be a non-negative number'),
  thresholdSpend: z.coerce.number().min(0, 'Must be a non-negative number'),
  multiplier: z.coerce.number().min(1, 'Multiplier must be at least 1'),
  benefits: z.array(z.string()).optional(),
});

type MembershipTier = z.infer<typeof membershipTierSchema> & { 
  id: string;
  createdAt: string;
  updatedAt: string;
  level?: number;
  memberCount?: number;
};

export default function MembershipTiersList({
  projectId,
  rewardSystemType,
}: {
  projectId: string;
  rewardSystemType: string;
}) {
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTier, setCurrentTier] = useState<MembershipTier | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [benefits, setBenefits] = useState<string[]>(['']);
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const form = useForm<z.infer<typeof membershipTierSchema>>({
    resolver: zodResolver(membershipTierSchema),
    defaultValues: {
      name: '',
      description: '',
      thresholdPoints: 0,
      thresholdSpend: 0,
      multiplier: 1,
      benefits: [''],
    },
  });

  // Fetch membership tiers on component mount
  useEffect(() => {
    fetchMembershipTiers();
  }, [projectId]);

  const fetchMembershipTiers = async () => {
    setLoadingState('loading');
    try {
      const response = await axios.get(`/api/projects/${projectId}/memberships/tiers`);
      
      // Ensure we have the data in the correct format
      if (response.data.tiers) {
        const formattedTiers = response.data.tiers.map((tier: any) => {
          return {
            ...tier,
            benefits: Array.isArray(tier.benefits) ? tier.benefits : [],
          };
        });
        setTiers(formattedTiers);
      } else {
        setTiers([]);
      }
      setLoadingState('success');
    } catch (error) {
      console.error('Failed to fetch membership tiers:', error);
      toast.error('Failed to load membership tiers');
      setLoadingState('error');
    }
  };

  const openCreateDialog = () => {
    form.reset({
      name: '',
      description: '',
      thresholdPoints: 0,
      thresholdSpend: 0,
      multiplier: 1,
      benefits: ['']
    });
    setBenefits(['']);
    setCurrentTier(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (tier: MembershipTier) => {
    // Ensure benefits is an array
    const tierBenefits = Array.isArray(tier.benefits) ? tier.benefits : [];
    
    form.reset({
      name: tier.name,
      description: tier.description,
      thresholdPoints: tier.thresholdPoints,
      thresholdSpend: tier.thresholdSpend,
      multiplier: tier.multiplier,
      benefits: tierBenefits.length > 0 ? tierBenefits : ['']
    });
    setBenefits(tierBenefits.length > 0 ? tierBenefits : ['']);
    setCurrentTier(tier);
    setIsDialogOpen(true);
  };

  const handleDeleteTier = async () => {
    if (!currentTier) return;
    setIsLoading(true);
    try {
      await axios.delete(`/api/projects/${projectId}/memberships/tiers/${currentTier.id}`);
      toast.success(`${currentTier.name} membership tier deleted`);
      // Refresh data
      fetchMembershipTiers();
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to delete membership tier:', error);
      toast.error(error.response?.data?.error || 'Failed to delete membership tier');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDialogOpen = (tier: MembershipTier) => {
    setCurrentTier(tier);
    setIsDeleteDialogOpen(true);
  };

  const addBenefit = () => {
    setBenefits([...benefits, '']);
  };

  const removeBenefit = (index: number) => {
    const newBenefits = [...benefits];
    newBenefits.splice(index, 1);
    setBenefits(newBenefits);
  };

  const updateBenefit = (index: number, value: string) => {
    const newBenefits = [...benefits];
    newBenefits[index] = value;
    setBenefits(newBenefits);
    
    // Update the form value as well
    const currentBenefits = form.getValues().benefits || [];
    const updatedBenefits = [...currentBenefits];
    updatedBenefits[index] = value;
    form.setValue('benefits', updatedBenefits);
  };

  const moveUp = async (index: number) => {
    if (index <= 0) return;
    try {
      setIsLoading(true);
      await axios.post(`/api/projects/${projectId}/memberships/tiers/reorder`, {
        tierId: tiers[index].id,
        direction: 'up'
      });
      fetchMembershipTiers();
      toast.success('Membership tier order updated');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update tier order');
    } finally {
      setIsLoading(false);
    }
  };

  const moveDown = async (index: number) => {
    if (index >= tiers.length - 1) return;
    try {
      setIsLoading(true);
      await axios.post(`/api/projects/${projectId}/memberships/tiers/reorder`, {
        tierId: tiers[index].id,
        direction: 'down'
      });
      fetchMembershipTiers();
      toast.success('Membership tier order updated');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update tier order');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof membershipTierSchema>) => {
    // Filter out empty benefit strings
    const filteredBenefits = benefits.filter(benefit => benefit.trim() !== '');
    const finalData = { ...data, benefits: filteredBenefits };

    setIsLoading(true);
    try {
      if (currentTier) {
        // Update existing tier
        const response = await axios.patch(`/api/projects/${projectId}/memberships/tiers/${currentTier.id}`, finalData);
        toast.success(`${finalData.name} membership tier updated`);
      } else {
        // Create new tier
        const response = await axios.post(`/api/projects/${projectId}/memberships/tiers`, finalData);
        toast.success(`${finalData.name} membership tier created`);
      }
      
      // Refresh data and reset form
      fetchMembershipTiers();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to save membership tier:', error);
      const errorMessage = error.response?.data?.error || 
        (error.response?.data?.details && 'Validation error. Please check your inputs.') || 
        'Failed to save membership tier';
      toast.error(errorMessage);
      
      // Show detailed validation errors if available
      if (error.response?.data?.details) {
        const details = error.response.data.details;
        for (const field in details) {
          if (details[field]?._errors) {
            details[field]._errors.forEach((err: string) => {
              toast.error(`${field}: ${err}`);
            });
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Membership Tiers</CardTitle>
            <CardDescription>
              Define membership tiers that customers can achieve based on points or spending
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Tier
          </Button>
        </CardHeader>
        <CardContent>
          {loadingState === 'loading' ? (
            <div className="py-8 text-center">Loading membership tiers...</div>
          ) : loadingState === 'error' ? (
            <div className="py-8 text-center text-red-500">
              Failed to load membership tiers. Please try again.
            </div>
          ) : tiers.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No membership tiers created yet.</p>
              <Button onClick={openCreateDialog} className="mt-4">
                Create your first tier
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tiers.map((tier, index) => (
                <div
                  key={tier.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  style={{ borderLeftWidth: '4px' }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{tier.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                    <div className="mt-2 text-sm">
                      {rewardSystemType !== 'STAMPS' && (
                        <span className="mr-4">
                          <strong>Threshold:</strong> {tier.thresholdPoints} points
                        </span>
                      )}
                      <span className="mr-4">
                        <strong>Spend:</strong> ${tier.thresholdSpend}
                      </span>
                      <span>
                        <strong>Multiplier:</strong> {tier.multiplier}x
                      </span>
                    </div>
                    {tier.benefits && tier.benefits.length > 0 && (
                      <div className="mt-2">
                        <strong className="text-sm">Benefits:</strong>
                        <ul className="list-disc list-inside text-sm">
                          {tier.benefits.map((benefit, i) => (
                            <li key={i}>{benefit}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveUp(index)}
                        disabled={index === 0 || isLoading}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveDown(index)}
                        disabled={index === tiers.length - 1 || isLoading}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(tier)}
                      disabled={isLoading}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteDialogOpen(tier)}
                      disabled={ isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentTier ? `Edit ${currentTier.name}` : 'Create a New Membership Tier'}
            </DialogTitle>
            <DialogDescription>
              {currentTier
                ? 'Edit the details of this membership tier'
                : 'Define a new tier for your loyalty program'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tier Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Bronze, Silver, Gold, etc." {...field} />
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
                        placeholder="A brief description of this tier and its benefits"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="thresholdPoints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points Threshold</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Points needed to reach this tier
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="thresholdSpend"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Spend Threshold</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
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
                  name="multiplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points Multiplier</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" min="1" {...field} />
                      </FormControl>
                      <FormDescription>
                        Points earned multiplier for this tier
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
                
                
              
              <div className="space-y-2">
                <Label>Benefits</Label>
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={benefit}
                      onChange={(e) => updateBenefit(index, e.target.value)}
                      placeholder={`Benefit ${index + 1}`}
                    />
                    {benefits.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBenefit(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBenefit}
                  className="mt-2"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Benefit
                </Button>
              </div>
              
            

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : currentTier ? 'Update Tier' : 'Create Tier'}
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
              This will permanently delete the "{currentTier?.name}" membership tier.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTier} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}