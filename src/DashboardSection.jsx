import React, { useState } from "react";
import {
  LayoutGrid, ShoppingBag, Search, Activity, FileText, DollarSign,
  ArrowUp, ArrowDown, ArrowLeft, LogOut,
} from "lucide-react";

// ============================================================
// Bitsy — Dashboard section
// ============================================================
// The analytics half of Bitsy. Kept in its own file because it has its own
// visual language (lime accent, near-black surfaces) and its own navigation,
// separate from the Bridge section.
//
// IMPORTANT: every figure below is sample data, so the layout can be reviewed
// before the platform integrations exist. The header carries a visible
// "Sample data" marker so nothing here is ever mistaken for a real figure.
// Replace SAMPLE with reads from the client's own project once the Meta,
// Google and Shopify syncs are built.

const D = {
  bg: "#0A0B0A",
  surface: "#121412",
  surfaceAlt: "#171A17",
  border: "#232723",
  borderLight: "#2E332E",
  textHi: "#F2F4F0",
  textLo: "#9AA296",
  textFaint: "#636B61",
  accent: "#C6F24E",
  accentDim: "rgba(198,242,78,0.12)",
  up: "#4ADE80",
  upDim: "rgba(74,222,128,0.12)",
  down: "#F87171",
  downDim: "rgba(248,113,113,0.12)",
  shopify: "#C6F24E",
  google: "#5B9DF9",
  meta: "#F0569B",
};

