import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BitsyBridgeDashboard from "./App.jsx";
import OAuthCallback from "./OAuthCallback.jsx";
import ShopifyLaunch from "./ShopifyLaunch.jsx";

// bitsy_bridge's main dashboard is a standalone webapp, never meant to run
// embedded inside Shopify's admin iframe — but Shopify's "install this app"
// flow (even for a Custom Distribution / single-store app) can load it
// embedded anyway, regardless of the "Embedded app" setting in the Dev
// Dashboard. If we detect we're inside a frame, force a top-level
// navigation to escape it before anything else runs.
//
// EXCEPTION: /shopify-launch is deliberately DIFFERENT — it's the page
// Shopify opens when someone launches the app from inside their admin,
// and it's SUPPOSED to run embedded, since it uses App Bridge to get a
// session token for the Token Exchange grant. Escaping the iframe there
// would break the entire mechanism this page exists for.
const isShopifyLaunchRoute = window.location.pathname.startsWith("/shopify-launch");

if (!isShopifyLaunchRoute && window.self !== window.top) {
  try {
    window.top.location.href = window.self.location.href;
  } catch {
    // Cross-origin restrictions may block this in rare cases — fall back
    // to at least rendering normally rather than a blank frame.
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/shopify-launch" element={<ShopifyLaunch />} />
        <Route path="/*" element={<BitsyBridgeDashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
