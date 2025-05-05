import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

// GET /api/projects/[projectId]/integrations/telegram/menus/[menuId]
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string; menuId: string } }
) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, menuId } = await params;

    // Check project access
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        organization: {
          users: {
            some: {
              userId: user.id,
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch the menu
    const menu = await db.telegramMenu.findUnique({
      where: {
        id: menuId,
        projectId,
      },
    });

    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Error fetching Telegram menu:", error);
    return NextResponse.json(
      { error: "Failed to fetch Telegram menu" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId]/integrations/telegram/menus/[menuId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string; menuId: string } }
) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, menuId } = await params;

    // Check project access
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        organization: {
          users: {
            some: {
              userId: user.id,
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if the menu exists
    const menu = await db.telegramMenu.findUnique({
      where: {
        id: menuId,
        projectId,
      },
    });

    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    // Delete the menu
    await db.telegramMenu.delete({
      where: {
        id: menuId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Telegram menu:", error);
    return NextResponse.json(
      { error: "Failed to delete Telegram menu" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[projectId]/integrations/telegram/menus/[menuId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string; menuId: string } }
) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { projectId, menuId } = await params;
    const body = await req.json();

    // Check project access
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        organization: {
          users: {
            some: {
              userId: user.id,
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if the menu exists
    const menu = await db.telegramMenu.findUnique({
      where: {
        id: menuId,
        projectId,
      },
    });

    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    // If setting as default, unset any existing default
    if (body.isDefault) {
      await db.telegramMenu.updateMany({
        where: {
          projectId,
          isDefault: true,
          id: { not: menuId },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Update the menu
    const updatedMenu = await db.telegramMenu.update({
      where: {
        id: menuId,
      },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        description: body.description !== undefined ? body.description : undefined,
        items: body.items !== undefined ? body.items : undefined,
        isDefault: body.isDefault !== undefined ? body.isDefault : undefined,
        sortOrder: body.sortOrder !== undefined ? body.sortOrder : undefined,
      },
    });

    return NextResponse.json(updatedMenu);
  } catch (error) {
    console.error("Error updating Telegram menu:", error);
    return NextResponse.json(
      { error: "Failed to update Telegram menu" },
      { status: 500 }
    );
  }
}