import { createClient } from "../supabase/server";

export const getServerUser = async () => {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user
}