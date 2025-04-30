import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@dabao/database";

export async function GET(request: NextRequest) {
  try {
    // Get the project slug from query parameters
    const { searchParams } = new URL(request.url);
    const projectSlug = searchParams.get("projectSlug");

    if (!projectSlug) {
      return NextResponse.json(
        { error: "Project slug is required" },
        { status: 400 }
      );
    }

    // Fetch the project with its theme settings
    const project = await prisma.project.findUnique({
      where: {
        slug: projectSlug,
        active: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        theme: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or inactive" },
        { status: 404 }
      );
    }

    // Return the theme data
    return NextResponse.json({
      theme: project.theme,
      projectSlug: project.slug,
      projectName: project.name,
    });
  } catch (error) {
    console.error("Error fetching theme:", error);
    return NextResponse.json(
      { error: "Failed to fetch theme data" },
      { status: 500 }
    );
  }
}