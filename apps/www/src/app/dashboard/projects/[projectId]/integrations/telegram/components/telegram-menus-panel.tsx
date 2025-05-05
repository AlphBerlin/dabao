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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Badge } from "@workspace/ui/components/badge";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { 
  AlertCircle, 
  Menu as MenuIcon, 
  Plus, 
  Trash, 
  GripVertical, 
  Edit, 
  Copy, 
  ArrowUp, 
  ArrowDown,
  AlertTriangle 
} from "lucide-react";

interface TelegramMenusPanelProps {
  projectId: string;
}

// Interface for menu item
interface MenuItem {
  text: string;
  action: string;
}

// Interface for menu data
interface MenuData {
  id: string;
  projectId: string;
  menuId: string;
  name: string;
  description?: string;
  items: MenuItem[];
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function TelegramMenusPanel({ projectId }: TelegramMenusPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuData | null>(null);
  const [isNewMenu, setIsNewMenu] = useState(false);
  const [menuId, setMenuId] = useState("");
  const [menuName, setMenuName] = useState("");
  const [menuDescription, setMenuDescription] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isDefault, setIsDefault] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch all menus for this project
  const { data: menus = [], isLoading } = useQuery({
    queryKey: ["telegramMenus", projectId],
    queryFn: () => fetchTelegramMenus(projectId),
  });

