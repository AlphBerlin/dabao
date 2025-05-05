import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import botManager from '@/services/bot-manager';

// GET route to fetch all feature configurations for a project's Telegram bot
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId =(await params).projectId;
    
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

    // Feature UI configurations are stored in telegramSettings.metadata
    // If none exist yet, return default configurations
    if (!telegramSettings.metadata || !telegramSettings.metadata.features) {
      const defaultFeatures = {
        mainMenu: {
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
          ],
        },
        welcomeMenu: {
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
          ],
        },
        apps: {
          membership: {
            enabled: true,
            title: "Membership"
          },
          menu: {
            enabled: true,
            title: "Menu",
            categories: [
              { id: "drinks", name: "Drinks" },
              { id: "food", name: "Food" },
              { id: "desserts", name: "Desserts" }
            ]
          },
          promotions: {
            enabled: true,
            title: "Promotions"
          },
          outlets: {
            enabled: true,
            title: "Our Outlets",
            locations: []
          }
        }
      };
      
      return NextResponse.json(defaultFeatures);
    }
    
    // Return the stored features configuration
    return NextResponse.json(telegramSettings.metadata.features);
  } catch (error) {
    console.error('Error fetching Telegram features:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Telegram features' },
      { status: 500 }
    );
  }
}

// POST route to update feature configurations
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId =(await params).projectId;
    const data = await request.json();
    
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

    // Get telegram settings
    const telegramSettings = await db.telegramSettings.findUnique({
      where: { projectId },
    });

    if (!telegramSettings) {
      return NextResponse.json({ error: 'Telegram integration not found' }, { status: 404 });
    }

    // Validate feature configuration (basic validation)
    if (!data || (data.mainMenu && !Array.isArray(data.mainMenu.layout))) {
      return NextResponse.json(
        { error: 'Invalid feature configuration format' },
        { status: 400 }
      );
    }
    
    // Get existing metadata or initialize if not exists
    const metadata = telegramSettings.metadata || {};
    
    // Update features in metadata
    metadata.features = data;
    
    // Save updated metadata
    await db.telegramSettings.update({
      where: { projectId },
      data: { metadata },
    });
    
    // Update the bot to apply changes
    await botManager.updateBotCommands(projectId);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating Telegram features:', error);
    return NextResponse.json(
      { error: 'Failed to update Telegram features' },
      { status: 500 }
    );
  }
}

// POST route for specific features (menus, apps, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId =(await params).projectId;
    const data = await request.json();
    const { featureType, featureId, config } = data;
    
    if (!featureType || !config) {
      return NextResponse.json(
        { error: 'Feature type and configuration are required' },
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

    // Get telegram settings
    const telegramSettings = await db.telegramSettings.findUnique({
      where: { projectId },
    });

    if (!telegramSettings) {
      return NextResponse.json({ error: 'Telegram integration not found' }, { status: 404 });
    }
    
    // Get existing metadata or initialize if not exists
    const metadata = telegramSettings.metadata || {};
    if (!metadata.features) {
      metadata.features = {};
    }
    
    // Initialize feature type if it doesn't exist
    if (!metadata.features[featureType]) {
      metadata.features[featureType] = {};
    }
    
    // Update specific feature
    if (featureId) {
      // For nested features like specific apps
      if (!metadata.features[featureType][featureId]) {
        metadata.features[featureType][featureId] = {};
      }
      metadata.features[featureType][featureId] = {
        ...metadata.features[featureType][featureId],
        ...config
      };
    } else {
      // For top-level features
      metadata.features[featureType] = {
        ...metadata.features[featureType],
        ...config
      };
    }
    
    // Save updated metadata
    await db.telegramSettings.update({
      where: { projectId },
      data: { metadata },
    });
    
    // Update the bot to apply changes
    await botManager.updateBotCommands(projectId);
    
    return NextResponse.json(metadata.features);
  } catch (error) {
    console.error('Error updating specific Telegram feature:', error);
    return NextResponse.json(
      { error: 'Failed to update Telegram feature' },
      { status: 500 }
    );
  }
}

// Helper route for adding and updating app content
export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId =(await params).projectId;
    const data = await request.json();
    const { app, content } = data;
    
    if (!app || !content) {
      return NextResponse.json(
        { error: 'App name and content are required' },
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

    // Get telegram settings
    const telegramSettings = await db.telegramSettings.findUnique({
      where: { projectId },
    });

    if (!telegramSettings) {
      return NextResponse.json({ error: 'Telegram integration not found' }, { status: 404 });
    }
    
    // Get existing metadata or initialize if not exists
    const metadata = telegramSettings.metadata || {};
    if (!metadata.features) {
      metadata.features = {};
    }
    if (!metadata.features.apps) {
      metadata.features.apps = {};
    }
    if (!metadata.features.apps[app]) {
      metadata.features.apps[app] = { enabled: true };
    }
    
    // Handle different content types based on the app
    switch (app) {
      case 'menu':
        // Update menu categories and items
        metadata.features.apps.menu = {
          ...metadata.features.apps.menu,
          ...content
        };
        break;
        
      case 'outlets':
        // Update outlet locations
        metadata.features.apps.outlets = {
          ...metadata.features.apps.outlets,
          ...content
        };
        break;
        
      case 'promotions':
        // Update promotions
        metadata.features.apps.promotions = {
          ...metadata.features.apps.promotions,
          ...content
        };
        break;
        
      default:
        // Generic content update
        metadata.features.apps[app] = {
          ...metadata.features.apps[app],
          ...content
        };
    }
    
    // Save updated metadata
    await db.telegramSettings.update({
      where: { projectId },
      data: { metadata },
    });
    
    return NextResponse.json(metadata.features.apps[app]);
  } catch (error) {
    console.error('Error updating app content:', error);
    return NextResponse.json(
      { error: 'Failed to update app content' },
      { status: 500 }
    );
  }
}