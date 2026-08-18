import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, AlertTriangle, ArrowRightLeft, Loader2 } from "lucide-react";
import { C, FONTS } from "./App.jsx";
import { supabase as controlPlaneSupabase } from "./lib/supabaseClient.js";

// Shopify redirects here after the consent screen is approved. Everything
// past validating the redirect itself now happens server-side in the
// shopify-token-exchange Edge Function — it looks up this client's own
// Shopify app credentials, does the exchange, and saves the resulting token
// directly into that client's own project. This page just calls it and
// reports the result.

export default function OAuthCallback() {
  const [status, setStatus] = useState("checking");
  // checking | exchanging | done | state_mismatch | shopify_error | missing_code | no_client | exchange_failed

  const [errorDetail, setErrorDetail] = useState("");
  const [shopDisplay, setShopDisplay] = useState("");
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

      const internalClientId = sessionStorage.getItem("shopify_oauth_internal_client_id");
      sessionStorage.removeItem("shopify_oauth_state");
      sessionStorage.removeItem("shopify_oauth_shop");
      sessionStorage.removeItem("shopify_oauth_internal_client_id");

      if (!internalClientId) {
        setStatus("no_client");
        return;
      }

      setShopDisplay(shop);
      setStatus("exchanging");
      const { data, error } = await controlPlaneSupabase.functions.invoke("shopify-token-exchange", {
        body: { code, shop, hmac, timestamp, host, state: returnedState, internal_client_id: internalClientId },
      });

      if (error || data?.error) {
        setErrorDetail(error?.message || data?.error || "Unknown error");
        setStatus("exchange_failed");
        return;
      }

      setStatus("done");
    };

    run();
  }, []);

  const cardStyle = { width: 420, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28 };

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

  if (status === "checking" || status === "exchanging") {
    const label = status === "exchanging" ? "Exchanging authorization and saving the connection…" : "Checking response from Shopify…";
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
  if (status === "missing_code") return <ErrorScreen title="No authorization code received" detail="This page is only meant to be reached via a Shopify redirect." />;
  if (status === "state_mismatch") return <ErrorScreen title="This authorization couldn't be verified" detail="The security check on this redirect didn't match. Try connecting again." />;
  if (status === "no_client") return <ErrorScreen title="No client reference found" detail="This connect flow wasn't started correctly — try again from Connections." />;
  if (status === "exchange_failed") return <ErrorScreen title="Couldn't complete the connection" detail={errorDetail} />;

  // done
  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Check size={18} color={C.success} />
        <p className="body-f" style={{ color: C.textHi, fontSize: 14 }}>Shopify connected</p>
      </div>
      <div className="mono" style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 12.5, color: C.textHi, marginBottom: 14 }}>
        {shopDisplay}
      </div>
      <p className="body-f" style={{ color: C.textFaint, fontSize: 12.5, marginBottom: 18 }}>
        The access token was saved directly to this store's own project.
      </p>
      <Link to="/" className="body-f" style={{ color: C.accent, fontSize: 13 }}>← Back to bitsy_bridge</Link>
    </Shell>
  );
}
