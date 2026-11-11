import { Page, Section, Rows, Properties, Segmented, Select, Input, Toggle, Grid, NumberedList, Floating, Text, Button, Fragment, useState, useEffect, useGrokTheme } from "./kit";
import type { ReactNode } from "./kit";

interface Backer { name: string; cost: number; avg: number | null; wr: number | null; resolved: number | null; pnl: number; rank: number | null; golden: boolean; skill: boolean; flow: string | null; buy24: number | null; sell24: number | null; sport: { n: number; wr: number; pnl: number } | null; wallet: string; top100?: boolean | null; rank30?: number | null; firstTs: number | null; lastTs: number | null; trades: number | null }
interface Kalshi { status: string; why?: string; action?: string; price?: number; ticker?: string; contract?: string; rule?: string; edge_vs_whales?: number | null; edge_vs_poly?: number; light?: string }
interface Game { name: string | null; start: string; src: string; state: string | null; detail: string; score: string; venue?: string | null; records?: string[]; url?: string | null }
interface Opp { name: string; wallet: string; cost: number; avg: number | null; wr: number | null; qualified: boolean; golden: boolean; rank?: number | null; rank30?: number | null }
interface Refresh { at: number; state?: string | null; detail?: string; score?: string; pct?: number | null; src?: string; team?: string; kNow?: number; final?: string; ended?: boolean; why?: string }
interface Pick { id: string; q: string; label: string; kind: string; league: string; slug: string; score: number; parts: Record<string, number>; price: number; avgEntry: number | null; whales: number; invested: number; golden: number; oppMoney: number; oppCount: number; oppQualified: number; fresh24: number; fresh24Opp: number; sideAll: number; sideCountAll: number | null; oppAll: number; oppCountAll: number | null; hedgeAll: number; game: Game; startTs: number; backers: Backer[]; opposing: Opp[]; kalshi: Kalshi; risks: string[]; net?: number; totalBackers?: number | null; refresh?: Refresh }
interface Hist { id: string; tier?: string; q: string; label: string; score: number; whales: number; invested: number; start: string; kalshi: string; kprice?: number | null; first_seen: number; last_seen: number; scans: number; result: string | null; graded?: number; active: boolean }
interface Scan { ts: number; signals: number; fun: number; calls: number; cappers?: number; bets?: number; buys?: number; wallets?: number }
interface Cols { f: string[]; r: unknown[][] }
interface ScanData { scannedAt: string; ts: number; secs: number; settings: { cappers: number; min: number; wallets: number; markets: number; windowH: number }; coverage: { cappers: number; qualified: number; golden: number; marketsFound: number; marketsInWindow: number; marketsScanned: number; hedgedExcluded: number; twoSidedExcluded: number; walletsLoaded: number; positionsLoaded: number; bets: number; buysRaw: number; buys: number; orcaCalls: number; orcaErrors: string[]; kalshiSeries: number; kalshiMatched: number; espnLeagues: number; lb30?: { asOf: string | null; start: string | null; end: string | null; scanned: number; deepestRank: number; skippedNonSports: number; skippedNoPositions: number }; notOnKalshi?: number }; signals: Pick[]; totalSignals: number; fun: Pick[]; totalFun: number; history: Hist[]; scans: Scan[]; buysC: Cols; betsC: Cols; tradersC: Cols; partNames: string[]; refreshedAt?: string; refreshTs?: number }
interface BuyRaw { ts: number; firstTs: number; fills: number; wallet: string; name: string; wr: number | null; wpnl: number; top100: boolean; rank: number | null; golden: boolean; q: string; side: string; label: string; kind: string; league: string; price: number | null; now: number | null; usd: number; shares: number | null; posCost: number; hedged: boolean; agree60: number; agreeAll: number; score: number; parts: number[]; kAct: string | null; kPrice: number | null; kContract: string | null; kEdge: number | null; kWhy: string | null; start: string; src: string; startTs: number | null; phase: string; gDetail: string; gScore: string; rank30?: number | null }
interface BetRaw { firstTs: number | null; lastBuyTs: number | null; wallet: string; name: string; wr: number | null; resolved: number | null; cpnl: number; rank: number | null; golden: boolean; skill: boolean; top100: boolean; src: string; q: string; side: string; label: string; outcome: string; kind: string; league: string; shares: number | null; avg: number | null; now: number | null; cost: number; value: number | null; upnl: number | null; upct: number | null; consYes: number | null; consNo: number | null; agree60: number; agreeAll: number; score: number; parts: number[]; kAct: string | null; kPrice: number | null; kContract: string | null; kEdge: number | null; kWhy: string | null; start: string; src2: string; startTs: number | null; phase: string; gDetail: string; gScore: string; rank30?: number | null }
interface Trader { wallet: string; name: string; rank: number; pnl: number; wr: number | null; resolved: number | null; wins: number | null; losses: number | null; pf: number | null; skill: boolean; golden: boolean; qualified: boolean; bets: number; value: number; lastTs: number | null; skillEdge: number | null; rank30?: number | null; sportsPct?: number | null }
interface Line { key: string; type: string; ts: number | null; firstTs: number | null; fills: number; wallet: string; name: string; wr: number | null; resolved: number | null; pnl: number; top100: boolean; rank: number | null; golden: boolean; q: string; side: string; label: string; kind: string; league: string; entry: number | null; now: number | null; amount: number; shares: number | null; value: number | null; upnl: number | null; upct: number | null; hedged: boolean; agree60: number; agreeAll: number; score: number; parts: number[]; kAct: string | null; kPrice: number | null; kContract: string | null; kEdge: number | null; kWhy: string | null; start: string; src: string; startTs: number | null; phase: string; gDetail: string; gScore: string; source: string; rank30?: number | null }
interface Filters { q: string; status: string; betType: string; evidence: string; sort: string; lineSort: string; side: string; capper: string; min: string; max: string; bought: string; kSide: string; kStatus: string; kText: string; platform: string; followedOnly: boolean; showHidden: boolean; hideHedgers: boolean; freshOnly: boolean; props: boolean }

const DATA: ScanData = (window as any).__DATA;

const BRAND = "#6D28D9";
const BRAND2 = "#0891B2";
const GREEN = "#16A34A";
const AMBER = "#D97706";
const RED = "#DC2626";
const AVATARS = ["#7C3AED", "#0284C7", "#DB2777", "#059669", "#EA580C", "#4F46E5"];
const PART_MAX: Record<string, number> = { "Consensus": 25, "Capper record": 25, "Money": 15, "One-sided": 15, "Golden": 10, "Fresh money": 10 };
const EV_MAX = [25, 20, 20, 20, 10];
const STORE_KEY = "orca-scanner-cappers-v1";

function decode<T>(c: Cols): T[] {
  return c.r.map((row: unknown[]) => {
    const o: Record<string, unknown> = {};
    c.f.forEach((k: string, i: number) => { o[k] = row[i]; });
    return o as unknown as T;
  });
}
const BUYS: BuyRaw[] = decode<BuyRaw>(DATA.buysC);
const BETS: BetRaw[] = decode<BetRaw>(DATA.betsC);
const TRADERS: Trader[] = decode<Trader>(DATA.tradersC);

function buyLine(b: BuyRaw, i: number): Line {
  return { key: "b" + i, type: "buy", ts: b.ts, firstTs: b.firstTs, fills: b.fills, wallet: b.wallet, name: b.name, wr: b.wr, resolved: null, pnl: b.wpnl, top100: b.top100, rank: b.rank, golden: b.golden, q: b.q, side: b.side, label: b.label, kind: b.kind, league: b.league, entry: b.price, now: b.now, amount: b.usd, shares: b.shares, value: null, upnl: null, upct: null, hedged: b.hedged, agree60: b.agree60, agreeAll: b.agreeAll, score: b.score, parts: b.parts, kAct: b.kAct, kPrice: b.kPrice, kContract: b.kContract, kEdge: b.kEdge, kWhy: b.kWhy, start: b.start, src: b.src, startTs: b.startTs, phase: b.phase, gDetail: b.gDetail, gScore: b.gScore, source: "OrcaLayer whale alert", rank30: b.rank30 };
}
function betLine(b: BetRaw, i: number): Line {
  return { key: "p" + i, type: "bet", ts: b.lastBuyTs, firstTs: b.firstTs, fills: 1, wallet: b.wallet, name: b.name, wr: b.wr, resolved: b.resolved, pnl: b.cpnl, top100: b.top100, rank: b.rank, golden: b.golden, q: b.q, side: b.side, label: b.label, kind: b.kind, league: b.league, entry: b.avg, now: b.now, amount: b.cost, shares: b.shares, value: b.value, upnl: b.upnl, upct: b.upct, hedged: false, agree60: b.agree60, agreeAll: b.agreeAll, score: b.score, parts: b.parts, kAct: b.kAct, kPrice: b.kPrice, kContract: b.kContract, kEdge: b.kEdge, kWhy: b.kWhy, start: b.start, src: b.src2, startTs: b.startTs, phase: b.phase, gDetail: b.gDetail, gScore: b.gScore, source: "OrcaLayer whale open positions", rank30: b.rank30 };
}
const BUY_LINES: Line[] = BUYS.map(buyLine);
const BET_LINES: Line[] = BETS.map(betLine);

const DEFAULT_FILTERS: Filters = { q: "", status: "active", betType: "all", evidence: "all", sort: "evidence", lineSort: "start", side: "", capper: "", min: "", max: "", bought: "", kSide: "", kStatus: "", kText: "", platform: "all", followedOnly: false, showHidden: false, hideHedgers: true, freshOnly: true, props: true };

