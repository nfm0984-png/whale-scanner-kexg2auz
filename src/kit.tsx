import React, { useState } from "react";
export { useState, useEffect, useMemo, useRef, useCallback, useReducer, Fragment } from "react";
export type ReactNode = React.ReactNode;
const BRAND = "#6D28D9";
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Inter, "Helvetica Neue", Arial, sans-serif';
const theme = {
  bg: { base: "#FFFFFF", subtle: "#F3F3F7", elevated: "#FFFFFF" },
  text: { primary: "#0F0F14", secondary: "#4B4B57", tertiary: "#85858F", accent: BRAND, onColor: "#FFFFFF", onPrimary: "#FFFFFF", success: "#16A34A", warning: "#D97706", danger: "#DC2626" },
  border: { subtle: "#EEEEF2", weak: "#E6E6EC", default: "#DCDCE3", strong: "#A1A1AA", focus: BRAND },
  font: { family: FONT, mono: "ui-monospace, SFMono-Regular, Menlo, monospace", label: {} },
  dataviz: { categorical: [BRAND, "#0891B2", "#DB2777", "#16A34A", "#EA580C"] },
};
export const useGrokTheme = () => theme;
const TONE: Record<string, [string, string]> = { success: ["#DCFCE7", "#166534"], warning: ["#FEF3C7", "#92400E"], danger: ["#FEE2E2", "#991B1B"], info: ["#E0F2FE", "#075985"] };

