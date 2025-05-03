'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Edit, Trash2, TicketIcon, Search, Calendar } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { DatePicker } from '@workspace/ui/components/date-picker';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';

// Schema for voucher creation
const voucherSchema = z.object({
  name: z.string().min(1, 'Voucher name is required').max(100),
  description: z.string().optional(),
  code: z.string().min(3, 'Code must be at least 3 characters').max(50),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_ITEM']),
  discountValue: z.coerce.number().min(0),
  minimumSpend: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().int().min(1).optional(),
  perCustomerLimit: z.coerce.number().int().min(1).optional(),
  startDate: z.date(),
  endDate: z.date(),
  isActive: z.boolean().default(true),
  requiredPoints: z.coerce.number().int().min(0).optional(),
  requiredStamps: z.coerce.number().int().min(0).optional(),
});

type FormValues = z.infer<typeof voucherSchema>;

export default function VouchersList({
  projectId
}: {
  projectId: string;
}) {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [projectPreferences, setProjectPreferences] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Load vouchers
  const loadVouchers = async (filter?: string) => {
    setIsLoading(true);
    try {
      // Build query parameters based on filter
      let params = '';
      if (filter === 'active') {
        params = '?active=true';
      } else if (filter === 'current') {
        params = '?active=true&current=true';
      }
      
      const response = await axios.get(`/api/projects/${projectId}/vouchers${params}`);
      setVouchers(response.data.vouchers || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load vouchers');
    } finally {
      setIsLoading(false);
    }
  };

  // Load project preferences to get reward system type
  const loadProjectPreferences = async () => {
    try {
      const response = await axios.get(`/api/projects/${projectId}/preferences/rewards`);
      setProjectPreferences(response.data.preferences);
      
      // Update form default values based on reward system
      if (response.data.preferences?.rewardSystemType === 'POINTS') {
        form.setValue('requiredPoints', 0);
        form.setValue('requiredStamps', undefined);
      } else {
        form.setValue('requiredStamps', 0);
        form.setValue('requiredPoints', undefined);
      }
    } catch (error) {
      console.error('Error loading project preferences', error);
    }
  };

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      name: '',
      description: '',
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      minimumSpend: 0,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3 months in the future
    },
  });

  // Load data on component mount
  useEffect(() => {
    loadVouchers();
    loadProjectPreferences();
  }, [projectId]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    loadVouchers(value);
  };
  
  // Generate a random voucher code
  const generateRandomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    form.setValue('code', result);
  };

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      // Format dates as ISO strings for API request
      const formattedData = {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
      };
      
      // Submit only the relevant redemption requirement based on project preference
      if (projectPreferences?.rewardSystemType === 'POINTS') {
        formattedData.requiredStamps = undefined;
      } else {
        formattedData.requiredPoints = undefined;
      }
      
      await axios.post(`/api/projects/${projectId}/vouchers`, formattedData);
      toast.success('Voucher created successfully');
      setIsDialogOpen(false);
      form.reset({
        name: '',
        description: '',
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        minimumSpend: 0,
        isActive: true,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      });
      loadVouchers(activeTab);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create voucher');
    } finally {
      setIsLoading(false);
    }
  };

  // Format discount value based on discount type
  const formatDiscountValue = (voucher: any) => {
    if (voucher.discountType === 'PERCENTAGE') {
      return `${voucher.discountValue}%`;
    } else if (voucher.discountType === 'FIXED_AMOUNT') {
      return `$${voucher.discountValue.toFixed(2)}`;
    } else {
      return 'Free Item';
    }
  };

  // Get status badge for a voucher
  const getStatusBadge = (voucher: any) => {
    const now = new Date();
    const startDate = new Date(voucher.startDate);
    const endDate = new Date(voucher.endDate);
    
    if (!voucher.isActive) {
      return <Badge variant="outline">Inactive</Badge>;
    } else if (now < startDate) {
      return <Badge variant="secondary">Scheduled</Badge>;
    } else if (now > endDate) {
      return <Badge variant="outline">Expired</Badge>;
    } else {
      return <Badge variant="default">Active</Badge>;
    }
  };

  // Get redemption requirement text
  const getRedemptionText = (voucher: any) => {
    if (voucher.requiredPoints) {
      return `${voucher.requiredPoints} ${projectPreferences?.pointsName || 'Points'}`;
    } else if (voucher.requiredStamps) {
      return `${voucher.requiredStamps} Stamps`;
    } else {
      return 'None';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Voucher Management</CardTitle>
          <CardDescription>
            Create and manage promotional vouchers and rewards.
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Voucher
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Voucher</DialogTitle>
              <DialogDescription>
                Create a promotional voucher or redemption reward for your customers.
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
                        <FormLabel>Voucher Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Summer Discount" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voucher Code</FormLabel>
                        <div className="flex space-x-2">
                          <FormControl>
                            <Input placeholder="SUMMER25" {...field} />
                          </FormControl>
                          <Button 
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={generateRandomCode}
                          >
                            Generate
                          </Button>
                        </div>
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
                        <Textarea 
                          placeholder="Describe what this voucher offers" 
                          {...field} 
                          value={field.value || ''}
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
                              <SelectValue placeholder="Select discount type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                            <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                            <SelectItem value="FREE_ITEM">Free Item</SelectItem>
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
                          {form.watch('discountType') === 'PERCENTAGE' 
                            ? 'Percentage (%)' 
                            : form.watch('discountType') === 'FIXED_AMOUNT' 
                              ? 'Amount ($)' 
                              : 'Value'
                          }
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step={form.watch('discountType') === 'PERCENTAGE' ? '1' : '0.01'}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                          disabled={(date) => {
                            // Disable dates before start date
                            const startDate = form.watch('startDate');
                            return date < startDate;
                          }}
                        />
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
                        <FormLabel>Minimum Spend ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0"
                            {...field}
                            value={field.value === undefined ? '' : field.value}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum purchase amount required
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {projectPreferences?.rewardSystemType === 'POINTS' ? (
                    <FormField
                      control={form.control}
                      name="requiredPoints"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Required Points</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                              value={field.value === undefined ? '' : field.value}
                            />
                          </FormControl>
                          <FormDescription>
                            Points needed to redeem (0 for none)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="requiredStamps"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Required Stamps</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                              value={field.value === undefined ? '' : field.value}
                            />
                          </FormControl>
                          <FormDescription>
                            Stamps needed to redeem (0 for none)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="usageLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Usage Limit</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Unlimited"
                            {...field}
                            value={field.value === undefined ? '' : field.value}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum redemptions (empty for unlimited)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="perCustomerLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Per Customer Limit</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="1"
                            {...field}
                            value={field.value === undefined ? '' : field.value}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum uses per customer
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="isActive"
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
                          Active
                        </FormLabel>
                        <FormDescription>
                          Make this voucher available for immediate use
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
                    {isLoading ? 'Creating...' : 'Create Voucher'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="space-y-4" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Vouchers</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="current">Currently Valid</TabsTrigger>
          </TabsList>
          
          {vouchers.length === 0 ? (
            <EmptyState
              icon={<TicketIcon className="w-12 h-12 text-muted-foreground" />}
              title="No vouchers found"
              description={activeTab === 'all' 
                ? "You haven't created any vouchers yet." 
                : "No vouchers match the current filter."}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Redemption</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell className="font-medium">{voucher.code}</TableCell>
                    <TableCell>
                      <div>{voucher.name}</div>
                      {voucher.description && (
                        <div className="text-sm text-muted-foreground">{voucher.description}</div>
                      )}
                    </TableCell>
                    <TableCell>{formatDiscountValue(voucher)}</TableCell>
                    <TableCell>{getRedemptionText(voucher)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs">
                          {format(new Date(voucher.startDate), 'MMM d')} - {format(new Date(voucher.endDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(voucher)}</TableCell>
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
        </Tabs>
      </CardContent>
    </Card>
  );
}