import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@workspace/ui/components/dialog';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

// Form schema for issuing points
const issuePointsFormSchema = z.object({
  points: z.number().int().positive({
    message: "Points must be a positive integer"
  }),
  reason: z.string().min(1, {
    message: "Reason is required"
  }),
  description: z.string().optional(),
  orderId: z.string().optional(),
  expiresAt: z.string().optional(),
});

type IssuePointsFormValues = z.infer<typeof issuePointsFormSchema>;

interface IssuePointsDialogProps {
  projectId: string;
  customerId: string;
  customerName: string;
  onSuccess?: (transaction: any) => void;
  onError?: (error: any) => void;
  trigger?: React.ReactNode;
}

export const IssuePointsDialog: React.FC<IssuePointsDialogProps> = ({
  projectId,
  customerId,
  customerName,
  onSuccess,
  onError,
  trigger
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<IssuePointsFormValues>({
    resolver: zodResolver(issuePointsFormSchema),
    defaultValues: {
      points: undefined,
      reason: '',
      description: '',
      orderId: '',
      expiresAt: '',
    },
  });

  // Reset form when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  };

  const onSubmit = async (values: IssuePointsFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/customers/${customerId}/points/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to issue points');
      }

      toast.success(`Successfully issued ${values.points} points to ${customerName}`);
      onSuccess?.(data.pointsTransaction);
      setIsOpen(false);
    } catch (error) {
      console.error('Error issuing points:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to issue points');
      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || <Button>Issue Points</Button>}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Issue Points to Customer</DialogTitle>
          <DialogDescription>
            Issue loyalty points to {customerName}. 
            Points will be added to the customer's account immediately.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="100" 
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the number of points to issue
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
                    <Input placeholder="Purchase" {...field} />
                  </FormControl>
                  <FormDescription>
                    Brief reason for issuing points
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
                      placeholder="Additional details about this points transaction" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="orderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order ID (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="ORD-12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiration Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormDescription>
                    When these points will expire, if applicable
                  </FormDescription>
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
                {isSubmitting ? 'Issuing Points...' : 'Issue Points'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
