import React, { useState, useEffect } from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
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
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, X, GripVertical, Save, Undo } from 'lucide-react';
import { toast } from 'sonner';

// Define types
interface ButtonItem {
  text: string;
  callback_data: string;
  emoji?: string;
}

interface MenuLayout {
  enabled: boolean;
  layout: ButtonItem[][];
}

interface BotMenuDesignerProps {
  projectId: string;
  initialData?: {
    mainMenu?: MenuLayout;
    welcomeMenu?: MenuLayout;
  };
  onSave: (data: any) => void;
}

const BotMenuDesigner: React.FC<BotMenuDesignerProps> = ({  
  initialData, 
  onSave 
}) => {
  const [mainMenu, setMainMenu] = useState<MenuLayout>({
    enabled: true,
    layout: [
      [
        { text: "💳 Membership", callback_data: "menu:membership" },
        { text: "🍽️ Menu", callback_data: "menu:food" }
      ],
      [
        { text: "🎁 Promotions", callback_data: "menu:promotions" },
        { text: "📍 Our Outlets", callback_data: "menu:outlets" }
      ]
    ]
  });

  const [welcomeMenu, setWelcomeMenu] = useState<MenuLayout>({
    enabled: true,
    layout: [
      [
        { text: "🎯 Check Points", callback_data: "points" },
        { text: "🎁 Get Rewards", callback_data: "coupon:list" }
      ],
      [
        { text: "👤 My Membership", callback_data: "membership" },
        { text: "📋 Menu", callback_data: "menu:main" }
      ]
    ]
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<'main' | 'welcome'>('main');
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editingCol, setEditingCol] = useState<number | null>(null);
  const [buttonText, setButtonText] = useState('');
  const [buttonAction, setButtonAction] = useState('');
  const [buttonEmoji, setButtonEmoji] = useState('');
  const [isNewButton, setIsNewButton] = useState(false);
  const [isNewRow, setIsNewRow] = useState(false);

  // Initialize from props if available
  useEffect(() => {
    if (initialData) {
      if (initialData.mainMenu) {
        setMainMenu(initialData.mainMenu);
      }
      if (initialData.welcomeMenu) {
        setWelcomeMenu(initialData.welcomeMenu);
      }
    }
  }, [initialData]);

  // Handle drag and drop reordering
  const onDragEnd = (result: any, menuType: 'main' | 'welcome') => {
    const { source, destination } = result;
    
    // Dropped outside the list
    if (!destination) return;
    
    const menu = menuType === 'main' ? { ...mainMenu } : { ...welcomeMenu };
    const layout = [...menu.layout];
    
    // Handle row reordering
    if (result.type === 'row') {
      const [removed] = layout.splice(source.index, 1);
      layout.splice(destination.index, 0, removed);
    } 
    // Handle button reordering within a row
    else if (result.type === 'button') {
      const sourceRowIndex = parseInt(source.droppableId);
      const destRowIndex = parseInt(destination.droppableId);
      
      // If moving between different rows
      if (sourceRowIndex !== destRowIndex) {
        const sourceRow = [...layout[sourceRowIndex]];
        const destRow = [...layout[destRowIndex]];
        
        const [removed] = sourceRow.splice(source.index, 1);
        destRow.splice(destination.index, 0, removed);
        
        layout[sourceRowIndex] = sourceRow;
        layout[destRowIndex] = destRow;
      } 
      // Moving within the same row
      else {
        const row = [...layout[sourceRowIndex]];
        const [removed] = row.splice(source.index, 1);
        row.splice(destination.index, 0, removed);
        
        layout[sourceRowIndex] = row;
      }
    }
    
    menu.layout = layout;
    
    if (menuType === 'main') {
      setMainMenu(menu);
    } else {
      setWelcomeMenu(menu);
    }
  };

  // Open dialog to edit button
  const openEditDialog = (menuType: 'main' | 'welcome', rowIndex: number, colIndex: number) => {
    setEditingMenu(menuType);
    setEditingRow(rowIndex);
    setEditingCol(colIndex);
    
    const menu = menuType === 'main' ? mainMenu : welcomeMenu;
    const button = menu.layout[rowIndex][colIndex];
    
    setButtonText(button.text.replace(/^.*?\s/, '')); // Remove emoji if present
    setButtonAction(button.callback_data);
    setButtonEmoji(button.text.match(/^\S+\s/) ? button.text.match(/^\S+/)?.[0] || '' : '');
    setIsNewButton(false);
    setIsDialogOpen(true);
  };

  // Open dialog to add new button
  const openNewButtonDialog = (menuType: 'main' | 'welcome', rowIndex: number) => {
    setEditingMenu(menuType);
    setEditingRow(rowIndex);
    setEditingCol(null);
    setButtonText('');
    setButtonAction('');
    setButtonEmoji('');
    setIsNewButton(true);
    setIsNewRow(false);
    setIsDialogOpen(true);
  };

  // Open dialog to add new row
  const openNewRowDialog = (menuType: 'main' | 'welcome') => {
    setEditingMenu(menuType);
    setEditingRow(null);
    setEditingCol(null);
    setButtonText('');
    setButtonAction('');
    setButtonEmoji('');
    setIsNewButton(true);
    setIsNewRow(true);
    setIsDialogOpen(true);
  };

  // Save button changes
  const saveButton = () => {
    if (!buttonText || !buttonAction) {
      toast.error('Button text and action are required');
      return;
    }
    
    const displayText = buttonEmoji ? `${buttonEmoji} ${buttonText}` : buttonText;
    const button: ButtonItem = {
      text: displayText,
      callback_data: buttonAction
    };
    
    if (editingMenu === 'main') {
      const updatedMenu = { ...mainMenu };
      
      if (isNewRow) {
        updatedMenu.layout.push([button]);
      } else if (isNewButton && editingRow !== null) {
        updatedMenu.layout[editingRow].push(button);
      } else if (editingRow !== null && editingCol !== null) {
        updatedMenu.layout[editingRow][editingCol] = button;
      }
      
      setMainMenu(updatedMenu);
    } else {
      const updatedMenu = { ...welcomeMenu };
      
      if (isNewRow) {
        updatedMenu.layout.push([button]);
      } else if (isNewButton && editingRow !== null) {
        updatedMenu.layout[editingRow].push(button);
      } else if (editingRow !== null && editingCol !== null) {
        updatedMenu.layout[editingRow][editingCol] = button;
      }
      
      setWelcomeMenu(updatedMenu);
    }
    
    setIsDialogOpen(false);
  };

  // Remove a button
  const removeButton = (menuType: 'main' | 'welcome', rowIndex: number, colIndex: number) => {
    if (menuType === 'main') {
      const updatedMenu = { ...mainMenu };
      updatedMenu.layout[rowIndex].splice(colIndex, 1);
      
      // If row becomes empty, remove it
      if (updatedMenu.layout[rowIndex].length === 0) {
        updatedMenu.layout.splice(rowIndex, 1);
      }
      
      setMainMenu(updatedMenu);
    } else {
      const updatedMenu = { ...welcomeMenu };
      updatedMenu.layout[rowIndex].splice(colIndex, 1);
      
      // If row becomes empty, remove it
      if (updatedMenu.layout[rowIndex].length === 0) {
        updatedMenu.layout.splice(rowIndex, 1);
      }
      
      setWelcomeMenu(updatedMenu);
    }
  };

  // Remove an entire row
  const removeRow = (menuType: 'main' | 'welcome', rowIndex: number) => {
    if (menuType === 'main') {
      const updatedMenu = { ...mainMenu };
      updatedMenu.layout.splice(rowIndex, 1);
      setMainMenu(updatedMenu);
    } else {
      const updatedMenu = { ...welcomeMenu };
      updatedMenu.layout.splice(rowIndex, 1);
      setWelcomeMenu(updatedMenu);
    }
  };

  // Toggle menu enabled state
  const toggleMenuEnabled = (menuType: 'main' | 'welcome') => {
    if (menuType === 'main') {
      setMainMenu({
        ...mainMenu,
        enabled: !mainMenu.enabled
      });
    } else {
      setWelcomeMenu({
        ...welcomeMenu,
        enabled: !welcomeMenu.enabled
      });
    }
  };

  // Save all menu changes
  const handleSaveAll = () => {
    const data = {
      mainMenu,
      welcomeMenu
    };
    
    onSave(data);
    toast.success('Bot menu settings saved');
  };

  // Render menu preview
  const renderMenuPreview = (menu: MenuLayout, menuType: 'main' | 'welcome') => {
    return (
      <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-md">
        <DragDropContext onDragEnd={(result) => onDragEnd(result, menuType)}>
          <Droppable droppableId={`${menuType}-rows`} type="row">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {menu.layout.map((row, rowIndex) => (
                  <Draggable key={`row-${rowIndex}`} draggableId={`${menuType}-row-${rowIndex}`} index={rowIndex}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="bg-white dark:bg-slate-800 rounded-md p-2 mb-2 relative"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div {...provided.dragHandleProps} className="cursor-grab">
                            <GripVertical size={16} />
                          </div>
                          <span className="text-xs text-slate-500">Row {rowIndex + 1}</span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => openNewButtonDialog(menuType, rowIndex)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                              title="Add button to row"
                            >
                              <Plus size={14} />
                            </button>
                            <button
                              onClick={() => removeRow(menuType, rowIndex)}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                              title="Remove row"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <Droppable droppableId={`${rowIndex}`} type="button" direction="horizontal">
                          {(provided) => (
                            <div 
                              ref={provided.innerRef} 
                              {...provided.droppableProps}
                              className="flex flex-wrap gap-2"
                            >
                              {row.map((button, colIndex) => (
                                <Draggable
                                  key={`${menuType}-button-${rowIndex}-${colIndex}`}
                                  draggableId={`${menuType}-button-${rowIndex}-${colIndex}`}
                                  index={colIndex}
                                >
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="bg-slate-100 dark:bg-slate-700 p-2 rounded relative group cursor-grab"
                                    >
                                      <span>{button.text}</span>
                                      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-800 rounded-full">
                                        <button
                                          onClick={() => openEditDialog(menuType, rowIndex, colIndex)}
                                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700"
                                          title="Edit button"
                                        >
                                          <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12.1464 1.14645C12.3417 0.951184 12.6583 0.951184 12.8535 1.14645L14.8535 3.14645C15.0488 3.34171 15.0488 3.65829 14.8535 3.85355L10.9109 7.79618C10.8349 7.87218 10.7471 7.93543 10.651 7.9835L6.72359 9.94822C6.53109 10.0442 6.29861 10.0117 6.14643 9.85948C5.99425 9.7073 5.96173 9.47482 6.05773 9.28232L8.02245 5.35492C8.07052 5.25878 8.13377 5.17097 8.20977 5.09497L12.1464 1.14645ZM12.5 2.20711L8.91091 5.79618L7.87868 6.82841L7.08689 8.41348L8.67196 7.62169L9.70419 6.58946L13.2929 3H12.5V2.20711ZM9.99998 2L8.99998 3H4.9C4.47171 3 4.18056 3.00039 3.95552 3.01877C3.73631 3.03668 3.62421 3.06915 3.54601 3.10899C3.35785 3.20487 3.20487 3.35785 3.10899 3.54601C3.06915 3.62421 3.03669 3.73631 3.01878 3.95552C3.00039 4.18056 3 4.47171 3 4.9V11.1C3 11.5283 3.00039 11.8194 3.01878 12.0445C3.03669 12.2637 3.06915 12.3758 3.10899 12.454C3.20487 12.6422 3.35785 12.7951 3.54601 12.891C3.62421 12.9309 3.73631 12.9633 3.95552 12.9812C4.18056 12.9996 4.47171 13 4.9 13H11.1C11.5283 13 11.8194 12.9996 12.0445 12.9812C12.2637 12.9633 12.3758 12.9309 12.454 12.891C12.6422 12.7951 12.7951 12.6422 12.891 12.454C12.9309 12.3758 12.9633 12.2637 12.9812 12.0445C12.9996 11.8194 13 11.5283 13 11.1V6.99998L14 5.99998V11.1V11.1207C14 11.5231 14 11.8553 13.9779 12.1259C13.9549 12.407 13.9057 12.6653 13.782 12.908C13.5903 13.2843 13.2843 13.5903 12.908 13.782C12.6653 13.9057 12.407 13.9549 12.1259 13.9779C11.8553 14 11.5231 14 11.1207 14H11.1H4.9H4.87934C4.47686 14 4.14468 14 3.87409 13.9779C3.59304 13.9549 3.33469 13.9057 3.09202 13.782C2.7157 13.5903 2.40973 13.2843 2.21799 12.908C2.09434 12.6653 2.04506 12.407 2.0221 12.1259C1.99999 11.8553 1.99999 11.5231 2 11.1207V11.1206V11.1V4.9V4.87935V4.87932C1.99999 4.47685 1.99999 4.14468 2.0221 3.87409C2.04506 3.59304 2.09434 3.33469 2.21799 3.09202C2.40973 2.7157 2.7157 2.40973 3.09202 2.21799C3.33469 2.09434 3.59304 2.04506 3.87409 2.0221C4.14468 1.99999 4.47685 1.99999 4.87932 2H4.87935H4.9H9.99998Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path>
                                          </svg>
                                        </button>
                                        <button
                                          onClick={() => removeButton(menuType, rowIndex, colIndex)}
                                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900"
                                          title="Remove button"
                                        >
                                          <X size={10} />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4"
          onClick={() => openNewRowDialog(menuType)}
        >
          <Plus className="mr-1" size={16} />
          Add Row
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bot Menu Designer</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <Undo className="mr-2" size={16} />
            Reset
          </Button>
          <Button onClick={handleSaveAll}>
            <Save className="mr-2" size={16} />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="main">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="main">Main Menu</TabsTrigger>
          <TabsTrigger value="welcome">Welcome Menu</TabsTrigger>
        </TabsList>
        
        <TabsContent value="main">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Main Menu Configuration</CardTitle>
                  <CardDescription>
                    Configure the main menu layout shown when users type /menu
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="main-enabled">Enabled</Label>
                  <Checkbox 
                    id="main-enabled" 
                    checked={mainMenu.enabled} 
                    onCheckedChange={() => toggleMenuEnabled('main')}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-950 rounded-md p-4">
                  <div className="text-sm text-slate-500 mb-2">Preview</div>
                  <div className="border border-slate-300 dark:border-slate-700 rounded-md p-4 max-w-sm mx-auto">
                    <div className="mb-2 text-slate-700 dark:text-slate-300">📋 Main Menu - Choose an option:</div>
                    {mainMenu.layout.map((row, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        {row.map((button, j) => (
                          <div key={j} className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm">
                            {button.text}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Layout Editor</h3>
                  {renderMenuPreview(mainMenu, 'main')}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="welcome">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Welcome Menu Configuration</CardTitle>
                  <CardDescription>
                    Configure the welcome menu shown when users first start the bot
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="welcome-enabled">Enabled</Label>
                  <Checkbox 
                    id="welcome-enabled" 
                    checked={welcomeMenu.enabled} 
                    onCheckedChange={() => toggleMenuEnabled('welcome')}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-950 rounded-md p-4">
                  <div className="text-sm text-slate-500 mb-2">Preview</div>
                  <div className="border border-slate-300 dark:border-slate-700 rounded-md p-4 max-w-sm mx-auto">
                    <div className="mb-2 text-slate-700 dark:text-slate-300">
                      Welcome! I'm your bot assistant. Use /help to see available commands.
                    </div>
                    {welcomeMenu.layout.map((row, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        {row.map((button, j) => (
                          <div key={j} className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm">
                            {button.text}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Layout Editor</h3>
                  {renderMenuPreview(welcomeMenu, 'welcome')}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {isNewButton ? 'Add New Button' : 'Edit Button'}
            </DialogTitle>
            <DialogDescription>
              {isNewButton 
                ? 'Create a new button for your bot menu' 
                : 'Update the button properties'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="emoji" className="text-right">
                Emoji
              </Label>
              <Input
                id="emoji"
                placeholder="😀"
                value={buttonEmoji}
                onChange={(e) => setButtonEmoji(e.target.value)}
                className="col-span-3"
                maxLength={2}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="text" className="text-right">
                Text
              </Label>
              <Input
                id="text"
                placeholder="Button Text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="action" className="text-right">
                Action
              </Label>
              <Input
                id="action"
                placeholder="callback_data (e.g. menu:main)"
                value={buttonAction}
                onChange={(e) => setButtonAction(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md">
            <div className="text-xs text-slate-500 mb-2">Preview:</div>
            <div className="inline-block bg-blue-500 text-white px-3 py-1 rounded-md">
              {buttonEmoji ? `${buttonEmoji} ${buttonText || 'Button Text'}` : buttonText || 'Button Text'}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveButton}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BotMenuDesigner;