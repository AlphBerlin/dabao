import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import botManager from "@/services/bot-manager";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { console } from "inspector";
import { a } from "node_modules/framer-motion/dist/types.d-DDSxwf0n";

// Schema for creating a new menu
const createMenuSchema = z.object({
  menuId: z.string().regex(/^[a-zA-Z0-9_]+$/, "Menu ID can only contain letters, numbers, and underscores"),
  name: z.string().min(1, "Menu name is required"),
  description: z.string().optional(),
  items: z.array(
    z.object({
      text: z.string(),
      action: z.string(),
    })
  ),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().default(0),
});

// GET /api/projects/[projectId]/integrations/telegram/menus
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Check for authentication and authorization
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } =await params;
    const orgId = req.cookies.get("orgId")?.value;
    if (!orgId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }
    // Check project access
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        organization: {
         id: orgId,
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch all menus for the project
    const menus = await db.telegramMenu.findMany({
      where: {
        projectId,
      },
      orderBy: [
        { isDefault: 'desc' },
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(menus);
  } catch (error) {
    console.error("Error fetching Telegram menus:", error);
    return NextResponse.json(
      { error: "Failed to fetch Telegram menus" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/integrations/telegram/menus
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
   // Check for authentication and authorization
   const supabase = await createClient();
   const { data: { user } } = await supabase.auth.getUser();

   if (!user) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }

    const projectId = (await params).projectId;
    const body = await req.json();
    const orgId = req.cookies.get("orgId")?.value;
    if (!orgId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }
    // Validate request body
    const validatedData = createMenuSchema.parse(body);

    // Check project access
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        organization: {
          id: orgId,
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 400 });
    }

    // Check if a menu with this ID already exists
    const existingMenu = await db.telegramMenu.findUnique({
      where: {
        projectId_menuId: {
          projectId,
          menuId: validatedData.menuId,
        },
      },
    });

    if (existingMenu) {
      return NextResponse.json(
        { error: "A menu with this ID already exists" },
        { status: 400 }
      );
    }

    // If this is set as default, unset any existing default menu
    if (validatedData.isDefault) {
      await db.telegramMenu.updateMany({
        where: {
          projectId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Create the menu
    const menu = await db.telegramMenu.create({
      data: {
        projectId,
        menuId: validatedData.menuId,
        name: validatedData.name,
        description: validatedData.description,
        items: validatedData.items,
        isDefault: validatedData.isDefault,
        sortOrder: validatedData.sortOrder,
      },
    });

    return NextResponse.json(menu, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error creating Telegram menu:", error);
    return NextResponse.json(
      { error: "Failed to create Telegram menu" },
      { status: 500 }
    );
  }
}

// PATCH - Update an existing menu
export async function PATCH(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = (await params).projectId;
    const searchParams = new URL(request.url).searchParams;
    const menuId = searchParams.get("menuId");
    const data = await request.json();

    if (!menuId) {
      return NextResponse.json(
        { error: "Menu ID is required" },
        { status: 400 }
      );
    }

    // Check if menu exists
    const existingMenu = await db.telegramMenu.findUnique({
      where: {
        id: menuId,
        projectId,
      },
    });

    if (!existingMenu) {
      return NextResponse.json(
        { error: "Menu not found" },
        { status: 404 }
      );
    }

    // If this is set as default, unset any existing default menu
    if (data.isDefault) {
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

    // Update menu
    const menu = await db.telegramMenu.update({
      where: {
        id: menuId,
      },
      data: {
        name: data.name,
        description: data.description,
        items: data.items,
        isDefault: data.isDefault,
      },
    });

    // Update bot menus
    await botManager.updateBotMenus(projectId);

    return NextResponse.json(menu);
  } catch (error: any) {
    console.error("Error updating Telegram menu:", error);
    return NextResponse.json(
      { error: "Failed to update menu" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a menu
export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = (await params).projectId;
    const searchParams = new URL(request.url).searchParams;
    const menuId = searchParams.get("menuId");

    if (!menuId) {
      return NextResponse.json(
        { error: "Menu ID is required" },
        { status: 400 }
      );
    }

    // Check if menu exists
    const existingMenu = await db.telegramMenu.findUnique({
      where: {
        id: menuId,
        projectId,
      },
    });

    if (!existingMenu) {
      return NextResponse.json(
        { error: "Menu not found" },
        { status: 404 }
      );
    }

    // Don't delete default menu
    if (existingMenu.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default menu" },
        { status: 400 }
      );
    }

    // Delete menu
    await db.telegramMenu.delete({
      where: {
        id: menuId,
      },
    });

    // Update bot menus
    await botManager.updateBotMenus(projectId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting Telegram menu:", error);
    return NextResponse.json(
      { error: "Failed to delete menu" },
      { status: 500 }
    );
  }
}

// PUT - For additional operations like reordering
export async function PUT(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = (await params).projectId;
    const data = await request.json();

    // Handle menu reordering
    if (data.action === "reorder" && Array.isArray(data.menuIds)) {
      // Update sort order for each menu
      for (let i = 0; i < data.menuIds.length; i++) {
        await db.telegramMenu.update({
          where: {
            id: data.menuIds[i],
            projectId,
          },
          data: {
            sortOrder: i,
          },
        });
      }

      // Update bot menus
      await botManager.updateBotMenus(projectId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error updating Telegram menus:", error);
    return NextResponse.json(
      { error: "Failed to update menus" },
      { status: 500 }
    );
  }
}