const FONTS_D = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
* { box-sizing: border-box; }
.disp { font-family: 'Space Grotesk', sans-serif; }
.body-f { font-family: 'Inter', sans-serif; }
.mono { font-family: 'JetBrains Mono', monospace; }
.focus-ring:focus-visible { outline: 2px solid ${D.accent}; outline-offset: 2px; }
`;

// South African rand, matching the design's "R 142 850,00" format.
const money = (n) =>
  "R " + n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .replace(/,/g, " ")
    .replace(/\.(\d{2})$/, ",$1");
const num = (n) => n.toLocaleString("en-ZA").replace(/,/g, " ");

// ---------- sample data ----------
const SAMPLE = {
  period: "May 2025",
  overview: {
    revenue: 142850, adSpend: 18420, roas: 7.76, orders: 1284,
    deltas: { revenue: 12.4, adSpend: 4.2, roas: 7.9, orders: 9.1 },
    series: [
      { label: "Wk 1", shopify: 28000, google: 3800, meta: 3200 },
      { label: "Wk 2", shopify: 31500, google: 4200, meta: 3600 },
      { label: "Wk 3", shopify: 34800, google: 4600, meta: 4100 },
      { label: "Wk 4", shopify: 48550, google: 5100, meta: 4400 },
    ],
    channels: [
      { label: "Shopify direct", value: 86400, color: D.shopify },
      { label: "Google Ads", value: 34200, color: D.google },
      { label: "Meta Ads", value: 22250, color: D.meta },
    ],
  },
  google: {
    kpis: [
      ["Spend", money(9840), 5.1], ["ROAS", "5.32x", 8.4],
      ["Impressions", num(842100), 11.2], ["Clicks", num(18420), 9.8],
      ["CTR", "2.19%", 0.3], ["Conversions", num(621), 14.2], ["CPA", money(15.85), -3.2],
    ],
    campaigns: [
      ["Brand Search", "Active", 1840, 124000, 6210, "5.01%", 198, 9.29, "8.42x"],
      ["Shopping — All Products", "Active", 3420, 412000, 7840, "1.90%", 241, 14.19, "5.81x"],
      ["Performance Max", "Active", 2880, 218000, 3240, "1.49%", 142, 20.28, "4.12x"],
      ["Retargeting — Display", "Paused", 1700, 88100, 1130, "1.28%", 40, 42.50, "2.04x"],
    ],
  },
  meta: {
    kpis: [
      ["Spend", money(8580), 3.2], ["ROAS", "4.80x", 6.1],
      ["Impressions", num(1240000), 14.8], ["Clicks", num(22140), 8.3],
      ["CTR", "1.79%", -0.1], ["Conversions", num(584), 10.4], ["CPA", money(14.69), -2.8],
    ],
    campaigns: [
      ["Prospecting — Broad", "Conversions", "Active", 2840, 520000, 9120, "1.75%", 198, 14.34, "5.12x"],
      ["Retargeting — Website Visitors", "Conversions", "Active", 1920, 184000, 6840, "3.72%", 241, 7.97, "7.84x"],
      ["Lookalike — Purchasers 1%", "Conversions", "Active", 2100, 312000, 4280, "1.37%", 104, 20.19, "4.21x"],
      ["Catalogue — Dynamic", "Sales", "Paused", 1720, 224000, 1900, "0.85%", 41, 41.95, "1.98x"],
    ],
  },
  shopify: {
    kpis: [
      ["Revenue", money(142850), 12.4], ["Orders", num(1284), 9.1],
      ["Average order value", money(111.25), 3.0], ["Units sold", num(3140), 7.4],
      ["Returning customers", "28.4%", 1.9], ["Conversion rate", "2.84%", 0.4],
    ],
    products: [
      ["Marine Rope 10mm (50m)", "CST-0021", 184, 112240],
      ["Deck Cleat 150mm", "CST-0071", 162, 23490],
      ["Anchor Chain 6mm (per m)", "CST-0044", 980, 93100],
      ["Marine Rope 12mm (50m)", "CST-0022", 96, 74880],
    ],
  },
  invoices: {
    outstanding: 8420, overdue: 2100, paidThisMonth: 6800,
    rows: [
      ["INV-00041", "Retainer — May 2025", "2025-05-01", "2025-06-01", 4200, "Sent"],
      ["INV-00040", "Google Ads Management — May 2025", "2025-05-01", "2025-06-01", 2220, "Sent"],
      ["INV-00038", "Meta Ads Management — April 2025", "2025-04-01", "2025-05-01", 2100, "Overdue"],
      ["INV-00036", "Retainer — April 2025", "2025-04-01", "2025-04-28", 4200, "Paid"],
      ["INV-00034", "Google Ads Management — April", "2025-04-01", "2025-04-28", 2600, "Paid"],
      ["INV-00031", "Retainer — March 2025", "2025-03-01", "2025-03-29", 4200, "Paid"],
      ["INV-00029", "Meta Ads Management — March", "2025-03-01", "2025-03-29", 1980, "Paid"],
    ],
  },
};

// ---------- shared pieces ----------
function Delta({ value }) {
  if (value == null) return null;
  const up = value >= 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span
      className="body-f"
      style={{
        display: "inline-flex", alignItems: "center", gap: 3,
        fontSize: 11, fontWeight: 600,
        color: up ? D.up : D.down,
        background: up ? D.upDim : D.downDim,
        padding: "2px 7px", borderRadius: 20,
      }}
    >
      <Icon size={10} /> {Math.abs(value)}%
    </span>
  );
}

function Kpi({ label, value, delta, flex = 1 }) {
  return (
    <div
      style={{
        flex, minWidth: 180, background: D.surface,
        border: `1px solid ${D.border}`, borderRadius: 12, padding: "18px 20px",
      }}
    >
      <div className="body-f" style={{
        color: D.textFaint, fontSize: 10.5, letterSpacing: "0.07em",
        textTransform: "uppercase", marginBottom: 10,
      }}>
        {label}
      </div>
      <div className="disp" style={{ color: D.textHi, fontSize: 26, fontWeight: 700, marginBottom: 10 }}>
        {value}
      </div>
      <Delta value={delta} />
    </div>
  );
}

function Panel({ title, children, style }) {
  return (
    <div style={{
      background: D.surface, border: `1px solid ${D.border}`,
      borderRadius: 12, padding: 20, ...style,
    }}>
      {title && (
        <div className="disp" style={{ color: D.textHi, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    Active: [D.up, D.upDim], Paused: [D.textFaint, "rgba(255,255,255,0.05)"],
    Paid: [D.up, D.upDim], Sent: [D.google, "rgba(91,157,249,0.14)"],
    Overdue: [D.down, D.downDim],
  };
  const [fg, bg] = map[status] || [D.textFaint, "transparent"];
  return (
    <span className="body-f" style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
      color: fg, background: bg, padding: "3px 8px", borderRadius: 5,
    }}>
      {status}
    </span>
  );
}

function DataTable({ columns, rows }) {
  const grid = columns.map((c) => c.width || "1fr").join(" ");
  return (
    <div>
      <div className="body-f" style={{
        display: "grid", gridTemplateColumns: grid, padding: "0 0 10px 0",
        borderBottom: `1px solid ${D.border}`, fontSize: 10.5, color: D.textFaint,
        fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
      }}>
        {columns.map((c) => (
          <span key={c.key} style={{ textAlign: c.align || "left" }}>{c.label}</span>
        ))}
      </div>
      {rows.map((r, i) => (
        <div key={i} className="body-f" style={{
          display: "grid", gridTemplateColumns: grid, alignItems: "center",
          padding: "13px 0", fontSize: 12.5, color: D.textLo,
          borderBottom: i < rows.length - 1 ? `1px solid ${D.border}` : "none",
        }}>
          {columns.map((c) => (
            <span key={c.key} style={{ textAlign: c.align || "left" }}>{c.render(r)}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

// Hand-drawn SVG so the dashboard needs no charting dependency.
function StackedLineChart({ series, height = 240 }) {
  const keys = [["shopify", D.shopify], ["google", D.google], ["meta", D.meta]];
  const w = 100, h = 100; // viewBox units; the SVG scales to its container
  const max = Math.max(...series.flatMap((p) => keys.map(([k]) => p[k]))) * 1.15;
  const x = (i) => (i / (series.length - 1)) * w;
  const y = (v) => h - (v / max) * h;

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: 18, marginBottom: 14 }}>
        {keys.map(([k, color]) => (
          <span key={k} className="body-f" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 11.5, color: D.textLo, textTransform: "capitalize",
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
            {k}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"
           style={{ width: "100%", height, display: "block" }}>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={0} y1={h * g} x2={w} y2={h * g}
                stroke={D.border} strokeWidth={0.4} vectorEffect="non-scaling-stroke" />
        ))}
        {keys.map(([k, color]) => (
          <polyline
            key={k}
            points={series.map((p, i) => `${x(i)},${y(p[k])}`).join(" ")}
            fill="none" stroke={color} strokeWidth={2}
            vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round"
          />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        {series.map((p) => (
          <span key={p.label} className="body-f" style={{ fontSize: 10.5, color: D.textFaint }}>
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ data, size = 170 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 42, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
        <g transform="rotate(-90 50 50)">
          {data.map((d) => {
            const len = (d.value / total) * circ;
            const el = (
              <circle
                key={d.label} cx="50" cy="50" r={r} fill="none"
                stroke={d.color} strokeWidth="13"
                strokeDasharray={`${len} ${circ - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </g>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 140 }}>
        {data.map((d) => (
          <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
            <span className="body-f" style={{ fontSize: 12, color: D.textLo, flex: 1 }}>{d.label}</span>
            <span className="mono" style={{ fontSize: 12, color: D.textHi }}>
              {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- pages ----------
function OverviewPage() {
  const o = SAMPLE.overview;
  return (
    <div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        <Kpi label="Total revenue" value={money(o.revenue)} delta={o.deltas.revenue} />
        <Kpi label="Ad spend" value={money(o.adSpend)} delta={o.deltas.adSpend} />
        <Kpi label="Blended ROAS" value={`${o.roas}x`} delta={o.deltas.roas} />
        <Kpi label="Orders" value={num(o.orders)} delta={o.deltas.orders} />
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "stretch" }}>
        <Panel title="Revenue over time" style={{ flex: 2, minWidth: 420 }}>
          <StackedLineChart series={o.series} />
        </Panel>
        <Panel title="Channel breakdown" style={{ flex: 1, minWidth: 280 }}>
          <DonutChart data={o.channels} />
        </Panel>
      </div>
    </div>
  );
}

function ShopifyPage() {
  const s = SAMPLE.shopify;
  return (
    <div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        {s.kpis.map(([label, value, delta]) => (
          <Kpi key={label} label={label} value={value} delta={delta} />
        ))}
      </div>
      <Panel title="Top products">
        <DataTable
          columns={[
            { key: "name", label: "Product", width: "2fr", render: (r) => (
                <span style={{ color: D.textHi }}>{r[0]}</span>) },
            { key: "sku", label: "SKU", width: "1fr", render: (r) => (
                <span className="mono" style={{ fontSize: 11.5 }}>{r[1]}</span>) },
            { key: "units", label: "Units", width: "0.7fr", align: "right", render: (r) => num(r[2]) },
            { key: "rev", label: "Revenue", width: "1fr", align: "right", render: (r) => (
                <span style={{ color: D.textHi }}>{money(r[3])}</span>) },
          ]}
          rows={s.products}
        />
      </Panel>
    </div>
  );
}

function AdsPage({ data, hasObjective }) {
  const campaignCols = [
    { key: "name", label: "Campaign", width: "1.8fr", render: (r) => (
        <span style={{ color: D.textHi }}>{r[0]}</span>) },
    ...(hasObjective ? [{ key: "obj", label: "Objective", width: "1fr", render: (r) => r[1] }] : []),
    { key: "status", label: "Status", width: "0.8fr", render: (r) => (
        <StatusPill status={r[hasObjective ? 2 : 1]} />) },
    { key: "spend", label: "Spend", width: "0.9fr", align: "right",
      render: (r) => money(r[hasObjective ? 3 : 2]) },
    { key: "impr", label: "Impressions", width: "1fr", align: "right",
      render: (r) => num(r[hasObjective ? 4 : 3]) },
    { key: "clicks", label: "Clicks", width: "0.8fr", align: "right",
      render: (r) => num(r[hasObjective ? 5 : 4]) },
    { key: "ctr", label: "CTR", width: "0.6fr", align: "right",
      render: (r) => r[hasObjective ? 6 : 5] },
    { key: "conv", label: "Conv.", width: "0.6fr", align: "right",
      render: (r) => num(r[hasObjective ? 7 : 6]) },
    { key: "cpa", label: "CPA", width: "0.8fr", align: "right",
      render: (r) => money(r[hasObjective ? 8 : 7]) },
    { key: "roas", label: "ROAS", width: "0.7fr", align: "right", render: (r) => (
        <span style={{ color: D.textHi }}>{r[hasObjective ? 9 : 8]}</span>) },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        {data.kpis.map(([label, value, delta]) => (
          <Kpi key={label} label={label} value={value} delta={delta} />
        ))}
      </div>
      <Panel title="Spend vs revenue" style={{ marginBottom: 14 }}>
        <StackedLineChart series={SAMPLE.overview.series} height={200} />
      </Panel>
      <Panel title="Campaigns">
        <DataTable columns={campaignCols} rows={data.campaigns} />
      </Panel>
    </div>
  );
}

function InvoicesPage() {
  const inv = SAMPLE.invoices;
  return (
    <div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        <Kpi label="Outstanding" value={money(inv.outstanding)} />
        <div style={{
          flex: 1, minWidth: 180, background: D.surface,
          border: `1px solid ${D.border}`, borderRadius: 12, padding: "18px 20px",
        }}>
          <div className="body-f" style={{
            color: D.textFaint, fontSize: 10.5, letterSpacing: "0.07em",
            textTransform: "uppercase", marginBottom: 10,
          }}>Overdue</div>
          <div className="disp" style={{ color: D.down, fontSize: 26, fontWeight: 700 }}>
            {money(inv.overdue)}
          </div>
        </div>
        <div style={{
          flex: 1, minWidth: 180, background: D.surface,
          border: `1px solid ${D.border}`, borderRadius: 12, padding: "18px 20px",
        }}>
          <div className="body-f" style={{
            color: D.textFaint, fontSize: 10.5, letterSpacing: "0.07em",
            textTransform: "uppercase", marginBottom: 10,
          }}>Paid this month</div>
          <div className="disp" style={{ color: D.up, fontSize: 26, fontWeight: 700 }}>
            {money(inv.paidThisMonth)}
          </div>
        </div>
      </div>
      <Panel title="Invoice history">
        <DataTable
          columns={[
            { key: "no", label: "Invoice", width: "0.9fr", render: (r) => (
                <span className="body-f" style={{ color: D.accent, fontWeight: 600 }}>{r[0]}</span>) },
            { key: "desc", label: "Description", width: "2.2fr", render: (r) => (
                <span style={{ color: D.textHi }}>{r[1]}</span>) },
            { key: "date", label: "Date", width: "1fr", render: (r) => (
                <span className="mono" style={{ fontSize: 11.5 }}>{r[2]}</span>) },
            { key: "due", label: "Due / paid", width: "1fr", render: (r) => (
                <span className="mono" style={{ fontSize: 11.5 }}>{r[3]}</span>) },
            { key: "amt", label: "Amount", width: "1fr", align: "right", render: (r) => (
                <span style={{ color: D.textHi }}>{money(r[4])}</span>) },
            { key: "status", label: "Status", width: "0.8fr", render: (r) => <StatusPill status={r[5]} /> },
          ]}
          rows={inv.rows}
        />
      </Panel>
    </div>
  );
}

function RevSharePage() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "90px 20px", textAlign: "center",
    }}>
      <div style={{
        width: 62, height: 62, borderRadius: 16, background: D.accentDim,
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
      }}>
        <DollarSign size={28} color={D.accent} />
      </div>
      <div className="disp" style={{ color: D.textHi, fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
        Rev Share
      </div>
      <p className="body-f" style={{ color: D.textLo, fontSize: 13.5, maxWidth: 380, lineHeight: 1.6, margin: 0 }}>
        Rev share reporting is being configured for your account. Your account manager
        will be in touch shortly.
      </p>
    </div>
  );
}

