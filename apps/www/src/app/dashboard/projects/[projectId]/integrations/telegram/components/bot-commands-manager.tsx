import React, { useState, useEffect } from 'react';
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
} from '@workspace/ui/components/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import { Switch } from '@workspace/ui/components/switch';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Trash2, GripVertical, Save, Pencil, Command } from 'lucide-react';
import { toast } from 'sonner';

// Define types
interface CommandItem {
  id: string;
  command: string;
  description: string;
  response?: string;
  type: string;
  isEnabled: boolean;
  sortOrder: number;
  metadata?: any;
}

interface BotCommandsManagerProps {
  projectId: string;
  commands?: CommandItem[];
  isLoading?: boolean;
  onSave: (command: CommandItem) => Promise<void>;
  onDelete: (commandId: string) => Promise<void>;
  onReorder: (commandIds: string[]) => Promise<void>;
}

const COMMAND_TYPES = [
  { value: 'TEXT_RESPONSE', label: 'Text Response' },
  { value: 'BUTTON_MENU', label: 'Button Menu' },
  { value: 'POINTS_INFO', label: 'Points Information' },
  { value: 'MEMBERSHIP_INFO', label: 'Membership Information' },
  { value: 'COUPON_GENERATOR', label: 'Coupon Generator' },
  { value: 'CUSTOM_ACTION', label: 'Custom Action' },
];

