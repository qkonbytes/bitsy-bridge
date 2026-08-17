import React, { useState, useMemo, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "./lib/supabaseClient";
import { createClient } from "@supabase/supabase-js";
import {
  LayoutGrid,
  Activity,
  SlidersHorizontal,
  Plug,
  Settings,
  Search,
  Plus,
  RefreshCw,
  ChevronDown,
  Check,
  X,
  Clock,
  ArrowRightLeft,
  Database,
  ShoppingBag,
  FileClock,
  Eye,
  Download,
  Lock,
  ChevronLeft,
  MapPin,
  AlertTriangle,
  LogOut,
  Loader2,
} from "lucide-react";

// ---------- Design tokens ----------
const C = {
  bg: "#10141B",
  surface: "#171C25",
  surfaceHover: "#1D2430",
  border: "#262D39",
  borderLight: "#333C4A",
  textHi: "#EDEFF3",
  textLo: "#8A93A3",
  textFaint: "#5B6472",
  accent: "#5500FF",
  accentDim: "rgba(85,0,255,0.14)",
  success: "#4ADE80",
  successDim: "rgba(74,222,128,0.12)",
  error: "#F87171",
  errorDim: "rgba(248,113,113,0.12)",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
* { box-sizing: border-box; }
.disp { font-family: 'Space Grotesk', sans-serif; }
.body-f { font-family: 'Inter', sans-serif; }
.mono { font-family: 'JetBrains Mono', monospace; }
.focus-ring:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 2px; }
@keyframes flow {
  0% { stroke-dashoffset: 24; }
  100% { stroke-dashoffset: 0; }
}
.flow-line { animation: flow 1.2s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .flow-line { animation: none; }
}
input::placeholder { color: ${C.textFaint}; }
`;

// ---------- Mock data ----------
const MOCK_STORES = [
  { id: 1, name: "Acme Hardware", skus: 1204, lastSync: "2m ago", status: "healthy", pending: 0, erp: "SQL Server (Pastel)" },
  { id: 2, name: "Coastal Supply Co.", skus: 340, lastSync: "syncing now", status: "syncing", pending: 12, erp: "MS Access" },
  { id: 3, name: "Midtown Parts", skus: 812, lastSync: "3h ago", status: "error", pending: 4, erp: "SQLite" },
  { id: 4, name: "Northline Distribution", skus: 2310, lastSync: "18m ago", status: "healthy", pending: 0, erp: "SQL Server" },
  { id: 5, name: "Riverside Outfitters", skus: 96, lastSync: "1d ago", status: "healthy", pending: 0, erp: "Firebird" },
];

const MOCK_HISTORY = [
  {
    time: "10:42:03", changed: 4, status: "success", duration: "4.2s",
    items: [
      { sku: "CST-0044", field: "price", oldVal: "92.00", newVal: "95.00" },
      { sku: "CST-0071", field: "qty", oldVal: "58", newVal: "60" },
      { sku: "CST-0021", field: "qty", oldVal: "36", newVal: "34" },
      { sku: "CST-0022", field: "price", oldVal: "760.00", newVal: "780.00" },
    ],
  },
  { time: "10:27:03", changed: 0, status: "success", duration: "1.1s", items: [] },
  {
    time: "10:12:04", changed: 3, status: "success", duration: "2.8s",
    items: [
      { sku: "CST-0071", field: "qty", oldVal: "55", newVal: "58" },
      { sku: "CST-0044", field: "qty", oldVal: "115", newVal: "120" },
      { sku: "CST-0021", field: "price", oldVal: "605.00", newVal: "610.00" },
    ],
  },
  { time: "09:57:02", changed: 0, status: "failed", duration: "—", items: [] },
  {
    time: "09:42:03", changed: 7, status: "success", duration: "3.5s",
    items: [
      { sku: "CST-0022", field: "qty", oldVal: "22", newVal: "19" },
      { sku: "CST-0071", field: "qty", oldVal: "50", newVal: "55" },
      { sku: "CST-0044", field: "price", oldVal: "90.00", newVal: "92.00" },
      { sku: "CST-0021", field: "qty", oldVal: "40", newVal: "36" },
      { sku: "CST-0021", field: "price", oldVal: "598.00", newVal: "605.00" },
      { sku: "CST-0022", field: "price", oldVal: "745.00", newVal: "760.00" },
      { sku: "CST-0071", field: "price", oldVal: "142.00", newVal: "145.00" },
    ],
  },
];

const ERP_LOCATIONS = ["Location 1", "Location 2", "Location 3", "Location 4", "Location 5"];
const LOCATION_LABEL = (loc) => (loc === "Location 1" ? "Location 1 (Main)" : loc);

const MOCK_ERP_PRODUCTS = [
  { sku: "HDW-1042", name: "Galvanised Hinge 75mm", qty: 214, price: 42.50, location: "Location 1", lastReceived: "2m ago" },
  { sku: "HDW-1043", name: "Galvanised Hinge 100mm", qty: 88, price: 54.00, location: "Location 1", lastReceived: "2m ago" },
  { sku: "HDW-2210", name: "Stainless Bolt M8x40", qty: 1560, price: 3.20, location: "Location 1", lastReceived: "2m ago" },
  { sku: "HDW-2211", name: "Stainless Bolt M10x50", qty: 940, price: 4.10, location: "Location 1", lastReceived: "2m ago" },
  { sku: "PNT-0087", name: "Exterior Primer 5L", qty: 0, price: 315.00, location: "Location 1", lastReceived: "2m ago" },
  { sku: "PNT-0091", name: "Exterior Primer 20L", qty: 12, price: 980.00, location: "Location 1", lastReceived: "2m ago" },
  { sku: "HDW-1042", name: "Galvanised Hinge 75mm", qty: 46, price: 42.50, location: "Location 2", lastReceived: "6m ago" },
  { sku: "HDW-2210", name: "Stainless Bolt M8x40", qty: 302, price: 3.20, location: "Location 2", lastReceived: "6m ago" },
  { sku: "PNT-0091", name: "Exterior Primer 20L", qty: 4, price: 980.00, location: "Location 2", lastReceived: "6m ago" },
  { sku: "HDW-1043", name: "Galvanised Hinge 100mm", qty: 20, price: 54.00, location: "Location 3", lastReceived: "11m ago" },
  { sku: "HDW-2211", name: "Stainless Bolt M10x50", qty: 118, price: 4.10, location: "Location 3", lastReceived: "11m ago" },
];

const MOCK_SHOPIFY_PRODUCTS = [
  { sku: "HDW-1042", name: "Galvanised Hinge 75mm", qty: 214, price: 42.50, variantId: "gid://Variant/9182734", lastConfirmed: "2m ago" },
  { sku: "HDW-1043", name: "Galvanised Hinge 100mm", qty: 90, price: 54.00, variantId: "gid://Variant/9182735", lastConfirmed: "18m ago" },
  { sku: "HDW-2210", name: "Stainless Bolt M8x40", qty: 1560, price: 3.20, variantId: "gid://Variant/9182801", lastConfirmed: "2m ago" },
  { sku: "HDW-2211", name: "Stainless Bolt M10x50", qty: 940, price: 3.95, variantId: "gid://Variant/9182802", lastConfirmed: "18m ago" },
  { sku: "PNT-0087", name: "Exterior Primer 5L", qty: 6, price: 315.00, variantId: "gid://Variant/9183010", lastConfirmed: "18m ago" },
  { sku: "PNT-0091", name: "Exterior Primer 20L", qty: 12, price: 980.00, variantId: "gid://Variant/9183011", lastConfirmed: "2m ago" },
];

const MOCK_ERP_PRODUCTS_COASTAL = [
  { sku: "CST-0021", name: "Marine Rope 10mm (50m)", qty: 34, price: 610.00, location: "Location 1", lastReceived: "1m ago" },
  { sku: "CST-0022", name: "Marine Rope 12mm (50m)", qty: 19, price: 780.00, location: "Location 1", lastReceived: "1m ago" },
  { sku: "CST-0044", name: "Anchor Chain 6mm (per m)", qty: 120, price: 95.00, location: "Location 1", lastReceived: "1m ago" },
  { sku: "CST-0071", name: "Deck Cleat 150mm", qty: 58, price: 145.00, location: "Location 1", lastReceived: "1m ago" },
  { sku: "CST-0044", name: "Anchor Chain 6mm (per m)", qty: 40, price: 95.00, location: "Location 2", lastReceived: "4m ago" },
  { sku: "CST-0071", name: "Deck Cleat 150mm", qty: 15, price: 145.00, location: "Location 2", lastReceived: "4m ago" },
];

const MOCK_SHOPIFY_PRODUCTS_COASTAL = [
  { sku: "CST-0021", name: "Marine Rope 10mm (50m)", qty: 34, price: 610.00, variantId: "gid://Variant/9291102", lastConfirmed: "1m ago" },
  { sku: "CST-0022", name: "Marine Rope 12mm (50m)", qty: 19, price: 780.00, variantId: "gid://Variant/9291103", lastConfirmed: "1m ago" },
  { sku: "CST-0071", name: "Deck Cleat 150mm", qty: 60, price: 145.00, variantId: "gid://Variant/9291140", lastConfirmed: "31m ago" },
];

function getErpRows(storeName) {
  if (storeName === MOCK_STORES[0].name) return MOCK_ERP_PRODUCTS;
  if (storeName === MOCK_STORES[1].name) return MOCK_ERP_PRODUCTS_COASTAL;
  return [];
}

function getShopifyRows(storeName) {
  if (storeName === MOCK_STORES[0].name) return MOCK_SHOPIFY_PRODUCTS;
  if (storeName === MOCK_STORES[1].name) return MOCK_SHOPIFY_PRODUCTS_COASTAL;
  return [];
}

// Placeholder until Shopify OAuth is wired in — real locations come from Shopify's Locations API once connected
const MOCK_SHOPIFY_LOCATIONS = {
  "Acme Hardware": [
    { id: "gid://shopify/Location/70011", name: "Acme — Main Store" },
    { id: "gid://shopify/Location/70012", name: "Acme — Overflow Depot" },
    { id: "gid://shopify/Location/70013", name: "Acme — Retail Front" },
  ],
  "Coastal Supply Co.": [
    { id: "gid://shopify/Location/70021", name: "Coastal — HQ" },
    { id: "gid://shopify/Location/70022", name: "Coastal — Dock Warehouse" },
  ],
};

function getErpLocationsUsed(storeName) {
  return ERP_LOCATIONS.filter((loc) => getErpRows(storeName).some((r) => r.location === loc));
}

// ERP rows whose part number has no match in shopify_data — driven from the ERP side, per the sync logic
function getNotMatchedRows(storeName) {
  const shopifySkus = new Set(getShopifyRows(storeName).map((r) => r.sku));
  return getErpRows(storeName).filter((r) => !shopifySkus.has(r.sku));
}



const MOCK_LOGS = [
  { time: "10:42:03", store: "Acme Hardware", sku: "HDW-1043", field: "qty", oldVal: "90", newVal: "88", type: "updated" },
  { time: "10:42:03", store: "Acme Hardware", sku: "HDW-2211", field: "price", oldVal: "3.95", newVal: "4.10", type: "updated" },
  { time: "10:42:03", store: "Acme Hardware", sku: "PNT-0087", field: "qty", oldVal: "6", newVal: "0", type: "updated" },
  { time: "10:27:03", store: "Acme Hardware", sku: "—", field: "—", oldVal: "—", newVal: "—", type: "none" },
  { time: "10:15:41", store: "Coastal Supply Co.", sku: "CST-0044", field: "new product", oldVal: "—", newVal: "added", type: "new" },
  { time: "09:57:02", store: "Midtown Parts", sku: "—", field: "—", oldVal: "—", newVal: "—", type: "failed" },
  { time: "09:42:03", store: "Acme Hardware", sku: "HDW-2210", field: "qty", oldVal: "1512", newVal: "1560", type: "updated" },
];

const STATUS_META = {
  healthy: { label: "Healthy", color: C.success, dim: C.successDim },
  syncing: { label: "Syncing", color: C.accent, dim: C.accentDim },
  error: { label: "Error", color: C.error, dim: C.errorDim },
};

// ---------- Bridge connector visual ----------
function BridgeConnector({ status, size = "md" }) {
  const meta = STATUS_META[status];
  const h = size === "lg" ? 64 : 36;
  const w = size === "lg" ? 220 : 140;
  const nodeR = size === "lg" ? 9 : 6;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <circle cx={12} cy={h / 2} r={nodeR} fill={C.textFaint} />
      <circle cx={w - 12} cy={h / 2} r={nodeR} fill={C.textFaint} />
      <line
        x1={12}
        y1={h / 2}
        x2={w - 12}
        y2={h / 2}
        stroke={C.border}
        strokeWidth={2}
      />
      {status !== "error" && (
        <line
          x1={12}
          y1={h / 2}
          x2={w - 12}
          y2={h / 2}
          stroke={meta.color}
          strokeWidth={2}
          strokeDasharray="6 6"
          className={status === "syncing" ? "flow-line" : ""}
          opacity={0.9}
        />
      )}
      <circle
        cx={w / 2}
        cy={h / 2}
        r={size === "lg" ? 13 : 9}
        fill={C.surface}
        stroke={meta.color}
        strokeWidth={2}
      />
      {status === "error" ? (
        <g stroke={meta.color} strokeWidth={2} strokeLinecap="round">
          <line x1={w / 2 - 4} y1={h / 2 - 4} x2={w / 2 + 4} y2={h / 2 + 4} />
          <line x1={w / 2 - 4} y1={h / 2 + 4} x2={w / 2 + 4} y2={h / 2 - 4} />
        </g>
      ) : status === "healthy" ? (
        <path
          d={`M ${w / 2 - 4} ${h / 2} l 3 3 l 5 -6`}
          stroke={meta.color}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <circle cx={w / 2} cy={h / 2} r={3} fill={meta.color} />
      )}
    </svg>
  );
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status];
  return (
    <span
      className="body-f"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        fontWeight: 600,
        color: meta.color,
        background: meta.dim,
        padding: "3px 9px",
        borderRadius: 20,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color }} />
      {meta.label}
    </span>
  );
}

// ---------- Sidebar ----------
function Sidebar({ role, active, setActive }) {
  const adminNav = [
    { key: "stores", label: "Stores", icon: LayoutGrid },
    { key: "settings", label: "Settings", icon: Settings },
  ];
  const customerNav = [
    { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { key: "shopifydb", label: "Shopify", icon: ShoppingBag },
    { key: "erpdb", label: "ERP", icon: Database },
    { key: "notmatched", label: "Not Matched", icon: AlertTriangle },
    { key: "history", label: "Sync History", icon: Activity },
    { key: "settings", label: "Settings", icon: Settings },
  ];
  const nav = role === "admin" ? adminNav : customerNav;

  return (
    <div
      style={{
        width: 220,
        flexShrink: 0,
        background: C.surface,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        padding: "20px 14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 24px 8px" }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: C.accentDim,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowRightLeft size={14} color={C.accent} />
        </div>
        <span className="disp" style={{ color: C.textHi, fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>
          bitsy_bridge
        </span>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              className="focus-ring body-f"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                borderRadius: 7,
                border: "none",
                background: isActive ? C.accentDim : "transparent",
                color: isActive ? C.accent : C.textLo,
                fontSize: 13.5,
                fontWeight: 500,
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = C.surfaceHover; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div style={{ marginTop: "auto", paddingTop: 20 }}>
        <div
          className="body-f"
          style={{
            fontSize: 11,
            color: C.textFaint,
            padding: "8px 10px",
            border: `1px solid ${C.border}`,
            borderRadius: 7,
          }}
        >
          {role === "admin" ? "Admin access" : "Coastal Supply Co."}
        </div>
      </div>
    </div>
  );
}

// ---------- Admin: Stores list ----------
function AdminStores({ onManage }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    return MOCK_STORES.filter((s) => {
      const matchesQuery = s.name.toLowerCase().includes(query.toLowerCase());
      const matchesFilter = filter === "all" || s.status === filter;
      return matchesQuery && matchesFilter;
    });
  }, [query, filter]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 className="disp" style={{ color: C.textHi, fontSize: 22, fontWeight: 700, margin: 0 }}>Stores</h1>
          <p className="body-f" style={{ color: C.textLo, fontSize: 13, margin: "4px 0 0 0" }}>
            {MOCK_STORES.length} connected clients
          </p>
        </div>
        <button
          className="focus-ring body-f"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: C.accent, color: "#FFFFFF", border: "none",
            padding: "9px 14px", borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: "pointer",
          }}
        >
          <Plus size={15} /> Add Store
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <Search size={15} color={C.textFaint} style={{ position: "absolute", left: 11, top: 10 }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stores..."
            className="focus-ring body-f"
            style={{
              width: "100%", background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "8px 12px 8px 32px", color: C.textHi, fontSize: 13.5,
            }}
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="focus-ring body-f"
          style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: "8px 12px", color: C.textLo, fontSize: 13.5, cursor: "pointer",
          }}
        >
          <option value="all">All statuses</option>
          <option value="healthy">Healthy</option>
          <option value="syncing">Syncing</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 && (
          <div className="body-f" style={{ color: C.textFaint, fontSize: 13.5, padding: "32px 0", textAlign: "center" }}>
            No stores match "{query}".
          </div>
        )}
        {filtered.map((s) => (
          <div
            key={s.id}
            style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div style={{ minWidth: 160 }}>
              <div className="disp" style={{ color: C.textHi, fontSize: 14.5, fontWeight: 600 }}>{s.name}</div>
              <div className="mono" style={{ color: C.textFaint, fontSize: 11.5, marginTop: 3 }}>
                {s.skus.toLocaleString()} SKUs · {s.erp}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span className="body-f" style={{ fontSize: 11.5, color: C.textFaint, minWidth: 30 }}>ERP</span>
              <BridgeConnector status={s.status} />
              <span className="body-f" style={{ fontSize: 11.5, color: C.textFaint, minWidth: 46 }}>Shopify</span>
            </div>
            <div style={{ minWidth: 100, textAlign: "right" }}>
              <StatusBadge status={s.status} />
              <div className="mono" style={{ color: C.textFaint, fontSize: 11, marginTop: 5 }}>{s.lastSync}</div>
            </div>
            <button
              onClick={() => onManage(s)}
              className="focus-ring body-f"
              style={{
                background: "transparent", border: `1px solid ${C.borderLight}`, color: C.textLo,
                borderRadius: 7, padding: "6px 12px", fontSize: 12.5, cursor: "pointer",
              }}
            >
              Manage
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Admin: Connections ----------
function AdminConnections({ store = MOCK_STORES[1].name }) {
  return (
    <div>
      <h1 className="disp" style={{ color: C.textHi, fontSize: 22, fontWeight: 700, margin: "0 0 4px 0" }}>
        Connections
      </h1>
      <p className="body-f" style={{ color: C.textLo, fontSize: 13, margin: "0 0 24px 0" }}>
        Configure this client's ERP source, Shopify credentials, and Supabase connection.
      </p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 260, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
          <div className="disp" style={{ color: C.textHi, fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
            ERP source — {store}
          </div>
          {[
            ["Connector type", "MS Access (.accdb)"],
            ["Host / file path", "//coastal-srv/data/inventory.accdb"],
            ["Field mapping", "3 fields mapped"],
          ].map(([label, val]) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <div className="body-f" style={{ color: C.textFaint, fontSize: 11.5, marginBottom: 4 }}>{label}</div>
              <div
                className="mono"
                style={{
                  background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6,
                  padding: "8px 10px", color: C.textHi, fontSize: 12.5,
                }}
              >
                {val}
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 260, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
          <div className="disp" style={{ color: C.textHi, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
            Shopify store
          </div>
          <p className="body-f" style={{ color: C.textFaint, fontSize: 11.5, margin: "0 0 12px 0" }}>
            Authorized via OAuth — no manual token entry.
          </p>
          {[
            ["Shop domain", "coastal-supply.myshopify.com"],
            ["Connection status", "Connected"],
            ["Scopes granted", "read/write_products, read/write_inventory, read_locations"],
            ["Connected on", "3 Aug 2026"],
            ["Token status", "Active — auto-refreshed"],
          ].map(([label, val]) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <div className="body-f" style={{ color: C.textFaint, fontSize: 11.5, marginBottom: 4 }}>{label}</div>
              <div
                className="mono"
                style={{
                  background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6,
                  padding: "8px 10px", color: C.textHi, fontSize: 12.5,
                }}
              >
                {val}
              </div>
            </div>
          ))}
          <button
            disabled
            className="body-f"
            style={{
              background: "transparent", border: `1px solid ${C.borderLight}`, color: C.textFaint,
              borderRadius: 8, padding: "8px 14px", fontSize: 12.5, cursor: "not-allowed", marginTop: 4,
            }}
          >
            Reconnect Shopify (setup coming soon)
          </button>
        </div>

        <div style={{ flex: 1, minWidth: 260, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
          <div className="disp" style={{ color: C.textHi, fontSize: 14, fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <Database size={15} color={C.accent} /> Supabase connection
          </div>
          <p className="body-f" style={{ color: C.textFaint, fontSize: 11.5, margin: "0 0 12px 0" }}>
            Used by this client's local agent to push data to the cloud DB.
          </p>
          {[
            ["Project URL", "https://bitsybridge.supabase.co"],
            ["Anon key", "eyJhbGciOi••••••••••••8kq2"],
            ["Store API key (device token)", "sbk_live_coastal_••••••••7f1a"],
          ].map(([label, val]) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <div className="body-f" style={{ color: C.textFaint, fontSize: 11.5, marginBottom: 4 }}>{label}</div>
              <div
                className="mono"
                style={{
                  background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6,
                  padding: "8px 10px", color: C.textHi, fontSize: 12.5,
                }}
              >
                {val}
              </div>
            </div>
          ))}
          <button
            className="focus-ring body-f"
            style={{
              background: "transparent", border: `1px solid ${C.borderLight}`, color: C.textHi,
              borderRadius: 8, padding: "8px 14px", fontSize: 12.5, cursor: "pointer", marginTop: 4,
            }}
          >
            Regenerate device token
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Shared: store selector ----------
function StoreSelector({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="focus-ring body-f"
      style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
        padding: "8px 12px", color: C.textHi, fontSize: 13, cursor: "pointer",
      }}
    >
      {MOCK_STORES.map((s) => (
        <option key={s.id} value={s.name}>{s.name}</option>
      ))}
    </select>
  );
}

function DBTable({ columns, rows }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
      <div
        className="body-f"
        style={{
          display: "grid", gridTemplateColumns: columns.map((c) => c.width || "1fr").join(" "),
          padding: "10px 18px", borderBottom: `1px solid ${C.border}`,
          fontSize: 11.5, color: C.textFaint, fontWeight: 600,
        }}
      >
        {columns.map((c) => <span key={c.key}>{c.label}</span>)}
      </div>
      {rows.length === 0 && (
        <div className="body-f" style={{ padding: "24px 18px", color: C.textFaint, fontSize: 13 }}>
          No rows for this store yet.
        </div>
      )}
      {rows.map((row, i) => (
        <div
          key={i}
          className="mono"
          style={{
            display: "grid", gridTemplateColumns: columns.map((c) => c.width || "1fr").join(" "),
            padding: "11px 18px", alignItems: "center",
            borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none",
            fontSize: 12.5, color: C.textHi,
          }}
        >
          {columns.map((c) => (
            <span key={c.key} style={{ color: c.key === "name" ? C.textHi : undefined }}>
              {c.render ? c.render(row) : row[c.key]}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------- Admin: Shopify ----------
function AdminShopifyDB({ fixedStore }) {
  const [store, setStore] = useState(fixedStore || MOCK_STORES[0].name);
  const rows = getShopifyRows(fixedStore || store);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <h1 className="disp" style={{ color: C.textHi, fontSize: 22, fontWeight: 700, margin: 0 }}>Shopify</h1>
          <p className="body-f" style={{ color: C.textLo, fontSize: 13, margin: "4px 0 0 0" }}>
            Mirror of last confirmed Shopify state (<span className="mono">shopify_data</span> table)
          </p>
        </div>
        {!fixedStore && <StoreSelector value={store} onChange={setStore} />}
      </div>
      <div style={{ height: 18 }} />
      <DBTable
        columns={[
          { key: "sku", label: "SKU", width: "0.9fr" },
          { key: "name", label: "Product", width: "1.6fr" },
          { key: "qty", label: "Qty", width: "0.6fr" },
          { key: "price", label: "Price", width: "0.7fr", render: (r) => `R ${r.price.toFixed(2)}` },
          { key: "variantId", label: "Variant ID", width: "1.4fr" },
          { key: "lastConfirmed", label: "Confirmed", width: "0.8fr" },
        ]}
        rows={rows}
      />
    </div>
  );
}

// ---------- Admin: ERP ----------
function AdminERPDB({ fixedStore }) {
  const [store, setStore] = useState(fixedStore || MOCK_STORES[0].name);
  const [location, setLocation] = useState("Location 1");
  const rows = getErpRows(fixedStore || store).filter((r) => r.location === location);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <h1 className="disp" style={{ color: C.textHi, fontSize: 22, fontWeight: 700, margin: 0 }}>ERP</h1>
          <p className="body-f" style={{ color: C.textLo, fontSize: 13, margin: "4px 0 0 0" }}>
            Latest snapshot pushed by the local agent (<span className="mono">erp_data</span> table)
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {!fixedStore && <StoreSelector value={store} onChange={setStore} />}
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="focus-ring body-f"
            style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
              padding: "8px 12px", color: C.textHi, fontSize: 13, cursor: "pointer",
            }}
          >
            {ERP_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{LOCATION_LABEL(loc)}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ height: 18 }} />
      <DBTable
        columns={[
          { key: "sku", label: "SKU", width: "0.9fr" },
          { key: "name", label: "Product", width: "1.6fr" },
          { key: "qty", label: "Qty", width: "0.6fr" },
          { key: "price", label: "Price", width: "0.7fr", render: (r) => `R ${r.price.toFixed(2)}` },
          { key: "location", label: "Location", width: "1fr", render: (r) => LOCATION_LABEL(r.location) },
          { key: "lastReceived", label: "Received", width: "0.8fr" },
        ]}
        rows={rows}
      />
    </div>
  );
}

// ---------- Admin: Logs (Nett Changed history) ----------
function LogTypeTag({ type }) {
  const map = {
    updated: { label: "Updated", color: C.accent, dim: C.accentDim },
    new: { label: "New", color: C.success, dim: C.successDim },
    failed: { label: "Failed", color: C.error, dim: C.errorDim },
    none: { label: "No changes", color: C.textFaint, dim: "transparent" },
  };
  const m = map[type];
  return (
    <span
      className="body-f"
      style={{
        fontSize: 11.5, fontWeight: 600, color: m.color, background: m.dim,
        padding: "2px 8px", borderRadius: 20,
      }}
    >
      {m.label}
    </span>
  );
}

function AdminLogs({ fixedStore }) {
  const [store, setStore] = useState(fixedStore || "all");
  const activeFilter = fixedStore || store;

  const rows = MOCK_LOGS.filter((l) => activeFilter === "all" || l.store === activeFilter);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <h1 className="disp" style={{ color: C.textHi, fontSize: 22, fontWeight: 700, margin: 0 }}>Logs</h1>
          <p className="body-f" style={{ color: C.textLo, fontSize: 13, margin: "4px 0 0 0" }}>
            What changed after each sync run (<span className="mono">nett_changed</span> table)
          </p>
        </div>
        {!fixedStore && (
          <select
            value={store}
            onChange={(e) => setStore(e.target.value)}
            className="focus-ring body-f"
            style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
              padding: "8px 12px", color: C.textHi, fontSize: 13, cursor: "pointer",
            }}
          >
            <option value="all">All stores</option>
            {MOCK_STORES.map((s) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        )}
      </div>
      <div style={{ height: 18 }} />
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        <div
          className="body-f"
          style={{
            display: "grid", gridTemplateColumns: "0.9fr 1.3fr 0.9fr 0.9fr 0.7fr 0.7fr 0.9fr",
            padding: "10px 18px", borderBottom: `1px solid ${C.border}`,
            fontSize: 11.5, color: C.textFaint, fontWeight: 600,
          }}
        >
          <span>Time</span><span>Store</span><span>SKU</span><span>Field</span><span>Old</span><span>New</span><span>Result</span>
        </div>
        {rows.length === 0 && (
          <div className="body-f" style={{ padding: "24px 18px", color: C.textFaint, fontSize: 13 }}>
            No log entries for this store.
          </div>
        )}
        {rows.map((l, i) => (
          <div
            key={i}
            className="mono"
            style={{
              display: "grid", gridTemplateColumns: "0.9fr 1.3fr 0.9fr 0.9fr 0.7fr 0.7fr 0.9fr",
              padding: "11px 18px", alignItems: "center",
              borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none",
              fontSize: 12.5, color: C.textHi,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={12} color={C.textFaint} /> {l.time}
            </span>
            <span className="body-f" style={{ color: C.textLo }}>{l.store}</span>
            <span>{l.sku}</span>
            <span style={{ color: C.textFaint }}>{l.field}</span>
            <span style={{ color: C.textFaint }}>{l.oldVal}</span>
            <span>{l.newVal}</span>
            <span><LogTypeTag type={l.type} /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Admin: real Supabase Auth login ----------
function AdminLogin({ onSignedIn, onSwitchToCustomer }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    onSignedIn(data.session);
  };

  const inputStyle = {
    width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
    padding: "10px 12px", color: C.textHi, fontSize: 13.5, boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{FONTS}</style>
      <form
        onSubmit={handleSubmit}
        style={{
          width: 340, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ArrowRightLeft size={14} color={C.accent} />
          </div>
          <span className="disp" style={{ color: C.textHi, fontSize: 15, fontWeight: 700 }}>bitsy_bridge admin</span>
        </div>

        <label className="body-f" style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 6, display: "block" }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="focus-ring"
          style={{ ...inputStyle, marginBottom: 14 }}
          placeholder="you@qkonbytes.com"
          required
        />

        <label className="body-f" style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 6, display: "block" }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="focus-ring"
          style={{ ...inputStyle, marginBottom: 18 }}
          placeholder="••••••••"
          required
        />

        {error && (
          <div className="body-f" style={{ color: C.error, fontSize: 12.5, marginBottom: 14, background: C.errorDim, padding: "8px 10px", borderRadius: 7 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="focus-ring body-f"
          style={{
            width: "100%", background: loading ? C.border : C.accent, color: "#FFFFFF", border: "none",
            borderRadius: 8, padding: "10px 14px", fontSize: 13.5, fontWeight: 600,
            cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        {onSwitchToCustomer && (
          <button
            type="button"
            onClick={onSwitchToCustomer}
            className="focus-ring body-f"
            style={{
              width: "100%", background: "transparent", border: "none", color: C.textFaint,
              fontSize: 12, cursor: "pointer", marginTop: 14, textAlign: "center",
            }}
          >
            Just previewing? View the customer side instead
          </button>
        )}
      </form>
    </div>
  );
}

function AdminAuthGate({ children, onSwitchToCustomer }) {
  const [status, setStatus] = useState("loading"); // loading | signed_out | checking_admin | authorized | not_admin
  const [session, setSession] = useState(null);
  const [checkError, setCheckError] = useState("");

  const checkIsPlatformAdmin = async (currentSession) => {
    if (!currentSession) {
      setStatus("signed_out");
      return;
    }
    setStatus("checking_admin");
    const { data, error } = await supabase
      .from("platform_admins")
      .select("id")
      .eq("user_id", currentSession.user.id)
      .maybeSingle();
    if (error) {
      setCheckError(error.message);
      setStatus("not_admin");
      return;
    }
    setStatus(data ? "authorized" : "not_admin");
  };

  useEffect(() => {
    if (!isSupabaseConfigured) return; // handled by the not_configured render below
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      checkIsPlatformAdmin(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      checkIsPlatformAdmin(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!isSupabaseConfigured) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{FONTS}</style>
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <AlertTriangle size={22} color={C.error} style={{ marginBottom: 12 }} />
          <p className="body-f" style={{ color: C.textHi, fontSize: 14, marginBottom: 6 }}>
            Supabase isn't configured
          </p>
          <p className="body-f" style={{ color: C.textFaint, fontSize: 12.5, marginBottom: 18 }}>
            <span className="mono">VITE_SUPABASE_URL</span> and/or <span className="mono">VITE_SUPABASE_ANON_KEY</span> are missing.
            Set them in Vercel's Project Settings → Environment Variables (or <span className="mono">.env.local</span> for local dev), then redeploy.
          </p>
          {onSwitchToCustomer && (
            <button
              onClick={onSwitchToCustomer}
              className="focus-ring body-f"
              style={{
                background: "transparent", border: `1px solid ${C.borderLight}`, color: C.textHi,
                borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer",
              }}
            >
              View customer side instead
            </button>
          )}
        </div>
      </div>
    );
  }

  if (status === "loading" || status === "checking_admin") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={20} color={C.textFaint} style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === "signed_out") {
    return (
      <AdminLogin
        onSignedIn={(s) => { setSession(s); checkIsPlatformAdmin(s); }}
        onSwitchToCustomer={onSwitchToCustomer}
      />
    );
  }

  if (status === "not_admin") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{FONTS}</style>
        <div style={{ textAlign: "center", maxWidth: 340 }}>
          <Lock size={22} color={C.textFaint} style={{ marginBottom: 12 }} />
          <p className="body-f" style={{ color: C.textHi, fontSize: 14, marginBottom: 6 }}>
            This account isn't set up as a platform admin.
          </p>
          <p className="body-f" style={{ color: C.textFaint, fontSize: 12.5, marginBottom: 18 }}>
            {checkError || "Ask an existing admin to add your user to platform_admins."}
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              onClick={handleSignOut}
              className="focus-ring body-f"
              style={{
                background: "transparent", border: `1px solid ${C.borderLight}`, color: C.textHi,
                borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer",
              }}
            >
              Sign out
            </button>
            {onSwitchToCustomer && (
              <button
                onClick={onSwitchToCustomer}
                className="focus-ring body-f"
                style={{
                  background: "transparent", border: "none", color: C.textFaint,
                  fontSize: 13, cursor: "pointer",
                }}
              >
                View customer side instead
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // authorized
  return children(handleSignOut, session);
}

// ---------- Customer: two-step login (resolve project by email, then password against THAT project) ----------
function CustomerLogin({ onResolved, onNotFound, onSkip }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!isSupabaseConfigured) {
      setError("Supabase isn't configured — set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.");
      return;
    }
    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc("resolve_client_project", { p_email: email });
    setLoading(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    const match = Array.isArray(data) ? data[0] : data;
    if (!match || !match.supabase_url) {
      onNotFound(email);
      return;
    }
    onResolved(email, match);
  };

  const inputStyle = {
    width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
    padding: "10px 12px", color: C.textHi, fontSize: 13.5, boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{FONTS}</style>
      <form
        onSubmit={handleSubmit}
        style={{ width: 340, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ArrowRightLeft size={14} color={C.accent} />
          </div>
          <span className="disp" style={{ color: C.textHi, fontSize: 15, fontWeight: 700 }}>bitsy_bridge</span>
        </div>

        <label className="body-f" style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 6, display: "block" }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="focus-ring"
          style={{ ...inputStyle, marginBottom: 14 }}
          placeholder="you@yourstore.com"
          required
        />

        {error && (
          <div className="body-f" style={{ color: C.error, fontSize: 12.5, marginBottom: 14, background: C.errorDim, padding: "8px 10px", borderRadius: 7 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="focus-ring body-f"
          style={{
            width: "100%", background: loading ? C.border : C.accent, color: "#FFFFFF", border: "none",
            borderRadius: 8, padding: "10px 14px", fontSize: 13.5, fontWeight: 600,
            cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
          {loading ? "Looking up your account…" : "Continue"}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="focus-ring body-f"
            style={{ width: "100%", background: "transparent", border: "none", color: C.textFaint, fontSize: 12, cursor: "pointer", marginTop: 14, textAlign: "center" }}
          >
            No client project set up yet — skip and preview
          </button>
        )}
      </form>
    </div>
  );
}

function CustomerPasswordStep({ email, storeName, clientSupabase, onSignedIn, onBack }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: signInError } = await clientSupabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    onSignedIn(data.session);
  };

  const inputStyle = {
    width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
    padding: "10px 12px", color: C.textHi, fontSize: 13.5, boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{FONTS}</style>
      <form
        onSubmit={handleSubmit}
        style={{ width: 340, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ArrowRightLeft size={14} color={C.accent} />
          </div>
          <span className="disp" style={{ color: C.textHi, fontSize: 15, fontWeight: 700 }}>bitsy_bridge</span>
        </div>
        <p className="body-f" style={{ color: C.textFaint, fontSize: 12, margin: "0 0 20px 0" }}>{storeName} · {email}</p>

        <label className="body-f" style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 6, display: "block" }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="focus-ring"
          style={{ ...inputStyle, marginBottom: 18 }}
          placeholder="••••••••"
          required
          autoFocus
        />

        {error && (
          <div className="body-f" style={{ color: C.error, fontSize: 12.5, marginBottom: 14, background: C.errorDim, padding: "8px 10px", borderRadius: 7 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="focus-ring body-f"
          style={{
            width: "100%", background: loading ? C.border : C.accent, color: "#FFFFFF", border: "none",
            borderRadius: 8, padding: "10px 14px", fontSize: 13.5, fontWeight: 600,
            cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="focus-ring body-f"
          style={{ width: "100%", background: "transparent", border: "none", color: C.textFaint, fontSize: 12, cursor: "pointer", marginTop: 14, textAlign: "center" }}
        >
          ← Use a different email
        </button>
      </form>
    </div>
  );
}

function CustomerAuthGate({ children, onPreview }) {
  const [step, setStep] = useState("email"); // email | password | authorized | not_found
  const [email, setEmail] = useState("");
  const [resolved, setResolved] = useState(null); // { supabase_url, anon_key, client_role, client_name }
  const [clientSupabase, setClientSupabase] = useState(null);
  const [session, setSession] = useState(null);

  const handleResolved = (enteredEmail, match) => {
    setEmail(enteredEmail);
    setResolved(match);
    setClientSupabase(createClient(match.supabase_url, match.anon_key));
    setStep("password");
  };

  const handleNotFound = () => setStep("not_found");

  const handleSignedIn = (s) => {
    setSession(s);
    setStep("authorized");
  };

  const handleSignOut = async () => {
    if (clientSupabase) await clientSupabase.auth.signOut();
    setStep("email");
    setSession(null);
    setResolved(null);
    setClientSupabase(null);
    setEmail("");
  };

  if (step === "email") {
    return <CustomerLogin onResolved={handleResolved} onNotFound={handleNotFound} onSkip={onPreview} />;
  }

  if (step === "not_found") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{FONTS}</style>
        <div style={{ textAlign: "center", maxWidth: 340 }}>
          <Lock size={22} color={C.textFaint} style={{ marginBottom: 12 }} />
          <p className="body-f" style={{ color: C.textHi, fontSize: 14, marginBottom: 6 }}>No account found for {email}</p>
          <p className="body-f" style={{ color: C.textFaint, fontSize: 12.5, marginBottom: 18 }}>
            Contact your account admin, or reach us at enquiries@qkonbytes.com.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              onClick={() => setStep("email")}
              className="focus-ring body-f"
              style={{ background: "transparent", border: `1px solid ${C.borderLight}`, color: C.textHi, borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}
            >
              Try again
            </button>
            {onPreview && (
              <button
                onClick={onPreview}
                className="focus-ring body-f"
                style={{ background: "transparent", border: "none", color: C.textFaint, fontSize: 13, cursor: "pointer" }}
              >
                Skip and preview
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === "password") {
    return (
      <CustomerPasswordStep
        email={email}
        storeName={resolved?.client_name}
        clientSupabase={clientSupabase}
        onSignedIn={handleSignedIn}
        onBack={() => { setStep("email"); setResolved(null); setClientSupabase(null); }}
      />
    );
  }

  // authorized
  return children(handleSignOut, session, resolved);
}

function Placeholder({ title }) {
  return (
    <div>
      <h1 className="disp" style={{ color: C.textHi, fontSize: 22, fontWeight: 700, margin: "0 0 8px 0" }}>{title}</h1>
      <p className="body-f" style={{ color: C.textFaint, fontSize: 13.5 }}>Coming in a later pass.</p>
    </div>
  );
}

// ---------- Admin: Store Detail (opened via "Manage") ----------
function StoreOverview({ store }) {
  const [interval_, setInterval_] = useState("30 min");
  const [paused, setPaused] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [markupType, setMarkupType] = useState("percent");
  const [markupValue, setMarkupValue] = useState("10");

  const handleForceSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 1800);
  };

  const status = syncing ? "syncing" : store.status;
  const cardStyle = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 };
  const labelStyle = { fontSize: 11.5, color: C.textFaint, marginBottom: 6, display: "block" };
  const inputStyle = {
    background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
    padding: "9px 12px", color: C.textHi, fontSize: 13,
  };
  const saveBtn = {
    background: "transparent", border: `1px solid ${C.borderLight}`, color: C.textHi,
    borderRadius: 8, padding: "8px 14px", fontSize: 12.5, cursor: "pointer",
    display: "flex", alignItems: "center", gap: 6,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <span className="body-f" style={{ fontSize: 12, color: C.textFaint }}>ERP</span>
        <BridgeConnector status={status} size="lg" />
        <span className="body-f" style={{ fontSize: 12, color: C.textFaint }}>Shopify</span>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1, ...cardStyle }}>
          <div className="body-f" style={{ color: C.textFaint, fontSize: 11.5, marginBottom: 6 }}>Status</div>
          <StatusBadge status={status} />
        </div>
        <div style={{ flex: 1, ...cardStyle }}>
          <div className="body-f" style={{ color: C.textFaint, fontSize: 11.5, marginBottom: 6 }}>Last synced</div>
          <div className="mono" style={{ color: C.textHi, fontSize: 14 }}>{syncing ? "syncing now…" : store.lastSync}</div>
        </div>
        <div style={{ flex: 1, ...cardStyle }}>
          <div className="body-f" style={{ color: C.textFaint, fontSize: 11.5, marginBottom: 6 }}>SKUs tracked</div>
          <div className="mono" style={{ color: C.textHi, fontSize: 14 }}>{store.skus.toLocaleString()}</div>
        </div>
      </div>

      <div style={cardStyle}>
        <div className="disp" style={{ color: C.textHi, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
          Sync controls
        </div>
        <p className="body-f" style={{ color: C.textFaint, fontSize: 12.5, margin: "0 0 16px 0" }}>
          Full admin rights — changes here apply immediately for this client. 15 min minimum interval.
        </p>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div style={{ minWidth: 200 }}>
            <label className="body-f" style={labelStyle}>Sync interval</label>
            <div style={{ display: "flex", gap: 8 }}>
              <select
                value={interval_}
                onChange={(e) => setInterval_(e.target.value)}
                disabled={paused}
                className="focus-ring body-f"
                style={{ ...inputStyle, flex: 1, cursor: paused ? "not-allowed" : "pointer", opacity: paused ? 0.5 : 1 }}
              >
                {["15 min", "30 min", "1 hr", "6 hr", "24 hr"].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <button className="focus-ring body-f" style={saveBtn} disabled={paused}>
                <Check size={14} /> Save
              </button>
            </div>
          </div>

          <div>
            <label className="body-f" style={labelStyle}>Pause all syncs</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 2 }}>
              <Toggle checked={paused} onChange={setPaused} />
              <span className="body-f" style={{ fontSize: 12.5, color: paused ? C.error : C.textLo }}>
                {paused ? "Paused" : "Running"}
              </span>
            </div>
          </div>

          <div>
            <label className="body-f" style={labelStyle}>Force a sync now</label>
            <button
              onClick={handleForceSync}
              disabled={syncing || paused}
              className="focus-ring body-f"
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: syncing || paused ? C.border : C.accent,
                color: syncing || paused ? C.textFaint : "#FFFFFF",
                border: "none", borderRadius: 8, padding: "9px 16px",
                fontSize: 13, fontWeight: 600, cursor: syncing || paused ? "default" : "pointer",
              }}
            >
              <RefreshCw size={14} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
              {syncing ? "Syncing…" : "Sync now"}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div className="disp" style={{ color: C.textHi, fontSize: 14, fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <SlidersHorizontal size={15} color={C.accent} /> Pricing markup
        </div>
        <p className="body-f" style={{ color: C.textFaint, fontSize: 12.5, margin: "0 0 16px 0" }}>
          Applied to every product price before it's pushed to Shopify.
        </p>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label className="body-f" style={labelStyle}>Markup type</label>
            <div style={{ display: "flex", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 3 }}>
              {[["percent", "% markup"], ["fixed", "ZAR value"]].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setMarkupType(key)}
                  className="focus-ring body-f"
                  style={{
                    border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12.5, fontWeight: 600,
                    cursor: "pointer", background: markupType === key ? C.accent : "transparent",
                    color: markupType === key ? "#FFFFFF" : C.textLo,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ width: 160 }}>
            <label className="body-f" style={labelStyle}>{markupType === "percent" ? "Percentage" : "Amount (ZAR)"}</label>
            <div style={{ position: "relative" }}>
              <input
                type="number"
                value={markupValue}
                onChange={(e) => setMarkupValue(e.target.value)}
                className="focus-ring body-f"
                style={{ ...inputStyle, width: "100%", paddingRight: 30, boxSizing: "border-box" }}
              />
              <span className="body-f" style={{ position: "absolute", right: 12, top: 9, fontSize: 12.5, color: C.textFaint }}>
                {markupType === "percent" ? "%" : "R"}
              </span>
            </div>
          </div>
          <button className="focus-ring body-f" style={saveBtn}>
            <Check size={14} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Admin: Location mapping (Q-KON Bytes only) ----------
// ---------- Admin: Not Matched (ERP part numbers with no Shopify match) ----------
function NotMatched({ store }) {
  const rows = getNotMatchedRows(store.name);

  return (
    <div>
      <div className="disp" style={{ color: C.textHi, fontSize: 14, fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
        <AlertTriangle size={15} color={C.error} /> Not matched
      </div>
      <p className="body-f" style={{ color: C.textFaint, fontSize: 12.5, margin: "0 0 16px 0" }}>
        ERP part numbers with no matching SKU in Shopify — never pushed, since bitsy_bridge doesn't create new Shopify products.
      </p>
      <DBTable
        columns={[
          { key: "sku", label: "Part number", width: "0.9fr" },
          { key: "name", label: "Product", width: "1.6fr" },
          { key: "location", label: "Location", width: "1fr", render: (r) => LOCATION_LABEL(r.location) },
          { key: "qty", label: "Qty", width: "0.6fr" },
          { key: "price", label: "Price", width: "0.7fr", render: (r) => `R ${r.price.toFixed(2)}` },
          { key: "lastReceived", label: "Last seen", width: "0.8fr" },
        ]}
        rows={rows}
      />
    </div>
  );
}

function LocationMapping({ store }) {
  const erpLocations = getErpLocationsUsed(store.name);
  const shopifyLocations = MOCK_SHOPIFY_LOCATIONS[store.name] || [];

  const [mapping, setMapping] = useState(() =>
    Object.fromEntries(erpLocations.map((loc, i) => [loc, shopifyLocations[i]?.id || ""]))
  );

  const cardStyle = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 };

  return (
    <div>
      <div className="disp" style={{ color: C.textHi, fontSize: 14, fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
        <MapPin size={15} color={C.accent} /> Location mapping
      </div>
      <p className="body-f" style={{ color: C.textFaint, fontSize: 12.5, margin: "0 0 4px 0" }}>
        Internal only — determines which ERP location's stock updates which Shopify location.
      </p>
      {shopifyLocations.length === 0 && (
        <p className="body-f" style={{ color: C.textFaint, fontSize: 12, margin: "0 0 16px 0" }}>
          Shopify locations will populate automatically once this store is connected via OAuth. Showing placeholder data for now.
        </p>
      )}
      <div style={{ height: 12 }} />

      <div style={cardStyle}>
        <div
          className="body-f"
          style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 0.6fr", padding: "0 0 10px 0",
            borderBottom: `1px solid ${C.border}`, fontSize: 11.5, color: C.textFaint, fontWeight: 600, marginBottom: 12,
          }}
        >
          <span>ERP location</span><span>Shopify location</span><span></span>
        </div>
        {erpLocations.length === 0 && (
          <p className="body-f" style={{ color: C.textFaint, fontSize: 13 }}>No ERP locations found for this store yet.</p>
        )}
        {erpLocations.map((loc, i) => (
          <div
            key={loc}
            style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 0.6fr", alignItems: "center",
              padding: "10px 0", borderBottom: i < erpLocations.length - 1 ? `1px solid ${C.border}` : "none",
            }}
          >
            <span className="mono" style={{ color: C.textHi, fontSize: 12.5 }}>{LOCATION_LABEL(loc)}</span>
            <select
              value={mapping[loc] || ""}
              onChange={(e) => setMapping({ ...mapping, [loc]: e.target.value })}
              className="focus-ring body-f"
              style={{
                background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
                padding: "7px 10px", color: C.textHi, fontSize: 12.5, cursor: "pointer", maxWidth: 260,
              }}
            >
              <option value="">Select a Shopify location…</option>
              {shopifyLocations.map((sl) => (
                <option key={sl.id} value={sl.id}>{sl.name}</option>
              ))}
            </select>
            <span style={{ textAlign: "right" }}>
              <button
                className="focus-ring body-f"
                style={{
                  background: "transparent", border: `1px solid ${C.borderLight}`, color: C.textHi,
                  borderRadius: 7, padding: "5px 11px", fontSize: 11.5, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 5,
                }}
              >
                <Check size={12} /> Save
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StoreDetail({ store, onBack }) {
  const [tab, setTab] = useState("overview");
  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "shopify", label: "Shopify" },
    { key: "erp", label: "ERP" },
    { key: "notmatched", label: "Not Matched" },
    { key: "history", label: "Sync History" },
    { key: "logs", label: "Logs" },
    { key: "connections", label: "Connections" },
    { key: "locations", label: "Locations" },
  ];

  return (
    <div>
      <button
        onClick={onBack}
        className="focus-ring body-f"
        style={{
          background: "transparent", border: "none", color: C.textFaint, fontSize: 12.5,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0, marginBottom: 14,
        }}
      >
        <ChevronLeft size={14} /> All stores
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 className="disp" style={{ color: C.textHi, fontSize: 22, fontWeight: 700, margin: 0 }}>{store.name}</h1>
          <p className="body-f" style={{ color: C.textLo, fontSize: 13, margin: "4px 0 0 0" }}>
            {store.skus.toLocaleString()} SKUs · {store.erp}
          </p>
        </div>
        <StatusBadge status={store.status} />
      </div>

      <div style={{ display: "flex", gap: 4, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: 4, marginBottom: 20, width: "fit-content" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="focus-ring body-f"
            style={{
              border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12.5, fontWeight: 600,
              cursor: "pointer", background: tab === t.key ? C.accent : "transparent",
              color: tab === t.key ? "#FFFFFF" : C.textLo,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <StoreOverview store={store} />}
      {tab === "shopify" && <AdminShopifyDB fixedStore={store.name} />}
      {tab === "erp" && <AdminERPDB fixedStore={store.name} />}
      {tab === "notmatched" && <NotMatched store={store} />}
      {tab === "history" && <CustomerHistory storeName={store.name} />}
      {tab === "logs" && <AdminLogs fixedStore={store.name} />}
      {tab === "connections" && <AdminConnections store={store.name} />}
      {tab === "locations" && <LocationMapping store={store} />}
    </div>
  );
}

// ---------- Admin: Global Settings ----------
function AdminGlobalSettings() {
  const [supportEmail, setSupportEmail] = useState("enquiries@qkonbytes.com");
  const [minInterval, setMinInterval] = useState("15 min");

  const cardStyle = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 };
  const labelStyle = { fontSize: 11.5, color: C.textFaint, marginBottom: 6, display: "block" };
  const inputStyle = {
    background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
    padding: "9px 12px", color: C.textHi, fontSize: 13,
  };
  const saveBtn = {
    background: "transparent", border: `1px solid ${C.borderLight}`, color: C.textHi,
    borderRadius: 8, padding: "8px 14px", fontSize: 12.5, cursor: "pointer",
    display: "flex", alignItems: "center", gap: 6,
  };

  return (
    <div>
      <h1 className="disp" style={{ color: C.textHi, fontSize: 22, fontWeight: 700, margin: "0 0 4px 0" }}>
        Settings
      </h1>
      <p className="body-f" style={{ color: C.textLo, fontSize: 13, margin: "0 0 24px 0" }}>
        Platform-wide defaults, not tied to a single client
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 520 }}>
        <div style={cardStyle}>
          <div className="disp" style={{ color: C.textHi, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            Sync limits
          </div>
          <label className="body-f" style={labelStyle}>Minimum sync interval (applies to every client)</label>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              value={minInterval}
              onChange={(e) => setMinInterval(e.target.value)}
              className="focus-ring body-f"
              style={{ ...inputStyle, flex: 1, cursor: "pointer" }}
            >
              {["5 min", "15 min", "30 min"].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <button className="focus-ring body-f" style={saveBtn}>
              <Check size={14} /> Save
            </button>
          </div>
        </div>

        <div style={cardStyle}>
          <div className="disp" style={{ color: C.textHi, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            Support contact
          </div>
          <label className="body-f" style={labelStyle}>Shown to clients under their Settings</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="focus-ring mono"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button className="focus-ring body-f" style={saveBtn}>
              <Check size={14} /> Save
            </button>
          </div>
        </div>

        <div style={cardStyle}>
          <div className="disp" style={{ color: C.textHi, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            Internal admin users
          </div>
          {["you@qkonbytes.com", "ops@qkonbytes.com"].map((email) => (
            <div
              key={email}
              className="mono"
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12.5, color: C.textHi,
              }}
            >
              {email}
              <span className="body-f" style={{ fontSize: 11, color: C.textFaint }}>Admin</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Customer: Dashboard ----------
function CustomerDashboard() {
  const store = MOCK_STORES[1]; // Coastal Supply Co.
  const status = store.status;

  return (
    <div>
      <h1 className="disp" style={{ color: C.textHi, fontSize: 22, fontWeight: 700, margin: "0 0 4px 0" }}>
        Dashboard
      </h1>
      <p className="body-f" style={{ color: C.textLo, fontSize: 13, margin: "0 0 24px 0" }}>
        {store.name}
      </p>

      <div
        style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
          <span className="body-f" style={{ fontSize: 12, color: C.textFaint }}>ERP</span>
        </div>
        <BridgeConnector status={status} size="lg" />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <span className="body-f" style={{ fontSize: 12, color: C.textFaint }}>Shopify</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18 }}>
          <div className="body-f" style={{ color: C.textFaint, fontSize: 11.5, marginBottom: 6 }}>Status</div>
          <StatusBadge status={status} />
        </div>
        <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18 }}>
          <div className="body-f" style={{ color: C.textFaint, fontSize: 11.5, marginBottom: 6 }}>Last synced</div>
          <div className="mono" style={{ color: C.textHi, fontSize: 14 }}>{store.lastSync}</div>
        </div>
        <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18 }}>
          <div className="body-f" style={{ color: C.textFaint, fontSize: 11.5, marginBottom: 6 }}>SKUs tracked</div>
          <div className="mono" style={{ color: C.textHi, fontSize: 14 }}>{store.skus.toLocaleString()}</div>
        </div>
      </div>

      <p className="body-f" style={{ color: C.textFaint, fontSize: 12, marginTop: 16 }}>
        Sync interval, pause, and force-sync controls have moved to Settings.
      </p>
    </div>
  );
}

// ---------- Shared: toggle switch ----------
function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="focus-ring"
      style={{
        width: 42, height: 24, borderRadius: 20, border: "none", cursor: "pointer",
        background: checked ? C.accent : C.border, position: "relative", flexShrink: 0,
        transition: "background 0.15s",
      }}
      aria-pressed={checked}
    >
      <span
        style={{
          position: "absolute", top: 3, left: checked ? 21 : 3,
          width: 18, height: 18, borderRadius: "50%", background: "#FFFFFF",
          transition: "left 0.15s",
        }}
      />
    </button>
  );
}

// ---------- Customer: Settings ----------
function CustomerSettings({ clientRole = "admin" }) {
  const [interval_, setInterval_] = useState("30 min");
  const [paused, setPaused] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [markupType, setMarkupType] = useState("percent");
  const [markupValue, setMarkupValue] = useState("10");
  const [shopUrl, setShopUrl] = useState("coastal-supply.myshopify.com");
  const [erpType, setErpType] = useState("MS Access (.accdb)");
  const [dbUser, setDbUser] = useState("");
  const [dbPass, setDbPass] = useState("");

  const handleForceSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 1800);
  };

  const cardStyle = {
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20,
  };
  const labelStyle = { fontSize: 11.5, color: C.textFaint, marginBottom: 6, display: "block" };
  const inputStyle = {
    width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
    padding: "9px 12px", color: C.textHi, fontSize: 13,
  };
  const saveBtn = {
    background: "transparent", border: `1px solid ${C.borderLight}`, color: C.textHi,
    borderRadius: 8, padding: "8px 14px", fontSize: 12.5, cursor: "pointer",
    display: "flex", alignItems: "center", gap: 6, marginTop: 12,
  };

  return (
    <div>
      <h1 className="disp" style={{ color: C.textHi, fontSize: 22, fontWeight: 700, margin: "0 0 4px 0" }}>
        Settings
      </h1>
      <p className="body-f" style={{ color: C.textLo, fontSize: 13, margin: "0 0 24px 0" }}>
        Coastal Supply Co.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Sync controls */}
        <div style={cardStyle}>
          <div className="disp" style={{ color: C.textHi, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
            Sync controls
          </div>
          <p className="body-f" style={{ color: C.textFaint, fontSize: 12.5, margin: "0 0 16px 0" }}>
            How often changes are checked and pushed automatically. 15 min minimum.
          </p>

          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div style={{ minWidth: 200 }}>
              <label className="body-f" style={labelStyle}>Sync interval</label>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={interval_}
                  onChange={(e) => setInterval_(e.target.value)}
                  disabled={paused}
                  className="focus-ring body-f"
                  style={{ ...inputStyle, flex: 1, cursor: paused ? "not-allowed" : "pointer", opacity: paused ? 0.5 : 1 }}
                >
                  {["15 min", "30 min", "1 hr", "6 hr", "24 hr"].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                <button className="focus-ring body-f" style={{ ...saveBtn, marginTop: 0 }} disabled={paused}>
                  <Check size={14} /> Save
                </button>
              </div>
            </div>

            <div>
              <label className="body-f" style={labelStyle}>Pause all syncs</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 2 }}>
                <Toggle checked={paused} onChange={setPaused} />
                <span className="body-f" style={{ fontSize: 12.5, color: paused ? C.error : C.textLo }}>
                  {paused ? "Paused" : "Running"}
                </span>
              </div>
            </div>

            <div>
              <label className="body-f" style={labelStyle}>Force a sync now</label>
              <button
                onClick={handleForceSync}
                disabled={syncing || paused}
                className="focus-ring body-f"
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: syncing || paused ? C.border : C.accent,
                  color: syncing || paused ? C.textFaint : "#FFFFFF",
                  border: "none", borderRadius: 8, padding: "9px 16px",
                  fontSize: 13, fontWeight: 600, cursor: syncing || paused ? "default" : "pointer",
                }}
              >
                <RefreshCw size={14} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
                {syncing ? "Syncing…" : "Sync now"}
              </button>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        </div>

        {/* Pricing markup */}
        <div style={cardStyle}>
          <div className="disp" style={{ color: C.textHi, fontSize: 14, fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <SlidersHorizontal size={15} color={C.accent} /> Pricing markup
          </div>
          <p className="body-f" style={{ color: C.textFaint, fontSize: 12.5, margin: "0 0 16px 0" }}>
            Applied to every product price before it's pushed to Shopify.
          </p>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <label className="body-f" style={labelStyle}>Markup type</label>
              <div style={{ display: "flex", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 3 }}>
                {[["percent", "% markup"], ["fixed", "ZAR value"]].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setMarkupType(key)}
                    className="focus-ring body-f"
                    style={{
                      border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12.5, fontWeight: 600,
                      cursor: "pointer", background: markupType === key ? C.accent : "transparent",
                      color: markupType === key ? "#FFFFFF" : C.textLo,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ width: 160 }}>
              <label className="body-f" style={labelStyle}>{markupType === "percent" ? "Percentage" : "Amount (ZAR)"}</label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  value={markupValue}
                  onChange={(e) => setMarkupValue(e.target.value)}
                  className="focus-ring body-f"
                  style={{ ...inputStyle, paddingRight: 30 }}
                />
                <span className="body-f" style={{ position: "absolute", right: 12, top: 9, fontSize: 12.5, color: C.textFaint }}>
                  {markupType === "percent" ? "%" : "R"}
                </span>
              </div>
            </div>
            <button className="focus-ring body-f" style={{ ...saveBtn, marginTop: 0 }}>
              <Check size={14} /> Save
            </button>
          </div>
        </div>

        {clientRole === "admin" ? (
          <>
            {/* Shopify connection */}
            <div style={cardStyle}>
              <div className="disp" style={{ color: C.textHi, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                Shopify store
              </div>
              <p className="body-f" style={{ color: C.textFaint, fontSize: 12.5, margin: "0 0 14px 0" }}>
                Connected via Shopify's own sign-in — no API tokens to copy or manage.
              </p>
              <label className="body-f" style={labelStyle}>Shop domain</label>
              <div style={{ display: "flex", gap: 8, maxWidth: 420, marginBottom: 14 }}>
                <input
                  value={shopUrl}
                  onChange={(e) => setShopUrl(e.target.value)}
                  className="focus-ring mono"
                  style={inputStyle}
                  placeholder="your-store.myshopify.com"
                />
                <button className="focus-ring body-f" style={{ ...saveBtn, marginTop: 0 }}>
                  <Check size={14} /> Save
                </button>
              </div>
              <label className="body-f" style={labelStyle}>Connection status</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  className="body-f"
                  style={{
                    fontSize: 11.5, fontWeight: 600, color: C.textFaint, background: "transparent",
                    border: `1px solid ${C.borderLight}`, padding: "3px 9px", borderRadius: 20,
                  }}
                >
                  Not connected
                </span>
                <button
                  disabled
                  className="body-f"
                  style={{
                    background: "transparent", border: `1px solid ${C.borderLight}`, color: C.textFaint,
                    borderRadius: 8, padding: "7px 14px", fontSize: 12.5, cursor: "not-allowed",
                  }}
                >
                  Connect Shopify (coming soon)
                </button>
              </div>
            </div>

            {/* ERP connection */}
            <div style={cardStyle}>
              <div className="disp" style={{ color: C.textHi, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                ERP connection
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
                <div style={{ minWidth: 200 }}>
                  <label className="body-f" style={labelStyle}>ERP on server</label>
                  <select
                    value={erpType}
                    onChange={(e) => setErpType(e.target.value)}
                    className="focus-ring body-f"
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    {["SQL Server (Pastel/Sage/Syspro)", "MS Access (.accdb)", "SQLite", "Firebird", "MySQL", "PostgreSQL", "Other"].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div style={{ minWidth: 200 }}>
                  <label className="body-f" style={labelStyle}>DB username</label>
                  <input
                    value={dbUser}
                    onChange={(e) => setDbUser(e.target.value)}
                    className="focus-ring mono"
                    style={inputStyle}
                    placeholder="db_user"
                  />
                </div>
                <div style={{ minWidth: 200 }}>
                  <label className="body-f" style={labelStyle}>DB password</label>
                  <input
                    type="password"
                    value={dbPass}
                    onChange={(e) => setDbPass(e.target.value)}
                    className="focus-ring mono"
                    style={inputStyle}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button className="focus-ring body-f" style={saveBtn}>
                <Check size={14} /> Save connection
              </button>
            </div>

            {/* Supabase connection */}
            <div style={cardStyle}>
              <div className="disp" style={{ color: C.textHi, fontSize: 14, fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                <Database size={15} color={C.accent} /> Supabase connection
              </div>
              <p className="body-f" style={{ color: C.textFaint, fontSize: 12.5, margin: "0 0 14px 0" }}>
                Enter these into your local agent's config UI so it can push data to the cloud DB.
              </p>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ minWidth: 240 }}>
                  <label className="body-f" style={labelStyle}>Project URL</label>
                  <input
                    readOnly
                    value="https://bitsybridge.supabase.co"
                    className="focus-ring mono"
                    style={{ ...inputStyle, color: C.textLo }}
                  />
                </div>
                <div style={{ minWidth: 240 }}>
                  <label className="body-f" style={labelStyle}>Anon key</label>
                  <input
                    readOnly
                    type="password"
                    value="eyJhbGciOi_placeholder_key_8kq2"
                    className="focus-ring mono"
                    style={{ ...inputStyle, color: C.textLo }}
                  />
                </div>
                <div style={{ minWidth: 240 }}>
                  <label className="body-f" style={labelStyle}>Store API key (device token)</label>
                  <input
                    readOnly
                    type="password"
                    value="sbk_live_coastal_placeholder_7f1a"
                    className="focus-ring mono"
                    style={{ ...inputStyle, color: C.textLo }}
                  />
                </div>
              </div>
              <p className="body-f" style={{ color: C.textFaint, fontSize: 11.5, margin: "12px 0 0 0" }}>
                Lost or compromised? Contact us at enquiries@qkonbytes.com to have it regenerated.
              </p>
            </div>
          </>
        ) : (
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Lock size={14} color={C.textFaint} />
              <div className="disp" style={{ color: C.textHi, fontSize: 14, fontWeight: 600 }}>
                Shopify, ERP &amp; Supabase connection
              </div>
            </div>
            <p className="body-f" style={{ color: C.textFaint, fontSize: 12.5, margin: 0 }}>
              Only account admins can view or change store connection details. Ask your account admin, or contact us at enquiries@qkonbytes.com.
            </p>
          </div>
        )}

        {/* Support */}
        <div style={cardStyle}>
          <div className="disp" style={{ color: C.textHi, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
            Need help?
          </div>
          <p className="body-f" style={{ color: C.textFaint, fontSize: 12.5, margin: "0 0 14px 0" }}>
            Send us an enquiry and we'll get back to you.
          </p>
          <a
            href="mailto:enquiries@qkonbytes.com"
            className="focus-ring body-f"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none",
              background: C.accent, color: "#FFFFFF", borderRadius: 8, padding: "9px 16px",
              fontSize: 13, fontWeight: 600,
            }}
          >
            Email enquiries@qkonbytes.com
          </a>
        </div>

      </div>
    </div>
  );
}

// ---------- Customer: Sync history ----------
function ViewOnlyTag() {
  return (
    <span
      className="body-f"
      style={{
        fontSize: 11, fontWeight: 600, color: C.textFaint,
        border: `1px solid ${C.borderLight}`, borderRadius: 20, padding: "3px 9px",
      }}
    >
      View only
    </span>
  );
}

// ---------- Customer: Shopify (read-only, own store) ----------
function CustomerShopifyDB() {
  const store = MOCK_STORES[1];
  const rows = getShopifyRows(store.name);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <h1 className="disp" style={{ color: C.textHi, fontSize: 22, fontWeight: 700, margin: 0 }}>Shopify</h1>
          <p className="body-f" style={{ color: C.textLo, fontSize: 13, margin: "4px 0 0 0" }}>
            Last confirmed state of your Shopify products
          </p>
        </div>
        <ViewOnlyTag />
      </div>
      <div style={{ height: 18 }} />
      <DBTable
        columns={[
          { key: "sku", label: "SKU", width: "0.9fr" },
          { key: "name", label: "Product", width: "1.6fr" },
          { key: "qty", label: "Qty", width: "0.6fr" },
          { key: "price", label: "Price", width: "0.7fr", render: (r) => `R ${r.price.toFixed(2)}` },
          { key: "variantId", label: "Variant ID", width: "1.4fr" },
          { key: "lastConfirmed", label: "Confirmed", width: "0.8fr" },
        ]}
        rows={rows}
      />
    </div>
  );
}

// ---------- Customer: ERP (read-only, own store) ----------
function CustomerERPDB() {
  const store = MOCK_STORES[1];
  const [location, setLocation] = useState("Location 1");
  const rows = getErpRows(store.name).filter((r) => r.location === location);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <h1 className="disp" style={{ color: C.textHi, fontSize: 22, fontWeight: 700, margin: 0 }}>ERP</h1>
          <p className="body-f" style={{ color: C.textLo, fontSize: 13, margin: "4px 0 0 0" }}>
            Latest snapshot received from your local agent
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="focus-ring body-f"
            style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
              padding: "8px 12px", color: C.textHi, fontSize: 13, cursor: "pointer",
            }}
          >
            {ERP_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{LOCATION_LABEL(loc)}</option>
            ))}
          </select>
          <ViewOnlyTag />
        </div>
      </div>
      <div style={{ height: 18 }} />
      <DBTable
        columns={[
          { key: "sku", label: "SKU", width: "0.9fr" },
          { key: "name", label: "Product", width: "1.6fr" },
          { key: "qty", label: "Qty", width: "0.6fr" },
          { key: "price", label: "Price", width: "0.7fr", render: (r) => `R ${r.price.toFixed(2)}` },
          { key: "location", label: "Location", width: "1fr", render: (r) => LOCATION_LABEL(r.location) },
          { key: "lastReceived", label: "Received", width: "0.8fr" },
        ]}
        rows={rows}
      />
    </div>
  );
}

// ---------- Customer: Not Matched (read-only, own store) ----------
function CustomerNotMatched() {
  const store = MOCK_STORES[1];
  const rows = getNotMatchedRows(store.name);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <h1 className="disp" style={{ color: C.textHi, fontSize: 22, fontWeight: 700, margin: 0 }}>Not Matched</h1>
          <p className="body-f" style={{ color: C.textLo, fontSize: 13, margin: "4px 0 0 0" }}>
            Part numbers in your ERP with no matching product in Shopify
          </p>
        </div>
        <ViewOnlyTag />
      </div>
      <div style={{ height: 18 }} />
      {rows.length === 0 ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
          <p className="body-f" style={{ color: C.textFaint, fontSize: 13, margin: 0 }}>
            Nothing here — every ERP part number currently matches a Shopify product.
          </p>
        </div>
      ) : (
        <>
          <p className="body-f" style={{ color: C.textFaint, fontSize: 12, margin: "0 0 12px 0" }}>
            These aren't synced — bitsy_bridge never creates new Shopify products. Add the product in Shopify with a matching SKU, or contact us at enquiries@qkonbytes.com.
          </p>
          <DBTable
            columns={[
              { key: "sku", label: "Part number", width: "0.9fr" },
              { key: "name", label: "Product", width: "1.6fr" },
              { key: "location", label: "Location", width: "1fr", render: (r) => LOCATION_LABEL(r.location) },
              { key: "qty", label: "Qty", width: "0.6fr" },
              { key: "price", label: "Price", width: "0.7fr", render: (r) => `R ${r.price.toFixed(2)}` },
              { key: "lastReceived", label: "Last seen", width: "0.8fr" },
            ]}
            rows={rows}
          />
        </>
      )}
    </div>
  );
}

function buildHistoryTxt(run) {
  const lines = [
    `Sync run — ${run.time}`,
    `Status: ${run.status === "success" ? "Success" : "Failed"}`,
    `Duration: ${run.duration}`,
    `Items changed: ${run.items.length}`,
    "",
    "SKU        FIELD    OLD          NEW",
    "----------------------------------------",
  ];
  run.items.forEach((it) => {
    lines.push(`${it.sku.padEnd(10)} ${it.field.padEnd(8)} ${String(it.oldVal).padEnd(12)} ${it.newVal}`);
  });
  if (run.items.length === 0) lines.push("(no changes on this run)");
  return lines.join("\n");
}

function downloadTxt(filename, text) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function SyncItemsModal({ run, onClose }) {
  if (!run) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
          width: 520, maxHeight: "70vh", display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <div>
            <div className="disp" style={{ color: C.textHi, fontSize: 15, fontWeight: 600 }}>Synced items</div>
            <div className="mono" style={{ color: C.textFaint, fontSize: 11.5, marginTop: 2 }}>
              Run at {run.time} · {run.items.length} changed
            </div>
          </div>
          <button
            onClick={onClose}
            className="focus-ring"
            style={{ background: "transparent", border: "none", color: C.textFaint, cursor: "pointer", padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>
          {run.items.length === 0 ? (
            <div className="body-f" style={{ padding: "28px 20px", color: C.textFaint, fontSize: 13 }}>
              No items changed on this run.
            </div>
          ) : (
            <>
              <div
                className="body-f"
                style={{
                  display: "grid", gridTemplateColumns: "1.1fr 0.8fr 1fr 1fr", padding: "9px 20px",
                  borderBottom: `1px solid ${C.border}`, fontSize: 11, color: C.textFaint, fontWeight: 600,
                }}
              >
                <span>SKU</span><span>Field</span><span>Old</span><span>New</span>
              </div>
              {run.items.map((it, i) => (
                <div
                  key={i}
                  className="mono"
                  style={{
                    display: "grid", gridTemplateColumns: "1.1fr 0.8fr 1fr 1fr", padding: "10px 20px",
                    borderBottom: i < run.items.length - 1 ? `1px solid ${C.border}` : "none",
                    fontSize: 12.5, color: C.textHi,
                  }}
                >
                  <span>{it.sku}</span>
                  <span style={{ color: C.textFaint }}>{it.field}</span>
                  <span style={{ color: C.textFaint }}>{it.oldVal}</span>
                  <span>{it.newVal}</span>
                </div>
              ))}
            </>
          )}
        </div>
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={() => downloadTxt(`sync_${run.time.replace(/:/g, "-")}.txt`, buildHistoryTxt(run))}
            className="focus-ring body-f"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: C.accent, color: "#FFFFFF", border: "none",
              borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            <Download size={14} /> Download as .txt
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomerHistory({ storeName = "Coastal Supply Co." }) {
  const [openRun, setOpenRun] = useState(null);

  return (
    <div>
      <h1 className="disp" style={{ color: C.textHi, fontSize: 22, fontWeight: 700, margin: "0 0 4px 0" }}>
        Sync History
      </h1>
      <p className="body-f" style={{ color: C.textLo, fontSize: 13, margin: "0 0 20px 0" }}>
        {storeName} · last 5 runs
      </p>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        <div
          className="body-f"
          style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1.3fr", padding: "10px 18px",
            borderBottom: `1px solid ${C.border}`, fontSize: 11.5, color: C.textFaint, fontWeight: 600,
          }}
        >
          <span>Time</span><span>Changed</span><span>Status</span><span>Duration</span><span>Items</span>
        </div>
        {MOCK_HISTORY.map((h, i) => (
          <div
            key={i}
            className="mono"
            style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1.3fr", padding: "12px 18px",
              borderBottom: i < MOCK_HISTORY.length - 1 ? `1px solid ${C.border}` : "none",
              fontSize: 12.5, color: C.textHi, alignItems: "center",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={12} color={C.textFaint} /> {h.time}
            </span>
            <span>{h.changed} SKUs</span>
            <span>
              {h.status === "success" ? (
                <span style={{ color: C.success, display: "flex", alignItems: "center", gap: 5 }}>
                  <Check size={13} /> Success
                </span>
              ) : (
                <span style={{ color: C.error, display: "flex", alignItems: "center", gap: 5 }}>
                  <X size={13} /> Failed
                </span>
              )}
            </span>
            <span style={{ color: C.textFaint }}>{h.duration}</span>
            <span style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setOpenRun(h)}
                disabled={h.items.length === 0}
                className="focus-ring body-f"
                style={{
                  background: "transparent", border: `1px solid ${C.borderLight}`,
                  color: h.items.length === 0 ? C.textFaint : C.textHi,
                  borderRadius: 6, padding: "5px 10px", fontSize: 11.5,
                  cursor: h.items.length === 0 ? "default" : "pointer",
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                <Eye size={12} /> View
              </button>
              <button
                onClick={() => downloadTxt(`sync_${h.time.replace(/:/g, "-")}.txt`, buildHistoryTxt(h))}
                disabled={h.items.length === 0}
                className="focus-ring body-f"
                style={{
                  background: "transparent", border: `1px solid ${C.borderLight}`,
                  color: h.items.length === 0 ? C.textFaint : C.textHi,
                  borderRadius: 6, padding: "5px 10px", fontSize: 11.5,
                  cursor: h.items.length === 0 ? "default" : "pointer",
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                <Download size={12} /> .txt
              </button>
            </span>
          </div>
        ))}
      </div>
      <SyncItemsModal run={openRun} onClose={() => setOpenRun(null)} />
    </div>
  );
}

// ---------- App ----------
export default function BitsyBridgeDashboard() {
  const [role, setRole] = useState("customer");
  const [clientRole, setClientRole] = useState("admin"); // this client account's own user role: admin | staff
  const [adminActive, setAdminActive] = useState("stores");
  const [customerActive, setCustomerActive] = useState("dashboard");
  const [selectedStore, setSelectedStore] = useState(null);
  const [customerPreview, setCustomerPreview] = useState(false); // bypass real customer login until a client project exists

  const active = role === "admin" ? adminActive : customerActive;
  const setActive = (key) => {
    if (role === "admin") {
      if (key === "stores") setSelectedStore(null); // nav click always returns to the list
      setAdminActive(key);
    } else {
      setCustomerActive(key);
    }
  };

  const renderMain = () => {
    if (role === "admin") {
      if (active === "stores") {
        return selectedStore
          ? <StoreDetail store={selectedStore} onBack={() => setSelectedStore(null)} />
          : <AdminStores onManage={(s) => setSelectedStore(s)} />;
      }
      if (active === "settings") return <AdminGlobalSettings />;
    } else {
      if (active === "dashboard") return <CustomerDashboard />;
      if (active === "shopifydb") return <CustomerShopifyDB />;
      if (active === "erpdb") return <CustomerERPDB />;
      if (active === "notmatched") return <CustomerNotMatched />;
      if (active === "history") return <CustomerHistory />;
      if (active === "settings") return <CustomerSettings clientRole={clientRole} />;
    }
    return null;
  };

  if (role === "admin") {
    return (
      <AdminAuthGate onSwitchToCustomer={() => setRole("customer")}>
        {(handleSignOut, session) => (
          <div style={{ background: C.bg, minHeight: "100vh", display: "flex" }}>
            <style>{FONTS}</style>
            <Sidebar role={role} active={active} setActive={setActive} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 28px", borderBottom: `1px solid ${C.border}`, gap: 18,
                }}
              >
                <span className="mono" style={{ fontSize: 12, color: C.textFaint }}>{session?.user?.email}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span className="body-f" style={{ fontSize: 12, color: C.textFaint }}>Preview as</span>
                  <div style={{ display: "flex", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 3 }}>
                    {["customer", "admin"].map((r) => (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className="focus-ring body-f"
                        style={{
                          border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12.5, fontWeight: 600,
                          cursor: "pointer", textTransform: "capitalize",
                          background: role === r ? C.accent : "transparent",
                          color: role === r ? "#FFFFFF" : C.textLo,
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="focus-ring body-f"
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: "transparent", border: `1px solid ${C.borderLight}`, color: C.textHi,
                      borderRadius: 8, padding: "6px 12px", fontSize: 12.5, cursor: "pointer",
                    }}
                  >
                    <LogOut size={13} /> Sign out
                  </button>
                </div>
              </div>
              <div style={{ padding: 28, flex: 1, overflow: "auto" }}>
                {renderMain()}
              </div>
            </div>
          </div>
        )}
      </AdminAuthGate>
    );
  }

  const customerShell = () => (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex" }}>
      <style>{FONTS}</style>
      <Sidebar role={role} active={active} setActive={setActive} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "flex-end",
            padding: "14px 28px", borderBottom: `1px solid ${C.border}`, gap: 18,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="body-f" style={{ fontSize: 12, color: C.textFaint }}>Client user role</span>
            <div style={{ display: "flex", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 3 }}>
              {["admin", "staff"].map((r) => (
                <button
                  key={r}
                  onClick={() => setClientRole(r)}
                  className="focus-ring body-f"
                  style={{
                    border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12.5, fontWeight: 600,
                    cursor: "pointer", textTransform: "capitalize",
                    background: clientRole === r ? C.accent : "transparent",
                    color: clientRole === r ? "#FFFFFF" : C.textLo,
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <span className="body-f" style={{ fontSize: 12, color: C.textFaint }}>Preview as</span>
          <div style={{ display: "flex", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 3 }}>
            {["customer", "admin"].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className="focus-ring body-f"
                style={{
                  border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12.5, fontWeight: 600,
                  cursor: "pointer", textTransform: "capitalize",
                  background: role === r ? C.accent : "transparent",
                  color: role === r ? "#FFFFFF" : C.textLo,
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: 28, flex: 1, overflow: "auto" }}>
          {renderMain()}
        </div>
      </div>
    </div>
  );

  if (customerPreview) return customerShell();

  return (
    <CustomerAuthGate onPreview={() => setCustomerPreview(true)}>
      {(handleSignOut, session, resolved) => customerShell()}
    </CustomerAuthGate>
  );
}
