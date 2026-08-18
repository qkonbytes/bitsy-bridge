import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { C, FONTS } from "./App.jsx";

// Shopify redirects here after the merchant approves (or the store owner
// approves, for a dev store) the consent screen. This page's job for now
// is just to receive and validate that redirect — actually exchanging the
// code for an access token requires the app's client SECRET, which can
// only ever run server-side (an Edge Function), not here in the browser.
// That exchange step comes next, once this routing/UI layer is proven.

export default function OAuthCallback() {
  const [status, setStatus] = useState("checking"); // checking | ok | state_mismatch | shopify_error | missing_code

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const shop = params.get("shop");
  const shopifyError = params.get("error");
  const returnedState = params.get("state");

  useEffect(() => {
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

    sessionStorage.removeItem("shopify_oauth_state");
    sessionStorage.removeItem("shopify_oauth_shop");
    setStatus("ok");

    // Next step (not yet wired up): POST { code, shop } to the client
    // project's Edge Function, which exchanges it for an access token
    // server-side and stores it in that project's settings.
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

  if (status === "checking") {
    return <Shell><p className="body-f" style={{ color: C.textFaint, fontSize: 13 }}>Checking response from Shopify…</p></Shell>;
  }

  if (status === "shopify_error") {
    return (
      <Shell>
        <AlertTriangle size={20} color={C.error} style={{ marginBottom: 10 }} />
        <p className="body-f" style={{ color: C.textHi, fontSize: 14, marginBottom: 6 }}>Shopify declined the request</p>
        <p className="body-f mono" style={{ color: C.textFaint, fontSize: 12.5, marginBottom: 18 }}>{shopifyError}</p>
        <Link to="/" className="body-f" style={{ color: C.accent, fontSize: 13 }}>← Back to bitsy_bridge</Link>
      </Shell>
    );
  }

  if (status === "missing_code") {
    return (
      <Shell>
        <AlertTriangle size={20} color={C.error} style={{ marginBottom: 10 }} />
        <p className="body-f" style={{ color: C.textHi, fontSize: 14, marginBottom: 6 }}>No authorization code received</p>
        <p className="body-f" style={{ color: C.textFaint, fontSize: 12.5, marginBottom: 18 }}>
          This page is only meant to be reached via a Shopify redirect — try connecting again from Settings.
        </p>
        <Link to="/" className="body-f" style={{ color: C.accent, fontSize: 13 }}>← Back to bitsy_bridge</Link>
      </Shell>
    );
  }

  if (status === "state_mismatch") {
    return (
      <Shell>
        <AlertTriangle size={20} color={C.error} style={{ marginBottom: 10 }} />
        <p className="body-f" style={{ color: C.textHi, fontSize: 14, marginBottom: 6 }}>This authorization couldn't be verified</p>
        <p className="body-f" style={{ color: C.textFaint, fontSize: 12.5, marginBottom: 18 }}>
          The security check on this redirect didn't match. This can happen if the link was reused or opened in a different tab — please try connecting again.
        </p>
        <Link to="/" className="body-f" style={{ color: C.accent, fontSize: 13 }}>← Back to bitsy_bridge</Link>
      </Shell>
    );
  }

  // ok
  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Check size={18} color={C.success} />
        <p className="body-f" style={{ color: C.textHi, fontSize: 14 }}>Authorization received from Shopify</p>
      </div>
      <div
        className="mono"
        style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 12.5, color: C.textHi, marginBottom: 14 }}
      >
        {shop}
      </div>
      <p className="body-f" style={{ color: C.textFaint, fontSize: 12.5, marginBottom: 18 }}>
        Next step: exchanging this for an access token happens server-side — that part isn't wired up yet, this page just confirms the redirect itself is working correctly.
      </p>
      <Link to="/" className="body-f" style={{ color: C.accent, fontSize: 13 }}>← Back to bitsy_bridge</Link>
    </Shell>
  );
}
