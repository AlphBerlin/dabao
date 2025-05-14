import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for delete account request
const DeleteAccountSchema = z.object({
  confirmation: z.literal('DELETE_MY_ACCOUNT')
});

// DELETE handler for account deletion
export async function DELETE(req: NextRequest) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = DeleteAccountSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Confirmation phrase "DELETE_MY_ACCOUNT" is required for account deletion',
        details: validationResult.error.format()
      }, { status: 400 });
    }

    // Find the user in our database
    const dbUser = await db.user.findUnique({
      where: { supabaseUserId: user.id }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // First delete from our database
    await db.user.delete({
      where: { id: dbUser.id }
    });

    // Then delete from Supabase auth
    const { error: supabaseError } = await supabase.auth.admin.deleteUser(user.id);
    
    if (supabaseError) {
      console.error('Error deleting user from Supabase:', supabaseError);
      return NextResponse.json({ 
        message: 'User data deleted from application database, but there was an error deleting authentication data',
        error: supabaseError.message
      }, { status: 500 });
    }

    // Sign out the user
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: 'Account successfully deleted'
    });
  } catch (error) {
    console.error('Error deleting user account:', error);
    return NextResponse.json(
      { error: 'Failed to delete user account' },
      { status: 500 }
    );
  }
}
