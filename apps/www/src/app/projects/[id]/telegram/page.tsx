'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Check, ExternalLink, Bot, Gear } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

import BotMenuDesigner from '@/components/telegram/bot-menu-designer';
import BotCommandsManager from '@/components/telegram/bot-commands-manager';

export default function TelegramBotSettingsPage() {
  const { id: projectId } = useParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [botSettings, setBotSettings] = useState<any>(null);
  const [botToken, setBotToken] = useState('');
  const [botUsername, setBotUsername] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [helpMessage, setHelpMessage] = useState('');
  const [enableCommands, setEnableCommands] = useState(true);
  const [commands, setCommands] = useState([]);
  const [commandsLoading, setCommandsLoading] = useState(true);
  const [features, setFeatures] = useState<any>(null);
  
  // Load settings
  useEffect(() => {
    loadBotSettings();
    loadBotCommands();
    loadBotFeatures();
  }, [projectId]);
  
  // Load Telegram bot settings
  const loadBotSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/projects/${projectId}/integrations/telegram`);
      
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setBotSettings(data);
          setBotToken(data.botToken || '');
          setBotUsername(data.botUsername || '');
          setWelcomeMessage(data.welcomeMessage || 'Welcome! I\'m your bot assistant. Use /help to see available commands.');
          setHelpMessage(data.helpMessage || 'Available commands:\n/start - Start the bot\n/help - Show this help message\n/menu - Show main menu');
          setEnableCommands(data.enableCommands !== false);
        }
      } else if (response.status !== 404) {
        const error = await response.json();
        toast.error(`Failed to load bot settings: ${error.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error loading bot settings:', error);
      toast.error('Failed to load bot settings');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load bot commands
  const loadBotCommands = async () => {
    try {
      setCommandsLoading(true);
      const response = await fetch(`/api/projects/${projectId}/integrations/telegram/commands`);
      
      if (response.ok) {
        const data = await response.json();
        setCommands(data);
      } else if (response.status !== 404) {
        const error = await response.json();
        toast.error(`Failed to load bot commands: ${error.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error loading bot commands:', error);
      toast.error('Failed to load bot commands');
    } finally {
      setCommandsLoading(false);
    }
  };
  
  // Load bot features
  const loadBotFeatures = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/integrations/telegram/features`);
      
      if (response.ok) {
        const data = await response.json();
        setFeatures(data);
      } else if (response.status !== 404) {
        const error = await response.json();
        console.error('Error loading bot features:', error);
      }
    } catch (error) {
      console.error('Error loading bot features:', error);
    }
  };
  
  // Save bot settings
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      
      // Validate required fields
      if (!botToken || !botUsername) {
        toast.error('Bot token and username are required');
        return;
      }
      
      const requestBody = {
        botToken,
        botUsername,
        welcomeMessage,
        helpMessage,
        enableCommands
      };
      
      const method = botSettings ? 'POST' : 'POST';
      
      const response = await fetch(`/api/projects/${projectId}/integrations/telegram`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (response.ok) {
        const data = await response.json();
        setBotSettings(data);
        toast.success('Bot settings saved successfully');
      } else {
        const error = await response.json();
        toast.error(`Failed to save bot settings: ${error.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving bot settings:', error);
      toast.error('Failed to save bot settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Save command changes
  const handleSaveCommand = async (command: any) => {
    try {
      const isNew = !command.id;
      const method = isNew ? 'POST' : 'PATCH';
      const url = isNew
        ? `/api/projects/${projectId}/integrations/telegram/commands`
        : `/api/projects/${projectId}/integrations/telegram/commands`;
        
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || response.statusText);
      }
      
      // Reload commands
      loadBotCommands();
      
      return true;
    } catch (error: any) {
      console.error('Error saving command:', error);
      throw error;
    }
  };
  
  // Delete command
  const handleDeleteCommand = async (commandId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/integrations/telegram/commands?commandId=${commandId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || response.statusText);
      }
      
      // Reload commands
      loadBotCommands();
      
      return true;
    } catch (error: any) {
      console.error('Error deleting command:', error);
      throw error;
    }
  };
  
  // Reorder commands
  const handleReorderCommands = async (commandIds: string[]) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/integrations/telegram/commands`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reorder',
          commandIds
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || response.statusText);
      }
      
      return true;
    } catch (error: any) {
      console.error('Error reordering commands:', error);
      toast.error('Failed to reorder commands');
      throw error;
    }
  };
  
  // Save menu features
  const handleSaveMenus = async (menuData: any) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/integrations/telegram/features`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          featureType: 'mainMenu',
          config: menuData.mainMenu
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || response.statusText);
      }
      
      // Update welcome menu
      await fetch(`/api/projects/${projectId}/integrations/telegram/features`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          featureType: 'welcomeMenu',
          config: menuData.welcomeMenu
        }),
      });
      
      // Reload features
      await loadBotFeatures();
    } catch (error: any) {
      console.error('Error saving menus:', error);
      toast.error('Failed to save menu settings');
      throw error;
    }
  };
  
  // Delete bot integration
  const handleDeleteIntegration = async () => {
    if (!confirm('Are you sure you want to delete this Telegram bot integration? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/projects/${projectId}/integrations/telegram`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Telegram integration deleted successfully');
        // Reset state
        setBotSettings(null);
        setBotToken('');
        setBotUsername('');
        setWelcomeMessage('Welcome! I\'m your bot assistant. Use /help to see available commands.');
        setHelpMessage('Available commands:\n/start - Start the bot\n/help - Show this help message');
      } else {
        const error = await response.json();
        toast.error(`Failed to delete integration: ${error.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting integration:', error);
      toast.error('Failed to delete integration');
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Telegram Bot Manager</h1>
          <p className="text-slate-500">Configure your Telegram bot integration</p>
        </div>
        
        {botSettings?.isActive && (
          <div className="flex items-center gap-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-3 py-1 rounded-full">
            <Check size={16} className="text-green-600 dark:text-green-400" />
            <span>Bot Active</span>
          </div>
        )}
      </div>
      
      <Tabs defaultValue="settings">
        <TabsList className="mb-6">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="commands">Commands</TabsTrigger>
          <TabsTrigger value="menus">Menu Designer</TabsTrigger>
          <TabsTrigger value="apps">Apps</TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Bot Configuration</CardTitle>
              <CardDescription>Configure your Telegram bot authentication details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isLoading && !botSettings && (
                <Alert variant="default">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No integration found</AlertTitle>
                  <AlertDescription>
                    You haven&apos;t set up Telegram integration yet. Fill in the details below to get started.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="botToken">Bot Token</Label>
                    <Input
                      id="botToken"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      placeholder="e.g. 1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                      type="password"
                    />
                    <p className="text-xs text-slate-500">
                      Get this from <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">@BotFather</a> on Telegram
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="botUsername">Bot Username</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-slate-500">@</span>
                      </div>
                      <Input
                        id="botUsername"
                        value={botUsername}
                        onChange={(e) => setBotUsername(e.target.value)}
                        placeholder="e.g. MyAwesomeBot"
                        className="pl-6"
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      The username you chose in BotFather
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage">Welcome Message</Label>
                  <Textarea
                    id="welcomeMessage"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Welcome message shown when users start the bot"
                    rows={3}
                  />
                  <p className="text-xs text-slate-500">
                    This message is shown when users first interact with your bot using /start
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="helpMessage">Help Message</Label>
                  <Textarea
                    id="helpMessage"
                    value={helpMessage}
                    onChange={(e) => setHelpMessage(e.target.value)}
                    placeholder="Help message shown when users request help"
                    rows={3}
                  />
                  <p className="text-xs text-slate-500">
                    This message is shown when users use the /help command
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableCommands"
                    checked={enableCommands}
                    onCheckedChange={setEnableCommands}
                  />
                  <Label htmlFor="enableCommands">Enable commands menu in Telegram</Label>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={isSaving || (!botToken && !botSettings)}
                  >
                    {isSaving ? 'Saving...' : botSettings ? 'Update Bot Settings' : 'Save Bot Settings'}
                  </Button>
                  
                  {botSettings && (
                    <Button
                      variant="destructive"
                      onClick={handleDeleteIntegration}
                    >
                      Delete Integration
                    </Button>
                  )}
                  
                  {botSettings && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(`https://t.me/${botUsername}`, '_blank')}
                    >
                      <ExternalLink size={16} className="mr-2" />
                      Open Bot in Telegram
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {botSettings && botSettings.botUsername && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Reference</CardTitle>
                <CardDescription>Useful information about your bot</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-md">
                    <h3 className="font-medium mb-2 flex items-center">
                      <Bot size={16} className="mr-2" />
                      Bot Link
                    </h3>
                    <div className="text-sm text-blue-600 dark:text-blue-400 break-all">
                      <a href={`https://t.me/${botSettings.botUsername}`} target="_blank" rel="noreferrer" className="hover:underline">
                        https://t.me/{botSettings.botUsername}
                      </a>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Share this link for users to access your bot
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-md">
                    <h3 className="font-medium mb-2 flex items-center">
                      <Gear size={16} className="mr-2" />
                      Bot Status
                    </h3>
                    <div className={`text-sm ${botSettings.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {botSettings.isActive ? 'Active & Running' : 'Inactive'}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {botSettings.isActive 
                        ? 'Your bot is online and responding to messages' 
                        : 'Your bot is not running. Check settings and save again.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="commands">
          {botSettings ? (
            <BotCommandsManager 
              projectId={projectId as string}
              commands={commands}
              isLoading={commandsLoading}
              onSave={handleSaveCommand}
              onDelete={handleDeleteCommand}
              onReorder={handleReorderCommands}
            />
          ) : (
            <Card>
              <CardContent className="py-10">
                <div className="text-center space-y-2">
                  <AlertCircle className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="text-lg font-medium">Bot not configured</h3>
                  <p className="text-slate-500">
                    Configure your bot settings first to manage commands
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => document.querySelector('[data-value="settings"]')?.click()}
                    className="mt-4"
                  >
                    Go to Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="menus">
          {botSettings ? (
            <BotMenuDesigner
              projectId={projectId as string}
              initialData={features}
              onSave={handleSaveMenus}
            />
          ) : (
            <Card>
              <CardContent className="py-10">
                <div className="text-center space-y-2">
                  <AlertCircle className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="text-lg font-medium">Bot not configured</h3>
                  <p className="text-slate-500">
                    Configure your bot settings first to design menus
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => document.querySelector('[data-value="settings"]')?.click()}
                    className="mt-4"
                  >
                    Go to Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="apps">
          <Card>
            <CardHeader>
              <CardTitle>Bot Apps</CardTitle>
              <CardDescription>Configure mini-applications for your bot</CardDescription>
            </CardHeader>
            <CardContent>
              {botSettings ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 mb-4">
                    Bot apps functionality coming soon.
                  </p>
                  <p className="text-sm text-slate-400">
                    You'll be able to configure cards, media galleries, forms and more.
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <AlertCircle className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="text-lg font-medium">Bot not configured</h3>
                  <p className="text-slate-500">
                    Configure your bot settings first to create bot apps
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => document.querySelector('[data-value="settings"]')?.click()}
                    className="mt-4"
                  >
                    Go to Settings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}