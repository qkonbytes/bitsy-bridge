import React, { useEffect, useState } from "react";
import { C, FONTS } from "./App.jsx";
import { supabase as controlPlaneSupabase } from "./lib/supabaseClient.js";

// This is what Shopify loads when someone opens bitsy_bridge from inside
// their Shopify admin sidebar — it's the "App URL" registered in the Dev
// Dashboard, and it's DELIBERATELY meant to run embedded (unlike the main
// dashboard). It uses App Bridge to get a session token, then hands that
// to our backend for the actual Token Exchange grant.

function loadAppBridgeScript() {
  return new Promise((resolve, reject) => {
    if (window.shopify) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.shopify.com/shopifycloud/app-bridge.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Failed to load Shopify App Bridge script"));
    // App Bridge expects to be one of the first scripts to run, so prepend
    // it rather than appending to the end of <head>.
    document.head.insertBefore(script, document.head.firstChild);
  });
}

function waitForShopifyGlobal(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (window.shopify && typeof window.shopify.idToken === "function") {
        resolve(window.shopify);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error("App Bridge didn't initialize in time"));
        return;
      }
      setTimeout(check, 100);
    };
    check();
  });
}

export default function ShopifyLaunch() {
  const [status, setStatus] = useState("checking");
  // checking | not_embedded | not_registered | loading_bridge | getting_token | exchanging | done | error
  const [errorDetail, setErrorDetail] = useState("");
  const [shopDisplay, setShopDisplay] = useState("");

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const shop = params.get("shop");
      const embedded = params.get("embedded");

      if (window.self === window.top || embedded !== "1") {
        setStatus("not_embedded");
        return;
      }
      if (!shop) {
        setErrorDetail("No shop parameter in the launch URL.");
        setStatus("error");
        return;
      }
      setShopDisplay(shop);

      // Look up which client this shop belongs to, and their Shopify Client ID —
      // App Bridge needs the correct per-client API key before it can init.
      const { data, error } = await controlPlaneSupabase.rpc("resolve_shop_domain", { p_shop: shop });
      const match = Array.isArray(data) ? data[0] : data;
      if (error || !match || !match.internal_client_id) {
        setStatus("not_registered");
        return;
      }
      if (!match.shopify_client_id) {
        setErrorDetail("This client has no Shopify Client ID saved in Connections yet.");
        setStatus("error");
        return;
      }

      try {
        setStatus("loading_bridge");
        // App Bridge's documented config fallback — set BEFORE the script
        // loads, since our API key varies per client and can't be baked
        // into a static <meta> tag at build time like a single-tenant app would.
        sessionStorage.setItem("app-bridge-config", JSON.stringify({ apiKey: match.shopify_client_id }));
        await loadAppBridgeScript();
        const shopify = await waitForShopifyGlobal();

        setStatus("getting_token");
        const sessionToken = await shopify.idToken();

        setStatus("exchanging");
        const { data: exchangeData, error: exchangeError } = await controlPlaneSupabase.functions.invoke(
          "shopify-session-token-exchange",
          { body: { shop, session_token: sessionToken, internal_client_id: match.internal_client_id } }
        );

        if (exchangeError || exchangeData?.error) {
          let detail = exchangeError?.message || exchangeData?.error || "Unknown error";
          if (exchangeError?.context) {
            try {
              const body = await exchangeError.context.json();
              if (body?.error) detail = body.error;
            } catch {
              // ignore, fall back to generic message
            }
          }
          setErrorDetail(detail);
          setStatus("error");
          return;
        }

        setStatus("done");
      } catch (err) {
        setErrorDetail(err.message || String(err));
        setStatus("error");
      }
    };

    run();
  }, []);

  const cardStyle = { width: 420, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28 };

  const Shell = ({ children }) => (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{FONTS}</style>
      <div style={cardStyle}>{children}</div>
    </div>
  );

  const statusLabels = {
    checking: "Checking launch context…",
    loading_bridge: "Loading Shopify App Bridge…",
    getting_token: "Getting session token…",
    exchanging: "Exchanging for an access token…",
  };

  if (statusLabels[status]) {
    return (
      <Shell>
        <p className="body-f" style={{ color: C.textFaint, fontSize: 13 }}>{statusLabels[status]}</p>
      </Shell>
    );
  }

  if (status === "not_embedded") {
    return (
      <Shell>
        <p className="body-f" style={{ color: C.textHi, fontSize: 14 }}>
          This page only works when opened from inside Shopify admin.
        </p>
      </Shell>
    );
  }

  if (status === "not_registered") {
    return (
      <Shell>
        <p className="body-f" style={{ color: C.textHi, fontSize: 14, marginBottom: 6 }}>
          This store isn't registered with bitsy_bridge yet.
        </p>
        <p className="body-f" style={{ color: C.textFaint, fontSize: 12.5 }}>{shopDisplay}</p>
      </Shell>
    );
  }

  if (status === "error") {
    return (
      <Shell>
        <p className="body-f" style={{ color: C.textHi, fontSize: 14, marginBottom: 6 }}>Couldn't complete the connection</p>
        <p className="body-f mono" style={{ color: C.textFaint, fontSize: 12, wordBreak: "break-word" }}>{errorDetail}</p>
      </Shell>
    );
  }

  // done
  return (
    <Shell>
      <p className="body-f" style={{ color: C.success, fontSize: 14, marginBottom: 6 }}>Shopify connected</p>
      <p className="body-f mono" style={{ color: C.textFaint, fontSize: 12.5 }}>{shopDisplay}</p>
    </Shell>
  );
}
