import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://izkoncmjtevgzhkvjxjo.supabase.co";
const supabaseKey = "INDSÆT_DIN_PUBLISHABLE_KEY_HER";

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getSession() {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Session error:", error);
    return null;
  }

  return session;
}

export async function getCurrentUser() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Get user error:", error);
    return null;
  }

  return user ?? null;
}

export function formatPrice(price) {
  return `${price.toLocaleString("da-DK")} DKK`;
}
