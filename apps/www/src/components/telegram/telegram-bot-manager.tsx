// src/components/TelegramBotManager.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@workspace/ui/components/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Textarea } from '@workspace/ui/components/textarea';
import { Switch } from '@workspace/ui/components/switch';
import { Badge } from '@workspace/ui/components/badge';
import { AlertCircle, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers';
import * as z from 'zod';
import { toast } from '@workspace/ui/hooks/use-toast';

interface TelegramBotManagerProps {
  projectId: string;
}

// Form schema for validation
const formSchema = z.object({
  botToken: z.string().min(20, 'Bot token is required'),
  botUsername: z.string().min(3, 'Bot username is required'),
  webhookUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  welcomeMessage: z.string().optional(),
  helpMessage: z.string().optional(),
  enableCommands: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

// Status indicator component
const StatusIndicator = ({ status }) => {
  if (!status) return null;
  
  const statusMap = {
    online: { icon: <CheckCircle className="h-5 w-5" />, color: 'bg-green-500', text: 'Online' },
    offline: { icon: <AlertCircle className="h-5 w-5" />, color: 'bg-red-500', text: 'Offline' },
    error: { icon: <AlertTriangle className="h-5 w-5" />, color: 'bg-amber-500', text: 'Error' },
    pending: { icon: <Loader2 className="h-5 w-5 animate-spin" />, color: 'bg-blue-500', text: 'Connecting' },
  };
  
  const statusInfo = statusMap[status] || statusMap.offline;
  
  return (
    <Badge className={`${statusInfo.color} text-white flex items-center gap-1`}>
      {statusInfo.icon}
      <span>{statusInfo.text}</span>
    </Badge>
  );
};

const TelegramBotManager: React.FC<TelegramBotManagerProps> = ({ projectId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [botSettings, setBotSettings] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      botToken: '',
      botUsername: '',
      webhookUrl: '',
      welcomeMessage: 'Welcome to our bot! Use /help to see available commands.',
      helpMessage: 'Available commands:\n/start - Start the bot\n/help - Show this help message\n/points - Check your points balance\n/rewards - View available rewards\n/profile - View your profile',
      enableCommands: true,
    },
  });
  
  // Fetch existing settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/${projectId}/telegram`);
        
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setBotSettings(data);
            setIsConfigured(true);
            
            // Update form values
            form.reset({
              botToken: data.botToken || '',
              botUsername: data.botUsername || '',
              webhookUrl: data.webhookUrl || '',
              welcomeMessage: data.welcomeMessage || 'Welcome to our bot! Use /help to see available commands.',
              helpMessage: data.helpMessage || 'Available commands:\n/start - Start the bot\n/help - Show this help message\n/points - Check your points balance\n/rewards - View available rewards\n/profile - View your profile',
              enableCommands: data.enableCommands !== undefined ? data.enableCommands : true,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching Telegram settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load Telegram bot settings',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [projectId]);
  
  // Save settings
  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/projects/${projectId}/telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (response.ok) {
        const data = await response.json();
        setBotSettings(data);
        setIsConfigured(true);
        
        toast({
          title: 'Success',
          description: isConfigured 
            ? 'Telegram bot settings updated' 
            : 'Telegram bot successfully configured',
        });
        
        // Poll for bot status for a short time to show updates
        pollBotStatus();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving Telegram settings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save Telegram bot settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Poll for bot status updates
  const pollBotStatus = async () => {
    let attempts = 0;
    const maxAttempts = 5;
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/telegram`);
        if (response.ok) {
          const data = await response.json();
          setBotSettings(data);
          
          // If bot is active or we've reached max attempts, stop polling
          if (data.isActive || attempts >= maxAttempts) {
            return;
          }
        }
      } catch (error) {
        console.error('Error polling bot status:', error);
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(checkStatus, 2000); // Check every 2 seconds
      }
    };
    
    checkStatus();
  };
  
  // Delete bot configuration
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this Telegram bot configuration?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/projects/${projectId}/telegram`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setBotSettings(null);
        setIsConfigured(false);
        form.reset();
        
        toast({
          title: 'Success',
          description: 'Telegram bot configuration deleted',
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete bot configuration');
      }
    } catch (error) {
      console.error('Error deleting Telegram configuration:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete Telegram bot configuration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Test webhook connection
  const testWebhook = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/telegram/webhook/${projectId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        toast({
          title: 'Webhook Status',
          description: `Bot is ${data.status}. Last checked: ${new Date(data.timestamp).toLocaleTimeString()}`,
        });
        
        // Refresh bot status
        pollBotStatus();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to test webhook');
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to test webhook connection',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Telegram Bot Configuration</CardTitle>
            <CardDescription>Connect a Telegram bot to your project</CardDescription>
          </div>
          {isConfigured && botSettings && (
            <StatusIndicator status={botSettings.status} />
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="botToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bot Token</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your bot token from @BotFather" {...field} />
                  </FormControl>
                  <FormDescription>
                    Create a new bot via <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">@BotFather</a> and paste the token here
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="botUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bot Username</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. MyAwesomeBot (without @)" {...field} />
                  </FormControl>
                  <FormDescription>
                    The username of your bot (without the @ symbol)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="webhookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://your-app.com/api/telegram/webhook/{projectId}" {...field} />
                  </FormControl>
                  <FormDescription>
                    Leave blank to use the default webhook URL for your project
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="welcomeMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Welcome Message</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Welcome message when users start the bot" {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="helpMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Help Message</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Help message when users use /help command" {...field} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="enableCommands"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Enable Commands
                    </FormLabel>
                    <FormDescription>
                      Set up standard commands like /start, /help, etc.
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
            
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isConfigured ? 'Update Bot' : 'Create Bot'}
              </Button>
              
              {isConfigured && (
                <>
                  <Button type="button" variant="outline" onClick={testWebhook} disabled={isLoading}>
                    Test Connection
                  </Button>
                  
                  <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading} className="ml-auto">
                    Delete Bot
                  </Button>
                </>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
      
      {isConfigured && botSettings && botSettings.statusMessage && (
        <CardFooter className="bg-amber-50 text-amber-800 p-4 rounded-b-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{botSettings.statusMessage}</p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
  );