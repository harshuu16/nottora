import { getSupabase } from './supabase';

export interface AdminUser {
  id: string;
  email: string;
  isAdmin: boolean;
  lastSignIn?: string;
}

/**
 * Checks if a user object has administrator privileges via app_metadata.is_admin === true.
 * This conforms directly to Supabase RLS policies using:
 * ((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text)::boolean = true
 */
export function isUserAdmin(user: any): boolean {
  if (!user) return false;
  return Boolean(user.app_metadata?.is_admin === true);
}

/**
 * Retrieves current authenticated user if and only if they have app_metadata.is_admin === true.
 */
export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) return null;

    if (!isUserAdmin(user)) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || 'Admin',
      isAdmin: true,
      lastSignIn: user.last_sign_in_at,
    };
  } catch (err) {
    console.warn('[Admin Auth] Error checking session:', err);
    return null;
  }
}

/**
 * Signs in an administrator using Supabase email/password.
 * Validates app_metadata.is_admin before granting access.
 * If user is authenticated but not an admin, immediately signs out and returns an error.
 */
export async function adminSignIn(
  email: string,
  password: string
): Promise<{ user: AdminUser | null; error: string | null }> {
  const client = getSupabase();
  if (!client) {
    return {
      user: null,
      error: 'Supabase client is not configured. Please verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, error: 'No user session returned from authentication service.' };
    }

    if (!isUserAdmin(data.user)) {
      // User is authenticated in Supabase but lacks admin app_metadata claim
      await client.auth.signOut();
      return {
        user: null,
        error:
          'Access Denied: This account does not have administrator privileges. (app_metadata.is_admin must be true in Supabase Auth).',
      };
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || 'Admin',
        isAdmin: true,
        lastSignIn: data.user.last_sign_in_at,
      },
      error: null,
    };
  } catch (err: any) {
    return {
      user: null,
      error: err?.message || 'Authentication request failed.',
    };
  }
}

/**
 * Signs out current admin user.
 */
export async function adminSignOut(): Promise<void> {
  const client = getSupabase();
  if (client) {
    await client.auth.signOut();
  }
}

/**
 * Subscribes to auth state changes to detect login/logout in real time.
 */
export function subscribeToAuthChanges(callback: (user: AdminUser | null) => void): () => void {
  const client = getSupabase();
  if (!client) return () => {};

  const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user && isUserAdmin(session.user)) {
      callback({
        id: session.user.id,
        email: session.user.email || 'Admin',
        isAdmin: true,
        lastSignIn: session.user.last_sign_in_at,
      });
    } else {
      callback(null);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}
