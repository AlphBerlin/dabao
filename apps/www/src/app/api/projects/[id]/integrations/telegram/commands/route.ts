import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import botManager from '@/services/bot-manager';

// GET route to fetch all commands for a project's Telegram bot
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId =(await params).id;
    
    // Check for authentication and authorization
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify if the project exists and user has access
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if telegram settings exist
    const telegramSettings = await db.telegramSettings.findUnique({
      where: { projectId },
    });

    if (!telegramSettings) {
      return NextResponse.json({ error: 'Telegram integration not found' }, { status: 404 });
    }

    // Fetch all commands for this project
    const commands = await db.telegramCommand.findMany({
      where: { projectId },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(commands);
  } catch (error) {
    console.error('Error fetching Telegram commands:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Telegram commands' },
      { status: 500 }
    );
  }
}

// POST route to create a new command
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId =(await params).id;
    const data = await request.json();
    
    // Check for authentication and authorization
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify if the project exists and user has access
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if telegram settings exist
    const telegramSettings = await db.telegramSettings.findUnique({
      where: { projectId },
    });

    if (!telegramSettings) {
      return NextResponse.json({ error: 'Telegram integration not found' }, { status: 404 });
    }

    // Validate required fields
    if (!data.command || !data.description || !data.type) {
      return NextResponse.json(
        { error: 'Command name, description and type are required' },
        { status: 400 }
      );
    }

    // Validate command format (no leading slash, no spaces)
    if (data.command.startsWith('/') || data.command.includes(' ')) {
      return NextResponse.json(
        { error: 'Command should not include leading slash or spaces' },
        { status: 400 }
      );
    }

    // Check if command already exists for this project
    const existingCommand = await db.telegramCommand.findFirst({
      where: {
        projectId,
        command: data.command,
      },
    });

    if (existingCommand) {
      return NextResponse.json(
        { error: 'A command with this name already exists' },
        { status: 400 }
      );
    }

    // Get the highest sort order to place new command at the end
    const lastCommand = await db.telegramCommand.findFirst({
      where: { projectId },
      orderBy: { sortOrder: 'desc' },
    });
    const nextSortOrder = lastCommand ? lastCommand.sortOrder + 1 : 0;

    // Create the new command
    const command = await db.telegramCommand.create({
      data: {
        projectId,
        command: data.command,
        description: data.description,
        response: data.response || `/${data.command} command received.`,
        type: data.type,
        isEnabled: data.isEnabled !== undefined ? data.isEnabled : true,
        sortOrder: nextSortOrder,
        metadata: data.metadata || {},
      },
    });

    // Update the bot to apply the new command
    await botManager.updateBotCommands(projectId);

    return NextResponse.json(command);
  } catch (error) {
    console.error('Error creating Telegram command:', error);
    return NextResponse.json(
      { error: 'Failed to create Telegram command' },
      { status: 500 }
    );
  }
}

// Get a specific command
export async function GET_SINGLE(
  request: NextRequest,
  { params }: { params: { id: string; commandId: string } }
) {
  try {
    const projectId =(await params).id;
    const commandId = params.commandId;
    
    // Check for authentication and authorization
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify project access
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get the command
    const command = await db.telegramCommand.findFirst({
      where: {
        id: commandId,
        projectId,
      },
    });

    if (!command) {
      return NextResponse.json({ error: 'Command not found' }, { status: 404 });
    }

    return NextResponse.json(command);
  } catch (error) {
    console.error('Error fetching Telegram command:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Telegram command' },
      { status: 500 }
    );
  }
}

// PUT/PATCH route to update a command
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; commandId?: string } }
) {
  try {
    const projectId =(await params).id;
    const data = await request.json();
    const commandId = params.commandId || data.id;
    
    if (!commandId) {
      return NextResponse.json(
        { error: 'Command ID is required' },
        { status: 400 }
      );
    }

    // Check for authentication and authorization
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify project access
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get existing command
    const existingCommand = await db.telegramCommand.findFirst({
      where: {
        id: commandId,
        projectId,
      },
    });

    if (!existingCommand) {
      return NextResponse.json({ error: 'Command not found' }, { status: 404 });
    }

    // Check for command name conflict if name is being changed
    if (data.command && data.command !== existingCommand.command) {
      const nameConflict = await db.telegramCommand.findFirst({
        where: {
          projectId,
          command: data.command,
          id: { not: commandId },
        },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: 'A command with this name already exists' },
          { status: 400 }
        );
      }

      // Validate command format if changing name
      if (data.command.startsWith('/') || data.command.includes(' ')) {
        return NextResponse.json(
          { error: 'Command should not include leading slash or spaces' },
          { status: 400 }
        );
      }
    }

    // Update the command
    const command = await db.telegramCommand.update({
      where: {
        id: commandId,
      },
      data: {
        command: data.command ?? existingCommand.command,
        description: data.description ?? existingCommand.description,
        response: data.response ?? existingCommand.response,
        type: data.type ?? existingCommand.type,
        isEnabled: data.isEnabled !== undefined ? data.isEnabled : existingCommand.isEnabled,
        sortOrder: data.sortOrder ?? existingCommand.sortOrder,
        metadata: data.metadata ?? existingCommand.metadata,
      },
    });

    // Update the bot to apply the changes
    await botManager.updateBotCommands(projectId);

    return NextResponse.json(command);
  } catch (error) {
    console.error('Error updating Telegram command:', error);
    return NextResponse.json(
      { error: 'Failed to update Telegram command' },
      { status: 500 }
    );
  }
}

// DELETE route to remove a command
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commandId?: string } }
) {
  try {
    const projectId =(await params).id;
    const url = new URL(request.url);
    const commandId = params.commandId || url.searchParams.get('commandId');
    
    if (!commandId) {
      return NextResponse.json(
        { error: 'Command ID is required' },
        { status: 400 }
      );
    }

    // Check for authentication and authorization
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify project access
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if command exists
    const existingCommand = await db.telegramCommand.findFirst({
      where: {
        id: commandId,
        projectId,
      },
    });

    if (!existingCommand) {
      return NextResponse.json({ error: 'Command not found' }, { status: 404 });
    }

    // Delete the command
    await db.telegramCommand.delete({
      where: {
        id: commandId,
      },
    });

    // Update the bot to apply the changes
    await botManager.updateBotCommands(projectId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting Telegram command:', error);
    return NextResponse.json(
      { error: 'Failed to delete Telegram command' },
      { status: 500 }
    );
  }
}

// PATCH route to reorder commands
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId =(await params).id;
    const data = await request.json();
    
    // Check if this is a reorder operation
    if (data.action === 'reorder' && Array.isArray(data.commandIds)) {
      // Check for authentication and authorization
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      // Verify project access
      const project = await db.project.findUnique({
        where: { id: projectId },
      });
  
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
  
      // Update each command's sort order
      const updates = data.commandIds.map((id: string, index: number) => {
        return db.telegramCommand.update({
          where: {
            id,
            projectId, // Ensure we only update commands from this project
          },
          data: {
            sortOrder: index,
          },
        });
      });
  
      // Execute all updates
      await Promise.all(updates);
  
      // Update the bot to apply the changes
      await botManager.updateBotCommands(projectId);
  
      // Get the updated command list
      const commands = await db.telegramCommand.findMany({
        where: { projectId },
        orderBy: { sortOrder: 'asc' },
      });
  
      return NextResponse.json(commands);
    } else {
      return NextResponse.json(
        { error: 'Invalid action or missing commandIds array' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error reordering Telegram commands:', error);
    return NextResponse.json(
      { error: 'Failed to reorder Telegram commands' },
      { status: 500 }
    );
  }
}