  // Mutation for creating/updating menus
  const { mutate: saveMenu, isPending: isSaving } = useMutation({
    mutationFn: (menu: any) => {
      const method = menu.id ? "PATCH" : "POST";
      return fetch(`/api/projects/${projectId}/integrations/telegram/menus${menu.id ? `/${menu.id}` : ''}`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(menu),
      }).then(res => {
        if (!res.ok) throw new Error("Failed to save menu");
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegramMenus", projectId] });
      toast.success(isNewMenu ? "Menu created successfully" : "Menu updated successfully");
      handleCloseDialog();
      
      // Also notify bot manager to refresh menus
      fetch(`/api/projects/${projectId}/integrations/telegram/refresh-menus`, {
        method: "POST",
      }).catch(console.error);
    },
    onError: (error) => {
      toast.error("Failed to save menu", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // Mutation for deleting menus
  const { mutate: deleteMenu, isPending: isDeleting } = useMutation({
    mutationFn: (menuId: string) => {
      return fetch(`/api/projects/${projectId}/integrations/telegram/menus/${menuId}`, {
        method: "DELETE",
      }).then(res => {
        if (!res.ok) throw new Error("Failed to delete menu");
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegramMenus", projectId] });
      toast.success("Menu deleted successfully");
      
      // Also notify bot manager to refresh menus
      fetch(`/api/projects/${projectId}/integrations/telegram/refresh-menus`, {
        method: "POST",
      }).catch(console.error);
    },
    onError: (error) => {
      toast.error("Failed to delete menu", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // Mutation for reordering menus
  const { mutate: reorderMenus } = useMutation({
    mutationFn: (menuIds: string[]) => {
      return fetch(`/api/projects/${projectId}/integrations/telegram/menus/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menuIds
        }),
      }).then(res => {
        if (!res.ok) throw new Error("Failed to reorder menus");
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegramMenus", projectId] });
      
      // Also notify bot manager to refresh menus
      fetch(`/api/projects/${projectId}/integrations/telegram/refresh-menus`, {
        method: "POST",
      }).catch(console.error);
    },
    onError: (error) => {
      toast.error("Failed to reorder menus", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // Open dialog for creating a new menu
  const handleNewMenu = () => {
    setIsNewMenu(true);
    setEditingMenu(null);
    setMenuId("");
    setMenuName("");
    setMenuDescription("");
    setMenuItems([{ text: "Main Menu", action: "menu:main" }]);
    setIsDefault(false);
    setIsDialogOpen(true);
  };

  // Open dialog for editing an existing menu
  const handleEditMenu = (menu: MenuData) => {
    setIsNewMenu(false);
    setEditingMenu(menu);
    setMenuId(menu.menuId);
    setMenuName(menu.name);
    setMenuDescription(menu.description || "");
    setMenuItems(menu.items || []);
    setIsDefault(menu.isDefault);
    setIsDialogOpen(true);
  };

  // Close the dialog and reset form state
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMenu(null);
  };

  // Handle deleting a menu
  const handleDeleteMenu = (menuId: string) => {
    if (confirm("Are you sure you want to delete this menu? This cannot be undone.")) {
      deleteMenu(menuId);
    }
  };

  // Save menu changes
  const handleSaveMenu = () => {
    // Validate the form
    if (!menuId || !menuName || menuItems.length === 0) {
      toast.error("Please fill out all required fields and add at least one menu item");
      return;
    }

    // Validate the menuId format
    if (menuId.includes(" ")) {
      toast.error("Menu ID cannot contain spaces");
      return;
    }

    // Check if the items are valid
    for (const item of menuItems) {
      if (!item.text || !item.action) {
        toast.error("All menu items must have text and action values");
        return;
      }
    }

    // Prepare the menu object
    const menuData = {
      ...(editingMenu ? { id: editingMenu.id } : {}),
      projectId,
      menuId,
      name: menuName,
      description: menuDescription,
      items: menuItems,
      isDefault
    };

    // Save the menu
    saveMenu(menuData);
  };

  // Add a new menu item
  const handleAddMenuItem = () => {
    setMenuItems([...menuItems, { text: "", action: "" }]);
  };

  // Update a menu item
  const handleUpdateMenuItem = (index: number, field: 'text' | 'action', value: string) => {
    const updatedItems = [...menuItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setMenuItems(updatedItems);
  };

  // Delete a menu item
  const handleDeleteMenuItem = (index: number) => {
    const updatedItems = [...menuItems];
    updatedItems.splice(index, 1);
    setMenuItems(updatedItems);
  };

  // Move a menu item up in the list
  const handleMoveItemUp = (index: number) => {
    if (index === 0) return;
    const updatedItems = [...menuItems];
    [updatedItems[index - 1], updatedItems[index]] = [updatedItems[index], updatedItems[index - 1]];
    setMenuItems(updatedItems);
  };

  // Move a menu item down in the list
  const handleMoveItemDown = (index: number) => {
    if (index === menuItems.length - 1) return;
    const updatedItems = [...menuItems];
    [updatedItems[index], updatedItems[index + 1]] = [updatedItems[index + 1], updatedItems[index]];
    setMenuItems(updatedItems);
  };

  // Handle drag and drop reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(menus);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update the sortOrder on the backend
    reorderMenus(items.map(item => item.id));
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
          <CardTitle className="text-2xl">Menu Manager</CardTitle>
          <CardDescription>
            Create and manage custom menus for your Telegram bot
          </CardDescription>
        </div>
        <Button onClick={handleNewMenu}>
          <Plus className="mr-2 h-4 w-4" /> Add Menu
        </Button>
      </CardHeader>
      
      <CardContent>
        {menus.length === 0 ? (
          <div className="text-center py-8 border rounded-lg border-dashed">
            <MenuIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No menus yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add custom menus to help users navigate your bot
            </p>
            <Button onClick={handleNewMenu} className="mt-4">
              <Plus className="mr-2 h-4 w-4" /> Add First Menu
            </Button>
          </div>
        ) : (
          <>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>How menus work</AlertTitle>
              <AlertDescription>
                Menus provide navigation options in your Telegram bot. Users select options which trigger actions.
                The Main Menu is the default starting point.
              </AlertDescription>
            </Alert>
            
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="menus">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {menus.map((menu: MenuData, index: number) => (
                      <Draggable key={menu.id} draggableId={menu.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`rounded-lg border bg-card text-card-foreground p-4 flex items-center justify-between ${index === 0 ? 'border-primary' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              <div {...provided.dragHandleProps} className="cursor-grab">
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {menu.name}
                                  {menu.isDefault && (
                                    <Badge variant="default" className="ml-2">Default</Badge>
                                  )}
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    ID: {menu.menuId}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {menu.description || `Menu with ${menu.items.length} items`}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditMenu(menu)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteMenu(menu.id)}
                                disabled={menu.isDefault}
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isNewMenu ? 'Create New Menu' : 'Edit Menu'}</DialogTitle>
            <DialogDescription>
              {isNewMenu 
                ? 'Add a new custom menu to your Telegram bot' 
                : `Editing menu: ${menuName}`}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="general" className="mt-4">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="items">Menu Items ({menuItems.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4 pt-4">
              {/* Menu ID */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="menuId" className="text-right">
                  Menu ID
                </Label>
                <div className="col-span-3">
                  <Input
                    id="menuId"
                    placeholder="e.g. main, settings, help"
                    value={menuId}
                    onChange={(e) => setMenuId(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Unique identifier used in code, no spaces
                  </p>
                </div>
              </div>
              
              {/* Menu Name */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Display Name
                </Label>
                <div className="col-span-3">
                  <Input
                    id="name"
                    placeholder="e.g. Main Menu"
                    value={menuName}
                    onChange={(e) => setMenuName(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Menu Description */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <div className="col-span-3">
                  <Textarea
                    id="description"
                    placeholder="Short description for the menu"
                    value={menuDescription}
                    onChange={(e) => setMenuDescription(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              
              {/* Default Menu Toggle */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isDefault" className="text-right">
                  Default Menu
                </Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isDefault"
                    checked={isDefault}
                    onCheckedChange={setIsDefault}
                    disabled={editingMenu?.isDefault}
                  />
                  <Label htmlFor="isDefault">
                    {isDefault ? 'Yes' : 'No'}
                  </Label>
                </div>
              </div>
              
              {isDefault && (
                <Alert className="col-span-4 mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Setting this as default will remove default status from any other menu.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            <TabsContent value="items" className="space-y-4 pt-4">
              <div className="space-y-4">
                {menuItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 border p-3 rounded-md relative">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <div>
                        <Label className="mb-1 block">Button Text</Label>
                        <Input
                          placeholder="e.g. Check Points"
                          value={item.text}
                          onChange={(e) => handleUpdateMenuItem(index, 'text', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="mb-1 block">Action</Label>
                        <Input
                          placeholder="e.g. points or menu:main"
                          value={item.action}
                          onChange={(e) => handleUpdateMenuItem(index, 'action', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleMoveItemUp(index)}
                        disabled={index === 0}
                        className="h-8 w-8"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleMoveItemDown(index)}
                        disabled={index === menuItems.length - 1}
                        className="h-8 w-8"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteMenuItem(index)}
                      disabled={menuItems.length <= 1}
                      className="h-8 w-8"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddMenuItem}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Menu Item
                </Button>
                
                {menuItems.length > 0 && (
                  <div className="mt-4 text-sm text-muted-foreground border-t pt-4">
                    <p className="font-medium">Supported actions:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li><code>menu:menu_id</code> - Opens another menu</li>
                      <li><code>points</code> - Shows points balance</li>
                      <li><code>membership</code> - Shows membership info</li>
                      <li><code>coupon:list</code> - Lists available coupons</li>
                      <li><code>coupon:generate</code> - Generate a coupon</li>
                    </ul>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              variant="outline"
              onClick={handleCloseDialog}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveMenu}
              disabled={isSaving}
            >
              {isSaving ? (
                <>Saving...</>
              ) : isNewMenu ? (
                <>Create Menu</>
              ) : (
                <>Update Menu</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
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