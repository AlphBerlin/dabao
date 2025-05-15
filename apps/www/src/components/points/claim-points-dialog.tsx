import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@workspace/ui/components/dialog';
import { Loader2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage 
} from '@workspace/ui/components/form';
import { Textarea } from '@workspace/ui/components/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

// Form schema for claiming points
const claimPointsFormSchema = z.object({
  points: z.number().int().positive({
    message: "Points must be a positive integer"
  }),
  reason: z.string().min(1, {
    message: "Reason is required"
  }),
  description: z.string().optional(),
  voucherId: z.string().optional(),
});

type ClaimPointsFormValues = z.infer<typeof claimPointsFormSchema>;

interface Voucher {
  id: string;
  name: string;
  discountValue: number;
  requiredPoints: number;
}

interface ClaimPointsDialogProps {
  projectId: string;
  customerId: string;
  customerName: string;
  currentBalance: number;
  onSuccess?: (transaction: any) => void;
  onError?: (error: any) => void;
  trigger?: React.ReactNode;
}

export const ClaimPointsDialog: React.FC<ClaimPointsDialogProps> = ({
  projectId,
  customerId,
  customerName,
  currentBalance: initialBalance,
  onSuccess,
  onError,
  trigger
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [currentBalance, setCurrentBalance] = useState(initialBalance);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const form = useForm<ClaimPointsFormValues>({
    resolver: zodResolver(claimPointsFormSchema),
    defaultValues: {
      points: undefined,
      reason: 'Voucher redemption',
      description: '',
      voucherId: undefined,
    },
  });

  // Reset form when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
      setSelectedVoucher(null);
    }
  };

  // Load available vouchers and fetch current balance when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableVouchers();
      fetchCurrentBalance();
    }
  }, [isOpen, projectId, customerId]);

  const fetchCurrentBalance = async () => {
    try {
      setIsLoadingBalance(true);
      const response = await fetch(`/api/projects/${projectId}/customers/${customerId}/points`);
      if (!response.ok) {
        throw new Error('Failed to fetch points balance');
      }
      const data = await response.json();
      setCurrentBalance(data.balance);
    } catch (error) {
      console.error('Error fetching points balance:', error);
      // Fallback to initial balance if fetch fails
      setCurrentBalance(initialBalance);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const fetchAvailableVouchers = async () => {
    try {
      // Fetch vouchers that require points and are active
      const response = await fetch(`/api/projects/${projectId}/vouchers?requiredPoints=true&active=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch vouchers');
      }
      const data = await response.json();
      setAvailableVouchers(data.vouchers || []);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    }
  };

  const handleVoucherChange = (voucherId: string) => {
    const voucher = availableVouchers.find(v => v.id === voucherId);
    if (voucher) {
      setSelectedVoucher(voucher);
      form.setValue('points', voucher.requiredPoints);
      form.setValue('voucherId', voucherId);
    }
  };

  const onSubmit = async (values: ClaimPointsFormValues) => {
    if (values.points > currentBalance) {
      form.setError('points', {
        type: 'manual',
        message: `Insufficient points balance. You have ${currentBalance} points available.`
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/customers/${customerId}/points/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim points');
      }

      toast.success(`Successfully redeemed ${values.points} points`);
      onSuccess?.(data.pointsTransaction);
      setIsOpen(false);
    } catch (error) {
      console.error('Error claiming points:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to claim points');
      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || <Button>Redeem Points</Button>}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Redeem Points</DialogTitle>
          <DialogDescription>
            Redeem your loyalty points for rewards. 
            You currently have {isLoadingBalance ? (
              <span>
                <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                Loading balance...
              </span>
            ) : (
              <span className="font-semibold">{currentBalance}</span>
            )} points available.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {availableVouchers.length > 0 && (
              <FormField
                control={form.control}
                name="voucherId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Voucher (Optional)</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleVoucherChange(value);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a voucher" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableVouchers.map(voucher => (
                          <SelectItem key={voucher.id} value={voucher.id}>
                            {voucher.name} - {voucher.requiredPoints} points
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Selecting a voucher will automatically set the required points
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points to Redeem</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="100" 
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the number of points to redeem {isLoadingBalance ? 
                      "(loading balance...)" : 
                      `(max: ${currentBalance})`
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input placeholder="Voucher redemption" {...field} />
                  </FormControl>
                  <FormDescription>
                    Reason for redeeming points
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional details about this redemption" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                type="button"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Redeeming Points...' : 'Redeem Points'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
