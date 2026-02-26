"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

/**
 * Returns whether the current user is logged in.
 * Subscribes to auth state changes so it stays in sync
 * without requiring a full page reload.
 */
export function useIsLoggedIn() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });

    // Stay in sync with auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return isLoggedIn;
}