const money = (n: number | null | undefined): string => (n === null || n === undefined ? "n/a" : (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US"));
const kMoney = (n: number): string => (Math.abs(n) >= 10000 ? (n < 0 ? "-$" : "$") + (Math.abs(n) / 1000).toFixed(Math.abs(n) >= 100000 ? 0 : 1) + "k" : money(n));
const cents = (p: number | null | undefined): string => (p === null || p === undefined ? "n/a" : Math.round(p * 1000) / 10 + "¢");
const ptTime = (ts: number): string => new Date(ts * 1000).toLocaleString("en-US", { timeZone: "America/Los_Angeles", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " PT";
const ago = (ts: number, now: number): string => {
  const s = Math.max(0, now - ts);
  if (s < 3600) return Math.max(1, Math.round(s / 60)) + "m ago";
  if (s < 86400) return Math.round(s / 3600) + "h ago";
  return Math.round(s / 86400) + "d ago";
};
const until = (ts: number, now: number): string => {
  const s = ts - now;
  if (s <= 0) return "Started";
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h > 0 ? "in " + h + "h " + m + "m" : "in " + m + "m";
};
const shortWallet = (w: string): string => (w && w.length > 12 ? w.slice(0, 6) + "…" + w.slice(-4) : w || "");
export const profileUrl = (w: string): string => "https://polymarket.com/profile/" + (w || "").toLowerCase();
const initials = (n: string): string => {
  const parts = n.replace(/[^A-Za-z0-9 \-_]/g, "").split(/[\s\-_]+/).filter((x: string) => x.length > 0);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return n.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "?";
};
const hue = (n: string): string => {
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 997;
  return AVATARS[h % AVATARS.length];
};
const conf = (score: number): { color: string; word: string } => (score >= 65 ? { color: GREEN, word: "Strong" } : score >= 45 ? { color: AMBER, word: "Moderate" } : { color: RED, word: "Low" });
const kindWord = (k: string): string => (k === "moneyline" ? "Winner" : k === "draw" ? "Draw market" : k === "total" ? "Total" : k === "spread" ? "Spread" : k === "teamwin" ? "To win" : k === "prop" ? "Player prop" : "Market");
function stakePct(p: Pick, fun: boolean): number {
  if (p.kalshi.status !== "ok") return 0;
  let pct = p.score >= 80 ? 0.05 : p.score >= 70 ? 0.04 : p.score >= 60 ? 0.03 : p.score >= 50 ? 0.02 : 0.01;
  if (fun) pct = pct / 2;
  if (p.kalshi.light !== "green") pct = pct / 2;
  return pct;
}
function matchup(q: string): string {
  return q.replace(/^Will\s+/, "").replace(/\s+end in a draw\?$/, "").replace(/\?$/, "").replace(/\s*\(BO\d\)/, "").replace(/^[A-Za-z0-9 ]+:\s+(?=.+ vs)/, "").replace(/ vs\.? /, " vs ");
}

export function windowOk(l: Line, status: string, scanTs: number): boolean {
  const st = l.startTs;
  if (status === "live") return l.phase === "live";
  if (status === "upcoming") return l.phase !== "live";
  const hours = status === "hour" ? 1 : status === "h3" ? 3 : status === "h6" ? 6 : 12;
  if (l.phase === "live") return true;
  if (st === null) return status === "active";
  return st <= scanTs + hours * 3600;
}
export function passLine(l: Line, f: Filters, followed: string[], hidden: string[], scanTs: number): boolean {
  const w = (l.wallet || "").toLowerCase();
  if (!f.showHidden && hidden.indexOf(w) >= 0) return false;
  if (f.followedOnly && followed.indexOf(w) < 0) return false;
  if (!windowOk(l, f.status, scanTs)) return false;
  if (f.betType !== "all" && l.kind !== f.betType) return false;
  if (!f.props && l.kind === "prop") return false;
  if (f.hideHedgers && l.hedged) return false;
  const lastBuy = l.ts || l.firstTs;
  if (f.freshOnly && lastBuy !== null && scanTs - lastBuy > 86400) return false;
  const text = (l.q + " " + l.label + " " + l.name + " " + l.wallet).toLowerCase();
  if (f.q && text.indexOf(f.q.trim().toLowerCase()) < 0) return false;
  if (f.capper && (l.name + " " + l.wallet).toLowerCase().indexOf(f.capper.trim().toLowerCase()) < 0) return false;
  if (f.side) {
    const lab = l.label.toLowerCase();
    if ((f.side === "over" || f.side === "under") && lab.indexOf(f.side) < 0) return false;
    if ((f.side === "yes" || f.side === "no") && l.side !== f.side) return false;
  }
  if (f.min !== "" && l.amount < Number(f.min)) return false;
  if (f.max !== "" && l.amount > Number(f.max)) return false;
  if (f.bought !== "") {
    if (lastBuy === null || scanTs - lastBuy > Number(f.bought) * 3600) return false;
  }
  const ver = l.kAct !== null;
  if (f.kStatus === "verified" && !ver) return false;
  if (f.kStatus === "none" && ver) return false;
  if (f.kSide && (!l.kAct || l.kAct.indexOf(f.kSide) < 0)) return false;
  if (f.kText && ((l.kContract || "") + " " + (l.kAct || "")).toLowerCase().indexOf(f.kText.trim().toLowerCase()) < 0) return false;
  if (f.platform === "kalshi" && !ver) return false;
  if (f.platform === "poly" && ver) return false;
  if (f.evidence === "fresh60" && (lastBuy === null || scanTs - lastBuy > 3600)) return false;
  if (f.evidence === "strong" && !(ver && l.golden && l.agree60 > 0 && lastBuy !== null && scanTs - lastBuy <= 3600)) return false;
  return true;
}
const BIG = 9e12;
export function sortLines(rows: Line[], sort: string): Line[] {
  const r = rows.slice();
  const st = (l: Line): number => (l.startTs === null ? BIG : l.startTs);
  const cmp: Record<string, (a: Line, b: Line) => number> = {
    "evidence": (a: Line, b: Line) => b.score - a.score || (b.ts || 0) - (a.ts || 0),
    "soonest": (a: Line, b: Line) => (a.phase === "live" ? 0 : 1) - (b.phase === "live" ? 0 : 1) || st(a) - st(b),
    "game-asc": (a: Line, b: Line) => st(a) - st(b),
    "game-desc": (a: Line, b: Line) => (b.startTs === null ? -BIG : b.startTs) - (a.startTs === null ? -BIG : a.startTs),
    "biggest": (a: Line, b: Line) => b.amount - a.amount,
    "smallest": (a: Line, b: Line) => a.amount - b.amount,
    "newest": (a: Line, b: Line) => (b.ts || b.firstTs || 0) - (a.ts || a.firstTs || 0),
    "oldest": (a: Line, b: Line) => (a.ts || a.firstTs || BIG) - (b.ts || b.firstTs || BIG),
    "market-asc": (a: Line, b: Line) => a.q.localeCompare(b.q),
    "market-desc": (a: Line, b: Line) => b.q.localeCompare(a.q),
    "capper-asc": (a: Line, b: Line) => a.name.localeCompare(b.name),
    "capper-desc": (a: Line, b: Line) => b.name.localeCompare(a.name),
  };
  r.sort(cmp[sort] || cmp["evidence"]);
  return r;
}
interface Group { key: string; q: string; label: string; side: string; kind: string; league: string; start: string; src: string; startTs: number | null; phase: string; rows: Line[]; exposure: number; score: number; firstTs: number | null; kAct: string | null; kPrice: number | null; kContract: string | null; kEdge: number | null; kWhy: string | null; now: number | null; gDetail: string; gScore: string; rank30?: number | null }
export function groupLines(rows: Line[], sort: string): Group[] {
  const m: Record<string, Group> = {};
  const order: string[] = [];
  rows.forEach((l: Line) => {
    const k = l.q + "|" + l.side;
    if (!m[k]) { m[k] = { key: k, q: l.q, label: l.label, side: l.side, kind: l.kind, league: l.league, start: l.start, src: l.src, startTs: l.startTs, phase: l.phase, rows: [], exposure: 0, score: 0, firstTs: null, kAct: l.kAct, kPrice: l.kPrice, kContract: l.kContract, kEdge: l.kEdge, kWhy: l.kWhy, now: l.now, gDetail: l.gDetail, gScore: l.gScore }; order.push(k); }
    const g = m[k];
    g.rows.push(l);
    g.exposure += l.amount;
    g.score = Math.max(g.score, l.score);
    if (l.firstTs !== null && (g.firstTs === null || l.firstTs < g.firstTs)) g.firstTs = l.firstTs;
  });
  const gs = order.map((k: string) => m[k]);
  gs.forEach((g: Group) => g.rows.sort((a: Line, b: Line) => b.amount - a.amount));
  const st = (g: Group): number => (g.startTs === null ? BIG : g.startTs);
  if (sort === "exposure") gs.sort((a: Group, b: Group) => b.exposure - a.exposure);
  else if (sort === "score") gs.sort((a: Group, b: Group) => b.score - a.score);
  else if (sort === "entry") gs.sort((a: Group, b: Group) => (a.firstTs || BIG) - (b.firstTs || BIG));
  else gs.sort((a: Group, b: Group) => (a.phase === "live" ? 0 : 1) - (b.phase === "live" ? 0 : 1) || st(a) - st(b) || a.q.localeCompare(b.q));
  return gs;
}

function Icon(props: { name: string; color: string; size?: number }) {
  const s = props.size || 18;
  const common = { fill: "none", stroke: props.color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "none" }}>
      {props.name === "whales" ? (<g {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></g>) : null}
      {props.name === "money" ? (<g {...common}><line x1="12" y1="2" x2="12" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></g>) : null}
      {props.name === "star" ? (<g {...common}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></g>) : null}
      {props.name === "against" ? (<g {...common}><path d="M7 20V4M3 8l4-4 4 4" /><path d="M17 4v16m4-4-4 4-4-4" /></g>) : null}
      {props.name === "clock" ? (<g {...common}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></g>) : null}
      {props.name === "chev" ? (<g {...common}><polyline points="6 9 12 15 18 9" /></g>) : null}
    </svg>
  );
}

function Chip(props: { children: ReactNode; bg: string; color: string; border?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 9px", borderRadius: 999, background: props.bg, color: props.color, border: props.border ? `1px solid ${props.border}` : "none", fontSize: 12, lineHeight: "16px", fontWeight: 650, letterSpacing: "0.02em" }}>{props.children}</span>
  );
}

function Face(props: { name: string; size?: number }) {
  const s = props.size || 32;
  return (
    <span style={{ width: s, height: s, borderRadius: 999, background: hue(props.name), color: "#FFFFFF", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: s * 0.38, fontWeight: 700, flex: "none" }}>{initials(props.name)}</span>
  );
}

function NameLink(props: { name: string; wallet: string; bold?: boolean }) {
  const t = useGrokTheme();
  if (!props.wallet) return <span>{props.name}</span>;
  return (
    <a href={profileUrl(props.wallet)} target="_blank" rel="noopener noreferrer" title={"Open " + props.name + " on Polymarket"} style={{ color: t.text.accent, fontWeight: props.bold ? 700 : 600, textDecoration: "none", overflowWrap: "anywhere" }}>{props.name} ↗</a>
  );
}

function Pct(props: { v: number | null | undefined }) {
  if (props.v === null || props.v === undefined) return <span>n/a</span>;
  return <span style={{ whiteSpace: "nowrap" }}>{props.v}<span style={{ fontSize: "0.72em", marginLeft: 1, opacity: 0.8 }}>%</span></span>;
}

const BTN = (bg: string, color: string, border?: string): Record<string, string | number> => ({ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxSizing: "border-box", height: 48, padding: "0 16px", borderRadius: 14, border: border ? "1.5px solid " + border : "none", background: bg, color: color, fontSize: 16, fontWeight: 800, lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: "none", cursor: "pointer", minWidth: 0 });

function PillTabs(props: { options: { value: string; label: string; count?: number }[]; value: string; onChange: (v: string) => void }) {
  const t = useGrokTheme();
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 20, width: "100%", background: t.bg.base, boxShadow: "0 2px 8px rgba(0,0,0,0.12)", padding: "8px 0" }}>
      <div style={{ display: "flex", flexWrap: "nowrap", gap: 8, overflowX: "auto", padding: "0 12px", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
        {props.options.map((o: { value: string; label: string; count?: number }) => {
          const on = o.value === props.value;
          return (
            <button key={o.value} onClick={() => props.onChange(o.value)} style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: 6, height: 40, padding: "0 16px", borderRadius: 999, border: on ? "1.5px solid " + BRAND : "1.5px solid " + t.border.default, background: on ? BRAND : t.bg.subtle, color: on ? "#FFFFFF" : t.text.secondary, fontFamily: t.font.family, fontSize: 15, fontWeight: on ? 800 : 600, whiteSpace: "nowrap", cursor: "pointer" }}>
              {o.label}{o.count !== undefined ? <span style={{ fontSize: 12, fontWeight: 800, minWidth: 20, height: 20, padding: "0 6px", boxSizing: "border-box", borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", background: on ? "rgba(255,255,255,0.25)" : t.bg.base, color: on ? "#FFFFFF" : t.text.secondary }}>{o.count}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const CFG: any = (window as any).__CFG || {};
const KEY_LS = "orca-gh-access-key";
function accessKey(): string {
  const built = (CFG.k || []).map((x: string) => x.split("").reverse().join("")).join("");
  if (built) return built;
  try { const v = window.localStorage.getItem(KEY_LS); if (v) return v; } catch (e) { /* ignore */ }
  return "";
}
async function ghApi(path: string, init?: { method?: string; body?: string }): Promise<Response> {
  const h: Record<string, string> = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", Authorization: "Bearer " + accessKey() };
  if (init && init.body) h["Content-Type"] = "application/json";
  return fetch("https://api.github.com/repos/" + CFG.owner + "/" + CFG.repo + path, { method: (init && init.method) || "GET", body: init && init.body, headers: h, cache: "no-store" });
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const mmss = (s: number): string => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
interface Job { mode: string; phase: string; msg: string; t0: number; url?: string; n?: number }

function ActionBar() {
  const t = useGrokTheme();
  const [sheet, setSheet] = useState<string>("");
  const [n, setN] = useState<string>("100");
  const [custom, setCustom] = useState<string>("");
  const [job, setJob] = useState<Job | null>(null);
  const [tick, setTick] = useState<number>(0);
  const [hasKey, setHasKey] = useState<boolean>(!!accessKey());
  const [keyText, setKeyText] = useState<string>("");
  const count = n === "custom" ? Math.max(1, Math.floor(Number(custom) || 0)) : Number(n);
  const busy = !!job && (job.phase === "starting" || job.phase === "queued" || job.phase === "in_progress" || job.phase === "loading");
  useEffect(() => { if (!busy) return; const id = setInterval(() => setTick((x: number) => x + 1), 1000); return () => clearInterval(id); }, [busy]);
  const follow = async (runId: number, mode: string, t0: number, cnt?: number) => {
    for (let i = 0; i < 400; i++) {
      await sleep(i === 0 ? 3000 : 8000);
      let r: Response;
      try { r = await ghApi("/actions/runs/" + runId); } catch (e) { continue; }
      if (!r.ok) continue;
      const run = await r.json();
      if (run.status !== "completed") { setJob({ mode, phase: run.status === "in_progress" ? "in_progress" : "queued", msg: run.status === "in_progress" ? (mode === "scan" ? "Scanning the top " + (cnt || "") + " whales…" : "Checking ESPN and Kalshi…") : "Waiting for a GitHub server to pick it up (can take 1–3 min)…", t0, url: run.html_url, n: cnt }); continue; }
      if (run.conclusion !== "success") { setJob({ mode, phase: "error", msg: (mode === "scan" ? "Scan" : "Refresh") + " failed on GitHub (" + run.conclusion + "). Your current data is unchanged.", t0, url: run.html_url }); return; }
      setJob({ mode, phase: "loading", msg: "Done. Loading the new data…", t0, url: run.html_url });
      const before = mode === "scan" ? DATA.ts : (DATA.refreshTs || 0);
      for (let k = 0; k < 20; k++) {
        try { const d = await (await fetch("data.json?t=" + Date.now(), { cache: "no-store" })).json(); if ((mode === "scan" ? d.ts : (d.refreshTs || 0)) !== before) break; } catch (e) { /* retry */ }
        await sleep(5000);
      }
      window.location.reload();
      return;
    }
  };
  const findRun = async (t0: number): Promise<number | null> => {
    for (let i = 0; i < 12; i++) {
      await sleep(4000);
      try {
        const r = await ghApi("/actions/runs?event=workflow_dispatch&per_page=5");
        if (r.ok) { const j = await r.json(); const run = (j.workflow_runs || []).find((x: any) => Date.parse(x.created_at) >= t0 - 90000); if (run) return run.id; }
      } catch (e) { /* retry */ }
    }
    return null;
  };
  const start = async (mode: string) => {
    if (busy) return;
    const t0 = Date.now();
    setJob({ mode, phase: "starting", msg: "Starting " + (mode === "scan" ? "a scan of the top " + count + " whales" : "a refresh") + "…", t0, n: count });
    try {
      const r = await ghApi("/actions/workflows/" + CFG.workflow + "/dispatches", { method: "POST", body: JSON.stringify({ ref: "main", inputs: { mode, cappers: String(mode === "scan" ? count : 100) }, return_run_details: true }) });
      if (r.status === 401 || r.status === 403 || r.status === 404) { setJob({ mode, phase: "error", msg: "GitHub rejected the access key (" + r.status + "). It may be expired or missing Actions access.", t0 }); return; }
      if (!r.ok) { setJob({ mode, phase: "error", msg: "GitHub returned " + r.status + ". Try again in a minute.", t0 }); return; }
      let runId: number | null = null;
      if (r.status === 200) { try { const j = await r.json(); runId = j.workflow_run_id || null; } catch (e) { runId = null; } }
      if (!runId) runId = await findRun(t0);
      if (!runId) { setJob({ mode, phase: "error", msg: "Started, but couldn't find the run. Reload in a few minutes.", t0 }); return; }
      await follow(runId, mode, t0, count);
    } catch (e) {
      setJob({ mode, phase: "error", msg: "Couldn't reach GitHub: " + String(e), t0 });
    }
  };
  useEffect(() => {
    if (!hasKey || !CFG.owner) return;
    (async () => {
      try {
        for (const st of ["in_progress", "queued"]) {
          const r = await ghApi("/actions/runs?status=" + st + "&event=workflow_dispatch&per_page=1");
          if (!r.ok) return;
          const run = ((await r.json()).workflow_runs || [])[0];
          if (run) { const mode = /refresh/i.test(run.display_title || run.name || "") ? "refresh" : "scan"; const t0 = Date.parse(run.run_started_at || run.created_at); setJob({ mode, phase: st, msg: "A " + mode + " is already running…", t0, url: run.html_url }); follow(run.id, mode, t0); return; }
        }
      } catch (e) { /* offline */ }
    })();
  }, [hasKey]);
  const btn = (label: string, key: string, solid: boolean) => (
    <button onClick={() => { if (key === "refresh" && hasKey) { setSheet(""); start("refresh"); } else setSheet(sheet === key ? "" : key); }} style={{ ...BTN(solid ? "#FFFFFF" : "rgba(255,255,255,0.08)", solid ? BRAND : "#FFFFFF", solid ? undefined : "rgba(255,255,255,0.7)"), flex: "1 1 0", fontFamily: t.font.family }}><span aria-hidden="true">{key === "scan" ? "⚡" : "↻"}</span>{label}</button>
  );
  const goBtn = (mode: string, label: string) => (
    <button disabled={busy} onClick={() => start(mode)} style={{ ...BTN(busy ? "rgba(255,255,255,0.5)" : "#FFFFFF", BRAND), marginTop: 10, width: "100%", fontSize: 15, cursor: busy ? "default" : "pointer", fontFamily: t.font.family }}>{label}</button>
  );
  const elapsed = job ? Math.max(0, (Date.now() - job.t0) / 1000) : 0;
  const expect = job && job.mode === "scan" ? 600 : 90;
  const pct = job ? (job.phase === "loading" ? 100 : Math.min(95, Math.round((elapsed / expect) * 100))) : 0;
  const status = job ? (
    <div style={{ marginTop: 10, borderRadius: 14, padding: 12, background: job.phase === "error" ? "rgba(220,38,38,0.35)" : "rgba(0,0,0,0.22)", fontSize: 13, lineHeight: "19px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontWeight: 800 }}><span>{job.msg}</span>{busy ? <span style={{ fontVariantNumeric: "tabular-nums" }}>{mmss(elapsed)}</span> : null}</div>
      {busy ? <div style={{ marginTop: 8, height: 6, borderRadius: 999, background: "rgba(255,255,255,0.25)", overflow: "hidden" }}><div style={{ width: pct + "%", height: "100%", background: "#FFFFFF", transition: "width 1s linear" }} /></div> : null}
      {busy ? <div style={{ marginTop: 6, color: "rgba(255,255,255,0.85)" }}>{job.mode === "scan" ? "Scans take about 8–12 minutes. You can leave this page open, or close it and come back later; the new picks will be here." : "Refresh takes about a minute."}</div> : null}
      {job.url ? <a href={job.url} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 6, color: "#FFFFFF", fontWeight: 700 }}>View run on GitHub ↗</a> : null}
      {!busy ? <button onClick={() => setJob(null)} style={{ marginLeft: job.url ? 12 : 0, marginTop: 6, background: "transparent", border: "none", color: "#FFFFFF", textDecoration: "underline", fontSize: 13, padding: 0, cursor: "pointer" }}>Dismiss</button> : null}
    </div>
  ) : null;
  const keyBox = !hasKey ? (
    <div style={{ marginTop: 10 }}>
      <div style={{ color: "rgba(255,255,255,0.9)" }}>This site needs its GitHub access key once to run scans. Paste it here (saved on this device only).</div>
      <input value={keyText} onChange={(ev: { target: { value: string } }) => setKeyText(ev.target.value)} placeholder="github_pat_…" style={{ marginTop: 8, width: "100%", boxSizing: "border-box", height: 44, borderRadius: 12, border: "none", padding: "0 12px", fontSize: 16 }} />
      <button onClick={() => { try { window.localStorage.setItem(KEY_LS, keyText.trim()); } catch (e) { /* ignore */ } setHasKey(!!keyText.trim()); }} style={{ ...BTN("#FFFFFF", BRAND), marginTop: 8, width: "100%", fontSize: 15, fontFamily: t.font.family }}>Save key</button>
    </div>
  ) : null;
  void tick;
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", gap: 8 }}>{btn("Scan", "scan", true)}{btn("Refresh", "refresh", false)}</div>
      {status}
      {sheet ? (
        <div style={{ marginTop: 10, borderRadius: 14, padding: 12, background: "rgba(0,0,0,0.22)", fontSize: 13, lineHeight: "19px" }}>
          {sheet === "scan" ? (
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Full scan: top whales of the last 30 days</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginTop: 8 }}>
                {["20", "40", "60", "80", "100", "custom"].map((v: string) => (
                  <button key={v} onClick={() => setN(v)} style={{ ...BTN(n === v ? "#FFFFFF" : "transparent", n === v ? BRAND : "#FFFFFF", "rgba(255,255,255,0.7)"), height: 44, padding: "0 8px", borderRadius: 12, fontSize: 15, fontFamily: t.font.family }}>{v === "custom" ? "Custom" : "Top " + v}</button>
                ))}
              </div>
              {n === "custom" ? <input type="number" min={1} inputMode="numeric" value={custom} onChange={(ev: { target: { value: string } }) => setCustom(ev.target.value)} placeholder="Any number of whales" style={{ marginTop: 8, width: "100%", boxSizing: "border-box", height: 44, borderRadius: 12, border: "none", padding: "0 12px", fontSize: 16 }} /> : null}
              {hasKey ? goBtn("scan", busy ? "Working…" : "Run scan · Top " + count) : keyBox}
              <div style={{ marginTop: 8, color: "rgba(255,255,255,0.85)" }}>Runs on GitHub with your OrcaLayer key and updates this page when done. Last scan {DATA.scannedAt}.</div>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Refresh: ESPN scores + Kalshi prices only</div>
              <div style={{ marginTop: 4, color: "rgba(255,255,255,0.85)" }}>Checks live status, final results and ESPN win chances for the current picks, logs W/L to the Journal and removes ended games. No OrcaLayer calls.</div>
              {hasKey ? goBtn("refresh", busy ? "Working…" : "Run refresh") : keyBox}
              <div style={{ marginTop: 8, color: "rgba(255,255,255,0.85)" }}>Last refresh {DATA.refreshedAt || "not yet"}.</div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function betHeadline(p: Pick): string {
  const lab = p.label;
  if (p.kind === "moneyline" || p.kind === "teamwin") return /NOT TO WIN$/.test(lab) ? lab.replace(/ NOT TO WIN$/, " not to win") : lab.replace(/ WIN$/, "") + " to win";
  if (p.kind === "draw") return lab === "DRAW" ? "Match ends in a draw" : "No draw (either team wins)";
  return lab;
}

function Pill(props: { label: string; on: boolean; color: string; onClick: () => void }) {
  const t = useGrokTheme();
  return (
    <button onClick={props.onClick} style={{ minHeight: 34, padding: "0 12px", borderRadius: 999, border: `1.5px solid ${props.on ? props.color : t.border.default}`, background: props.on ? props.color : "transparent", color: props.on ? "#FFFFFF" : t.text.primary, fontSize: 13, fontWeight: 700, fontFamily: t.font.family, cursor: "pointer" }}>{props.label}</button>
  );
}

function Ring(props: { score: number; track: string; text: string; sub: string; label?: string; color?: string; size?: number }) {
  const c = conf(props.score);
  const sz = props.size || 76;
  const r = sz / 2 - 5;
  const len = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: sz, height: sz, flex: "none" }}>
      <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
        <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke={props.track} strokeWidth="6" />
        <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke={props.color || c.color} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(len * Math.max(0, Math.min(100, props.score))) / 100} ${len}`} transform={`rotate(-90 ${sz / 2} ${sz / 2})`} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: Math.round(sz * (String(props.score).length >= 3 ? 0.24 : 0.29)), fontWeight: 800, color: props.text, lineHeight: 1, display: "flex", alignItems: "flex-start", letterSpacing: "-0.02em" }}>{props.score}{props.label === "CHANCE" ? <span style={{ fontSize: "0.48em", fontWeight: 700, marginLeft: 1, marginTop: "0.08em", opacity: 0.75 }}>%</span> : null}</div>
        <div style={{ fontSize: 8, marginTop: 3, fontWeight: 600, color: props.sub, letterSpacing: "0.04em" }}>{props.label || "SCORE"}</div>
      </div>
    </div>
  );
}

function Hero(props: { top: number; fun: number; buys: number; bets: number; active: number; value: number }) {
  const stat = (v: string, l: string) => (
    <div style={{ flex: "1 1 70px", minWidth: 0, background: "rgba(255,255,255,0.12)", borderRadius: 14, padding: "10px 12px" }}>
      <div style={{ fontSize: 22, lineHeight: "26px", fontWeight: 800, color: "#FFFFFF" }}>{v}</div>
      <div style={{ fontSize: 11, lineHeight: "14px", fontWeight: 600, color: "rgba(255,255,255,0.78)", marginTop: 2, letterSpacing: "0.03em" }}>{l}</div>
    </div>
  );
  const chip = (s: string) => <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 9px", borderRadius: 999, background: "rgba(255,255,255,0.12)" }}>{s}</span>;
  return (
    <div style={{ borderRadius: 22, padding: 18, background: `linear-gradient(135deg, #1E1B4B 0%, ${BRAND} 55%, ${BRAND2} 100%)`, color: "#FFFFFF", boxShadow: "0 10px 30px rgba(76, 29, 149, 0.25)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.14em" }}>ORCA · WHALE SIGNALS</div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 999, background: "rgba(255,255,255,0.16)" }}>Live · tap to scan</span>
      </div>
      <div style={{ fontSize: 26, lineHeight: "32px", fontWeight: 800, marginTop: 10 }}>Follow conviction. Verify everything.</div>
      <div style={{ fontSize: 13, lineHeight: "18px", color: "rgba(255,255,255,0.82)", marginTop: 4 }}>Top {DATA.coverage.cappers} whales, last 30 days · live + next {DATA.settings.windowH} hours</div>
      <div style={{ fontSize: 12, lineHeight: "17px", color: "rgba(255,255,255,0.78)", marginTop: 2 }}>Scanned {DATA.scannedAt} · Refreshed {DATA.refreshedAt || "not yet"}</div>
      <ActionBar />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
        {stat(String(props.top), "TOP PICKS")}
        {stat(String(props.fun), "FUN PICKS")}
        {stat(String(props.buys), "RECENT BUYS")}
        {stat(String(props.bets), "SPORTS BETS")}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
        {chip("Top " + DATA.coverage.cappers + " whales · last 30 days")}
        {chip(props.active + " with open bets")}
        {chip(kMoney(props.value) + " in open bets")}
        {chip((DATA.coverage.notOnKalshi || 0) + " not on Kalshi")}
        {chip(DATA.coverage.hedgedExcluded + DATA.coverage.twoSidedExcluded + " hedges filtered")}
        {chip("$" + DATA.settings.min + " min · " + DATA.settings.wallets + "+ wallets")}
      </div>
    </div>
  );
}

function KalshiBox(props: { act: string | null; price: number | null; contract: string | null; edge: number | null; why: string | null; label: string; entry: number | null; now: number | null; compact?: boolean }) {
  const t = useGrokTheme();
  const ok = props.act !== null;
  const yes = ok && (props.act || "").indexOf("YES") >= 0;
  const good = props.edge !== null && props.edge >= 0;
  return (
    <div style={{ borderRadius: 16, border: `1.5px solid ${ok ? (yes ? GREEN : RED) : t.border.default}`, padding: props.compact ? 10 : 14, background: t.bg.base }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: t.text.tertiary }}>KALSHI — WHAT TO SELECT</div>
      {ok ? (
        <div>
          <div style={{ fontSize: props.compact ? 20 : 28, lineHeight: props.compact ? "24px" : "32px", fontWeight: 850, marginTop: 6, overflowWrap: "anywhere" }}>{(props.contract || props.label).toUpperCase()}</div>
          <div style={{ ...BTN(yes ? GREEN : RED, "#FFFFFF"), marginTop: 8, height: 48, justifyContent: "space-between", gap: 12, cursor: "default" }}>
            <span style={{ fontSize: 17, fontWeight: 850 }}>{props.act}</span>
            <span style={{ fontSize: 20, fontWeight: 850, fontVariantNumeric: "tabular-nums" }}>{cents(props.price)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <Chip bg={good ? GREEN : AMBER} color="#FFFFFF">{good ? "Value" : "Pricier"} {props.edge !== null ? (props.edge >= 0 ? "+" : "") + props.edge + "¢" : ""}</Chip>
            <span style={{ fontSize: 12, lineHeight: "17px", color: t.text.secondary }}>Verified contract match · whale paid {cents(props.entry)} · Polymarket now {cents(props.now)}</span>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.secondary, marginTop: 6 }}><span style={{ fontWeight: 700, color: t.text.primary }}>Not on Kalshi.</span> {props.why || "No verified Kalshi equivalent"}. No side is guessed.</div>
      )}
    </div>
  );
}

function EvidenceBars(props: { parts: number[]; names: string[] }) {
  const t = useGrokTheme();
  return (
    <div>
      {props.names.map((n: string, i: number) => (
        <div key={n} style={{ marginTop: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, gap: 8 }}><span style={{ color: t.text.secondary }}>{n}</span><span style={{ fontWeight: 700 }}>{props.parts[i]} / {EV_MAX[i]}</span></div>
          <div style={{ height: 5, borderRadius: 999, background: t.border.default, marginTop: 3, overflow: "hidden" }}><div style={{ width: `${Math.min(100, ((props.parts[i] || 0) / EV_MAX[i]) * 100)}%`, height: "100%", background: `linear-gradient(90deg, ${BRAND}, ${BRAND2})` }} /></div>
        </div>
      ))}
    </div>
  );
}

function CapperButtons(props: { wallet: string; followed: string[]; hidden: string[]; toggle: (kind: string, w: string) => void }) {
  const w = (props.wallet || "").toLowerCase();
  const f = props.followed.indexOf(w) >= 0;
  const h = props.hidden.indexOf(w) >= 0;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <Pill label={f ? "★ Following" : "☆ Follow"} on={f} color={BRAND} onClick={() => props.toggle("follow", w)} />
      <Pill label={h ? "Hidden · show" : "Hide"} on={h} color={RED} onClick={() => props.toggle("hide", w)} />
    </div>
  );
}

function BuyCard(props: { l: Line; now: number; followed: string[]; hidden: string[]; toggle: (kind: string, w: string) => void }) {
  const t = useGrokTheme();
  const { l, now } = props;
  const [open, setOpen] = useState<boolean>(false);
  const live = l.phase === "live";
  const chance = l.now !== null ? Math.round(l.now * 100) : null;
  const delta = l.kPrice !== null && l.entry !== null ? Math.round((l.kPrice - l.entry) * 1000) / 10 : null;
  const fol = props.followed.indexOf(l.wallet.toLowerCase()) >= 0;
  return (
    <div style={{ borderRadius: 18, border: `1px solid ${fol ? BRAND : t.border.default}`, background: t.bg.base, padding: 14, marginBottom: 12, fontFamily: t.font.family, color: t.text.primary, boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 6px 18px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <Chip bg={live ? RED : t.bg.subtle} color={live ? "#FFFFFF" : t.text.primary}>{live ? "● LIVE" : l.startTs ? until(l.startTs, now) : "Upcoming"}</Chip>
        <Chip bg={t.bg.subtle} color={t.text.primary}>{l.league}</Chip>
        <Chip bg={t.bg.subtle} color={t.text.secondary}>{kindWord(l.kind)}</Chip>
        <Chip bg={l.kAct ? GREEN : t.bg.subtle} color={l.kAct ? "#FFFFFF" : t.text.secondary}>{l.kAct ? "Kalshi verified" : "Polymarket only"}</Chip>
        {l.hedged ? <Chip bg={AMBER} color="#FFFFFF">Hedged / two-sided</Chip> : null}
        {fol ? <Chip bg={BRAND} color="#FFFFFF">★ Following</Chip> : null}
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 10 }}>
        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
          <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.secondary, overflowWrap: "anywhere" }}>{l.q}</div>
          <div style={{ fontSize: 22, lineHeight: "26px", fontWeight: 850, marginTop: 3, overflowWrap: "anywhere" }}>{l.label} <span style={{ fontSize: 15, fontWeight: 700, color: t.text.secondary }}>@ {cents(l.entry)}</span></div>
          <div style={{ fontSize: 12, lineHeight: "17px", color: t.text.tertiary, marginTop: 3 }}>Starts {l.start}{l.gScore ? " · " + l.gScore : ""}{l.gDetail ? " · " + l.gDetail : ""}</div>
        </div>
        {chance !== null ? <Ring score={chance} label="CHANCE" color={BRAND2} size={64} track={t.border.default} text={t.text.primary} sub={t.text.tertiary} /> : null}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6, marginTop: 10 }}>
        <div style={{ background: t.bg.subtle, borderRadius: 12, padding: 8 }}><div style={{ fontSize: 11, color: t.text.tertiary }}>Amount</div><div style={{ fontSize: 17, fontWeight: 800 }}>{kMoney(l.amount)}</div></div>
        <div style={{ background: t.bg.subtle, borderRadius: 12, padding: 8 }}><div style={{ fontSize: 11, color: t.text.tertiary }}>{l.type === "buy" ? "Bought" : "First entry"}</div><div style={{ fontSize: 15, fontWeight: 800 }}>{l.ts || l.firstTs ? ago((l.ts || l.firstTs) as number, now) : "n/a"}</div></div>
        <div style={{ background: t.bg.subtle, borderRadius: 12, padding: 8 }}><div style={{ fontSize: 11, color: t.text.tertiary }}>Evidence</div><div style={{ fontSize: 17, fontWeight: 800, color: conf(l.score).color }}>{l.score}/100</div></div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <Face name={l.name} size={28} />
        <NameLink name={l.name} wallet={l.wallet} bold={true} />
        {l.golden ? <Chip bg={AMBER} color="#FFFFFF">Golden</Chip> : null}
        {l.top100 ? <Chip bg={t.bg.subtle} color={t.text.primary}>{l.rank30 ? "#" + l.rank30 + " · 30d" : "Top whale"}</Chip> : <Chip bg={t.bg.subtle} color={t.text.secondary}>Not a top whale</Chip>}
        <span style={{ fontSize: 12, color: t.text.secondary }}>{l.wr !== null ? <Fragment><Pct v={l.wr} /> win rate (30d)</Fragment> : ""}</span>
      </div>
      <button onClick={() => setOpen(!open)} style={{ marginTop: 10, minHeight: 42, width: "100%", borderRadius: 12, border: "none", background: t.bg.subtle, color: t.text.primary, fontFamily: t.font.family, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{open ? "Hide details" : "Kalshi, value now & evidence"}</button>
      {open ? (
        <div style={{ marginTop: 10 }}>
          <KalshiBox act={l.kAct} price={l.kPrice} contract={l.kContract} edge={l.kEdge} why={l.kWhy} label={l.label} entry={l.entry} now={l.now} compact={true} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: t.text.tertiary, marginTop: 12 }}>VALUE NOW · BEFORE FEES</div>
          <div style={{ fontSize: 13, lineHeight: "20px", color: t.text.secondary, marginTop: 4 }}>Capper paid {cents(l.entry)} · Polymarket now {cents(l.now)} · Kalshi buy {cents(l.kPrice)}{delta !== null ? " · " + (delta <= 0 ? "" : "+") + delta + "¢ vs capper" : ""}</div>
          <div style={{ fontSize: 13, lineHeight: "20px", color: t.text.secondary }}>Chance to hit (market-implied): {chance !== null ? chance + "%" : "n/a"}. Not a win probability.</div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: t.text.tertiary, marginTop: 12 }}>POSITION</div>
          <div style={{ fontSize: 13, lineHeight: "20px", color: t.text.secondary, marginTop: 4 }}>
            {l.type === "buy" ? money(l.amount) + " over " + l.fills + (l.fills === 1 ? " fill" : " fills") + (l.shares ? ", " + l.shares.toLocaleString("en-US") + " shares" : "") + ". Latest buy " + (l.ts ? ptTime(l.ts) : "n/a") + (l.firstTs && l.firstTs !== l.ts ? ", first buy " + ptTime(l.firstTs) : "") + "." : "Holds " + money(l.amount) + (l.entry ? " at " + cents(l.entry) : "") + (l.shares ? ", " + l.shares.toLocaleString("en-US") + " shares" : "") + (l.value !== null ? ", worth " + money(l.value) : "") + (l.upnl !== null ? ", unrealized " + money(l.upnl) + (l.upct !== null ? " (" + l.upct + "%)" : "") : "") + ". First entry " + (l.firstTs ? ptTime(l.firstTs) : "not supplied") + "."}
          </div>
          <div style={{ fontSize: 13, lineHeight: "20px", color: t.text.secondary }}>Capper lifetime P&L {money(l.pnl)}{l.resolved ? " · " + l.resolved.toLocaleString("en-US") + " resolved" : ""}. Same side: {l.agreeAll} other qualified whale{l.agreeAll === 1 ? "" : "s"}, {l.agree60} within 60 min.</div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: t.text.tertiary, marginTop: 12 }}>EVIDENCE SCORE · {l.score}/100 · NOT A WIN PROBABILITY</div>
          <EvidenceBars parts={l.parts} names={DATA.partNames} />
          <div style={{ fontSize: 12, lineHeight: "17px", color: t.text.tertiary, marginTop: 8 }}>Start time from {l.src}. Source: {l.source}.</div>
          <div style={{ marginTop: 10 }}><CapperButtons wallet={l.wallet} followed={props.followed} hidden={props.hidden} toggle={props.toggle} /></div>
        </div>
      ) : null}
    </div>
  );
}

