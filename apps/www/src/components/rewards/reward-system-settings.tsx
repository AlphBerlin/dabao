'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import axios from 'axios';
import { toast } from 'sonner';

import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
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
import { Badge } from '@workspace/ui/components/badge';
import { Separator } from '@workspace/ui/components/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';

// Schema for reward system form
const rewardPreferencesSchema = z.object({
  rewardSystemType: z.enum(['POINTS', 'STAMPS', 'BOTH']),
  pointsName: z.string().min(1, 'Points name is required').max(50).optional(),
  pointsAbbreviation: z.string().min(1, 'Abbreviation is required').max(10).optional(),
  pointsToStampRatio: z.coerce.number().int().min(1, 'Must be at least 1').optional(),
  pointsExpiryDays: z.coerce.number().int().min(1, 'Must be at least 1').optional().nullable(),
  stampsPerCard: z.coerce.number().int().min(1, 'Must be at least 1').max(100, 'Maximum 100 stamps per card').optional(),
  pointsCollectionMechanism: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CUSTOM']).default('MEDIUM'),
  customPointsRatio: z.coerce.number().min(0.01, 'Must be greater than 0').optional(),
});

type FormValues = z.infer<typeof rewardPreferencesSchema>;

export default function RewardSystemSettings({
  projectId,
  preferences,
}: {
  projectId: string;
  preferences: any | null;
}) {
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with existing preferences
  const form = useForm<FormValues>({
    resolver: zodResolver(rewardPreferencesSchema),
    defaultValues: {
      rewardSystemType: preferences?.rewardSystemType || 'POINTS',
      pointsName: preferences?.pointsName || 'Points',
      pointsAbbreviation: preferences?.pointsAbbreviation || 'pts',
      pointsToStampRatio: preferences?.pointsToStampRatio || 10,
      pointsExpiryDays: preferences?.pointsExpiryDays || null,
      stampsPerCard: preferences?.stampsPerCard || 10,
      pointsCollectionMechanism: preferences?.pointsCollectionMechanism || 'MEDIUM',
      customPointsRatio: preferences?.customPointsRatio || 1,
    },
  });

  const rewardSystemType = form.watch('rewardSystemType');
  const pointsCollectionMechanism = form.watch('pointsCollectionMechanism');

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      await axios.patch(`/api/projects/${projectId}/preferences/rewards`, data);
      toast.success('Reward system settings saved successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Reward System Configuration</CardTitle>
            <CardDescription>
              Choose between a point-based or stamp-based reward system for your customers.
              You can only select one system type per project.
            </CardDescription>
          </div>
          {preferences && <Badge variant="outline">Active</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rewardSystemType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reward System Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reward system type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="POINTS">Points Only</SelectItem>
                      <SelectItem value="STAMPS">Stamps Only</SelectItem>
                      <SelectItem value="BOTH">Both Points & Stamps</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose whether to use points, stamps, or both for your rewards program
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(rewardSystemType === 'POINTS' || rewardSystemType === 'BOTH') && (
              <>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="pointsName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Points" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormDescription>
                          What to call your points (e.g., Stars, Credits, Coins)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pointsAbbreviation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points Abbreviation</FormLabel>
                        <FormControl>
                          <Input placeholder="pts" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormDescription>
                          Short form of your points name (e.g., pts, ★)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="pointsExpiryDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points Expiry (Days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="365"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of days after which points expire (leave empty for no expiry)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pointsCollectionMechanism"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points Collection Mechanism</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select collection mechanism" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LOW">Low (10% of purchase)</SelectItem>
                          <SelectItem value="MEDIUM">Medium (30% of purchase)</SelectItem>
                          <SelectItem value="HIGH">High (50% of purchase)</SelectItem>
                          <SelectItem value="CUSTOM">Custom percentage</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose how many points customers earn relative to their purchase amount
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {pointsCollectionMechanism === 'CUSTOM' && (
                  <FormField
                    control={form.control}
                    name="customPointsRatio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Points Ratio</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1.0"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          Define your custom points ratio
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            {(rewardSystemType === 'STAMPS' || rewardSystemType === 'BOTH') && (
              <>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="stampsPerCard"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stamps Per Card</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="10" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormDescription>
                          Number of stamps needed to complete a card
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {rewardSystemType === 'BOTH' && (
                    <FormField
                      control={form.control}
                      name="pointsToStampRatio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points to Stamp Conversion Ratio</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="10" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormDescription>
                            How many points equal one stamp (e.g., 10 points = 1 stamp)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </>
            )}

            <div className="pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}