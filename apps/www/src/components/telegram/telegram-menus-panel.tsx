"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent
} from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@workspace/ui/components/table";
import { Textarea } from "@workspace/ui/components/textarea";
import { Badge } from "@workspace/ui/components/badge";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Trash, Edit, Menu } from "lucide-react";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { 
  DragDropContext, 
  Droppable, 
  Draggable,
  DropResult 
} from "@hello-pangea/dnd";

// Define the Menu Item schema
const menuItemSchema = z.object({
  text: z.string().min(1, "Button text is required"),
  action: z.string().min(1, "Action is required"),
});

// Define the form schema for creating/editing menus
const formSchema = z.object({
  menuId: z.string().regex(/^[a-zA-Z0-9_]+$/, "Menu ID can only contain letters, numbers, and underscores"),
  name: z.string().min(1, "Menu name is required"),
  description: z.string().optional(),
  items: z.array(menuItemSchema).min(1, "At least one menu item is required"),
  isDefault: z.boolean().default(false),
});

type Menu = {
  id: string;
  menuId: string;
  name: string;
  description?: string;
  items: MenuItem[];
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type MenuItem = {
  text: string;
  action: string;
};

type TelegramMenusProps = {
  projectId: string;
};

export default function TelegramMenusPanel({ projectId }: TelegramMenusProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [currentMenu, setCurrentMenu] = useState<Menu | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Setup form for the menu
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      menuId: "",
      name: "",
      description: "",
      items: [{ text: "", action: "" }],
      isDefault: false,
    },
  });

  // Load menus when component mounts
  useEffect(() => {
    loadMenus();
  }, [projectId]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isMenuDialogOpen && isEditing && currentMenu) {
      form.reset({
        menuId: currentMenu.menuId,
        name: currentMenu.name,
        description: currentMenu.description || "",
        items: currentMenu.items,
        isDefault: currentMenu.isDefault,
      });
    } else if (isMenuDialogOpen && !isEditing) {
      form.reset({
        menuId: "",
        name: "",
        description: "",
        items: [{ text: "", action: "" }],
        isDefault: false,
      });
    }
  }, [isMenuDialogOpen, isEditing, currentMenu]);

  // Load all menus
  const loadMenus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/integrations/telegram/menus`);
      if (!response.ok) {
        throw new Error("Failed to fetch menus");
      }
      const data = await response.json();
      setMenus(data);
    } catch (error) {
      console.error("Error loading menus:", error);
      toast.error("Failed to load menus");
    } finally {
      setIsLoading(false);
    }
  };

  // Add a menu item to the form
  const addMenuItem = () => {
    const currentItems = form.getValues("items") || [];
    form.setValue("items", [...currentItems, { text: "", action: "" }]);
  };

  // Remove a menu item from the form
  const removeMenuItem = (index: number) => {
    const currentItems = form.getValues("items") || [];
    if (currentItems.length > 1) {
      form.setValue("items", currentItems.filter((_, i) => i !== index));
    } else {
      toast.error("Menu must have at least one item");
    }
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      let response;

      if (isEditing && currentMenu) {
        // Update existing menu
        response = await fetch(`/api/projects/${projectId}/integrations/telegram/menus/${currentMenu.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
      } else {
        // Create new menu
        response = await fetch(`/api/projects/${projectId}/integrations/telegram/menus`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save menu");
      }

      toast.success(isEditing ? "Menu updated" : "Menu created");
      setIsMenuDialogOpen(false);
      setCurrentMenu(null);
      setIsEditing(false);
      loadMenus();
    } catch (error: any) {
      console.error("Error saving menu:", error);
      toast.error(error.message || "Failed to save menu");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a menu
  const deleteMenu = async (menuId: string) => {
    if (confirm("Are you sure you want to delete this menu?")) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/projects/${projectId}/integrations/telegram/menus/${menuId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete menu");
        }

        toast.success("Menu deleted");
        loadMenus();
      } catch (error) {
        console.error("Error deleting menu:", error);
        toast.error("Failed to delete menu");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Edit an existing menu
  const editMenu = (menu: Menu) => {
    setCurrentMenu(menu);
    setIsEditing(true);
    setIsMenuDialogOpen(true);
  };

  // Handle menu reordering via drag and drop
  const onDragEnd = async (result: DropResult) => {
    setIsDragging(false);
    
    if (!result.destination) return;
    
    const items = Array.from(menus);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update the UI immediately for better UX
    setMenus(items);
    
    // Prepare menu IDs in the new order
    const menuIds = items.map(menu => menu.id);
    
    // Send update to server
    try {
      const response = await fetch(`/api/projects/${projectId}/integrations/telegram/menus`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder", menuIds }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update menu order");
      }
      
      toast.success("Menu order updated");
    } catch (error) {
      console.error("Error updating menu order:", error);
      toast.error("Failed to update menu order");
      // Reload menus to reset the order in case of failure
      loadMenus();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Telegram Menus</span>
          <Button 
            onClick={() => {
              setCurrentMenu(null);
              setIsEditing(false);
              setIsMenuDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Menu
          </Button>
        </CardTitle>
        <CardDescription>
          Create and manage menu buttons for your Telegram bot
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && menus.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : menus.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Menu className="h-8 w-8 mx-auto mb-2" />
            <p>No menus created yet</p>
            <p className="text-sm">Create your first menu to get started</p>
          </div>
        ) : (
          <DragDropContext
            onDragEnd={onDragEnd}
            onDragStart={() => setIsDragging(true)}
          >
            <Droppable droppableId="menus-list">
              {(provided) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{ width: "5%" }}></TableHead>
                        <TableHead style={{ width: "25%" }}>Name</TableHead>
                        <TableHead style={{ width: "20%" }}>Menu ID</TableHead>
                        <TableHead style={{ width: "30%" }}>Description</TableHead>
                        <TableHead style={{ width: "10%" }}>Items</TableHead>
                        <TableHead style={{ width: "10%" }}>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menus.map((menu, index) => (
                        <Draggable 
                          key={menu.id} 
                          draggableId={menu.id} 
                          index={index}
                        >
                          {(provided) => (
                            <TableRow
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={isDragging ? "opacity-70" : ""}
                            >
                              <TableCell>
                                <div 
                                  {...provided.dragHandleProps}
                                  className="cursor-grab flex items-center justify-center"
                                >
                                  <Menu className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {menu.name}
                                  {menu.isDefault && (
                                    <Badge variant="outline" className="ml-2">Default</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {menu.menuId}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {menu.description || "-"}
                              </TableCell>
                              <TableCell>
                                {menu.items.length}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => editMenu(menu)}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Edit</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => deleteMenu(menu.id)}
                                          disabled={menu.isDefault}
                                        >
                                          <Trash className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {menu.isDefault ? "Cannot delete default menu" : "Delete"}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {/* Menu Edit/Create Dialog */}
        <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Menu" : "Create Menu"}</DialogTitle>
              <DialogDescription>
                {isEditing 
                  ? "Make changes to your menu" 
                  : "Create a new menu for your Telegram bot"}
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
                        <FormLabel>Menu Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Main Menu" {...field} />
                        </FormControl>
                        <FormDescription>
                          A descriptive name for this menu
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="menuId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Menu ID</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="main_menu" 
                            {...field} 
                            disabled={isEditing}
                          />
                        </FormControl>
                        <FormDescription>
                          Unique ID used in callback data
                        </FormDescription>
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
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Main navigation menu for the bot"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Optional description of this menu's purpose
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isDefault"
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
                          Default Menu
                        </FormLabel>
                        <FormDescription>
                          This menu will be shown when users send /menu command
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Menu Items</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={addMenuItem}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Item
                    </Button>
                  </div>
                  
                  <ScrollArea className="max-h-[300px] pr-4">
                    <div className="space-y-4">
                      {form.watch("items")?.map((_, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <div className="grid grid-cols-2 gap-2 flex-grow">
                            <FormField
                              control={form.control}
                              name={`items.${index}.text`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Button Text" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`items.${index}.action`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Action (e.g., menu:submenu)" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeMenuItem(index)}
                            disabled={form.watch("items")?.length <= 1}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsMenuDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? "Update Menu" : "Create Menu"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}