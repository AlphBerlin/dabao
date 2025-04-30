import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Button } from '@workspace/ui/components/button';
import { Switch } from '@workspace/ui/components/switch';
import { createOrganization, CreateOrganizationData } from '@/lib/api';
import { useToast } from '@workspace/ui/hooks/use-toast';

interface OrganizationFormProps {
  typeOptions?: string[];
  planOptions?: { label: string; value: string }[];
  onSubmit?: (data: CreateOrganizationData) => void;
  showHelpText?: boolean;
}

type FormValues = {
  name: string;
  type: string;
  plan: string;
  billingEmail: string;
};

export const OrganizationForm: React.FC<OrganizationFormProps> = ({
  typeOptions = ['Personal', 'Team', 'Enterprise'],
  planOptions = [
    { label: 'Free - $0/month', value: 'free' },
    { label: 'Pro - $25/month', value: 'pro' },
    { label: 'Enterprise - Custom', value: 'enterprise' },
  ],
  onSubmit,
  showHelpText = true,
}) => {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      name: '',
      type: typeOptions[0],
      plan: planOptions[0].value,
      billingEmail: '',
    },
  });

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleFormSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Use the provided onSubmit handler if available, otherwise use the default API
      if (onSubmit) {
        onSubmit(data);
      } else {
        const organization = await createOrganization(data);
        
        toast({
          title: 'Organization created',
          description: `${organization?.name} has been created successfully.`,
        });
        
        // Redirect to the dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create organization',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-background text-foreground rounded-2xl shadow-lg dark:shadow-black/20">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Create a new organization</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Dark mode</span>
          <Switch checked={theme === 'dark'} onCheckedChange={handleThemeToggle} />
        </div>
      </div>
      
      {showHelpText && (
        <p className="text-sm text-muted-foreground mb-6">
          This is your organization within Dabao. For example, you can use the name of your company or department.
        </p>
      )}

      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(handleFormSubmit)}>
          {/* Name Field */}
          <FormField
            control={form.control}
            name="name"
            rules={{ required: 'Organization name is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Organization name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Billing Email Field */}
          <FormField
            control={form.control}
            name="billingEmail"
            rules={{ 
              required: 'Billing email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              }
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Billing Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="billing@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Type Select */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          {/* Plan Select */}
          <FormField
            control={form.control}
            name="plan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {planOptions.map((plan) => (
                        <SelectItem key={plan.value} value={plan.value}>
                          {plan.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-border">
            <Button variant="outline" type="button" onClick={() => form.reset()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create organization'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
