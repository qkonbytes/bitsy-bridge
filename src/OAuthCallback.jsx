import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { Check, AlertTriangle, ArrowRightLeft, Loader2 } from "lucide-react";
import { C, FONTS } from "./App.jsx";
import { supabase as controlPlaneSupabase } from "./lib/supabaseClient.js";

// Shopify redirects here after the merchant (or store owner, on a dev store)
// approves the consent screen. This page:
//  1. Validates the redirect is genuine (state match, matches what we sent)
//  2. Calls the control-plane Edge Function to exchange the code for a token
//     (that step needs the Shopify Client Secret, which only exists server-side)
//  3. Saves the resulting token into the correct CLIENT project's own
//     settings table — using that project's already-persisted login session,
//     never the control plane's credentials.

export default function OAuthCallback() {
  const [status, setStatus] = useState("checking");
  // checking | exchanging | saving | done | state_mismatch | shopify_error | missing_code | exchange_failed | no_target

  const [errorDetail, setErrorDetail] = useState("");
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const shop = params.get("shop");
  const shopifyError = params.get("error");
  const returnedState = params.get("state");
  const hmac = params.get("hmac");
  const timestamp = params.get("timestamp");
  const host = params.get("host");

  useEffect(() => {
    const run = async () => {
      const expectedState = sessionStorage.getItem("shopify_oauth_state");

      if (shopifyError) {
        setStatus("shopify_error");
        return;
      }
      if (!code || !shop) {
        setStatus("missing_code");
        return;
      }
      if (!expectedState || expectedState !== returnedState) {
        setStatus("state_mismatch");
        return;
      }

      const targetProjectRaw = sessionStorage.getItem("shopify_oauth_target_project");
      sessionStorage.removeItem("shopify_oauth_state");
      sessionStorage.removeItem("shopify_oauth_shop");
      sessionStorage.removeItem("shopify_oauth_target_project");

      if (!targetProjectRaw) {
        setStatus("no_target");
        return;
      }
      const targetProject = JSON.parse(targetProjectRaw);

      setStatus("exchanging");
      const { data, error } = await controlPlaneSupabase.functions.invoke("shopify-token-exchange", {
        body: { code, shop, hmac, timestamp, host, state: returnedState },
      });

      if (error || data?.error) {
        setErrorDetail(error?.message || data?.error || "Unknown error");
        setStatus("exchange_failed");
        return;
      }

      setStatus("saving");
      // This client is pointed at the SAME project the user was already logged
      // into before the redirect, so it picks up their persisted session —
      // no separate re-authentication needed.
      const clientSupabase = createClient(targetProject.url, targetProject.anonKey);
      const { data: existing } = await clientSupabase.from("settings").select("id").limit(1).maybeSingle();

      const updatePayload = {
        shopify_connected: true,
        shopify_shop_domain: shop,
        shopify_access_token: data.access_token,
        shopify_scope: data.scope,
        shopify_connected_at: new Date().toISOString(),
      };

      const { error: saveError } = existing
        ? await clientSupabase.from("settings").update(updatePayload).eq("id", existing.id)
        : await clientSupabase.from("settings").insert(updatePayload);

      if (saveError) {
        setErrorDetail(saveError.message);
        setStatus("exchange_failed");
        return;
      }

      setStatus("done");
    };

    run();
  }, []);

  const cardStyle = {
    width: 420, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28,
  };

  const Shell = ({ children }) => (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{FONTS}</style>
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ArrowRightLeft size={14} color={C.accent} />
          </div>
          <span className="disp" style={{ color: C.textHi, fontSize: 15, fontWeight: 700 }}>bitsy_bridge</span>
        </div>
        {children}
      </div>
    </div>
  );

  const ErrorScreen = ({ title, detail }) => (
    <Shell>
      <AlertTriangle size={20} color={C.error} style={{ marginBottom: 10 }} />
      <p className="body-f" style={{ color: C.textHi, fontSize: 14, marginBottom: 6 }}>{title}</p>
      {detail && <p className="body-f mono" style={{ color: C.textFaint, fontSize: 12, marginBottom: 18, wordBreak: "break-word" }}>{detail}</p>}
      <Link to="/" className="body-f" style={{ color: C.accent, fontSize: 13 }}>← Back to bitsy_bridge</Link>
    </Shell>
  );

  if (status === "checking" || status === "exchanging" || status === "saving") {
    const label = status === "exchanging" ? "Exchanging authorization for an access token…"
      : status === "saving" ? "Saving connection…"
      : "Checking response from Shopify…";
    return (
      <Shell>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Loader2 size={16} color={C.textFaint} style={{ animation: "spin 1s linear infinite" }} />
          <p className="body-f" style={{ color: C.textFaint, fontSize: 13 }}>{label}</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </Shell>
    );
  }

  if (status === "shopify_error") return <ErrorScreen title="Shopify declined the request" detail={shopifyError} />;
  if (status === "missing_code") return <ErrorScreen title="No authorization code received" detail="This page is only meant to be reached via a Shopify redirect — try connecting again from Settings." />;
  if (status === "state_mismatch") return <ErrorScreen title="This authorization couldn't be verified" detail="The security check on this redirect didn't match. Try connecting again." />;
  if (status === "no_target") return <ErrorScreen title="No client project to save this into" detail="This connect flow wasn't started from a real logged-in session, so there's nowhere to save the resulting token." />;
  if (status === "exchange_failed") return <ErrorScreen title="Couldn't complete the connection" detail={errorDetail} />;

  // done
  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Check size={18} color={C.success} />
        <p className="body-f" style={{ color: C.textHi, fontSize: 14 }}>Shopify connected</p>
      </div>
      <div
        className="mono"
        style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 12.5, color: C.textHi, marginBottom: 14 }}
      >
        {shop}
      </div>
      <p className="body-f" style={{ color: C.textFaint, fontSize: 12.5, marginBottom: 18 }}>
        The access token was saved to this store's project. You can head back and check the Connections/Settings page.
      </p>
      <Link to="/" className="body-f" style={{ color: C.accent, fontSize: 13 }}>← Back to bitsy_bridge</Link>
    </Shell>
  );
}