const BotCommandsManager: React.FC<BotCommandsManagerProps> = ({ 
  projectId, 
  commands = [], 
  isLoading = false,
  onSave,
  onDelete,
  onReorder
}) => {
  const [commandsList, setCommandsList] = useState<CommandItem[]>(commands);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<CommandItem | null>(null);
  const [isNewCommand, setIsNewCommand] = useState(false);
  
  // Form fields
  const [commandName, setCommandName] = useState('');
  const [commandDescription, setCommandDescription] = useState('');
  const [commandResponse, setCommandResponse] = useState('');
  const [commandType, setCommandType] = useState('TEXT_RESPONSE');
  const [commandEnabled, setCommandEnabled] = useState(true);
  const [commandMetadata, setCommandMetadata] = useState('{}');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Update command list when props change
  useEffect(() => {
    if (commands.length > 0) {
      setCommandsList(commands);
    }
  }, [commands]);
  
  // Handle the drag and drop reordering
  const onDragEnd = (result: any) => {
    const { destination, source } = result;
    
    // Return if dropped outside the list
    if (!destination) return;
    
    // Return if dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    
    // Reorder the list
    const reordered = Array.from(commandsList);
    const [removed] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, removed);
    
    // Update the sort order
    const reorderedWithIndex = reordered.map((item, index) => ({
      ...item,
      sortOrder: index
    }));
    
    // Update the list
    setCommandsList(reorderedWithIndex);
    
    // Save the new order
    onReorder(reorderedWithIndex.map(cmd => cmd.id));
  };
  
  // Open dialog to add a new command
  const openNewCommandDialog = () => {
    setIsNewCommand(true);
    setEditingCommand(null);
    setCommandName('');
    setCommandDescription('');
    setCommandResponse('');
    setCommandType('TEXT_RESPONSE');
    setCommandEnabled(true);
    setCommandMetadata('{}');
    setIsDialogOpen(true);
  };
  
  // Open dialog to edit a command
  const openEditCommandDialog = (command: CommandItem) => {
    setIsNewCommand(false);
    setEditingCommand(command);
    setCommandName(command.command);
    setCommandDescription(command.description);
    setCommandResponse(command.response || '');
    setCommandType(command.type);
    setCommandEnabled(command.isEnabled);
    setCommandMetadata(command.metadata ? JSON.stringify(command.metadata, null, 2) : '{}');
    setIsDialogOpen(true);
  };
  
  // Save command changes
  const handleSaveCommand = async () => {
    // Basic validation
    if (!commandName) {
      toast.error('Command name is required');
      return;
    }
    
    if (commandName.includes(' ')) {
      toast.error('Command name cannot contain spaces');
      return;
    }
    
    if (commandName.startsWith('/')) {
      toast.error('Command name should not start with a forward slash');
      return;
    }
    
    if (!commandDescription) {
      toast.error('Command description is required');
      return;
    }
    
    // For text response commands, a response is required
    if (commandType === 'TEXT_RESPONSE' && !commandResponse) {
      toast.error('Response text is required for Text Response commands');
      return;
    }
    
    // Validate metadata JSON format
    let parsedMetadata;
    try {
      parsedMetadata = commandMetadata ? JSON.parse(commandMetadata) : {};
    } catch (error) {
      toast.error('Metadata must be valid JSON');
      return;
    }
    
    // Prepare command data
    const commandData: CommandItem = {
      id: editingCommand?.id || '', // Will be ignored for new commands
      command: commandName,
      description: commandDescription,
      response: commandResponse,
      type: commandType,
      isEnabled: commandEnabled,
      sortOrder: editingCommand?.sortOrder || commandsList.length,
      metadata: parsedMetadata
    };
    
    setIsSaving(true);
    
    try {
      // Save the command
      await onSave(commandData);
      
      // Close dialog
      setIsDialogOpen(false);
      
      // Show success message
      if (isNewCommand) {
        toast.success('Command added successfully');
      } else {
        toast.success('Command updated successfully');
      }
    } catch (error) {
      toast.error('Failed to save command');
      console.error('Error saving command:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Delete a command
  const handleDeleteCommand = async (id: string) => {
    if (confirm('Are you sure you want to delete this command?')) {
      setIsDeleting(true);
      
      try {
        await onDelete(id);
        toast.success('Command deleted successfully');
      } catch (error) {
        toast.error('Failed to delete command');
        console.error('Error deleting command:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  // Render form fields based on command type
  const renderCommandTypeFields = () => {
    switch (commandType) {
      case 'TEXT_RESPONSE':
        return (
          <div className="mb-4">
            <Label htmlFor="response" className="text-sm font-medium">
              Response Text
            </Label>
            <Textarea
              id="response"
              value={commandResponse}
              onChange={(e) => setCommandResponse(e.target.value)}
              placeholder="Enter the text response for this command"
              className="mt-1"
              rows={3}
            />
            <p className="text-xs text-slate-500 mt-1">
              This text will be sent when the command is used
            </p>
          </div>
        );
        
      case 'BUTTON_MENU':
        return (
          <>
            <div className="mb-4">
              <Label htmlFor="response" className="text-sm font-medium">
                Menu Title
              </Label>
              <Input
                id="response"
                value={commandResponse}
                onChange={(e) => setCommandResponse(e.target.value)}
                placeholder="Enter the menu title"
                className="mt-1"
              />
            </div>
            <div className="mb-4">
              <Label htmlFor="metadata" className="text-sm font-medium">
                Button Configuration
              </Label>
              <Textarea
                id="metadata"
                value={commandMetadata}
                onChange={(e) => setCommandMetadata(e.target.value)}
                placeholder={`{
  "title": "Menu Title",
  "buttons": [
    { "label": "Button 1", "action": "action:1" },
    { "label": "Button 2", "action": "action:2" }
  ]
}`}
                className="mt-1 font-mono text-sm"
                rows={8}
              />
              <p className="text-xs text-slate-500 mt-1">
                Configure the buttons that will appear in the menu
              </p>
            </div>
          </>
        );
        
      case 'CUSTOM_ACTION':
        return (
          <div className="mb-4">
            <Label htmlFor="metadata" className="text-sm font-medium">
              Action Configuration
            </Label>
            <Textarea
              id="metadata"
              value={commandMetadata}
              onChange={(e) => setCommandMetadata(e.target.value)}
              placeholder={`{
  "actionType": "api_call",
  "endpoint": "/api/example",
  "method": "GET",
  "responseTemplate": "Your data: {{result}}"
}`}
              className="mt-1 font-mono text-sm"
              rows={8}
            />
            <p className="text-xs text-slate-500 mt-1">
              Configure custom actions for this command
            </p>
          </div>
        );
        
      default:
        return (
          <div className="text-sm text-slate-500 p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
            This command type is pre-configured and will use system defaults.
          </div>
        );
    }
  };
  
  // Render command list item
  const renderCommandItem = (command: CommandItem, index: number) => {
    return (
      <Draggable key={command.id} draggableId={command.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`border-b border-slate-200 dark:border-slate-700 p-4 ${
              !command.isEnabled ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  {...provided.dragHandleProps} 
                  className="cursor-grab text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <GripVertical size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">/{command.command}</span>
                    {!command.isEnabled && (
                      <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                        Disabled
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500">{command.description}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">
                  {COMMAND_TYPES.find((t) => t.value === command.type)?.label || command.type}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditCommandDialog(command)}
                  title="Edit command"
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteCommand(command.id)}
                  title="Delete command"
                  disabled={isDeleting}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Draggable>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bot Commands</h2>
        <Button onClick={openNewCommandDialog}>
          <Plus className="mr-2" size={16} />
          Add Command
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Command List</CardTitle>
          <CardDescription>
            Manage the commands available in your bot. Users can trigger these with /{'{command}'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-32 text-slate-500">
              Loading commands...
            </div>
          ) : commandsList.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-32 text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-md">
              <Command size={24} className="mb-2" />
              <p>No commands found</p>
              <Button variant="link" onClick={openNewCommandDialog} className="mt-2">
                Add your first command
              </Button>
            </div>
          ) : (
            <div className="border rounded-md border-slate-200 dark:border-slate-700">
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="commands" direction="vertical">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {commandsList.map((command, index) => renderCommandItem(command, index))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Command Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isNewCommand ? 'Add New Command' : 'Edit Command'}
            </DialogTitle>
            <DialogDescription>
              {isNewCommand 
                ? 'Create a new command for your bot' 
                : 'Update your command settings'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Command Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Command
              </Label>
              <div className="col-span-3 relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-slate-500">/</span>
                </div>
                <Input
                  id="name"
                  placeholder="command"
                  value={commandName}
                  onChange={(e) => setCommandName(e.target.value)}
                  className="pl-6"
                  required
                />
              </div>
            </div>
            
            {/* Command Description */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                placeholder="Shows the menu options"
                value={commandDescription}
                onChange={(e) => setCommandDescription(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            
            {/* Command Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select 
                value={commandType} 
                onValueChange={setCommandType}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select command type" />
                </SelectTrigger>
                <SelectContent>
                  {COMMAND_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Command Enabled Status */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="enabled" className="text-right">
                Enabled
              </Label>
              <div className="flex items-center gap-2 col-span-3">
                <Switch
                  id="enabled"
                  checked={commandEnabled}
                  onCheckedChange={setCommandEnabled}
                />
                <Label htmlFor="enabled" className="text-sm">
                  {commandEnabled ? 'Command is active' : 'Command is disabled'}
                </Label>
              </div>
            </div>
            
            <div className="col-span-4 border-t border-slate-200 dark:border-slate-700 pt-4">
              <h3 className="font-medium mb-2">Command Options</h3>
              {renderCommandTypeFields()}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveCommand}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BotCommandsManager;