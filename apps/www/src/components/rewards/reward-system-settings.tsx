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
  CardFooter,
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
import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group';
import { Switch } from '@workspace/ui/components/switch';

// Schema for reward system form
const rewardPreferencesSchema = z.object({
  rewardSystemType: z.enum(['POINTS', 'STAMPS']),
  pointsName: z.string().min(1, 'Points name is required').max(50).optional(),
  pointsAbbreviation: z.string().min(1, 'Abbreviation is required').max(10).optional(),
  pointsToStampRatio: z.coerce.number().int().min(1, 'Must be at least 1').optional(),
  pointsExpiryDays: z.coerce.number().int().min(1, 'Must be at least 1').optional().nullable(),
  stampsPerCard: z.coerce.number().int().min(1, 'Must be at least 1').max(100, 'Maximum 100 stamps per card').optional(),
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
    },
  });

  const rewardSystemType = form.watch('rewardSystemType');

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
        <CardTitle>Reward System Configuration</CardTitle>
        <CardDescription>
          Choose between a point-based or stamp-based reward system for your customers.
          You can only select one system type per project.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rewardSystemType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Reward System Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="POINTS" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Point-based System
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Customers earn points with purchases and can redeem them for rewards
                        </FormDescription>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="STAMPS" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Stamp-based System
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Customers collect stamps on a card and redeem completed cards for rewards
                        </FormDescription>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {rewardSystemType === 'POINTS' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pointsName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Points" {...field} />
                        </FormControl>
                        <FormDescription>
                          What you call your loyalty points (e.g. Stars, Coins)
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
                          <Input placeholder="pts" {...field} />
                        </FormControl>
                        <FormDescription>
                          Short form (e.g. pts, ★)
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
                      <FormLabel>Points Expiry</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="365"
                          {...field}
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : parseInt(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of days until points expire (leave empty for no expiry)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {rewardSystemType === 'STAMPS' && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="stampsPerCard"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stamps Per Card</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          placeholder="10"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of stamps needed to complete a card
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pointsToStampRatio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points to Stamp Ratio</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="10"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        How many points equal one stamp (for conversion)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}