// ---------- shell ----------
export default function DashboardSection({
  clientName = "Client",
  email = "",
  onSignOut,
  onBackToChooser,
}) {
  const [active, setActive] = useState("overview");

  const nav = [
    { key: "overview", label: "Overview", icon: LayoutGrid },
    { key: "shopify", label: "Shopify", icon: ShoppingBag },
    { key: "google", label: "Google", icon: Search },
    { key: "meta", label: "Meta", icon: Activity },
    { key: "invoices", label: "Invoices", icon: FileText },
    { key: "revshare", label: "Rev Share", icon: DollarSign },
  ];

  const titles = {
    overview: "Overview", shopify: "Shopify", google: "Google Ads",
    meta: "Meta Ads", invoices: "Invoices", revshare: "Rev Share",
  };

  const renderPage = () => {
    if (active === "overview") return <OverviewPage />;
    if (active === "shopify") return <ShopifyPage />;
    if (active === "google") return <AdsPage data={SAMPLE.google} hasObjective={false} />;
    if (active === "meta") return <AdsPage data={SAMPLE.meta} hasObjective />;
    if (active === "invoices") return <InvoicesPage />;
    if (active === "revshare") return <RevSharePage />;
    return null;
  };

  return (
    <div style={{ background: D.bg, minHeight: "100vh", display: "flex" }}>
      <style>{FONTS_D}</style>

      {/* sidebar */}
      <div style={{
        width: 212, flexShrink: 0, background: D.surfaceAlt,
        borderRight: `1px solid ${D.border}`, display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "22px 20px 18px 20px" }}>
          <span className="disp" style={{ color: D.textHi, fontSize: 21, fontWeight: 700, letterSpacing: "-0.02em" }}>
            bitsy<span style={{ color: D.accent }}>.</span>
          </span>
        </div>

        <div className="body-f" style={{
          color: D.textFaint, fontSize: 9.5, letterSpacing: "0.12em",
          textTransform: "uppercase", padding: "0 20px 8px 20px",
        }}>
          Menu
        </div>

        <nav style={{ display: "flex", flexDirection: "column" }}>
          {nav.map((item) => {
            const Icon = item.icon;
            const on = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                className="focus-ring body-f"
                style={{
                  display: "flex", alignItems: "center", gap: 11,
                  padding: "11px 20px", border: "none", cursor: "pointer",
                  textAlign: "left", fontSize: 13.5, fontWeight: on ? 600 : 500,
                  background: on ? D.accentDim : "transparent",
                  color: on ? D.accent : D.textLo,
                  borderLeft: `2px solid ${on ? D.accent : "transparent"}`,
                }}
              >
                <Icon size={16} /> {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", padding: 20, borderTop: `1px solid ${D.border}` }}>
          <div className="body-f" style={{ color: D.textHi, fontSize: 12.5, fontWeight: 600 }}>
            {clientName}
          </div>
          <div className="body-f" style={{ color: D.textFaint, fontSize: 11, marginBottom: 12, wordBreak: "break-all" }}>
            {email}
          </div>
          {onBackToChooser && (
            <button
              onClick={onBackToChooser}
              className="focus-ring body-f"
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 7,
                background: "transparent", border: `1px solid ${D.borderLight}`,
                color: D.textLo, borderRadius: 8, padding: "7px 10px",
                fontSize: 12, cursor: "pointer", marginBottom: 8,
              }}
            >
              <ArrowLeft size={13} /> Switch section
            </button>
          )}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="focus-ring body-f"
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 7,
                background: "transparent", border: `1px solid ${D.borderLight}`,
                color: D.textLo, borderRadius: 8, padding: "7px 10px",
                fontSize: 12, cursor: "pointer",
              }}
            >
              <LogOut size={13} /> Sign out
            </button>
          )}
        </div>
      </div>

      {/* main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 28px", borderBottom: `1px solid ${D.border}`, gap: 16,
        }}>
          <span className="disp" style={{ color: D.textHi, fontSize: 16, fontWeight: 700 }}>
            {titles[active]}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Visible while the figures are placeholders, so nothing here is
                mistaken for real reporting. Remove once data is connected. */}
            <span className="body-f" style={{
              fontSize: 10.5, fontWeight: 600, color: D.down,
              background: D.downDim, padding: "4px 10px", borderRadius: 20,
            }}>
              Sample data
            </span>
            <span className="body-f" style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              fontSize: 12, color: D.textLo, background: D.surface,
              border: `1px solid ${D.border}`, padding: "5px 12px", borderRadius: 20,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: D.accent }} />
              {SAMPLE.period}
            </span>
          </div>
        </div>

        <div style={{ padding: 24, flex: 1, overflow: "auto" }}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
