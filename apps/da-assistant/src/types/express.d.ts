import { User } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      supabase?: SupabaseClient;
    }
  }
}