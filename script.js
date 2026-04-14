import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://izkoncmjtevgzhkvjxjo.supabase.co";
const supabaseKey = "sb_publishable_ADuhyroHDg6pDq170WrBGA_i-KJUhDu";

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getSession() {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return session;
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export function formatPrice(price) {
  return `${price.toLocaleString("da-DK")} DKK`;
}
