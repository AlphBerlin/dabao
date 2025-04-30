// app/api/theme/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ThemeConfig } from "@/lib/theme-provider";

// 1) Your global fallback:
const defaultTheme: ThemeConfig = {
  colors: {
    primary: { DEFAULT: "#0079FF", 50: "#E6F0FF", /* … */ 900: "#001533" },
    secondary: { DEFAULT: "#10B981" },
  },
  borderRadius: {
    sm: "0.125rem",
    DEFAULT: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
  },
};

// 2) Any “static” theme overrides for known slugs:
const staticThemes: Record<string, ThemeConfig> = {
  demo: defaultTheme,
  alpha: {
    colors: {
      primary: { DEFAULT: "#FF5722" /* …custom shades…*/ },
      secondary: { DEFAULT: "#FFC107" },
    },
    borderRadius: defaultTheme.borderRadius,
  },
  // add more built-in themes here…
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectSlug = searchParams.get("projectSlug");

  if (!projectSlug) {
    return NextResponse.json(
      { error: "Project slug is required" },
      { status: 400 }
    );
  }

  try {
    // 3) Load from DB if present & active
    // const project = await prisma.project.findUnique({
    //   where: { slug: projectSlug, active: true },
    //   select: { name: true, theme: true },
    // });

    // 4) Determine which theme to return
    const theme: ThemeConfig =
      project?.theme ??              // DB value if set
      staticThemes[projectSlug] ??   // built-in static
      defaultTheme;                  // ultimate fallback

    return NextResponse.json({
      theme,
      projectSlug,
      projectName: project?.name ?? null,
    });
  } catch (error) {
    console.error("Error fetching theme:", error);
    return NextResponse.json(
      {
        theme: defaultTheme,
        projectSlug,
        error: "Couldn’t load theme, falling back to default",
      },
      { status: 200 }
    );
  }
}
