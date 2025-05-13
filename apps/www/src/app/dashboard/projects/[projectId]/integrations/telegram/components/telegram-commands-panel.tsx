"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Switch } from "@workspace/ui/components/switch";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { AlertCircle, Plus, Trash, GripVertical, Edit, Command } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";

interface TelegramCommandsPanelProps {
  projectId: string;
}

// Command type options
const COMMAND_TYPES = [
  { value: "TEXT_RESPONSE", label: "Text Response" },
  { value: "BUTTON_MENU", label: "Button Menu" },
  { value: "POINTS_INFO", label: "Points Information" },
  { value: "MEMBERSHIP_INFO", label: "Membership Information" },
  { value: "COUPON_GENERATOR", label: "Coupon Generator" },
  { value: "CUSTOM_ACTION", label: "Custom Action" }
];

export default function TelegramCommandsPanel({ projectId }: TelegramCommandsPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<any>(null);
  const [isNewCommand, setIsNewCommand] = useState(false);
  const [commandName, setCommandName] = useState("");
  const [commandDescription, setCommandDescription] = useState("");
  const [commandResponse, setCommandResponse] = useState("");
  const [commandType, setCommandType] = useState("TEXT_RESPONSE");
  const [commandEnabled, setCommandEnabled] = useState(true);
  const [commandMetadata, setCommandMetadata] = useState<any>({});
  
  const queryClient = useQueryClient();

  // Fetch all commands for this project
  const { data: commands = [], isLoading } = useQuery({
    queryKey: ["telegramCommands", projectId],
    queryFn: () => fetchTelegramCommands(projectId),
  });

  // Mutation for creating/updating commands
  const { mutate: saveCommand, isPending: isSaving } = useMutation({
    mutationFn: (command: any) => {
      const method = command.id ? "PATCH" : "POST";
      return fetch(`/api/projects/${projectId}/integrations/telegram/commands${command.id ? `?commandId=${command.id}` : ''}`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      }).then(res => {
        if (!res.ok) throw new Error("Failed to save command");
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegramCommands", projectId] });
      toast.success(isNewCommand ? "Command created successfully" : "Command updated successfully");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Failed to save command", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // Mutation for deleting commands
  const { mutate: deleteCommand} = useMutation({
    mutationFn: (commandId: string) => {
      return fetch(`/api/projects/${projectId}/integrations/telegram/commands?commandId=${commandId}`, {
        method: "DELETE",
      }).then(res => {
        if (!res.ok) throw new Error("Failed to delete command");
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegramCommands", projectId] });
      toast.success("Command deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete command", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // Mutation for reordering commands
  const { mutate: reorderCommands } = useMutation({
    mutationFn: (commandIds: string[]) => {
      return fetch(`/api/projects/${projectId}/integrations/telegram/commands`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reorder",
          commandIds
        }),
      }).then(res => {
        if (!res.ok) throw new Error("Failed to reorder commands");
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegramCommands", projectId] });
    },
    onError: (error) => {
      toast.error("Failed to reorder commands", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // Open dialog for creating a new command
  const handleNewCommand = () => {
    setIsNewCommand(true);
    setEditingCommand(null);
    setCommandName("");
    setCommandDescription("");
    setCommandResponse("");
    setCommandType("TEXT_RESPONSE");
    setCommandEnabled(true);
    setCommandMetadata({});
    setIsDialogOpen(true);
  };

  // Open dialog for editing an existing command
  const handleEditCommand = (command: any) => {
    setIsNewCommand(false);
    setEditingCommand(command);
    setCommandName(command.command);
    setCommandDescription(command.description);
    setCommandResponse(command.response || "");
    setCommandType(command.type);
    setCommandEnabled(command.isEnabled);
    setCommandMetadata(command.metadata || {});
    setIsDialogOpen(true);
  };

  // Close the dialog and reset form state
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCommand(null);
  };

  // Handle toggling a command's enabled state
  const handleToggleEnabled = (command: any, enabled: boolean) => {
    saveCommand({
      ...command,
      isEnabled: enabled
    });
  };

  // Handle deleting a command
  const handleDeleteCommand = (commandId: string) => {
    if (confirm("Are you sure you want to delete this command? This cannot be undone.")) {
      deleteCommand(commandId);
    }
  };

  // Save command changes
  const handleSaveCommand = () => {
    // Validate the form
    if (!commandName || !commandDescription || !commandType) {
      toast.error("Please fill out all required fields");
      return;
    }

    // Validate the command format (no spaces, no leading slash)
    if (commandName.includes(" ") || commandName.startsWith("/")) {
      toast.error("Command name cannot contain spaces or start with '/'");
      return;
    }

    // For TEXT_RESPONSE type, ensure there's a response
    if (commandType === "TEXT_RESPONSE" && !commandResponse) {
      toast.error("Response text is required for Text Response commands");
      return;
    }

    // Prepare the command object
    const commandData = {
      ...(editingCommand ? { id: editingCommand.id } : {}),
      command: commandName,
      description: commandDescription,
      response: commandResponse,
      type: commandType,
      isEnabled: commandEnabled,
      metadata: commandMetadata
    };

    // Save the command
    saveCommand(commandData);
  };

  // Handle drag and drop reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(commands);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update the sortOrder on the backend
    reorderCommands(items.map(item => item.id));
  };

  // Render command type badge
  const renderCommandTypeBadge = (type: string) => {
    switch (type) {
      case "TEXT_RESPONSE":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Text Response</Badge>;
      case "BUTTON_MENU":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Button Menu</Badge>;
      case "POINTS_INFO":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Points Info</Badge>;
      case "MEMBERSHIP_INFO":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Membership Info</Badge>;
      case "COUPON_GENERATOR":
        return <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">Coupon Generator</Badge>;
      case "CUSTOM_ACTION":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Custom Action</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Render metadata fields based on command type
  const renderMetadataFields = () => {
    switch (commandType) {
      case "BUTTON_MENU":
        return (
          <div className="space-y-4 mt-4 border p-4 rounded-md">
            <h4 className="font-medium text-sm">Button Configuration</h4>
            <div className="space-y-2">
              <Label>Menu Title</Label>
              <Input
                placeholder="Enter menu title"
                value={commandMetadata.title || ''}
                onChange={(e) => setCommandMetadata({
                  ...commandMetadata,
                  title: e.target.value
                })}
              />
            </div>
            
            <div>
              <Label className="block mb-2">Buttons</Label>
              {(commandMetadata.buttons || []).map((button: any, index: number) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    placeholder="Button label"
                    value={button.label}
                    onChange={(e) => {
                      const newButtons = [...(commandMetadata.buttons || [])];
                      newButtons[index] = { ...button, label: e.target.value };
                      setCommandMetadata({
                        ...commandMetadata,
                        buttons: newButtons
                      });
                    }}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Action (e.g. menu:main)"
                    value={button.action}
                    onChange={(e) => {
                      const newButtons = [...(commandMetadata.buttons || [])];
                      newButtons[index] = { ...button, action: e.target.value };
                      setCommandMetadata({
                        ...commandMetadata,
                        buttons: newButtons
                      });
                    }}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      const newButtons = [...(commandMetadata.buttons || [])];
                      newButtons.splice(index, 1);
                      setCommandMetadata({
                        ...commandMetadata,
                        buttons: newButtons
                      });
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const buttons = commandMetadata.buttons || [];
                  setCommandMetadata({
                    ...commandMetadata,
                    buttons: [...buttons, { label: '', action: '' }]
                  });
                }}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Button
              </Button>
            </div>
          </div>
        );
      
      case "CUSTOM_ACTION":
        return (
          <div className="space-y-4 mt-4 border p-4 rounded-md">
            <h4 className="font-medium text-sm">Custom Action Configuration</h4>
            
            <div className="space-y-2">
              <Label>Action Type</Label>
              <Select
                value={commandMetadata.actionType || "webhook"}
                onValueChange={(value) => setCommandMetadata({
                  ...commandMetadata,
                  actionType: value
                })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="webhook">External Webhook</SelectItem>
                    <SelectItem value="api_call">API Call</SelectItem>
                    <SelectItem value="form">User Input Form</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            {commandMetadata.actionType === "webhook" && (
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  placeholder="https://your-webhook-url.com"
                  value={commandMetadata.webhookUrl || ''}
                  onChange={(e) => setCommandMetadata({
                    ...commandMetadata,
                    webhookUrl: e.target.value
                  })}
                />
              </div>
            )}
            
            {commandMetadata.actionType === "form" && (
              <div className="space-y-2">
                <Label>Form Prompt</Label>
                <Textarea
                  placeholder="Please provide the requested information:"
                  value={commandMetadata.formPrompt || ''}
                  onChange={(e) => setCommandMetadata({
                    ...commandMetadata,
                    formPrompt: e.target.value
                  })}
                  rows={3}
                />
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-2xl">Command Manager</CardTitle>
          <CardDescription>
            Create and manage custom commands for your Telegram bot
          </CardDescription>
        </div>
        <Button onClick={handleNewCommand}>
          <Plus className="mr-2 h-4 w-4" /> Add Command
        </Button>
      </CardHeader>
      
      <CardContent>
        {commands.length === 0 ? (
          <div className="text-center py-8 border rounded-lg border-dashed">
            <Command className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No commands yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add custom commands to your bot to help users interact with it
            </p>
            <Button onClick={handleNewCommand} className="mt-4">
              <Plus className="mr-2 h-4 w-4" /> Add First Command
            </Button>
          </div>
        ) : (
          <>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>How commands work</AlertTitle>
              <AlertDescription>
                Users can interact with these commands in your Telegram bot by typing a forward slash (/) followed by the command name.
              </AlertDescription>
            </Alert>
            
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="commands">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {commands.map((command: any, index: number) => (
                      <Draggable key={command.id} draggableId={command.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`rounded-lg border bg-card text-card-foreground p-4 flex items-center justify-between ${command.isEnabled ? '' : 'opacity-60'}`}
                          >
                            <div className="flex items-center gap-2">
                              <div {...provided.dragHandleProps} className="cursor-grab">
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  /{command.command} 
                                  {renderCommandTypeBadge(command.type)}
                                  {!command.isEnabled && (
                                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                      Disabled
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {command.description}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={command.isEnabled}
                                onCheckedChange={(checked) => handleToggleEnabled(command, checked)}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditCommand(command)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCommand(command.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{isNewCommand ? 'Create New Command' : 'Edit Command'}</DialogTitle>
            <DialogDescription>
              {isNewCommand 
                ? 'Add a new custom command to your Telegram bot' 
                : `Editing command /${commandName}`}
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
                  <span className="text-muted-foreground">/</span>
                </div>
                <Input
                  id="name"
                  placeholder="e.g. menu or points"
                  className="pl-6"
                  value={commandName}
                  onChange={(e) => setCommandName(e.target.value)}
                />
              </div>
            </div>
            
            {/* Command Description */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <div className="col-span-3">
                <Input
                  id="description"
                  placeholder="Short description for the command list"
                  value={commandDescription}
                  onChange={(e) => setCommandDescription(e.target.value)}
                />
              </div>
            </div>
            
            {/* Command Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <div className="col-span-3">
                <Select
                  value={commandType}
                  onValueChange={setCommandType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select command type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {COMMAND_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Command Response (for TEXT_RESPONSE type) */}
            {commandType === 'TEXT_RESPONSE' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="response" className="text-right">
                  Response
                </Label>
                <div className="col-span-3">
                  <Textarea
                    id="response"
                    placeholder="Text to reply when the command is used"
                    value={commandResponse}
                    onChange={(e) => setCommandResponse(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
            
            {/* Command Enabled */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="enabled" className="text-right">
                Enabled
              </Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={commandEnabled}
                  onCheckedChange={setCommandEnabled}
                />
                <Label htmlFor="enabled">
                  {commandEnabled ? 'Active' : 'Inactive'}
                </Label>
              </div>
            </div>

            {/* Render type-specific fields */}
            {renderMetadataFields()}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline"
              onClick={handleCloseDialog}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveCommand}
              disabled={isSaving}
            >
              {isSaving ? (
                <>Saving...</>
              ) : isNewCommand ? (
                <>Create Command</>
              ) : (
                <>Update Command</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Fetch Telegram commands for a project
async function fetchTelegramCommands(projectId: string) {
  try {
    const response = await fetch(`/api/projects/${projectId}/integrations/telegram/commands`);
    if (!response.ok) {
      throw new Error('Failed to fetch commands');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Telegram commands:', error);
    return [];
  }
}