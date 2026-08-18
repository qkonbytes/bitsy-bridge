// Builds the URL that kicks off Shopify's Authorization Code Grant flow.
// Each client now has their OWN Shopify app (their own Client ID/Secret,
// registered by us in the Dev Dashboard, scoped to their store) — there is
// no single shared app ID anymore. The client_id passed in here is public
// and safe in frontend code; the SECRET is never used here, only server-side
// in the token exchange Edge Function.

const SHOPIFY_SCOPES = [
  "read_products",
  "write_products",
  "read_inventory",
  "write_inventory",
  "read_locations",
  "write_locations",
].join(",");

// Normalizes whatever shop-domain format someone pastes in into the classic
// {store}.myshopify.com form OAuth's authorize endpoint actually needs.
// Shopify's own UI trains people to copy the newer unified admin URL
// (admin.shopify.com/store/{handle}) when just browsing their store day to
// day — that format looks like a domain but does NOT work for OAuth, and
// produces a confusing "application_cannot_be_found" error instead of a
// clear "wrong format" one. Catch and fix it here instead.
export function normalizeShopDomain(input) {
  let cleaned = input.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");

  const adminUrlMatch = cleaned.match(/^admin\.shopify\.com\/store\/([a-zA-Z0-9\-]+)/);
  if (adminUrlMatch) {
    cleaned = `${adminUrlMatch[1]}.myshopify.com`;
  }

  // A bare handle with no domain at all — assume myshopify.com
  if (cleaned && !cleaned.includes(".")) {
    cleaned = `${cleaned}.myshopify.com`;
  }

  return cleaned;
}

export function buildShopifyAuthUrl(shopDomain, { shopifyClientId, internalClientId }) {
  const redirectUri = import.meta.env.VITE_SHOPIFY_REDIRECT_URI || `${window.location.origin}/oauth/callback`;

  if (!shopifyClientId) {
    throw new Error("This client has no Shopify Client ID saved yet — add one in Connections first.");
  }
  if (!internalClientId) {
    throw new Error("Missing internal client reference — can't start the connect flow.");
  }

  const cleanShop = normalizeShopDomain(shopDomain);

  if (!/^[a-zA-Z0-9\-]+\.myshopify\.com$/.test(cleanShop)) {
    throw new Error(
      `"${shopDomain}" doesn't look like a valid Shopify domain. It should look like your-store.myshopify.com — not the admin.shopify.com URL from your browser's address bar.`
    );
  }

  // CSRF protection: a random value Shopify echoes back on the callback,
  // which we verify matches what we generated before trusting the redirect.
  const state = crypto.randomUUID();
  sessionStorage.setItem("shopify_oauth_state", state);
  sessionStorage.setItem("shopify_oauth_shop", cleanShop);
  // The browser does a full page navigation to Shopify and back, so any
  // React state is gone by the time /oauth/callback runs — this is how the
  // callback knows which client's credentials to use for the exchange.
  sessionStorage.setItem("shopify_oauth_internal_client_id", internalClientId);

  const params = new URLSearchParams({
    client_id: shopifyClientId,
    scope: SHOPIFY_SCOPES,
    redirect_uri: redirectUri,
    state,
  });

  return `https://${cleanShop}/admin/oauth/authorize?${params.toString()}`;
}
