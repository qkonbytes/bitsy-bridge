import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BitsyBridgeDashboard from "./App.jsx";
import OAuthCallback from "./OAuthCallback.jsx";

// bitsy_bridge is a standalone webapp, never meant to run embedded inside
// Shopify's admin iframe — but Shopify's "install this app" flow (even for
// a Custom Distribution / single-store app) can load it embedded anyway,
// regardless of the "Embedded app" setting in the Dev Dashboard. This is a
// well-known, long-standing gap in Shopify's own tooling, not something we
// can fully rely on a dashboard toggle to prevent. If we detect we're
// inside a frame, force a top-level navigation to escape it before
// anything else runs — otherwise our own OAuth flow (which expects a real,
// non-embedded browser context) silently breaks in ways that are very hard
// to diagnose from the inside.
if (window.self !== window.top) {
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
        <Route path="/*" element={<BitsyBridgeDashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
