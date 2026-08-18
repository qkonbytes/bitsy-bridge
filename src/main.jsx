import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BitsyBridgeDashboard from "./App.jsx";
import OAuthCallback from "./OAuthCallback.jsx";

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
