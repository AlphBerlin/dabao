"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Separator } from "@workspace/ui/components/separator";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@workspace/ui/components/form";
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group";
import { Trash, Plus, Link2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog";
import { Code } from "@workspace/ui/components/code";

// Form schema
const commandSchema = z.object({
  command: z
    .string()
    .min(1, "Command is required")
    .max(32, "Command must be 32 characters or less")
    .regex(/^[a-z0-9_]*$/, "Command can only contain lowercase letters, numbers, and underscores"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(256, "Description must be 256 characters or less"),
  type: z.enum([
    "TEXT_RESPONSE",
    "BUTTON_MENU",
    "POINTS_INFO",
    "MEMBERSHIP_INFO",
    "COUPON_GENERATOR",
    "CUSTOM_ACTION",
  ]),
  response: z.string().optional(),
  isEnabled: z.boolean().default(true),
  sortOrder: z.number().default(0),
  metadata: z.any().optional(),
});

type CommandFormData = z.infer<typeof commandSchema>;

// Props for the form
interface CommandFormProps {
  projectId: string;
  onSubmit: (data: CommandFormData) => Promise<void>;
  editingCommand: any | null;
  onCancel: () => void;
}

export default function CommandForm({
  projectId,
  onSubmit,
  editingCommand,
  onCancel,
}: CommandFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customButtons, setCustomButtons] = useState<any[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string>("");
  const [isCreatingMenu, setIsCreatingMenu] = useState(false);
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuId, setNewMenuId] = useState("");
  const router = useRouter();

  // Setup form
  const form = useForm<CommandFormData>({
    resolver: zodResolver(commandSchema),
    defaultValues: {
      command: "",
      description: "",
      type: "TEXT_RESPONSE",
      response: "",
      isEnabled: true,
      sortOrder: 0,
      metadata: {},
    },
  });

  // Fetch existing menus for Button Menu type
  const { data: menus = [] } = useQuery({
    queryKey: ["telegramMenus", projectId],
    queryFn: () => fetchTelegramMenus(projectId),
    enabled: !!projectId,
  });

  // Populate form with editing command data
  useEffect(() => {
    if (editingCommand) {
      form.reset({
        command: editingCommand.command || "",
        description: editingCommand.description || "",
        type: editingCommand.type || "TEXT_RESPONSE",
        response: editingCommand.response || "",
        isEnabled: editingCommand.isEnabled ?? true,
        sortOrder: editingCommand.sortOrder ?? 0,
        metadata: editingCommand.metadata || {},
      });

      // Set custom buttons if available
      if (editingCommand.type === "BUTTON_MENU" && editingCommand.metadata?.buttons) {
        setCustomButtons(editingCommand.metadata.buttons);
      }

      // If using a pre-defined menu, set the selectedMenuId
      if (editingCommand.type === "BUTTON_MENU" && editingCommand.metadata?.menuId) {
        setSelectedMenuId(editingCommand.metadata.menuId);
      }
    }
  }, [editingCommand, form]);

  // Handle adding a button
  const handleAddButton = () => {
    setCustomButtons([...customButtons, { label: "", action: "" }]);
  };

  // Handle removing a button
  const handleRemoveButton = (index: number) => {
    const updatedButtons = [...customButtons];
    updatedButtons.splice(index, 1);
    setCustomButtons(updatedButtons);
  };

  // Handle button properties change
  const handleButtonChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updatedButtons = [...customButtons];
    updatedButtons[index] = { ...updatedButtons[index], [field]: value };
    setCustomButtons(updatedButtons);
  };

  // Handle creating a new menu on the fly
  const handleCreateMenu = async () => {
    if (!newMenuName || !newMenuId) {
      toast.error("Menu name and ID are required");
      return;
    }

    // Simple validation for menu ID
    if (!/^[a-zA-Z0-9_]+$/.test(newMenuId)) {
      toast.error("Menu ID can only contain letters, numbers, and underscores");
      return;
    }

    try {
      // Convert buttons to menu items format
      const menuItems = customButtons.map(button => ({
        text: button.label,
        action: button.action
      }));

      // Create the menu via API
      const response = await fetch(`/api/projects/${projectId}/integrations/telegram/menus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menuId: newMenuId,
          name: newMenuName,
          description: `Created from command /${form.getValues("command")}`,
          items: menuItems,
          isDefault: false
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create menu");
      }

      const newMenu = await response.json();
      
      // Set the created menu as selected
      setSelectedMenuId(newMenuId);
      
      // Clear form
      setIsCreatingMenu(false);
      setNewMenuName("");
      setNewMenuId("");
      
      toast.success("Menu created successfully");
    } catch (error) {
      toast.error("Failed to create menu", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (data: CommandFormData) => {
    try {
      // Prepare metadata based on command type
      let metadata = {};

      switch (data.type) {
        case "BUTTON_MENU":
          if (selectedMenuId) {
            // Use selected menu
            metadata = {
              ...data.metadata,
              menuId: selectedMenuId,
              title: data.response || "Menu"
            };
          } else {
            // Use custom buttons
            metadata = {
              ...data.metadata,
              title: data.response || "Menu",
              buttons: customButtons,
            };
          }
          break;
        case "CUSTOM_ACTION":
          metadata = {
            ...data.metadata,
            actionType: data.metadata?.actionType || "api_call",
          };
          break;
      }

      // Submit with updated metadata
      await onSubmit({
        ...data,
        metadata,
      });
    } catch (error) {
      console.error("Error submitting command:", error);
      toast.error("Failed to save command");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Command */}
          <FormField
            control={form.control}
            name="command"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Command</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      /
                    </span>
                    <Input
                      placeholder="menu"
                      className="pl-6"
                      {...field}
                      disabled={!!editingCommand}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Users will type /{field.value} to trigger this command
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Show the main menu"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Shown in the command list in Telegram
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Command Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Command Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                  className="grid grid-cols-3 gap-4"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="TEXT_RESPONSE" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Text Response
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="BUTTON_MENU" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Button Menu
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="POINTS_INFO" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Points Info
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="MEMBERSHIP_INFO" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Membership Info
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="COUPON_GENERATOR" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Coupon Generator
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="CUSTOM_ACTION" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Custom Action
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Controls how the bot responds when this command is used
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Response - show for TEXT_RESPONSE and BUTTON_MENU */}
        {(form.watch("type") === "TEXT_RESPONSE" ||
          form.watch("type") === "BUTTON_MENU") && (
          <FormField
            control={form.control}
            name="response"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {form.watch("type") === "TEXT_RESPONSE"
                    ? "Text Response"
                    : "Menu Title"}
                </FormLabel>
                <FormControl>
                  {form.watch("type") === "TEXT_RESPONSE" ? (
                    <Textarea
                      placeholder="Enter the response text"
                      className="min-h-32"
                      {...field}
                    />
                  ) : (
                    <Input placeholder="Menu Title" {...field} />
                  )}
                </FormControl>
                <FormDescription>
                  {form.watch("type") === "TEXT_RESPONSE"
                    ? "The text response sent when this command is used"
                    : "The text displayed above the menu buttons"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Button Menu Options - only for BUTTON_MENU type */}
        {form.watch("type") === "BUTTON_MENU" && (
          <div className="space-y-4 border rounded-md p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Menu Configuration</h3>
            </div>

            {/* Menu Selection or Custom Buttons */}
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Label>Menu Source</Label>
                <RadioGroup
                  value={selectedMenuId ? "existing" : "custom"}
                  onValueChange={(value) => {
                    if (value === "custom") {
                      setSelectedMenuId("");
                    }
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="existing" id="existing" />
                    <Label htmlFor="existing">Use existing menu</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom">Create custom buttons</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Select Existing Menu */}
              {selectedMenuId || !customButtons.length ? (
                <div className="space-y-2">
                  <Label>Select Menu</Label>
                  <div className="flex space-x-2">
                    <Select
                      value={selectedMenuId}
                      onValueChange={(value) => {
                        setSelectedMenuId(value);
                        // If a menu is selected, clear custom buttons
                        if (value) {
                          setCustomButtons([]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a menu" />
                      </SelectTrigger>
                      <SelectContent>
                        {menus.map((menu: any) => (
                          <SelectItem key={menu.id} value={menu.menuId}>
                            {menu.name} ({menu.menuId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        router.push(`/dashboard/projects/${projectId}/integrations/telegram/settings?tab=menus`);
                      }}
                    >
                      <Link2 className="h-4 w-4 mr-2" /> Manage Menus
                    </Button>
                  </div>

                  {/* Create New Menu From Buttons */}
                  {customButtons.length > 0 && (
                    <div className="mt-4">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setIsCreatingMenu(true)}
                      >
                        Save as Menu...
                      </Button>
                    </div>
                  )}

                  <Dialog open={isCreatingMenu} onOpenChange={setIsCreatingMenu}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Menu</DialogTitle>
                        <DialogDescription>
                          Save your custom buttons as a reusable menu
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="newMenuName" className="text-right">
                            Menu Name
                          </Label>
                          <Input
                            id="newMenuName"
                            value={newMenuName}
                            onChange={(e) => setNewMenuName(e.target.value)}
                            placeholder="Main Menu"
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="newMenuId" className="text-right">
                            Menu ID
                          </Label>
                          <div className="col-span-3">
                            <Input
                              id="newMenuId"
                              value={newMenuId}
                              onChange={(e) => setNewMenuId(e.target.value)}
                              placeholder="main_menu"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Used in callback_data as <Code>menu:menu_id</Code>
                            </p>
                          </div>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreatingMenu(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="button" onClick={handleCreateMenu}>
                          Create Menu
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : null}

              {/* Custom Buttons Editor */}
              {!selectedMenuId && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Custom Buttons</Label>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddButton}>
                        <Plus className="h-4 w-4 mr-2" /> Add Button
                      </Button>
                    </div>

                    {customButtons.length === 0 ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No buttons added yet</AlertTitle>
                        <AlertDescription>
                          Add buttons or select an existing menu above
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-2">
                        {customButtons.map((button, index) => (
                          <Fragment key={index}>
                            <div className="grid grid-cols-3 gap-2 items-center">
                              <Input
                                value={button.label}
                                onChange={(e) =>
                                  handleButtonChange(index, "label", e.target.value)
                                }
                                placeholder="Button Label"
                                className="col-span-1"
                              />
                              <Input
                                value={button.action}
                                onChange={(e) =>
                                  handleButtonChange(index, "action", e.target.value)
                                }
                                placeholder="Action (e.g. menu:main)"
                                className="col-span-1"
                              />
                              <div className="col-span-1 flex justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveButton(index)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Fragment>
                        ))}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      <p>Button actions can be:</p>
                      <ul className="list-disc list-inside pl-4 mt-1">
                        <li><Code>menu:menu_id</Code> - Display another menu</li>
                        <li><Code>points</Code> - Show points balance</li>
                        <li><Code>membership</Code> - Show membership info</li> 
                        <li><Code>coupon:list</Code> - List available coupons</li>
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Custom Action Options - only for CUSTOM_ACTION type */}
        {form.watch("type") === "CUSTOM_ACTION" && (
          <div className="space-y-4 border rounded-md p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Custom Action Configuration</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="actionType" className="text-right">
                  Action Type
                </Label>
                <Select
                  value={form.getValues().metadata?.actionType || "api_call"}
                  onValueChange={(value) => {
                    const metadata = form.getValues().metadata || {};
                    form.setValue("metadata", { ...metadata, actionType: value });
                  }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select action type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="api_call">API Call</SelectItem>
                    <SelectItem value="form">Collect Form Data</SelectItem>
                    <SelectItem value="location">Request Location</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.getValues().metadata?.actionType === "form" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="formPrompt" className="text-right">
                    Form Prompt
                  </Label>
                  <Textarea
                    id="formPrompt"
                    value={form.getValues().metadata?.formPrompt || ""}
                    onChange={(e) => {
                      const metadata = form.getValues().metadata || {};
                      form.setValue("metadata", {
                        ...metadata,
                        formPrompt: e.target.value,
                      });
                    }}
                    placeholder="Please provide the following information:"
                    className="col-span-3"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Advanced Settings Toggle */}
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? "Hide Advanced Settings" : "Show Advanced Settings"}
          </Button>
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="grid grid-cols-2 gap-4">
            {/* Is Enabled */}
            <FormField
              control={form.control}
              name="isEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Enable Command
                    </FormLabel>
                    <FormDescription>
                      When disabled, the command will not appear in the command list
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

            {/* Sort Order */}
            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Controls the order in which commands are displayed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {editingCommand ? "Update Command" : "Create Command"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Fetch Telegram menus for a project
async function fetchTelegramMenus(projectId: string) {
  try {
    const response = await fetch(`/api/projects/${projectId}/integrations/telegram/menus`);
    if (!response.ok) {
      throw new Error('Failed to fetch menus');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Telegram menus:', error);
    return [];
  }
}