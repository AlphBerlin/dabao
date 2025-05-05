import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

const reorderSchema = z.object({
  tierId: z.string().min(1),
  direction: z.enum(['up', 'down']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId =(await params).projectId;
    
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this project
    const hasAccess = await supabase.rpc('check_user_has_project_access', {
      p_user_id: user.id,
      p_project_id: projectId,
    });

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validationResult = reorderSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: validationResult.error.format() 
      }, { status: 400 });
    }
    
    const { tierId, direction } = validationResult.data;
    
    // Get all tiers ordered by level
    const tiers = await db.membershipTier.findMany({
      where: { projectId },
      orderBy: { level: 'asc' },
      select: { id: true, level: true }
    });

    // Find the current tier index
    const currentIndex = tiers.findIndex(tier => tier.id === tierId);
    if (currentIndex === -1) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    }

    // Find the target tier index
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Make sure the target index is valid
    if (targetIndex < 0 || targetIndex >= tiers.length) {
      return NextResponse.json({ 
        error: 'Cannot move tier further in that direction' 
      }, { status: 400 });
    }
    
    // Get the target tier
    const targetTier = tiers[targetIndex];
    const currentTier = tiers[currentIndex];
    
    // Swap the levels
    await db.$transaction([
      db.membershipTier.update({
        where: { id: currentTier.id },
        data: { level: targetTier.level }
      }),
      db.membershipTier.update({
        where: { id: targetTier.id },
        data: { level: currentTier.level }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering membership tiers:', error);
    return NextResponse.json({ error: 'Failed to reorder membership tiers' }, { status: 500 });
  }
}