function LineCard(props: { g: Group; now: number; followed: string[]; hidden: string[]; toggle: (kind: string, w: string) => void }) {
  const t = useGrokTheme();
  const { g, now } = props;
  const [open, setOpen] = useState<boolean>(false);
  const live = g.phase === "live";
  const chance = g.now !== null ? Math.round(g.now * 100) : null;
  return (
    <div style={{ borderRadius: 18, border: `1px solid ${t.border.default}`, background: t.bg.base, padding: 14, marginBottom: 12, fontFamily: t.font.family, color: t.text.primary, boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 6px 18px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <Chip bg={live ? RED : t.bg.subtle} color={live ? "#FFFFFF" : t.text.primary}>{live ? "● LIVE" : g.startTs ? until(g.startTs, now) : "Upcoming"}</Chip>
        <Chip bg={t.bg.subtle} color={t.text.primary}>{g.league}</Chip>
        <Chip bg={t.bg.subtle} color={t.text.secondary}>{kindWord(g.kind)}</Chip>
        <Chip bg={g.kAct ? GREEN : t.bg.subtle} color={g.kAct ? "#FFFFFF" : t.text.secondary}>{g.kAct ? "Kalshi verified" : "Polymarket only"}</Chip>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 10 }}>
        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
          <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.secondary, overflowWrap: "anywhere" }}>{matchup(g.q)}</div>
          <div style={{ fontSize: 22, lineHeight: "26px", fontWeight: 850, marginTop: 3, overflowWrap: "anywhere" }}>{g.label}</div>
          <div style={{ fontSize: 12, lineHeight: "17px", color: t.text.tertiary, marginTop: 3 }}>{g.start}{g.gScore ? " · " + g.gScore : ""} · {g.rows.length} wallet{g.rows.length === 1 ? "" : "s"} · {kMoney(g.exposure)}</div>
        </div>
        {chance !== null ? <Ring score={chance} label="CHANCE" color={BRAND2} size={64} track={t.border.default} text={t.text.primary} sub={t.text.tertiary} /> : null}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, alignItems: "center" }}>
        {g.rows.slice(0, 4).map((l: Line) => (<span key={l.key} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 8px 3px 3px", borderRadius: 999, background: t.bg.subtle, fontSize: 13 }}><Face name={l.name} size={22} /><NameLink name={l.name} wallet={l.wallet} /></span>))}
        {g.rows.length > 4 ? <span style={{ fontSize: 12, color: t.text.secondary }}>+{g.rows.length - 4} more in details</span> : null}
      </div>
      <div style={{ marginTop: 10 }}><KalshiBox act={g.kAct} price={g.kPrice} contract={g.kContract} edge={g.kEdge} why={g.kWhy} label={g.label} entry={g.rows[0] ? g.rows[0].entry : null} now={g.now} compact={true} /></div>
      <button onClick={() => setOpen(!open)} style={{ marginTop: 10, minHeight: 42, width: "100%", borderRadius: 12, border: "none", background: t.bg.subtle, color: t.text.primary, fontFamily: t.font.family, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{open ? "Hide wallets" : "Every wallet and position"}</button>
      {open ? (
        <div style={{ marginTop: 8 }}>
          {g.rows.map((l: Line) => (
            <div key={l.key} style={{ padding: "10px 0", borderBottom: `1px solid ${t.border.subtle}` }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <Face name={l.name} size={26} /><NameLink name={l.name} wallet={l.wallet} bold={true} />
                {l.golden ? <Chip bg={AMBER} color="#FFFFFF">Golden</Chip> : null}
                <span style={{ fontSize: 12, color: t.text.tertiary }}>{shortWallet(l.wallet)}</span>
              </div>
              <div style={{ fontSize: 13, lineHeight: "19px", color: t.text.secondary, marginTop: 4 }}>Win rate (30d) <Pct v={l.wr} />{l.resolved ? " over " + l.resolved.toLocaleString("en-US") : ""} · P&L {money(l.pnl)} · position {money(l.amount)}{l.value !== null ? " (now " + money(l.value) + ")" : ""} · entry {cents(l.entry)} / now {cents(l.now)} · first entry {l.firstTs ? ptTime(l.firstTs) : "not supplied"} · evidence {l.score}</div>
              <div style={{ marginTop: 6 }}><CapperButtons wallet={l.wallet} followed={props.followed} hidden={props.hidden} toggle={props.toggle} /></div>
            </div>
          ))}
          <div style={{ fontSize: 12, lineHeight: "17px", color: t.text.tertiary, marginTop: 8 }}>Start time from {g.src}. Colors describe the held side, not confidence.</div>
        </div>
      ) : null}
    </div>
  );
}

function PickCard(props: { p: Pick; fun: boolean; bankroll: number; now: number; rank: number; followed: string[]; hidden: string[]; toggle: (kind: string, w: string) => void }) {
  const t = useGrokTheme();
  const { p, fun, bankroll, now, rank } = props;
  const [open, setOpen] = useState<boolean>(false);
  const k = p.kalshi;
  const ok = k.status === "ok";
  const c = conf(p.score);
  const pct = stakePct(p, fun);
  const stake = pct > 0 ? Math.max(1, Math.round(bankroll * pct)) : 0;
  const live = p.game.state === "in" || p.startTs <= now;
  const backers = p.backers.filter((b: Backer) => props.hidden.indexOf((b.wallet || "").toLowerCase()) < 0);
  const label = (s: string) => <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: t.text.tertiary }}>{s}</div>;
  const tile = (icon: string, tint: string, l: string, v: string, sub: string) => (
    <div style={{ borderRadius: 16, padding: 12, background: t.bg.subtle, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 28, height: 28, borderRadius: 9, background: tint, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={icon} color="#FFFFFF" size={16} /></span>
        <span style={{ fontSize: 12, lineHeight: "15px", fontWeight: 600, color: t.text.secondary }}>{l}</span>
      </div>
      <div style={{ fontSize: 26, lineHeight: "30px", fontWeight: 800, color: t.text.primary, marginTop: 8 }}>{v}</div>
      <div style={{ fontSize: 12, lineHeight: "16px", color: t.text.tertiary, marginTop: 2 }}>{sub}</div>
    </div>
  );
  const sideTotal = p.fresh24 + p.fresh24Opp;
  const freshShare = sideTotal > 0 ? p.fresh24 / sideTotal : 0;
  const lastBuy = Math.max(0, ...backers.map((b: Backer) => b.lastTs || 0));
  return (
    <div style={{ borderRadius: 22, border: `1px solid ${t.border.default}`, background: t.bg.base, boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 10px 28px rgba(0,0,0,0.07)", overflow: "hidden", marginBottom: 18, fontFamily: t.font.family, color: t.text.primary }}>
      <div style={{ height: 5, background: fun ? `linear-gradient(90deg, ${AMBER}, #F472B6)` : `linear-gradient(90deg, ${BRAND}, ${BRAND2})` }} />
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <Chip bg={BRAND} color="#FFFFFF">#{rank}</Chip>
          <Chip bg={t.bg.subtle} color={t.text.primary}>{p.league}</Chip>
          <Chip bg={t.bg.subtle} color={t.text.secondary}>{kindWord(p.kind)}</Chip>
          <Chip bg={live ? RED : t.bg.subtle} color={live ? "#FFFFFF" : t.text.primary}><Icon name="clock" color={live ? "#FFFFFF" : t.text.secondary} size={12} />{live ? "LIVE" : until(p.startTs, now)}</Chip>
          {fun ? <Chip bg={AMBER} color="#FFFFFF">Fun</Chip> : null}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <div style={{ fontSize: 14, lineHeight: "19px", fontWeight: 600, color: t.text.secondary, overflowWrap: "anywhere" }}>{matchup(p.q)}</div>
            <div style={{ fontSize: 24, lineHeight: "29px", fontWeight: 850, marginTop: 4, overflowWrap: "anywhere" }}>Bet: {betHeadline(p)}</div>
            <div style={{ ...BTN(ok ? ((k.action || "").indexOf("YES") >= 0 ? GREEN : RED) : t.bg.subtle, ok ? "#FFFFFF" : t.text.secondary), justifyContent: "space-between", marginTop: 8, width: "100%", height: 46, gap: 12, fontSize: 15, cursor: "default" }}>{ok ? <Fragment><span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{k.action}{k.contract ? " · " + k.contract : ""}</span><span style={{ flex: "none", display: "inline-flex", alignItems: "baseline", gap: 6 }}><span style={{ fontSize: 18, fontVariantNumeric: "tabular-nums" }}>{cents(k.price)}</span><span style={{ fontSize: 12, fontWeight: 700, opacity: 0.85 }}>on Kalshi</span></span></Fragment> : <span>Not on Kalshi</span>}</div>
            <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.tertiary, marginTop: 4 }}>Starts {p.game.start}{p.game.score ? " · " + p.game.score : ""} · <span style={{ color: c.color, fontWeight: 700 }}>{c.word} confidence</span> · <Pct v={Math.round(p.price * 100)} /> chance (market)</div>
            {p.refresh ? (
              <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.secondary, marginTop: 4 }}>
                {p.refresh.final ? <Chip bg={p.refresh.final === "W" ? GREEN : p.refresh.final === "L" ? RED : t.bg.subtle} color="#FFFFFF">{p.refresh.final === "W" ? "WON" : p.refresh.final === "L" ? "LOST" : "PUSH"}</Chip> : null}
                {p.refresh.detail ? " ESPN: " + p.refresh.detail + (p.refresh.score ? " · " + p.refresh.score : "") : ""}
                {p.refresh.pct !== undefined && p.refresh.pct !== null ? <Fragment> · ESPN gives <b><Pct v={p.refresh.pct} /></b> to win vs Kalshi {cents(p.refresh.kNow !== undefined ? p.refresh.kNow : (k.price === undefined ? null : k.price))}</Fragment> : <Fragment>{p.refresh.why ? " ESPN: " + p.refresh.why : ""}{p.refresh.kNow !== undefined && p.refresh.kNow !== null ? " · Kalshi now " + cents(p.refresh.kNow) : ""}</Fragment>}
                {" · refreshed " + ptTime(p.refresh.at)}
              </div>
            ) : null}
          </div>
          <Ring score={p.score} track={t.border.default} text={t.text.primary} sub={t.text.tertiary} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginTop: 14 }}>
          {tile("whales", BRAND, "Top whales on this bet", String(backers.length), "$500+ each · top " + DATA.coverage.cappers + " (30 days) · " + p.golden + " golden")}
          {tile("money", GREEN, "Their money", kMoney(p.invested), "net " + kMoney(p.net !== undefined ? p.net : p.invested - p.oppMoney) + " after whales against")}
          {tile("star", AMBER, "Total backers", p.totalBackers !== undefined && p.totalBackers !== null ? p.totalBackers.toLocaleString("en-US") : "n/a", "all wallets, any size" + (p.sideAll ? " · " + kMoney(p.sideAll) : ""))}
          {tile("against", RED, "Top whales against", String(p.oppCount), kMoney(p.oppMoney) + " on the other side")}
        </div>
        <div style={{ marginTop: 14 }}>
          <KalshiBox act={ok ? (k.action || null) : null} price={k.price === undefined ? null : k.price} contract={k.contract || null} edge={k.edge_vs_whales === undefined ? null : k.edge_vs_whales} why={k.why || null} label={p.label} entry={p.avgEntry} now={p.price} />
          {ok ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginTop: 10 }}>
              <span style={{ fontSize: 13, color: t.text.secondary }}>Suggested stake · <Pct v={Number((pct * 100).toFixed(1))} /> of {money(bankroll)}</span>
              <span style={{ fontSize: 20, fontWeight: 800 }}>{money(stake)}</span>
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
          <div style={{ display: "flex" }}>
            {backers.slice(0, 4).map((b: Backer, i: number) => (
              <a key={i} href={profileUrl(b.wallet)} target="_blank" rel="noopener noreferrer" title={"Open " + b.name + " on Polymarket"} style={{ marginLeft: i === 0 ? 0 : -8, borderRadius: 999, border: `2px solid ${t.bg.base}`, display: "inline-flex" }}><Face name={b.name} size={30} /></a>
            ))}
          </div>
          <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.secondary, minWidth: 0 }}>{lastBuy ? "Latest whale buy " + ago(lastBuy, now) + " · " + ptTime(lastBuy) : "Buy times not supplied"}</div>
        </div>
        <button onClick={() => setOpen(!open)} style={{ marginTop: 12, minHeight: 48, width: "100%", borderRadius: 14, border: "none", background: t.bg.subtle, color: t.text.primary, fontFamily: t.font.family, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {open ? "Hide details" : "Whales, buy times, risks & score"}
          <span style={{ display: "inline-flex", transform: open ? "rotate(180deg)" : "none" }}><Icon name="chev" color={t.text.secondary} size={16} /></span>
        </button>
        {open ? (
          <div style={{ marginTop: 14 }}>
            {label("BACKING WHALES · TAP A NAME FOR THEIR POLYMARKET PROFILE")}
            {backers.map((b: Backer, i: number) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: `1px solid ${t.border.subtle}` }}>
                <Face name={b.name} size={36} />
                <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                    <NameLink name={b.name} wallet={b.wallet} bold={true} />
                    {b.golden ? <Chip bg={AMBER} color="#FFFFFF">Golden</Chip> : null}
                    {b.skill ? <Chip bg={BRAND} color="#FFFFFF">Skill badge</Chip> : null}
                    {b.top100 ? <Chip bg={t.bg.subtle} color={t.text.primary}>#{b.rank30 || b.rank} · 30d</Chip> : null}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: "20px", marginTop: 4 }}><b>{money(b.cost)}</b> at {cents(b.avg)} · now {cents(p.price)}</div>
                  <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.secondary, marginTop: 2 }}>
                    {b.lastTs ? "Bought " + ago(b.lastTs, now) + " · " + ptTime(b.lastTs) : "Buy time not supplied"}
                    {b.firstTs && b.lastTs && b.firstTs !== b.lastTs ? " · first buy " + ptTime(b.firstTs) : ""}
                    {b.trades ? " · " + b.trades + (b.trades === 1 ? " fill" : " fills") : ""}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.secondary, marginTop: 2 }}><Pct v={b.wr} /> win rate (30d){b.resolved ? " · " + b.resolved.toLocaleString("en-US") + " resolved" : ""} · P&L {money(b.pnl)}{b.sport ? " · " + p.league + " record " + b.sport.wr + "% over " + b.sport.n : ""}</div>
                  <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.secondary, marginTop: 2 }}>{b.flow ? "24h: " + b.flow + (b.buy24 ? " · bought " + money(b.buy24) : "") + (b.sell24 ? " · sold " + money(b.sell24) : "") : "24h flow not checked"}</div>
                  <div style={{ marginTop: 6 }}><CapperButtons wallet={b.wallet} followed={props.followed} hidden={props.hidden} toggle={props.toggle} /></div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 14 }}>{label("OPPOSING WHALES · $500+")}</div>
            {p.opposing.length ? p.opposing.map((o: Opp, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", flexWrap: "wrap" }}>
                <Face name={o.name} size={26} />
                <span style={{ fontSize: 14, flex: "1 1 auto", minWidth: 0 }}><NameLink name={o.name} wallet={o.wallet} />{o.wr !== null ? <Fragment> · <Pct v={o.wr} /></Fragment> : null}{o.rank30 || o.rank ? " · #" + (o.rank30 || o.rank) + " · 30d" : ""}</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{money(o.cost)}{o.avg ? " @ " + cents(o.avg) : ""}</span>
              </div>
            )) : <div style={{ fontSize: 14, color: t.text.secondary, padding: "8px 0" }}>No $500+ whale on the other side.</div>}
            <div style={{ marginTop: 14 }}>{label("FRESH MONEY · LAST 24H, ALL WHALES")}</div>
            <div style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden", background: t.border.default, marginTop: 8 }}>
              <div style={{ width: `${freshShare * 100}%`, background: GREEN }} />
              <div style={{ flex: "1 1 auto", background: RED, opacity: sideTotal > 0 ? 0.85 : 0 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: t.text.secondary, marginTop: 6, gap: 8, flexWrap: "wrap" }}><span>This side {money(p.fresh24)}</span><span>Against {money(p.fresh24Opp)}</span></div>
            <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.secondary, marginTop: 4 }}>All tracked whales: {money(p.sideAll)} ({p.sideCountAll}) for vs {money(p.oppAll)} ({p.oppCountAll}) against · {money(p.hedgeAll)} hedged.</div>
            <div style={{ marginTop: 16 }}>{label("KEY RISKS")}</div>
            {p.risks.map((r: string, i: number) => <div key={i} style={{ fontSize: 13, lineHeight: "19px", color: t.text.secondary, marginTop: 4 }}>• {r}</div>)}
            <div style={{ marginTop: 16 }}>{label("SIGNAL SCORE · A SCORE, NOT A PREDICTION")}</div>
            {Object.keys(p.parts).map((key: string) => {
              const max = PART_MAX[key] || 10;
              const v = p.parts[key];
              return (
                <div key={key} style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: t.text.secondary }}>{key}</span><span style={{ fontWeight: 700 }}>{v} / {max}</span></div>
                  <div style={{ height: 6, borderRadius: 999, background: t.border.default, marginTop: 4, overflow: "hidden" }}><div style={{ width: `${Math.min(100, (v / max) * 100)}%`, height: "100%", background: `linear-gradient(90deg, ${BRAND}, ${BRAND2})` }} /></div>
                </div>
              );
            })}
            <div style={{ marginTop: 16 }}>{label("CONTRACT, GAME & TIMING")}</div>
            <div style={{ fontSize: 13, lineHeight: "19px", color: t.text.secondary, marginTop: 6, overflowWrap: "anywhere" }}>
              {ok ? "Kalshi " + k.ticker + ": “" + k.rule + "” " : ""}Start time from {p.game.src}.{p.game.venue ? " Venue: " + p.game.venue + "." : ""}{p.game.records && p.game.records.length ? " Records: " + p.game.records.join(" · ") + "." : ""}{p.game.detail ? " ESPN: " + p.game.detail + "." : ""} Polymarket market: {p.q}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function App() {
  const t = useGrokTheme();
  const [tab, setTab] = useState<string>("top");
  const [bankrollText, setBankrollText] = useState<string>("74");
  const [minPos, setMinPos] = useState<string>("500");
  const [minWallets, setMinWallets] = useState<string>("2");
  const [f, setF] = useState<Filters>(DEFAULT_FILTERS);
  const [followed, setFollowed] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [buyLimit, setBuyLimit] = useState<number>(20);
  const [lineLimit, setLineLimit] = useState<number>(20);
  const [capView, setCapView] = useState<string>("all");
  const [capQ, setCapQ] = useState<string>("");
  const [capSort, setCapSort] = useState<string>("rank");
  const [capLimit, setCapLimit] = useState<number>(25);
  const [journal, setJournal] = useState<string>("all");
  const [capN, setCapN] = useState<string>("100");
  const [capCustom, setCapCustom] = useState<string>("");
  const [saved, setSaved] = useState<string>("");
  const [now] = useState<number>(Math.floor(Date.now() / 1000));
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (raw) {
        const v = JSON.parse(raw) as { followed?: string[]; hidden?: string[] };
        if (Array.isArray(v.followed)) setFollowed(v.followed);
        if (Array.isArray(v.hidden)) setHidden(v.hidden);
        setSaved("Your follow and hide choices were restored on this device.");
      }
    } catch (e) {
      setSaved("");
    }
  }, []);
  const persist = (fo: string[], hi: string[]) => {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify({ followed: fo, hidden: hi })); setSaved("Saved on this device."); } catch (e) { setSaved("This view can't save choices, so they reset when the page reloads. Allow site storage in your browser to keep them."); }
  };
  const toggle = (kind: string, w: string) => {
    const lw = w.toLowerCase();
    let fo = followed.slice();
    let hi = hidden.slice();
    if (kind === "follow") { fo = fo.indexOf(lw) >= 0 ? fo.filter((x: string) => x !== lw) : fo.concat([lw]); hi = hi.filter((x: string) => x !== lw); }
    else { hi = hi.indexOf(lw) >= 0 ? hi.filter((x: string) => x !== lw) : hi.concat([lw]); fo = fo.filter((x: string) => x !== lw); }
    setFollowed(fo); setHidden(hi); persist(fo, hi);
  };
  const set = (k: string, v: string | boolean) => { const n: Filters = { ...f, [k]: v } as Filters; setF(n); setBuyLimit(20); setLineLimit(20); };
  const bankroll = Math.max(0, Number(bankrollText) || 0);
  const minP = Number(minPos);
  const minW = Number(minWallets);
  const visibleBackers = (p: Pick): Backer[] => p.backers.filter((b: Backer) => b.cost >= minP && hidden.indexOf((b.wallet || "").toLowerCase()) < 0);
  const followOk = (p: Pick): boolean => !f.followedOnly || p.backers.some((b: Backer) => followed.indexOf((b.wallet || "").toLowerCase()) >= 0);
  // Ended games are removed by refresh.py (W/L goes to the Journal first); this also drops any that ended since.
  const finished = (p: Pick): boolean => (p.refresh && (p.refresh.state === "post" || !!p.refresh.final || !!p.refresh.ended)) || p.game.state === "post";
  const top = DATA.signals.filter((p: Pick) => visibleBackers(p).length >= minW && followOk(p) && !finished(p)).slice(0, 5);
  const fun = DATA.fun.filter((p: Pick) => visibleBackers(p).length >= 1 && followOk(p) && !finished(p));
  const capNum = capN === "custom" ? Math.max(1, Math.floor(Number(capCustom) || 0)) : Number(capN);
  const allPicks = DATA.signals.concat(DATA.fun);
  const buys = sortLines(BUY_LINES.filter((l: Line) => passLine(l, f, followed, hidden, DATA.ts)), f.sort);
  const betRows = BET_LINES.filter((l: Line) => passLine(l, f, followed, hidden, DATA.ts));
  const groups = groupLines(betRows, f.lineSort);
  const activeTraders = Array.from(new Set(BET_LINES.map((l: Line) => l.wallet.toLowerCase())));
  const openValue = BET_LINES.reduce((a: number, l: Line) => a + l.amount, 0);
  const graded = DATA.history.filter((h: Hist) => h.result);
  const wins = graded.filter((h: Hist) => h.result === "W").length;
  const journalRows = DATA.history.filter((h: Hist) => journal === "all" || (journal === "won" && h.result === "W") || (journal === "lost" && h.result === "L") || (journal === "pending" && !h.result) || (journal === "top" && h.tier !== "fun") || (journal === "fun" && h.tier === "fun"));
  const sportRows = allPicks.flatMap((p: Pick) => p.backers.filter((b: Backer) => b.sport).map((b: Backer) => ({ lead: p.league, title: b.name, detail: b.sport ? b.sport.wr + "% over " + b.sport.n + " resolved " + p.league + " markets, P&L " + money(b.sport.pnl) : "", meta: matchup(p.q) })));
  const activeFilterCount = Object.keys(DEFAULT_FILTERS).filter((k: string) => k !== "sort" && k !== "lineSort" && (f as unknown as Record<string, unknown>)[k] !== (DEFAULT_FILTERS as unknown as Record<string, unknown>)[k]).length;
  // capper directory: top 100 plus every other whale seen in this scan
  const seen: Record<string, { wallet: string; name: string; wr: number | null; pnl: number; golden: boolean; n: number; amt: number }> = {};
  BUY_LINES.concat(BET_LINES).forEach((l: Line) => { const w = l.wallet.toLowerCase(); if (!seen[w]) seen[w] = { wallet: w, name: l.name, wr: l.wr, pnl: l.pnl, golden: l.golden, n: 0, amt: 0 }; seen[w].n += 1; seen[w].amt += l.amount; });
  const topSet: Record<string, boolean> = {};
  TRADERS.forEach((x: Trader) => { topSet[x.wallet.toLowerCase()] = true; });
  const others: Trader[] = Object.keys(seen).filter((w: string) => !topSet[w]).map((w: string) => ({ wallet: w, name: seen[w].name, rank: 0, pnl: seen[w].pnl, wr: seen[w].wr, resolved: null, wins: null, losses: null, pf: null, skill: false, golden: seen[w].golden, qualified: true, bets: seen[w].n, value: Math.round(seen[w].amt), lastTs: null, skillEdge: null }));
  const directory: Trader[] = TRADERS.map((x: Trader) => ({ ...x, bets: Math.max(x.bets, seen[x.wallet.toLowerCase()] ? seen[x.wallet.toLowerCase()].n : 0), value: Math.max(x.value, seen[x.wallet.toLowerCase()] ? Math.round(seen[x.wallet.toLowerCase()].amt) : 0) })).concat(others);
  let capRows = directory.filter((x: Trader) => {
    const w = x.wallet.toLowerCase();
    if (capView === "following" && followed.indexOf(w) < 0) return false;
    if (capView === "hidden" && hidden.indexOf(w) < 0) return false;
    if (capView === "golden" && !x.golden) return false;
    if (capView === "active" && x.bets <= 0) return false;
    if (capView === "top100" && x.rank <= 0) return false;
    if (x.rank > capNum) return false;
    if (capQ && (x.name + " " + x.wallet).toLowerCase().indexOf(capQ.trim().toLowerCase()) < 0) return false;
    return true;
  });
  capRows = capRows.slice().sort((a: Trader, b: Trader) => capSort === "wr" ? (b.wr || 0) - (a.wr || 0) : capSort === "bets" ? b.bets - a.bets || b.value - a.value : capSort === "pnl" ? b.pnl - a.pnl : (a.rank || 999) - (b.rank || 999));
  const statusOpts = [{ value: "active", label: "Live + next 12 hours" }, { value: "live", label: "Live now" }, { value: "upcoming", label: "Upcoming · next 12 hours" }, { value: "hour", label: "Live + next hour" }, { value: "h3", label: "Live + next 3 hours" }, { value: "h6", label: "Live + next 6 hours" }];
  const filterBlock = (isBets: boolean) => (
    <Section heading={isBets ? "Filter and sort bets" : "Filter and sort buys"} caption={activeFilterCount ? activeFilterCount + " filters on · " + (isBets ? betRows.length + " positions" : buys.length + " buys") + " match" : "Defaults: live + next 12h, hedgers and 24h+ stale hidden"} collapsible defaultOpen={false}>
      <Input label="Search events or wallets" value={f.q} onChange={(v: string) => set("q", v)} placeholder="Team, market, capper or 0x…" />
      <Grid columns={2}>
        <Select label="Game starts" value={f.status} onChange={(v: string) => set("status", v)} options={statusOpts} />
        <Select label="Bet type" value={f.betType} onChange={(v: string) => set("betType", v)} options={[{ value: "all", label: "All sports bets" }, { value: "spread", label: "Spreads" }, { value: "moneyline", label: "Moneylines" }, { value: "total", label: "Totals · Over / Under" }, { value: "prop", label: "Player props" }, { value: "other", label: "Other (maps, futures)" }]} />
        {isBets ? (
          <Select label="Sort lines" value={f.lineSort} onChange={(v: string) => set("lineSort", v)} options={[{ value: "start", label: "Event start · earliest first" }, { value: "entry", label: "Trader entry · oldest first" }, { value: "score", label: "Highest score first" }, { value: "resolving", label: "Resolving soonest" }, { value: "exposure", label: "Largest exposure" }]} />
        ) : (
          <Select label="Sort results" value={f.sort} onChange={(v: string) => set("sort", v)} options={[{ value: "evidence", label: "Best evidence first" }, { value: "soonest", label: "Live, then soonest game" }, { value: "game-asc", label: "Game start · ascending" }, { value: "game-desc", label: "Game start · descending" }, { value: "biggest", label: "Amount · descending" }, { value: "smallest", label: "Amount · ascending" }, { value: "newest", label: "Bought · newest first" }, { value: "oldest", label: "Bought · oldest first" }, { value: "market-asc", label: "Market · A–Z" }, { value: "market-desc", label: "Market · Z–A" }, { value: "capper-asc", label: "Capper · A–Z" }, { value: "capper-desc", label: "Capper · Z–A" }]} />
        )}
        <Select label="Evidence" value={f.evidence} onChange={(v: string) => set("evidence", v)} options={[{ value: "all", label: "All evidence · research included" }, { value: "fresh60", label: "Buys within 60 minutes" }, { value: "strong", label: "Strongest verified evidence only" }]} />
        <Select label="Held side" value={f.side} onChange={(v: string) => set("side", v)} options={[{ value: "", label: "All sides" }, { value: "over", label: "Over" }, { value: "under", label: "Under" }, { value: "yes", label: "Yes / first team" }, { value: "no", label: "No / second team" }]} />
        <Select label="Purchased within" value={f.bought} onChange={(v: string) => set("bought", v)} options={[{ value: "", label: "Any purchase in this scan" }, { value: "1", label: "Last hour" }, { value: "3", label: "Last 3 hours" }, { value: "6", label: "Last 6 hours" }, { value: "12", label: "Last 12 hours" }, { value: "24", label: "Last 24 hours" }]} />
        <Input label="Capper name or wallet" value={f.capper} onChange={(v: string) => set("capper", v)} placeholder="All cappers" />
        <Select label="Platform" value={f.platform} onChange={(v: string) => set("platform", v)} options={[{ value: "all", label: "All platforms" }, { value: "kalshi", label: "Verified Kalshi picks" }, { value: "poly", label: "Polymarket only" }]} />
        <Input label="Minimum purchase ($)" type="number" value={f.min} onChange={(v: string) => set("min", v)} placeholder="500" />
        <Input label="Maximum purchase ($)" type="number" value={f.max} onChange={(v: string) => set("max", v)} placeholder="No max" />
        <Select label="Kalshi side" value={f.kSide} onChange={(v: string) => set("kSide", v)} options={[{ value: "", label: "Any side" }, { value: "YES", label: "YES" }, { value: "NO", label: "NO" }]} />
        <Select label="Kalshi verification" value={f.kStatus} onChange={(v: string) => set("kStatus", v)} options={[{ value: "", label: "Any verification status" }, { value: "verified", label: "Verified contract" }, { value: "none", label: "No verified equivalent" }]} />
        <Input label="Kalshi contract wording" value={f.kText} onChange={(v: string) => set("kText", v)} placeholder="e.g. MOUZ" />
      </Grid>
      <Grid columns={2}>
        <Toggle label="Followed cappers only" value={f.followedOnly} onChange={(v: boolean) => set("followedOnly", v)} />
        <Toggle label="Show hidden cappers" value={f.showHidden} onChange={(v: boolean) => set("showHidden", v)} />
        <Toggle label="Hide hedgers (two-sided)" value={f.hideHedgers} onChange={(v: boolean) => set("hideHedgers", v)} />
        <Toggle label="Hide stale (no buy in 24h)" value={f.freshOnly} onChange={(v: boolean) => set("freshOnly", v)} />
        <Toggle label="Include player props" value={f.props} onChange={(v: boolean) => set("props", v)} />
      </Grid>
      <Button label="Reset display filters" onClick={() => { setF(DEFAULT_FILTERS); setBuyLimit(20); setLineLimit(20); }} />
    </Section>
  );
  return (
    <Page title="Orca Whale Scanner" summary={"Whale picks from your OrcaLayer data, matched to Kalshi contracts. Snapshot from " + DATA.scannedAt + " · tap Scan for fresh data."}>
      <Hero top={top.length} fun={fun.length} buys={BUY_LINES.length} bets={BET_LINES.length} active={activeTraders.length} value={openValue} />

      <Section heading="Bankroll and pick rules" caption={"Bankroll " + money(bankroll) + " · " + money(minP) + "+ positions · Top 5 needs " + minW + "+ whales" + (followed.length ? " · " + followed.length + " followed" : "") + (hidden.length ? " · " + hidden.length + " hidden" : "")} collapsible defaultOpen={false}>
        <Grid columns={3}>
          <Input label="Bankroll ($)" type="number" value={bankrollText} onChange={(v: string) => setBankrollText(v)} />
          <Select label="Min position" value={minPos} onChange={(v: string) => setMinPos(v)} options={[{ value: "500", label: "$500+" }, { value: "1000", label: "$1,000+" }, { value: "2500", label: "$2,500+" }, { value: "5000", label: "$5,000+" }]} />
          <Select label="Top 5 consensus" value={minWallets} onChange={(v: string) => setMinWallets(v)} options={[{ value: "2", label: "2+ whales" }, { value: "3", label: "3+ whales" }, { value: "4", label: "4+ whales" }]} />
        </Grid>
        <Toggle label="Only picks a followed capper backs" value={f.followedOnly} onChange={(v: boolean) => set("followedOnly", v)} />
      </Section>

      {tab === "top" ? (
        <Section heading="Top 5">
          <Text>Ranked by how many top-{DATA.coverage.cappers} whales (last 30 days) hold $500+ on the same side, then by their money minus whale money against. Only bets you can place on Kalshi count.</Text>
          {top.length === 0 && f.followedOnly ? <Text>No pick clears the filter: none of the top picks is backed by a capper you follow. Turn off "Only picks a followed capper backs" to see them.</Text> : top.length === 0 ? <Text>No pick qualifies right now: none has {minW}+ top whales on a bet Kalshi lists. Fun Picks has {fun.length} with 1 whale.</Text> : top.length < 5 ? <Text>Only {top.length} of 5 qualify right now. The rest of the board has fewer than {minW} top whales on a Kalshi-listed bet.</Text> : null}
          {top.map((p: Pick, i: number) => (<PickCard key={p.id} p={p} fun={false} bankroll={bankroll} now={now} rank={i + 1} followed={followed} hidden={hidden} toggle={toggle} />))}
          <Text>Top 5 rules: {minW}+ top whales (top {DATA.coverage.cappers} by 30-day P&L) with {money(minP)}+ each, verified Kalshi contract, no hedgers, game live or starting within 12 hours. Any sport counts.</Text>
        </Section>
      ) : null}

      {tab === "fun" ? (
        <Section heading="Fun Picks">
          <div style={{ borderRadius: 16, padding: "12px 14px", background: t.bg.subtle, fontFamily: t.font.family, fontSize: 14, lineHeight: "20px", color: t.text.secondary, marginBottom: 14 }}>
            <span style={{ color: AMBER, fontWeight: 800 }}>Lower confidence. </span>One top whale with $500+ is enough and stakes are halved. Every pick has a verified Kalshi contract.
          </div>
          {fun.map((p: Pick, i: number) => (<PickCard key={p.id} p={p} fun={true} bankroll={bankroll} now={now} rank={i + 1} followed={followed} hidden={hidden} toggle={toggle} />))}
        </Section>
      ) : null}

      {tab === "buys" ? (
        <Fragment>
          {filterBlock(false)}
          <Section heading={"Recent Buys · " + buys.length}>
            <Text>{buys.length ? "Qualified whales' $500+ buys in the last 24 hours on games live or starting within 12 hours, newest scan " + DATA.scannedAt + ". Repeat fills on the same side are combined." : "No buys match these filters. Reset display filters to see all " + BUY_LINES.length + "."}</Text>
            {buys.slice(0, buyLimit).map((l: Line) => (<BuyCard key={l.key} l={l} now={now} followed={followed} hidden={hidden} toggle={toggle} />))}
            {buys.length > buyLimit ? <Button label={"Show more buys (" + (buys.length - buyLimit) + " left)"} onClick={() => setBuyLimit(buyLimit + 20)} /> : null}
          </Section>
        </Fragment>
      ) : null}

      {tab === "bets" ? (
        <Fragment>
          {filterBlock(true)}
          <Section heading={"Sports bets · " + groups.length + " lines"}>
            <Text>{groups.length ? groups.length + " distinct bet lines · " + betRows.length + " wallet positions ($500+, qualified). " + groups.filter((g: Group) => g.kAct !== null).length + " verified on Kalshi, " + groups.filter((g: Group) => g.kAct === null).length + " Polymarket only." : "No open bets match these filters. Reset display filters to see all " + BET_LINES.length + " positions."}</Text>
            {groups.slice(0, lineLimit).map((g: Group) => (<LineCard key={g.key} g={g} now={now} followed={followed} hidden={hidden} toggle={toggle} />))}
            {groups.length > lineLimit ? <Button label={"Show more picks (" + (groups.length - lineLimit) + " left)"} onClick={() => setLineLimit(lineLimit + 20)} /> : null}
            <Text>Actual multi-leg combos: OrcaLayer reports single-market positions only, so combos are not listed.</Text>
          </Section>
        </Fragment>
      ) : null}

      {tab === "cappers" ? (
        <Section heading={"Cappers · " + capRows.length}>
          <Text>Top {DATA.coverage.cappers} sports whales by 30-day P&L, #1 first (#n · 30d is their rank on the 30-day leaderboard). Tap a name for their Polymarket profile. Follow to filter picks to them; hide to drop them from every count.</Text>
          <Grid columns={2}>
            <Select label="Whales to show" value={capN} onChange={(v: string) => { setCapN(v); setCapLimit(25); }} options={[{ value: "20", label: "Top 20" }, { value: "40", label: "Top 40" }, { value: "60", label: "Top 60" }, { value: "80", label: "Top 80" }, { value: "100", label: "Top 100" }, { value: "custom", label: "Custom number" }]} />
            {capN === "custom" ? <Input label="Custom number" type="number" value={capCustom} onChange={(v: string) => { setCapCustom(v); setCapLimit(25); }} placeholder="e.g. 50" /> : <Text>Showing top {capNum}</Text>}
          </Grid>
          <Segmented options={[{ value: "all", label: "All" }, { value: "following", label: "Following", count: followed.length }, { value: "hidden", label: "Hidden", count: hidden.length }, { value: "golden", label: "Golden" }, { value: "active", label: "Active" }, { value: "top100", label: "Top whales" }]} value={capView} onChange={(v: string) => { setCapView(v); setCapLimit(25); }} />
          <Grid columns={2}>
            <Input label="Search cappers" value={capQ} onChange={(v: string) => { setCapQ(v); setCapLimit(25); }} placeholder="Name or 0x wallet" />
            <Select label="Sort" value={capSort} onChange={(v: string) => setCapSort(v)} options={[{ value: "rank", label: "30-day rank" }, { value: "wr", label: "Win rate (30d)" }, { value: "bets", label: "Open bets now" }, { value: "pnl", label: "30-day P&L" }]} />
          </Grid>
          {saved ? <Text>{saved}</Text> : null}
          <div style={{ fontFamily: t.font.family, color: t.text.primary }}>
            {capRows.slice(0, capLimit).map((x: Trader) => (
              <div key={x.wallet} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: `1px solid ${t.border.subtle}` }}>
                <Face name={x.name} size={38} />
                <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                    <NameLink name={x.name} wallet={x.wallet} bold={true} />
                    {x.rank > 0 ? <Chip bg={t.bg.subtle} color={t.text.primary}>#{x.rank30 || x.rank} · 30d</Chip> : <Chip bg={t.bg.subtle} color={t.text.secondary}>Not a top whale</Chip>}
                    {x.golden ? <Chip bg={AMBER} color="#FFFFFF">Golden</Chip> : null}
                    {x.skill ? <Chip bg={BRAND} color="#FFFFFF">Skill badge</Chip> : null}
                    {x.sportsPct ? <Chip bg={t.bg.subtle} color={t.text.secondary}>{Math.round(x.sportsPct)}<span style={{ fontSize: "0.72em" }}>%</span> sports</Chip> : null}
                  </div>
                  <div style={{ fontSize: 12, color: t.text.tertiary, marginTop: 2 }}>{shortWallet(x.wallet)}</div>
                  <div style={{ fontSize: 13, lineHeight: "19px", color: t.text.secondary, marginTop: 3 }}>P&L {kMoney(x.pnl)} · {x.wr !== null ? <Fragment><Pct v={x.wr} /> win rate (30d)</Fragment> : "win rate n/a"}{x.resolved ? " · " + x.resolved.toLocaleString("en-US") + " resolved" : ""}{x.wins !== null && x.losses !== null ? " · " + x.wins.toLocaleString("en-US") + "–" + x.losses.toLocaleString("en-US") : ""}{x.pf ? " · PF " + x.pf : ""}{x.skillEdge ? " · edge " + x.skillEdge + "¢" : ""}</div>
                  <div style={{ fontSize: 13, lineHeight: "19px", color: x.bets > 0 ? t.text.primary : t.text.tertiary, marginTop: 2 }}>{x.bets > 0 ? x.bets + " open bet" + (x.bets === 1 ? "" : "s") + " in this scan · " + money(x.value) : "No $500+ bets in the next 12 hours"}{x.lastTs ? " · last trade " + ago(x.lastTs, now) : ""}</div>
                  <div style={{ marginTop: 6 }}><CapperButtons wallet={x.wallet} followed={followed} hidden={hidden} toggle={toggle} /></div>
                </div>
              </div>
            ))}
          </div>
          {capRows.length > capLimit ? <Button label={"Show more cappers (" + (capRows.length - capLimit) + " left)"} onClick={() => setCapLimit(capLimit + 25)} /> : null}
        </Section>
      ) : null}

      {tab === "more" ? (
        <Section heading="More">
          <Section heading="Whale consensus" collapsible defaultOpen={false}>
            <Rows rows={allPicks.map((p: Pick) => ({ lead: p.league, title: matchup(p.q) + " — " + p.label, detail: p.whales + (p.whales === 1 ? " top whale, " : " top whales, ") + money(p.invested) + ". All wallets on this side: " + (p.totalBackers !== undefined && p.totalBackers !== null ? p.totalBackers.toLocaleString("en-US") : "n/a") + " with " + money(p.sideAll) + ".", meta: "Score " + p.score }))} />
          </Section>
          <Section heading="Opposing whales" collapsible defaultOpen={false}>
            <Rows rows={allPicks.map((p: Pick) => ({ lead: p.league, title: matchup(p.q) + " — against " + p.label, detail: p.oppCount + " whales with $500+ (" + p.oppQualified + " qualified), " + money(p.oppMoney) + "." + (p.opposing.length ? " Biggest: " + p.opposing.slice(0, 3).map((o: Opp) => o.name + " " + money(o.cost)).join(", ") + "." : ""), status: p.oppMoney > p.invested ? { label: "More money against", tone: "warning" as const } : { label: "Smaller" } }))} />
          </Section>
          <Section heading="Value now · Kalshi price check" collapsible defaultOpen={false} caption="Price comparison only. Kalshi never counts toward the signal score.">
            <Rows rows={allPicks.map((p: Pick) => ({ lead: p.league, title: matchup(p.q) + " — " + p.label, detail: p.kalshi.status === "ok" ? p.kalshi.action + " " + p.kalshi.contract + " at " + cents(p.kalshi.price) + " vs whale entry " + cents(p.avgEntry) + " and Polymarket now " + cents(p.price) : (p.kalshi.why || "No match"), status: p.kalshi.status === "ok" ? (p.kalshi.light === "green" ? { label: "Value", tone: "success" as const } : { label: "Pricier", tone: "warning" as const }) : { label: "No contract" } }))} />
          </Section>
          <Section heading="Whale money flow" collapsible defaultOpen={false} caption="Last 24h buys and sells by each backing whale on its pick side.">
            <Rows rows={allPicks.flatMap((p: Pick) => p.backers.filter((b: Backer) => b.flow).map((b: Backer) => ({ lead: p.league, title: b.name + " — " + p.label, detail: "Bought " + money(b.buy24 || 0) + ", sold " + money(b.sell24 || 0) + " in 24h. Holds " + money(b.cost) + ".", status: b.flow === "Buying more" ? { label: "Buying more", tone: "success" as const } : b.flow === "Trimming" ? { label: "Trimming", tone: "warning" as const } : { label: "Holding" } })))} />
          </Section>
          {sportRows.length ? (
            <Section heading="Whale record by sport" collapsible defaultOpen={false}>
              <Rows rows={sportRows} />
            </Section>
          ) : null}
          <Section heading="Outcome journal" collapsible defaultOpen={false} caption={"Record so far: " + wins + "–" + (graded.length - wins) + ". Picks are graded on a later scan once their games settle."}>
            <Select label="Show" value={journal} onChange={(v: string) => setJournal(v)} options={[{ value: "all", label: "All saved picks" }, { value: "won", label: "Winning outcomes" }, { value: "lost", label: "Losing outcomes" }, { value: "pending", label: "Pending outcomes" }, { value: "top", label: "Top 5 picks" }, { value: "fun", label: "Fun Picks" }]} />
            {journalRows.length ? <Rows rows={journalRows.map((h: Hist) => ({ lead: h.tier === "fun" ? "Fun" : "Top", title: matchup(h.q) + " — " + h.label, detail: "Score " + h.score + ", " + h.whales + " whales, " + money(h.invested) + ". " + h.kalshi + ". Starts " + h.start + ".", meta: "First seen " + ptTime(h.first_seen) + " · " + h.scans + (h.scans === 1 ? " scan" : " scans"), status: h.result ? (h.result === "W" ? { label: "Won", tone: "success" as const } : { label: "Lost", tone: "danger" as const }) : { label: h.active ? "Active" : "Waiting for result" } }))} /> : <Text>No saved picks in this view yet.</Text>}
          </Section>
          <Section heading="Scan history" collapsible defaultOpen={false}>
            <Rows rows={DATA.scans.slice().reverse().map((s: Scan) => ({ title: ptTime(s.ts), detail: s.signals + " Top picks · " + s.fun + " Fun picks" + (s.buys !== undefined ? " · " + s.buys + " buys · " + s.bets + " bets · " + s.wallets + " wallets checked" : ""), meta: (s.cappers ? s.cappers + " cappers · " : "") + s.calls + " OrcaLayer calls" }))} />
          </Section>
          <Section heading="Scan details and coverage" collapsible defaultOpen={false}>
            <Properties items={[
              { label: "Scanned", value: DATA.scannedAt + " in " + DATA.secs + "s · manual scan only" },
              { label: "Whales", value: "Top " + DATA.coverage.cappers + " sports whales by 30-day P&L (OrcaLayer business pnl-leaderboard, window 30" + (DATA.coverage.lb30 ? ", " + DATA.coverage.lb30.start + " to " + DATA.coverage.lb30.end + "; read ranks 1–" + DATA.coverage.lb30.deepestRank + " in order, skipped " + DATA.coverage.lb30.skippedNonSports + " non-sports and " + DATA.coverage.lb30.skippedNoPositions + " with no open positions" : "") + "), " + DATA.coverage.golden + " golden" },
              { label: "Open positions read", value: DATA.coverage.positionsLoaded + " across " + DATA.coverage.walletsLoaded + " wallets; " + DATA.coverage.bets + " qualifying bets kept" },
              { label: "Recent buys", value: DATA.coverage.buysRaw + " whale buys in 24h, " + DATA.coverage.buys + " qualified and in the 12h window" },
              { label: "Sports markets with 2+ whales", value: DATA.coverage.marketsFound + " found, " + DATA.coverage.marketsInWindow + " in window, " + DATA.coverage.marketsScanned + " checked" },
              { label: "Hedges dropped", value: DATA.coverage.hedgedExcluded + " hedged holders + " + DATA.coverage.twoSidedExcluded + " two-sided capper positions" },
              { label: "OrcaLayer calls", value: DATA.coverage.orcaCalls + (DATA.coverage.orcaErrors.length ? ", errors: " + DATA.coverage.orcaErrors.join("; ") : ", no errors") },
              { label: "Kalshi", value: DATA.coverage.kalshiSeries + " series read, " + DATA.coverage.kalshiMatched + " pick contracts verified" },
              { label: "ESPN", value: DATA.coverage.espnLeagues + " league scoreboards checked" },
              { label: "Times", value: "Pacific Time. Window: live + next 12 hours; completed games hidden." },
            ]} />
          </Section>
          <Section heading="Methodology" collapsible defaultOpen={false} caption="Scores rank evidence; they are not win probabilities.">
            <Properties items={[
              { label: "Guardrails", value: "Only the top " + DATA.coverage.cappers + " whales of the last 30 days count · $500 minimum position · 2+ of them for Top 5 · verified Kalshi contract required for Top 5 and Fun" },
              { label: "Top 5 ranking", value: "Most top whales on the side first, then most money net of whale money against; score parts only break ties" },
              { label: "Signal score (picks)", value: "Consensus 25 · Capper record 25 · Money 15 · One-sided 15 · Golden 10 · Fresh money 10" },
              { label: "Evidence score (buys, bets)", value: "Recency 25 · Capper record 20 · Independent agreement within 60 min 20 · Kalshi quote 20 · Kalshi price at or below the capper's 10" },
              { label: "Strong evidence only", value: "Golden capper, bought within 60 minutes, another whale agreeing within 60 minutes, verified Kalshi contract" },
              { label: "Confidence colors", value: "Green 65+, yellow 45–64, red under 45" },
              { label: "Stake", value: "2–5% of bankroll by score, halved for Fun Picks or pricier Kalshi lines, none without a Kalshi match" },
              { label: "Chance to hit", value: "Polymarket price of the held side; market-implied, not a prediction" },
            ]} />
          </Section>
          <Section heading="Connections" collapsible defaultOpen={false}>
            <Rows rows={[
              { lead: "OrcaLayer", title: "Your Premium key", detail: "Leaderboard, open positions, market holders, whale alerts, buy times. The only whale source.", status: { label: "Connected", tone: "success" as const } },
              { lead: "Kalshi", title: "Public market API", detail: "Contract match, YES/NO wording and ask price only. Never a signal.", status: { label: "Public" } },
              { lead: "ESPN", title: "Public scoreboard", detail: "Start times, live status, scores, venue and records.", status: { label: "Public" } },
              { lead: "Polymarket", title: "Profile links", detail: "Every capper name opens polymarket.com/profile/<wallet>.", status: { label: "Links" } },
            ]} />
          </Section>
          <Section heading="Limits" collapsible defaultOpen={false}>
            <NumberedList items={[
              "Scan and Refresh run on GitHub Actions from the buttons at the top. A scan takes about 8–12 minutes; refresh about a minute. Only one runs at a time.",
              "Follow and hide choices save on this device only.",
              "Whale positions come from each top whale's own open positions (up to 200 per wallet), so a whale with more open bets can be missed.",
              "Refresh uses ESPN and Kalshi only; esports and leagues ESPN doesn't cover show no ESPN win chance.",
              "Ended games are removed from every list on refresh after their W/L is written to the Journal.",
              "Combos are not reported by OrcaLayer; ESPN player stats are not loaded.",
              "Esports start times come from Kalshi contract wording or the same match's markets; some show the date only.",
            ]} />
          </Section>
        </Section>
      ) : null}

      <Floating edge="top" align="center" bar>
        <PillTabs
          options={[{ value: "top", label: "Top 5", count: top.length }, { value: "fun", label: "Fun", count: fun.length }, { value: "buys", label: "Buys", count: buys.length }, { value: "bets", label: "Bets", count: groups.length }, { value: "cappers", label: "Cappers" }, { value: "more", label: "More" }]}
          value={tab}
          onChange={(v: string) => setTab(v)}
        />
      </Floating>
    </Page>
  );
}



