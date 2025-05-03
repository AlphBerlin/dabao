'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, Copy } from 'lucide-react';
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
  DialogTrigger,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/popover';
import { Calendar } from '@workspace/ui/components/calendar';
import { format } from 'date-fns';
import { cn } from '@workspace/ui/lib/utils';
import { CalendarIcon } from 'lucide-react';
import {undefined} from "zod";

const voucherSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(50),
  description: z.string().min(1, 'Description is required'),
  discountType: z.enum(['FIXED', 'PERCENTAGE']),
  discountValue: z.coerce.number().min(0, 'Must be a non-negative number'),
  minimumSpend: z.coerce.number().min(0, 'Must be a non-negative number'),
  pointsCost: z.coerce.number().int().min(0, 'Must be a non-negative number'),
  maxRedemptions: z.coerce.number().int().min(1, 'Must be at least 1').optional(),
  validFrom: z.date(),
  validUntil: z.date(),
  isActive: z.boolean().default(true),
});

type Voucher = z.infer<typeof voucherSchema> & {
  id: string;
  createdAt: string;
  updatedAt: string;
  redeemCount: number;
};

export default function VouchersList({
  projectId,
}: {
  projectId: string;
}) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentVoucher, setCurrentVoucher] = useState<Voucher | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loadingState, setLoadingState] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');

  // @ts-ignore
  const form = useForm<z.infer<typeof voucherSchema>>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minimumSpend: 0,
      pointsCost: 0,
      maxRedemptions: undefined,
      validFrom: new Date(),
      validUntil: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      isActive: true,
    }
  });

  const discountType = form.watch('discountType');

  useEffect(() => {
    fetchVouchers();
  }, [projectId]);

  const fetchVouchers = async () => {
    setLoadingState('loading');
    try {
      const { data } = await axios.get(`/api/projects/${projectId}/vouchers`);
      setVouchers(data.vouchers);
      setLoadingState('success');
    } catch (err) {
      console.error(err);
      toast.error('Failed to load vouchers');
      setLoadingState('error');
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setValue('code', result);
  };

  const openCreateDialog = () => {
    form.reset({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minimumSpend: 0,
      pointsCost: 0,
      maxRedemptions: undefined,
      validFrom: new Date(),
      validUntil: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      isActive: true,
    });
    setCurrentVoucher(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (voucher: Voucher) => {
    form.reset({
      code: voucher.code,
      description: voucher.description,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      minimumSpend: voucher.minimumSpend,
      pointsCost: voucher.pointsCost,
      maxRedemptions: voucher.maxRedemptions,
      validFrom: new Date(voucher.validFrom),
      validUntil: new Date(voucher.validUntil),
      isActive: voucher.isActive,
    });
    setCurrentVoucher(voucher);
    setIsDialogOpen(true);
  };

  const handleDeleteVoucher = async () => {
    if (!currentVoucher) return;
    setIsLoading(true);
    try {
      await axios.delete(
        `/api/projects/${projectId}/vouchers/${currentVoucher.id}`
      );
      toast.success(`Voucher ${currentVoucher.code} deleted`);
      fetchVouchers();
      setIsDeleteDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete voucher');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Voucher code copied');
  };

  const onSubmit = async (data: z.infer<typeof voucherSchema>) => {
    setIsLoading(true);
    try {
      if (currentVoucher) {
        await axios.patch(
          `/api/projects/${projectId}/vouchers/${currentVoucher.id}`,
          data
        );
        toast.success(`Voucher ${data.code} updated`);
      } else {
        await axios.post(`/api/projects/${projectId}/vouchers`, data);
        toast.success(`Voucher ${data.code} created`);
      }
      fetchVouchers();
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to save voucher');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Vouchers</CardTitle>
            <CardDescription>
              Create and manage discount vouchers
            </CardDescription>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Voucher
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {currentVoucher
                    ? `Edit ${currentVoucher.code}`
                    : 'Create a New Voucher'}
                </DialogTitle>
                <DialogDescription>
                  {currentVoucher
                    ? 'Edit the details of this voucher'
                    : 'Define a new voucher that customers can redeem'}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Voucher Code</FormLabel>
                          <FormControl>
                            <Input placeholder="SUMMER20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-8"
                      onClick={generateRandomCode}
                    >
                      Generate
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Summer promotion discount"
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
                      name="discountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PERCENTAGE">
                                Percentage
                              </SelectItem>
                              <SelectItem value="FIXED">Fixed Amount</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="discountValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {discountType === 'PERCENTAGE'
                              ? 'Discount %'
                              : 'Discount Amount'}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                step={
                                  discountType === 'PERCENTAGE' ? '1' : '0.01'
                                }
                                min="0"
                                max={
                                  discountType === 'PERCENTAGE' ? '100' : undefined
                                }
                                {...field}
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                                {discountType === 'PERCENTAGE' ? '%' : '$'}
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="minimumSpend"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Spend</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input type="number" step="0.01" min="0" {...field} />
                              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                                $
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>0 for no minimum</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pointsCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points Cost</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" min="0" {...field} />
                          </FormControl>
                          <FormDescription>0 for free redemption</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="maxRedemptions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Redemptions</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            min="1"
                            placeholder="Unlimited"
                            value={field.value || ''}
                            onChange={(e) => {
                              const v =
                                e.target.value === ''
                                  ? undefined
                                  : parseInt(e.target.value, 10);
                              field.onChange(v);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave empty for unlimited
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="validFrom"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Valid From</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value
                                    ? format(field.value, 'PPP')
                                    : 'Pick a date'}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="validUntil"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Valid Until</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value
                                    ? format(field.value, 'PPP')
                                    : 'Pick a date'}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between border p-3 rounded-lg">
                        <div>
                          <FormLabel>Active</FormLabel>
                          <FormDescription>
                            Enable or disable this voucher
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
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading
                        ? 'Saving…'
                        : currentVoucher
                        ? 'Update Voucher'
                        : 'Create Voucher'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {loadingState === 'loading' ? (
            <div className="py-8 text-center">Loading vouchers…</div>
          ) : loadingState === 'error' ? (
            <div className="py-8 text-center text-red-500">
              Failed to load vouchers.
            </div>
          ) : vouchers.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No vouchers yet.</p>
              <Button onClick={openCreateDialog} className="mt-4">
                Create your first voucher
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="p-2 pl-4">Code</th>
                      <th className="p-2">Description</th>
                      <th className="p-2">Value</th>
                      <th className="p-2">Points</th>
                      <th className="p-2">Valid Until</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.map((v) => (
                      <tr key={v.id} className="border-b">
                        <td className="p-2 pl-4 font-mono uppercase">
                          <div className="flex items-center gap-2">
                            {v.code}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => copyToClipboard(v.code)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="p-2">{v.description}</td>
                        <td className="p-2">
                          {v.discountType === 'PERCENTAGE'
                            ? `${v.discountValue}%`
                            : `$${v.discountValue.toFixed(2)}`}
                        </td>
                        <td className="p-2">{v.pointsCost}</td>
                        <td className="p-2">
                          {new Date(v.validUntil).toLocaleDateString()}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={v.isActive ? 'default' : 'secondary'}>
                              {v.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {v.redeemCount > 0 && (
                              <Badge variant="outline">
                                {v.redeemCount}
                                {v.maxRedemptions ? ` / ${v.maxRedemptions}` : ''}{' '}
                                used
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(v)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setCurrentVoucher(v);
                                setIsDeleteDialogOpen(true);
                              }}
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

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the voucher "
              {currentVoucher?.code}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVoucher}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
