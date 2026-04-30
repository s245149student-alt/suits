export async function getCurrentUser() {
  try {
    const response = await fetch("/api/me");
    const data = await response.json();

    return data.user ?? null;
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
}

export function formatPrice(price) {
  return `${Number(price).toLocaleString("da-DK")} DKK`;
}  return `${price.toLocaleString("da-DK")} DKK`;
}
