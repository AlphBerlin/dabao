"use server";

import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";

export type AuthError = {
    message: string;
};

/**
 * Sign up a user with email and password
 */
export async function signUp(data: {
    email: string;
    password: string;
    redirectTo?: string;
}): Promise<{ data: any; error: AuthError | null }> {
    try {
        const supabase = await createClient();
        const { data: signUpData, error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                emailRedirectTo: data.redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
            },
        });

        if (error) {
            return {
                data: null,
                error: {
                    message: error.message,
                },
            };
        }

        return {
            data: signUpData,
            error: null,
        };
    } catch (error: any) {
        return {
            data: null,
            error: {
                message: error.message || "Something went wrong during signup.",
            },
        };
    }
}

/**
 * Sign in a user with email and password
 */
export async function signIn(data: {
    email: string;
    password: string;
}): Promise<{ data: any; error: AuthError | null }> {
    try {
        const supabase = await createClient();

        const { data: signInData, error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });

        if (error) {
            return {
                data: null,
                error: {
                    message: error.message,
                },
            };
        }

        return {
            data: signInData,
            error: null,
        };
    } catch (error: any) {
        return {
            data: null,
            error: {
                message: error.message || "Invalid login credentials.",
            },
        };
    }
}

/**
 * Sign in a user with OAuth provider (Google)
 */
export async function signInWithGoogle(redirectTo?: string): Promise<{ error: AuthError | null }> {
    try {
        const supabase = await createClient();
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
            },
        });

        if (error) {
            return {
                error: {
                    message: error.message,
                },
            };
        }

        return { error: null };
    } catch (error: any) {
        return {
            error: {
                message: error.message || "Failed to sign in with Google.",
            },
        };
    }
}

/**
 * Send a password reset email
 */
export async function forgotPassword(data: {
    email: string;
    redirectTo?: string;
}): Promise<{ error: AuthError | null }> {
    try {
        const supabase = await createClient();

        const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
            redirectTo: data.redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
        });

        if (error) {
            return {
                error: {
                    message: error.message,
                },
            };
        }

        return { error: null };
    } catch (error: any) {
        return {
            error: {
                message: error.message || "Failed to send reset email.",
            },
        };
    }
}

/**
 * Reset password with reset token
 */
export async function resetPassword(data: {
    password: string;
}): Promise<{ error: AuthError | null }> {
    try {
        const supabase = await createClient();

        const { error } = await supabase.auth.updateUser({
            password: data.password,
        });

        if (error) {
            return {
                error: {
                    message: error.message,
                },
            };
        }

        return { error: null };
    } catch (error: any) {
        return {
            error: {
                message: error.message || "Failed to reset password.",
            },
        };
    }
}

/**
 * Sign out the current user
 */
export async function signOut(callbackUrl?: string): Promise<{ error: AuthError | null }> {
    try {
        const supabase = await createClient();

        const { error } = await supabase.auth.signOut();

        if (error) {
            return {
                error: {
                    message: error.message,
                },
            };
        }

        if (callbackUrl) {
            redirect(callbackUrl);
        }

        return { error: null };
    } catch (error: any) {
        return {
            error: {
                message: error.message || "Failed to sign out.",
            },
        };
    }
}

/**
 * Get the current session data
 */
export async function getSession() {
    try {
        const supabase = await createClient();

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            throw error;
        }

        return session;
    } catch (error) {
        console.error("Error getting session:", error);
        return null;
    }
}

/**
 * Get the current user
 */
export async function getUser() {
    try {
        const supabase = await createClient();

        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            throw error;
        }

        return user;
    } catch (error) {
        console.error("Error getting user:", error);
        return null;
    }
}
