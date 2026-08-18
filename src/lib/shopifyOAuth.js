// Builds the URL that kicks off Shopify's Authorization Code Grant flow.
// The client (app) ID is public and safe in frontend code — it identifies
// OUR app to Shopify, same value for every client store. The client SECRET
// is never used here; that only ever lives server-side, in the token
// exchange step (an Edge Function, not this frontend).

const SHOPIFY_SCOPES = [
  "read_products",
  "write_products",
  "read_inventory",
  "write_inventory",
  "read_locations",
].join(",");

export function buildShopifyAuthUrl(shopDomain, targetProject) {
  const clientId = import.meta.env.VITE_SHOPIFY_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_SHOPIFY_REDIRECT_URI || `${window.location.origin}/oauth/callback`;

  if (!clientId) {
    throw new Error("VITE_SHOPIFY_CLIENT_ID isn't set — the Shopify app hasn't been registered yet.");
  }

  const cleanShop = shopDomain
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  // CSRF protection: a random value Shopify echoes back on the callback,
  // which we verify matches what we generated before trusting the redirect.
  const state = crypto.randomUUID();
  sessionStorage.setItem("shopify_oauth_state", state);
  sessionStorage.setItem("shopify_oauth_shop", cleanShop);

  // The browser does a full page navigation to Shopify and back, so any
  // React state is gone by the time /oauth/callback runs. We stash which
  // client project the resulting token belongs to here, so the callback
  // knows where to save it once the exchange completes.
  if (targetProject?.url && targetProject?.anonKey) {
    sessionStorage.setItem(
      "shopify_oauth_target_project",
      JSON.stringify({ url: targetProject.url, anonKey: targetProject.anonKey })
    );
  } else {
    sessionStorage.removeItem("shopify_oauth_target_project");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    scope: SHOPIFY_SCOPES,
    redirect_uri: redirectUri,
    state,
  });

  return `https://${cleanShop}/admin/oauth/authorize?${params.toString()}`;
}
