"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

/** The signed-in user's profile (name + role). Every role-aware UI decision
 * (nav items, buttons) should read from this — never assume a role. */
export function useProfile() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });
}