export function Page(p: { title?: string; summary?: string; children?: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "68px 12px 48px", fontFamily: FONT, color: theme.text.primary }}>
      {p.title ? <h1 style={{ fontSize: 22, lineHeight: "28px", margin: "6px 2px 4px", fontWeight: 800, letterSpacing: "-0.01em" }}>{p.title}</h1> : null}
      {p.summary ? <p style={{ fontSize: 13, lineHeight: "18px", color: theme.text.tertiary, margin: "0 2px 12px" }}>{p.summary}</p> : null}
      {p.children}
    </div>
  );
}
export function Floating(p: { edge?: string; align?: string; bar?: boolean; children?: React.ReactNode }) {
  return <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "center", background: "#FFFFFF" }}><div style={{ width: "100%", maxWidth: 760 }}>{p.children}</div></div>;
}
export function Section(p: { heading?: string; caption?: string; collapsible?: boolean; defaultOpen?: boolean; children?: React.ReactNode }) {
  const [open, setOpen] = useState<boolean>(p.collapsible ? !!p.defaultOpen : true);
  const head = p.heading ? (
    <div onClick={p.collapsible ? () => setOpen(!open) : undefined} role={p.collapsible ? "button" : undefined}
      style={{ display: "flex", alignItems: "center", gap: 10, cursor: p.collapsible ? "pointer" : "default", userSelect: "none", padding: p.collapsible ? "12px 14px" : "0 2px", borderRadius: 16, background: p.collapsible ? theme.bg.subtle : "transparent" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: p.collapsible ? 16 : 20, fontWeight: 800, lineHeight: p.collapsible ? "22px" : "26px" }}>{p.heading}</div>
        {p.caption ? <div style={{ fontSize: 12.5, lineHeight: "17px", color: theme.text.tertiary, marginTop: 2 }}>{p.caption}</div> : null}
      </div>
      {p.collapsible ? <span aria-hidden style={{ fontSize: 14, color: theme.text.tertiary, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>▼</span> : null}
    </div>
  ) : null;
  return (
    <section style={{ margin: "16px 0" }}>
      {head}
      {open ? <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: p.heading ? 10 : 0 }}>{p.children}</div> : null}
    </section>
  );
}
export function Text(p: { children?: React.ReactNode }) {
  return <p style={{ fontSize: 14, lineHeight: "20px", color: theme.text.secondary, margin: "0 2px" }}>{p.children}</p>;
}
interface Row { lead?: React.ReactNode; title?: React.ReactNode; detail?: React.ReactNode; meta?: React.ReactNode; status?: { label: string; tone?: string }; icon?: React.ReactNode; onClick?: () => void }
export function Rows(p: { rows: Row[] }) {
  if (!p.rows || !p.rows.length) return null;
  return (
    <div style={{ border: "1px solid " + theme.border.subtle, borderRadius: 16, overflow: "hidden", background: "#FFFFFF" }}>
      {p.rows.map((r: Row, i: number) => {
        const tn = r.status ? TONE[r.status.tone || ""] || ["#F1F1F4", "#3F3F46"] : null;
        return (
          <div key={i} onClick={r.onClick} style={{ display: "flex", gap: 10, padding: "12px 14px", borderTop: i ? "1px solid " + theme.border.subtle : "none", cursor: r.onClick ? "pointer" : "default", alignItems: "flex-start" }}>
            {r.icon ? <div style={{ flex: "none" }}>{r.icon}</div> : null}
            <div style={{ flex: 1, minWidth: 0 }}>
              {r.lead ? <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", color: BRAND, textTransform: "uppercase", marginBottom: 2 }}>{r.lead}</div> : null}
              {r.title ? <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: "20px" }}>{r.title}</div> : null}
              {r.detail ? <div style={{ fontSize: 13, lineHeight: "18px", color: theme.text.secondary, marginTop: 2 }}>{r.detail}</div> : null}
              {r.meta ? <div style={{ fontSize: 12, lineHeight: "16px", color: theme.text.tertiary, marginTop: 4 }}>{r.meta}</div> : null}
            </div>
            {r.status && tn ? <span style={{ flex: "none", fontSize: 11.5, fontWeight: 800, padding: "4px 9px", borderRadius: 999, background: tn[0], color: tn[1], whiteSpace: "nowrap" }}>{r.status.label}</span> : null}
          </div>
        );
      })}
    </div>
  );
}
export function Properties(p: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <div style={{ border: "1px solid " + theme.border.subtle, borderRadius: 16, overflow: "hidden" }}>
      {p.items.map((x, i) => (
        <div key={i} style={{ padding: "10px 14px", borderTop: i ? "1px solid " + theme.border.subtle : "none" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.text.tertiary }}>{x.label}</div>
          <div style={{ fontSize: 13.5, lineHeight: "19px", marginTop: 2 }}>{x.value}</div>
        </div>
      ))}
    </div>
  );
}
export function NumberedList(p: { items: React.ReactNode[] }) {
  return <ol style={{ margin: 0, paddingLeft: 22, fontSize: 13.5, lineHeight: "20px", color: theme.text.secondary }}>{p.items.map((x, i) => <li key={i} style={{ marginBottom: 6 }}>{x}</li>)}</ol>;
}
export function Segmented(p: { options: { value: string; label: string; count?: number }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: 4, background: theme.bg.subtle, borderRadius: 999, scrollbarWidth: "none" }}>
      {p.options.map((o) => {
        const on = o.value === p.value;
        return <button key={o.value} onClick={() => p.onChange(o.value)} style={{ flex: "1 0 auto", height: 36, padding: "0 12px", borderRadius: 999, border: "none", background: on ? "#FFFFFF" : "transparent", boxShadow: on ? "0 1px 4px rgba(0,0,0,0.12)" : "none", color: on ? BRAND : theme.text.secondary, fontWeight: 800, fontSize: 13.5, fontFamily: FONT, cursor: "pointer", whiteSpace: "nowrap" }}>{o.label}{o.count !== undefined ? <span style={{ marginLeft: 6, opacity: 0.7 }}>{o.count}</span> : null}</button>;
      })}
    </div>
  );
}
const FIELD: React.CSSProperties = { width: "100%", boxSizing: "border-box", height: 44, padding: "0 12px", borderRadius: 12, border: "1.5px solid " + theme.border.default, background: "#FFFFFF", fontSize: 16, fontFamily: FONT, color: theme.text.primary, outline: "none" };
const LABEL: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, color: theme.text.tertiary, marginBottom: 4 };
export function Select(p: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return <label style={{ display: "block", minWidth: 0 }}><span style={LABEL}>{p.label}</span><select value={p.value} onChange={(e) => p.onChange(e.target.value)} style={{ ...FIELD, appearance: "auto" }}>{p.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;
}
export function Input(p: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return <label style={{ display: "block", minWidth: 0 }}><span style={LABEL}>{p.label}</span><input type={p.type || "text"} inputMode={p.type === "number" ? "decimal" : undefined} value={p.value} placeholder={p.placeholder} onChange={(e) => p.onChange(e.target.value)} style={FIELD} /></label>;
}
export function Toggle(p: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", minHeight: 40, fontSize: 14, fontWeight: 600 }} onClick={(e) => { e.preventDefault(); p.onChange(!p.value); }}>
      <span style={{ position: "relative", width: 44, height: 26, borderRadius: 999, background: p.value ? BRAND : "#D4D4DC", flex: "none", transition: "background .15s" }}>
        <span style={{ position: "absolute", top: 3, left: p.value ? 21 : 3, width: 20, height: 20, borderRadius: 999, background: "#FFFFFF", boxShadow: "0 1px 3px rgba(0,0,0,0.25)", transition: "left .15s" }} />
      </span>
      <span>{p.label}</span>
    </label>
  );
}
export function Grid(p: { columns?: number; children?: React.ReactNode }) {
  const c = p.columns || 2;
  return <div style={{ display: "grid", gridTemplateColumns: c >= 3 ? "repeat(auto-fit, minmax(min(100%, 150px), 1fr))" : "repeat(" + c + ", minmax(0, 1fr))", gap: 10 }}>{p.children}</div>;
}
export function Button(p: { label: string; onClick?: () => void }) {
  return <button onClick={p.onClick} style={{ width: "100%", height: 46, borderRadius: 14, border: "1.5px solid " + theme.border.default, background: "#FFFFFF", color: BRAND, fontWeight: 800, fontSize: 15, fontFamily: FONT, cursor: "pointer" }}>{p.label}</button>;
}
