import { Page, Section, Rows, Properties, Segmented, Select, Input, Toggle, Grid, NumberedList, Floating, Text, Button, Fragment, useState, useEffect, useGrokTheme } from "./kit";
import type { ReactNode } from "./kit";

interface Backer { name: string; cost: number; avg: number | null; wr: number | null; resolved: number | null; pnl: number; rank: number | null; golden: boolean; skill: boolean; flow: string | null; buy24: number | null; sell24: number | null; sport: { n: number; wr: number; pnl: number } | null; wallet: string; top100?: boolean | null; rank30?: number | null; rankAll?: number | null; firstTs: number | null; lastTs: number | null; trades: number | null }
interface Kalshi { status: string; why?: string; action?: string; price?: number; ticker?: string; contract?: string; rule?: string; edge_vs_whales?: number | null; edge_vs_poly?: number; light?: string }
interface Game { name: string | null; start: string; src: string; state: string | null; detail: string; score: string; venue?: string | null; records?: string[]; url?: string | null; teams?: string[] }
interface Opp { name: string; wallet: string; cost: number; avg: number | null; wr: number | null; qualified: boolean; golden: boolean; rank?: number | null; rank30?: number | null; rankAll?: number | null }
interface Refresh { at: number; state?: string | null; detail?: string; score?: string; pct?: number | null; src?: string; team?: string; kNow?: number; final?: string; ended?: boolean; why?: string }
interface Pick { id: string; q: string; label: string; kind: string; league: string; slug: string; score: number; parts: Record<string, number>; price: number; avgEntry: number | null; whales: number; invested: number; golden: number; oppMoney: number; oppCount: number; oppQualified: number; fresh24: number; fresh24Opp: number; sideAll: number; sideCountAll: number | null; oppAll: number; oppCountAll: number | null; hedgeAll: number; game: Game; startTs: number; backers: Backer[]; opposing: Opp[]; kalshi: Kalshi; risks: string[]; net?: number; totalBackers?: number | null; refresh?: Refresh; oneSidedShare?: number | null; priceBand?: string; split?: boolean; glue?: boolean; pricier?: boolean; overCents?: number | null; pickId?: string; strength?: string; started?: boolean }
interface Hist { id: string; tier?: string; q: string; label: string; score: number; whales: number; invested: number; start: string; kalshi: string; kprice?: number | null; first_seen: number; last_seen: number; scans: number; result: string | null; graded?: number; active: boolean }
interface CapperHistPick { id: string; q?: string | null; label?: string | null; side?: string | null; league?: string | null; start?: string | null; startTs?: number | null; kind?: string | null; cost?: number | null; avg?: number | null; result?: string | null; graded?: number | null; kAct?: string | null; kContract?: string | null; kprice?: number | null; profit?: number | null; current?: boolean; conv?: string | null; mult?: number | null }
interface CapperRec { wallet: string; name: string; rankAll?: number | null; rank?: number | null; golden?: boolean; w: number; l: number; push: number; open: number; n: number; profit: number; risked: number; wr?: number | null; roi?: number | null; qualified: boolean; pnl?: number | null; wrAll?: number | null; picks: CapperHistPick[]; cw?: number; cl?: number; cn?: number; cwr?: number | null; croi?: number | null; cprofit?: number; crisked?: number; quality?: number; qQual?: boolean; demoted?: boolean; shrunkWr?: number | null; shrunkRoi?: number | null; win?: Record<string, { pnl?: number; roi?: number | null; rec?: number[] }>; badge?: string; proven?: boolean; coldDemoted?: boolean; medBet?: number | null; maxBet?: number | null; convRec?: Record<string, { w: number; l: number; roi: number | null }>; winStale?: string[] }
interface CapperHistory { minSample: number; updatedAt?: string; cappers: CapperRec[] }
interface Scan { ts: number; signals: number; fun: number; poly?: number; glue?: number; props?: number; longshots?: number; biggest?: number; upcoming?: number; calls: number; cappers?: number; bets?: number; buys?: number; wallets?: number }
interface Cols { f: string[]; r: unknown[][] }
interface ScanData { scannedAt: string; ts: number; secs: number; settings: { cappers: number; min: number; wallets: number; markets: number; windowH: number }; coverage: { cappers: number; qualified: number; golden: number; marketsFound: number; marketsInWindow: number; marketsScanned: number; hedgedExcluded: number; twoSidedExcluded: number; walletsLoaded: number; positionsLoaded: number; bets: number; buysRaw: number; buys: number; orcaCalls: number; orcaErrors: string[]; kalshiSeries: number; kalshiMatched: number; espnLeagues: number; lb30?: { asOf: string | null; start: string | null; end: string | null; scanned: number; deepestRank: number; skippedNonSports: number; skippedNoPositions: number; endpoint?: string; params?: string }; lbAll?: { asOf: string | null; start: string | null; end: string | null; scanned: number; deepestRank: number; skippedNonSports: number; skippedNoPositions: number; endpoint?: string; params?: string }; notOnKalshi?: number }; signals: Pick[]; totalSignals: number; fun: Pick[]; totalFun: number; poly?: Pick[]; totalPoly?: number; glue?: Pick[]; totalGlue?: number; props?: Pick[]; totalProps?: number; longshots?: Pick[]; totalLongshots?: number; biggest?: Pick[]; totalBiggest?: number; upcoming?: Pick[]; totalUpcoming?: number; history: Hist[]; scans: Scan[]; buysC: Cols; betsC: Cols; tradersC: Cols; partNames: string[]; refreshedAt?: string; refreshTs?: number; capperHistory?: CapperHistory }
interface BuyRaw { ts: number; firstTs: number; fills: number; wallet: string; name: string; wr: number | null; wpnl: number; top100: boolean; rank: number | null; golden: boolean; q: string; side: string; label: string; kind: string; league: string; price: number | null; now: number | null; usd: number; shares: number | null; posCost: number; hedged: boolean; agree60: number; agreeAll: number; score: number; parts: number[]; kAct: string | null; kPrice: number | null; kContract: string | null; kEdge: number | null; kWhy: string | null; start: string; src: string; startTs: number | null; phase: string; gDetail: string; gScore: string; rank30?: number | null; rankAll?: number | null; gName?: string }
interface BetRaw { firstTs: number | null; lastBuyTs: number | null; wallet: string; name: string; wr: number | null; resolved: number | null; cpnl: number; rank: number | null; golden: boolean; skill: boolean; top100: boolean; src: string; q: string; side: string; label: string; outcome: string; kind: string; league: string; shares: number | null; avg: number | null; now: number | null; cost: number; value: number | null; upnl: number | null; upct: number | null; consYes: number | null; consNo: number | null; agree60: number; agreeAll: number; score: number; parts: number[]; kAct: string | null; kPrice: number | null; kContract: string | null; kEdge: number | null; kWhy: string | null; start: string; src2: string; startTs: number | null; phase: string; gDetail: string; gScore: string; rank30?: number | null; rankAll?: number | null; gName?: string }
interface Trader { wallet: string; name: string; rank: number; pnl: number; wr: number | null; resolved: number | null; wins: number | null; losses: number | null; pf: number | null; skill: boolean; golden: boolean; qualified: boolean; bets: number; value: number; lastTs: number | null; skillEdge: number | null; rank30?: number | null; sportsPct?: number | null; rankAll?: number | null; pnl30?: number | null }
interface Line { key: string; type: string; ts: number | null; firstTs: number | null; fills: number; wallet: string; name: string; wr: number | null; resolved: number | null; pnl: number; top100: boolean; rank: number | null; golden: boolean; q: string; side: string; label: string; kind: string; league: string; entry: number | null; now: number | null; amount: number; shares: number | null; value: number | null; upnl: number | null; upct: number | null; hedged: boolean; agree60: number; agreeAll: number; score: number; parts: number[]; kAct: string | null; kPrice: number | null; kContract: string | null; kEdge: number | null; kWhy: string | null; start: string; src: string; startTs: number | null; phase: string; gDetail: string; gScore: string; source: string; rank30?: number | null; rankAll?: number | null; gName?: string }
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
const BANKROLL_KEY = "orca-scanner-bankroll-v1";
const DEFAULT_BANKROLL = "166";
const STALE_BANKROLLS = ["225.06", "225", "160"];
const DAILY_CAP = "Daily cap $40, stop after a losing reload; don't re-bet a pick you already lost today.";

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
const QMAP: Record<string, CapperRec> = (() => {
  const m: Record<string, CapperRec> = {};
  (((DATA.capperHistory && DATA.capperHistory.cappers) || []) as CapperRec[]).forEach((c: CapperRec) => { m[(c.wallet || "").toLowerCase()] = c; });
  return m;
})();
// Conviction (Noel, Nov 13): a whale's big bets are the real ones; tiny side bets are throwaways.
const CONV_W: Record<string, number> = { H: 1.5, N: 1, T: 0.1 };
const CONV_LABEL: Record<string, string> = { H: "High conviction", N: "Normal", T: "Throwaway" };
const CONV_PICK: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  Object.keys(QMAP).forEach((w: string) => { (QMAP[w].picks || []).forEach((p: CapperHistPick) => { if (p.conv) m[w + "|" + p.id] = p.conv; }); });
  return m;
})();
function convOf(wallet: string | null | undefined, cost: number | null | undefined, pid?: string | null): { tag: string; mult: number | null } {
  const lw = (wallet || "").toLowerCase();
  const rec = QMAP[lw];
  const c = cost || 0;
  const med = rec && rec.medBet ? rec.medBet : 0;
  const mult = med && c ? Math.round((c / med) * 10) / 10 : null;
  if (pid && CONV_PICK[lw + "|" + pid]) return { tag: CONV_PICK[lw + "|" + pid], mult };
  if (!med || !c) return { tag: "N", mult };
  if (c >= 2 * med) return { tag: "H", mult };
  if (c <= 0.25 * med || (rec && rec.maxBet && c <= 0.1 * rec.maxBet)) return { tag: "T", mult };
  return { tag: "N", mult };
}
function kShort(v: number | null | undefined): string {
  if (v == null) return "n/a";
  const a = Math.abs(v), sg = v < 0 ? "-" : "+";
  if (a >= 1e6) return sg + "$" + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1) + "M";
  if (a >= 1e3) return sg + "$" + Math.round(a / 1e3) + "K";
  return sg + "$" + Math.round(a);
}
function winShort(rec: CapperRec | undefined): string {
  if (!rec || !rec.win) return "";
  const w = rec.win;
  const g = (k: string) => (w[k] && w[k].pnl != null ? kShort(w[k].pnl) : "n/a");
  return "Wk " + g("week") + " · Mo " + g("month") + " · Yr " + g("year") + " · All " + g("all");
}
function badgeColor(b: string | undefined): string { return b === "Hot" ? GREEN : b === "Cold" ? RED : b === "Cooling" ? AMBER : "#64748B"; }
function convNet(backers: { wallet?: string | null; cost?: number | null }[], opp: number, pid?: string): number {
  let s = 0;
  backers.forEach((b) => { const c = b.cost || 0; s += c * (CONV_W[convOf(b.wallet, c, pid).tag] || 1); });
  return s - opp;
}
function backerStats(backers: { wallet?: string | null; cost?: number | null }[] | undefined, pid?: string): { quality: number; w: number; l: number; roi: number | null; text: string } {
  let tw = 0, tq = 0, w = 0, l = 0, rNum = 0, rDen = 0;
  (backers || []).forEach((b) => {
    const rec = QMAP[(b.wallet || "").toLowerCase()];
    const cost = (b.cost != null && b.cost > 0) ? b.cost : 0;
    const wt = (cost || 1) * (CONV_W[convOf(b.wallet, cost, pid).tag] || 1);
    tw += wt;
    tq += wt * ((rec && rec.quality) ? rec.quality : 0);
    if (rec) {
      w += rec.cw || 0;
      l += rec.cl || 0;
      if (rec.croi != null && (rec.crisked || 0) > 0) { rNum += wt * rec.croi; rDen += wt; }
    }
  });
  const roi = rDen ? Math.round((rNum / rDen) * 10) / 10 : null;
  const text = (w + l) ? ("Backers " + w + "–" + l + (roi != null ? ", " + (roi >= 0 ? "+" : "") + roi + "% ROI" : "")) : "Backers record building";
  return { quality: tw ? tq / tw : 0, w, l, roi, text };
}
function BackersLine(props: { backers: { wallet?: string | null; cost?: number | null; name?: string | null }[] | undefined; pid?: string }) {
  const t = useGrokTheme();
  const s = backerStats(props.backers, props.pid);
  const top = (props.backers || []).filter((b) => (b.cost || 0) > 0).slice().sort((a, b) => (b.cost || 0) - (a.cost || 0)).slice(0, 3);
  return (
    <div data-backers-line="1" style={{ marginTop: 6 }}>
      <div style={{ fontSize: 14, lineHeight: "20px", fontWeight: 750, color: t.text.primary }}>{s.text}</div>
      {top.map((b, i: number) => {
        const rec = QMAP[(b.wallet || "").toLowerCase()];
        const cv = convOf(b.wallet, b.cost, props.pid);
        const nm = (rec && rec.name && rec.name.indexOf("0x") !== 0 ? rec.name : b.name) || shortWallet(b.wallet || "");
        return (
          <div key={i} data-backer-conv={cv.tag} style={{ fontSize: 12, lineHeight: "17px", color: t.text.secondary, marginTop: 3 }}>
            <span style={{ fontWeight: 750, color: cv.tag === "H" ? GREEN : cv.tag === "T" ? t.text.tertiary : t.text.primary }}>{nm} {money(b.cost || 0)}{cv.mult != null ? " = " + cv.mult + "x usual" : ""} · {CONV_LABEL[cv.tag]}</span>
            {rec && rec.badge && rec.badge !== "n/a" ? <span style={{ fontWeight: 750, color: badgeColor(rec.badge) }}>{" · " + rec.badge}</span> : null}
            {rec && rec.win ? <span>{" · " + winShort(rec)}</span> : null}
          </div>
        );
      })}
    </div>
  );
}

function buyLine(b: BuyRaw, i: number): Line {
  return { key: "b" + i, type: "buy", ts: b.ts, firstTs: b.firstTs, fills: b.fills, wallet: b.wallet, name: b.name, wr: b.wr, resolved: null, pnl: b.wpnl, top100: b.top100, rank: b.rank, golden: b.golden, q: b.q, side: b.side, label: b.label, kind: b.kind, league: b.league, entry: b.price, now: b.now, amount: b.usd, shares: b.shares, value: null, upnl: null, upct: null, hedged: b.hedged, agree60: b.agree60, agreeAll: b.agreeAll, score: b.score, parts: b.parts, kAct: b.kAct, kPrice: b.kPrice, kContract: b.kContract, kEdge: b.kEdge, kWhy: b.kWhy, start: b.start, src: b.src, startTs: b.startTs, phase: b.phase, gDetail: b.gDetail, gScore: b.gScore, source: "OrcaLayer whale alert", rank30: b.rank30, rankAll: b.rankAll, gName: b.gName };
}
function betLine(b: BetRaw, i: number): Line {
  return { key: "p" + i, type: "bet", ts: b.lastBuyTs, firstTs: b.firstTs, fills: 1, wallet: b.wallet, name: b.name, wr: b.wr, resolved: b.resolved, pnl: b.cpnl, top100: b.top100, rank: b.rank, golden: b.golden, q: b.q, side: b.side, label: b.label, kind: b.kind, league: b.league, entry: b.avg, now: b.now, amount: b.cost, shares: b.shares, value: b.value, upnl: b.upnl, upct: b.upct, hedged: false, agree60: b.agree60, agreeAll: b.agreeAll, score: b.score, parts: b.parts, kAct: b.kAct, kPrice: b.kPrice, kContract: b.kContract, kEdge: b.kEdge, kWhy: b.kWhy, start: b.start, src: b.src2, startTs: b.startTs, phase: b.phase, gDetail: b.gDetail, gScore: b.gScore, source: "OrcaLayer whale open positions", rank30: b.rank30, rankAll: b.rankAll, gName: b.gName };
}
const BUY_LINES: Line[] = BUYS.map(buyLine);
const BET_LINES: Line[] = BETS.map(betLine);

const DEFAULT_FILTERS: Filters = { q: "", status: "active", betType: "all", evidence: "all", sort: "strength", lineSort: "strength", side: "", capper: "", min: "", max: "", bought: "", kSide: "", kStatus: "", kText: "", platform: "all", followedOnly: false, showHidden: false, hideHedgers: true, freshOnly: true, props: true };

const money = (n: number | null | undefined): string => (n === null || n === undefined ? "n/a" : (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US"));
const kMoney = (n: number): string => (Math.abs(n) >= 1000000 ? (n < 0 ? "-$" : "$") + (Math.abs(n) / 1000000).toFixed(Math.abs(n) >= 10000000 ? 1 : 2).replace(/\.?0+$/, "") + "M" : Math.abs(n) >= 10000 ? (n < 0 ? "-$" : "$") + (Math.abs(n) / 1000).toFixed(Math.abs(n) >= 100000 ? 0 : 1) + "k" : money(n));
const cents = (p: number | null | undefined): string => (p === null || p === undefined ? "n/a" : Math.round(p * 1000) / 10 + "¢");
const ptTime = (ts: number): string => new Date(ts * 1000).toLocaleString("en-US", { timeZone: "America/Los_Angeles", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " PT";
const ago = (ts: number, now: number): string => {
  const s = Math.max(0, now - ts);
  if (s < 3600) return Math.max(1, Math.round(s / 60)) + "m ago";
  if (s < 86400) return Math.round(s / 3600) + "h ago";
  return Math.round(s / 86400) + "d ago";
};
const until = (ts: number, now: number, start?: string): string => {
  if (!ts) {
    const d = (start || "").replace(/\s*\(time not supplied\)/i, "").replace(/Time n\/a/i, "").trim();
    return d || "Date n/a";
  }
  const s = ts - now;
  if (s <= 0) return "Started";
  const h = Math.floor(s / 3600);
  const m = Math.max(0, Math.round((s % 3600) / 60));
  return h > 0 ? "starts in " + h + "h " + m + "m" : "starts in " + m + "m";
};
const shortWallet = (w: string): string => (w && w.length > 12 ? w.slice(0, 6) + "…" + w.slice(-4) : w || "");
export const profileUrl = (w: string): string => "https://polymarket.com/profile/" + (w || "").toLowerCase();
export const eventUrl = (slug: string): string => "https://polymarket.com/event/" + (slug || "");
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
function usedPrice(p: Pick): number | null {
  if (p.kalshi && p.kalshi.status === "ok" && p.kalshi.price != null) return p.kalshi.price;
  return p.price != null ? p.price : null;
}
function priceBand(px: number | null): "best" | "mid" | "longshot" | "glue" {
  if (px == null) return "mid";
  const c = px * 100;
  if (c < 45) return "longshot";
  if (c >= 95) return "glue";
  if (c >= 65 && c <= 84) return "best";
  return "mid";
}
function oneSidedShare(p: Pick): number {
  if (p.oneSidedShare != null) return p.oneSidedShare;
  const tot = (p.invested || 0) + (p.oppMoney || 0);
  return tot > 0 ? (p.invested || 0) / tot : 1;
}
function overCents(p: Pick): number | null {
  if (p.overCents != null) return p.overCents;
  const px = usedPrice(p), avg = p.avgEntry;
  if (px == null || avg == null) return null;
  return Math.round((px - avg) * 1000) / 10;
}
function isStarted(p: Pick, now: number): boolean {
  if (p.started) return true;
  if (p.game && (p.game.state === "in" || p.game.state === "post")) return true;
  if (p.refresh && (p.refresh.state === "in" || p.refresh.state === "post" || !!p.refresh.ended || !!p.refresh.final)) return true;
  if (p.startTs && p.startTs <= now) return true;
  return false;
}
function pickIdOf(p: Pick): string {
  if (p.pickId) return p.pickId;
  const s = p.id || ((p.slug || "") + (p.label || ""));
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return (Math.abs(h).toString(36).toUpperCase() + "XXXXXX").slice(0, 6);
}
function dollarStake(word: "Go big" | "Normal" | "Small", bankroll: number, combo?: boolean): number {
  if (bankroll <= 0) return 0;
  if (combo) return Math.max(1, Math.round(bankroll * 0.01));
  const pct = word === "Go big" ? 0.04 : word === "Normal" ? 0.02 : 0.01;
  let s = Math.max(1, Math.round(bankroll * pct));
  if (word === "Go big") s = Math.min(10, s);
  return s;
}
function stakePctOf(word: "Go big" | "Normal" | "Small", combo?: boolean): number {
  if (combo) return 0.01;
  return word === "Go big" ? 0.04 : word === "Normal" ? 0.02 : 0.01;
}
function rankLabel(rankAll?: number | null, rank?: number | null, rank30?: number | null): string {
  if (rankAll) return "all-time #" + rankAll;
  if (rank30) return "#" + rank30 + " · 30d";
  if (rank) return "#" + rank;
  return "";
}
function gameKey(p: Pick): string {
  const m = (p.slug || "").match(/(.+-20\d\d-\d\d-\d\d)/);
  if (m) return m[1];
  return String(p.startTs || 0) + "|" + (p.league || "") + "|" + matchup(p.q).toLowerCase();
}

function gameTitle(p: { q: string; game?: { name?: string | null } }): string {
  const m = matchup(p.q);
  if (/\svs\.?\s/i.test(m)) return m;
  const n = (p.game && p.game.name) || "";
  if (n) return n.replace(/\s@\s/, " vs ");
  return m;
}
function matchup(q: string): string {
  let s = (q || "");
  s = s.replace(/^Will\s+/, "").replace(/\s+end in a draw\?$/, "").replace(/\?$/, "").replace(/\s*\(BO\d\)/, "").replace(/^[A-Za-z0-9 ]+:\s+(?=.+ vs)/, "").replace(/ vs\.? /, " vs ");
  const propGame = s.match(/^(.+?\svs\.?\s.+?):\s+(.+)$/i);
  if (propGame && !/^(1H |1st Half |1st half |First Half )?O\/U\b/i.test(propGame[2]) && !/both teams to score|^exact score|^spread:/i.test(propGame[2])) {
    return propGame[1].replace(/ vs\.? /, " vs ").replace(/\s+/g, " ").trim();
  }
  s = s.replace(/^Spread:\s*(.+?)\s*\((-?[\d.]+)\).*$/, "$1 spread");
  s = s.replace(/^Map Handicap:\s*/i, "Map handicap: ");
  s = s.replace(/\s*\([+-][\d.]+\)/g, "");
  s = s.replace(/:\s*(1H |1st Half |1st half )?O\/U\s+[\d.]+$/i, " · total");
  s = s.replace(/^Games Total:\s*O\/U\s+[\d.]+/i, "Series total");
  s = s.replace(/^Map \d+ Total Rounds:\s*Over\/Under\s+[\d.]+/i, "Map total rounds");
  return s.replace(/\s+/g, " ").trim();
}

function kickoffLabel(ts: number): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).formatToParts(new Date(ts * 1000));
  const get = (t: string): string => { const x = parts.find((p) => p.type === t); return x ? x.value : ""; };
  return (get("weekday") + " " + get("month") + " " + get("day") + " · " + get("hour") + ":" + get("minute") + " " + get("dayPeriod").toUpperCase() + " PT").replace(/\s+/g, " ").trim();
}
function tidyDate(start: string): string {
  if (!start) return "";
  let s = start.replace(/\s*\(time not supplied\)/i, "").replace(/\s*Time n\/a/i, "").trim();
  s = s.replace(/,\s+(\d{1,2}:\d{2}\s*[AP]M\s*PT)/i, " · $1");
  const iso = s.match(/^(20\d\d)-(\d\d)-(\d\d)$/);
  if (iso) {
    const d = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 18));
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short", month: "short", day: "numeric" }).formatToParts(d);
    const get = (t: string): string => { const x = parts.find((p) => p.type === t); return x ? x.value : ""; };
    return get("weekday") + " " + get("month") + " " + get("day");
  }
  return s;
}
function whenLine(ts: number | null | undefined, start: string | undefined, now: number, live?: boolean): { when: string; count: string } {
  if (ts) return { when: kickoffLabel(ts), count: until(ts, now) === "Started" && live ? "LIVE" : until(ts, now) };
  const d = tidyDate(start || "");
  return { when: d, count: live ? "LIVE" : "" };
}
function cleanFight(s: string): string {
  return (s || "").replace(/\s*\((?:[^)]*(?:Prelims|Main Card|Early Prelims|[A-Za-z]*weight)[^)]*)\)\s*/gi, " ").replace(/\s+/g, " ").trim();
}
function vsTitleOf(s: string): string {
  let t = cleanFight(s || "");
  t = t.replace(/\s+@\s+/, " vs ").replace(/\s+vs\.?\s+/i, " vs ");
  t = t.replace(/^[A-Za-z0-9 .]+:\s+(?=.+\svs\b)/, "");
  if (/\svs\s/i.test(t)) {
    const boxed = t.split(/:\s+/)[0];
    if (/\svs\s/i.test(boxed)) t = boxed;
    return t.replace(/\s*\(W\)\s*$/, "").trim();
  }
  return "";
}
type EvSlot = { league: string; title: string; teams: string[]; startTs: number; start: string };
function collectSlots(): EvSlot[] {
  const slots: EvSlot[] = [];
  const add = (league: string, q: string, gameName: string | null | undefined, startTs: number | null | undefined, start: string | undefined) => {
    const title = vsTitleOf(q) || vsTitleOf(gameName || "");
    if (!title) return;
    const teams = title.split(/\s+vs\s+/i).map((x) => cleanFight(x));
    slots.push({ league: league || "", title, teams, startTs: startTs || 0, start: start || "" });
  };
  [DATA.signals, DATA.fun, DATA.poly || [], DATA.glue || [], DATA.props || [], DATA.longshots || [], DATA.biggest || [], DATA.upcoming || []].forEach((arr) => {
    (arr || []).forEach((p: Pick) => add(p.league, p.q, p.game && p.game.name, p.startTs, p.game && p.game.start));
  });
  BET_LINES.concat(BUY_LINES).forEach((l: Line) => add(l.league, l.q, l.gName, l.startTs, l.start));
  return slots;
}
const EV_SLOTS: EvSlot[] = collectSlots();
function sameDay(a: string, b: string): boolean {
  if (!a || !b) return false;
  const ia = a.match(/20\d\d-\d\d-\d\d/); const ib = b.match(/20\d\d-\d\d-\d\d/);
  if (ia && ib) return ia[0] === ib[0];
  const ta = tidyDate(a), tb = tidyDate(b);
  return !!ta && ta === tb;
}
type EventBits = { league: string; title: string; highlight: string; startTs: number; start: string; player?: string; playerTeam?: string; hasOpp: boolean };
function resolveEvent(o: { league?: string; q?: string; label?: string; kind?: string; startTs?: number | null; start?: string; game?: { name?: string | null; start?: string; teams?: string[] }; gName?: string; slug?: string }): EventBits {
  const league = o.league || "";
  const q = o.q || "";
  const gameName = (o.game && o.game.name) || o.gName || "";
  let title = vsTitleOf(q) || vsTitleOf(gameName);
  let ts = o.startTs || 0;
  let start = (o.game && o.game.start) || o.start || "";
  if (!title) {
    const hints = matchupTeams(q).concat(o.label ? [String(o.label).replace(/\s+WIN.*$/i, "").replace(/\s+NOT TO WIN.*$/i, "").replace(/\s+\(-?[\d.]+\).*$/, "")] : []);
    const cands = EV_SLOTS.filter((s) => s.league === league && s.teams.some((t) => hints.some((h) => namesOverlap(t, h))));
    let best = cands.find((s) => !!(ts && s.startTs === ts)) || cands.find((s) => !!(start && (s.start === start || sameDay(s.start, start))));
    if (!best && ts) {
      const same = cands.filter((s) => s.startTs === ts);
      if (same.length === 1) best = same[0];
    }
    if (!best && cands.length === 1) best = cands[0];
    if (best) {
      title = best.title;
      if (!ts) ts = best.startTs;
      if (!start || /time not supplied/i.test(start)) start = best.start;
    }
  }
  if (!title) title = gameTitle({ q, game: { name: gameName || null } });
  const hasOpp = /\svs\s/i.test(title);
  let highlight = "";
  const lab = (o.label || "").replace(/\s+WIN.*$/i, "").replace(/\s+NOT TO WIN.*$/i, "").replace(/\s+\(-?[\d.]+\).*$/, "").trim();
  if (lab && hasOpp) {
    const teams = title.split(/\s+vs\s+/i);
    const hit = teams.find((t) => namesOverlap(t, lab) || namesOverlap(t, q));
    if (hit) highlight = hit;
  }
  let player = "";
  let playerTeam = "";
  if ((o.kind || "") === "prop") {
    const pm = q.match(/^(.+?):\s+/);
    if (pm && !/\svs\s/i.test(pm[1])) player = pm[1].trim();
    const slug = o.slug || "";
    const sm = slug.match(/^[a-z0-9]+-([a-z0-9]+)-([a-z0-9]+)-20\d\d/i);
    if (sm) playerTeam = sm[1].toUpperCase();
  }
  return { league, title, highlight, startTs: ts, start, player, playerTeam, hasOpp };
}
function EventMeta(props: { ev: EventBits; now: number; live?: boolean; compact?: boolean; extra?: ReactNode }) {
  const t = useGrokTheme();
  const { ev, now, live, compact } = props;
  const w = whenLine(ev.startTs, ev.start, now, live);
  const parts = ev.title.split(/(\s+vs\s+)/i);
  const node = (
    <span>
      {parts.map((x, i) => {
        if (/^\s*vs\s*$/i.test(x)) return <span key={i} style={{ fontWeight: 600, color: t.text.tertiary }}>{x}</span>;
        const on = !!(ev.highlight && namesOverlap(x, ev.highlight));
        return <span key={i} style={on ? { color: GREEN, fontWeight: 800 } : undefined}>{x}</span>;
      })}
    </span>
  );
  const head = ev.player ? (<span>{ev.player}{ev.playerTeam ? " (" + ev.playerTeam + ")" : ""}{ev.hasOpp ? <span> · {node}</span> : null}</span>) : node;
  if (compact) {
    return (
      <div style={{ overflowWrap: "anywhere" }}>
        {ev.league ? <span style={{ fontWeight: 700 }}>{ev.league} · </span> : null}
        {head}
        {w.when ? <span style={{ color: t.text.tertiary }}> · {w.when}</span> : null}
        {w.count ? <span style={{ color: live ? RED : t.text.secondary, fontWeight: 700 }}> · {w.count}</span> : null}
      </div>
    );
  }
  return (
    <div data-event-meta="1">
      <div style={{ fontSize: 14, lineHeight: "19px", fontWeight: 600, color: t.text.secondary, overflowWrap: "anywhere" }}>
        {ev.league ? <span style={{ fontWeight: 800, color: t.text.primary }}>{ev.league}</span> : null}
        {ev.league ? <span style={{ color: t.text.tertiary }}> · </span> : null}
        {head}
      </div>
      {w.when || w.count || props.extra ? (
        <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.tertiary, marginTop: 4 }}>
          {w.when}{w.count ? <span style={{ color: live ? RED : t.text.secondary, fontWeight: 700 }}> · {w.count}</span> : null}
          {props.extra ? <span>{w.when || w.count ? " · " : null}{props.extra}</span> : null}
        </div>
      ) : null}
    </div>
  );
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
    "strength": (a: Line, b: Line) => backerStats([{ wallet: b.wallet, cost: b.amount }]).quality - backerStats([{ wallet: a.wallet, cost: a.amount }]).quality || cmpStrength(1 + (a.agreeAll || 0), a.amount, 0, qualityOf(a), 1 + (b.agreeAll || 0), b.amount, 0, qualityOf(b)),
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
  r.sort(cmp[sort] || cmp["strength"]);
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
              <div style={{ fontWeight: 800, fontSize: 14 }}>Full scan: top all-time sports whales</div>
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
              <div style={{ marginTop: 4, color: "rgba(255,255,255,0.85)" }}>Checks live status, final results and ESPN win chances, logs W/L to the Journal, and drops games that have already started from Top 20, Upcoming, Fun, Polymarket, Player Props, Longshots, Biggest Bets and combos (live games stay on Bets). Ended games are removed everywhere. No OrcaLayer calls.</div>
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
      <div style={{ fontSize: 13, lineHeight: "18px", color: "rgba(255,255,255,0.82)", marginTop: 4 }}>Top {DATA.coverage.cappers} all-time sports whales · games that haven't started, next {DATA.settings.windowH} hours</div>
      <div style={{ fontSize: 12, lineHeight: "17px", color: "rgba(255,255,255,0.78)", marginTop: 2 }}>Scanned {DATA.scannedAt} · Refreshed {DATA.refreshedAt || "not yet"}</div>
      <ActionBar />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
        {stat(String(props.top), "TOP PICKS")}
        {stat(String(props.fun), "FUN PICKS")}
        {stat(String(props.buys), "RECENT BUYS")}
        {stat(String(props.bets), "SPORTS BETS")}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
        {chip("Top " + DATA.coverage.cappers + " whales · all-time")}
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


function matchupTeams(q: string): string[] {
  if (!q) return [];
  let s = q.replace(/^(Spread:\s*|Map Handicap:\s*|Exact Score:\s*|Counter-Strike:\s*)/i, "");
  s = s.replace(/:\s*(1H |1st Half |1st half )?O\/U\s+[\d.]+$/i, "");
  s = s.replace(/\s*\(BO\d\).*$/i, "");
  s = s.replace(/\s+-\s+(BLAST|CCT|Map|Group).*$/i, "");
  s = s.replace(/\s+on\s+\d{4}-\d{2}-\d{2}.*$/i, "");
  s = s.replace(/^[A-Za-z0-9 .]+:\s+(?=.+\svs)/, "");
  let m = s.match(/^Will\s+(.+?)\s+vs\.?\s+(.+?)\s+end/i);
  if (m) return [m[1].trim(), m[2].trim()];
  m = s.match(/(.+?)\s+vs\.?\s+(.+)$/i);
  if (m) return [m[1].replace(/\s*\([+-]?[\d.]+\)\s*$/, "").trim(), m[2].replace(/\s*\([+-]?[\d.]+\)\s*$/, "").trim()];
  m = s.match(/^(.+?)\s+\d+\s*[-–]\s*\d+\s+(.+?)\??$/);
  if (m) return [m[1].trim(), m[2].replace(/\?$/, "").trim()];
  m = s.match(/^Will\s+(.+?)\s+win\b/i);
  if (m) return [m[1].trim()];
  m = q.match(/^Spread:\s*(.+?)\s*\(/i);
  if (m) return [m[1].trim()];
  return [];
}
function normName(s: string): string { return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function namesOverlap(a: string, b: string): boolean {
  const x = normName(a), y = normName(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  const xs = x.split(" ").filter((w: string) => w.length > 2);
  const ys = y.split(" ").filter((w: string) => w.length > 2);
  return xs.some((w: string) => ys.indexOf(w) >= 0 && w.length > 3);
}
function otherTeam(q: string, team: string, teams?: string[]): string | null {
  const list = (teams && teams.length ? teams : matchupTeams(q)).slice();
  if (!team || !list.length) return null;
  const n = team.toLowerCase();
  const hit = list.find((t: string) => { const x = t.toLowerCase(); return x === n || x.indexOf(n) >= 0 || n.indexOf(x) >= 0; });
  const rest = list.filter((t: string) => t !== hit);
  return rest.length ? rest[0] : null;
}
const GOAL_LEAGUES = /^(EPL|UCL|UEL|UECL|LAL|UNL|FIF|IFR|CDR|UWCL|UWEC|BUN|BL2|SEA|ITB|FL1|FL2|ERE|POR|MEX|MEX2|BRA|ARG|SPL|EFL|ELC|EFA|LCUP|TUR|SCO|BEL|DEN|NOR|SWE|JAP|KOR|AUS|LIB|SUD|COF|DFB|ITC|NWSL|MLS|NHL|KHL|SHL|AHL|NIRL|NIRL1|CONL|AFCQ|CDE|CRINT|PER1|COL1|CLF|CAF|CAN|WCQ|SAUD|EGY|RSA|CHI|URU|PAR|ECU|VEN|BOL|USL|FAC|COP|AFC|OFC|GOL|SUDQ|AFCON|GOLD)$/i;
const POINT_LEAGUES = /^(NBA|WNBA|NFL|CFB|CBB|CWBB)$/i;
const RUN_LEAGUES = /^(MLB|NPB|KBO)$/i;
function isGoals(league: string, q: string): boolean {
  if (/goal/i.test(q || "")) return true;
  if (GOAL_LEAGUES.test(league || "")) return true;
  if (POINT_LEAGUES.test(league || "") || RUN_LEAGUES.test(league || "") || isEsport(league, q)) return false;
  const m = (q || "").match(/O\/U\s+([\d.]+)/i) || (q || "").match(/Over\/Under\s+([\d.]+)/i);
  return !!(m && parseFloat(m[1]) <= 6.5);
}
function isEsport(league: string, q: string): boolean {
  return /^(CS2|DOTA2|LOL|VAL|R6|COD|OW|RL)$/i.test(league || "") || /map handicap|map \d|counter-strike|dota|valorant/i.test(q || "");
}
function unitWord(league: string, q: string, plural: boolean): string {
  if (/rounds/i.test(q || "")) return plural ? "rounds" : "round";
  if (isEsport(league, q)) return plural ? "maps" : "map";
  if (isGoals(league, q)) return plural ? "goals" : "goal";
  if (RUN_LEAGUES.test(league || "") || /\bruns?\b/i.test(q || "")) return plural ? "runs" : "run";
  return plural ? "points" : "point";
}
const coverNeed = (line: number): number => (Math.round(line) === line ? line + 1 : Math.ceil(line));
const dogMaxLose = (line: number): number => Math.floor(line);
function parseSpread(label: string, q: string, side: string): { team: string; line: number; against: boolean; dog: boolean } | null {
  const lab = (label || "").trim();
  let m = lab.match(/^(.+?)\s+([+-])([\d.]+)\s+or better for the other side$/i);
  if (m) return { team: m[1].trim(), line: parseFloat(m[3]), against: true, dog: false };
  m = lab.match(/^(.+?)\s+\(\+([\d.]+)\)$/);
  if (m) return { team: m[1].trim(), line: parseFloat(m[2]), against: false, dog: true };
  m = lab.match(/^(.+?)\s+\(-([\d.]+)\)$/);
  if (m) return { team: m[1].trim(), line: parseFloat(m[2]), against: false, dog: false };
  m = lab.match(/^(.+?)\s+-([\d.]+)$/);
  if (m) return { team: m[1].trim(), line: parseFloat(m[2]), against: false, dog: false };
  m = lab.match(/^(.+?)\s+\+([\d.]+)$/);
  if (m) return { team: m[1].trim(), line: parseFloat(m[2]), against: false, dog: true };
  m = (q || "").match(/^Spread:\s*(.+?)\s*\((-?[\d.]+)\)/);
  if (m) {
    const line = Math.abs(parseFloat(m[2]));
    return { team: m[1].trim(), line, against: (side || "").toLowerCase() !== "yes", dog: false };
  }
  return null;
}
function parseTotalLine(q: string): number | null {
  const m = (q || "").match(/O\/U\s+([\d.]+)/i) || (q || "").match(/Over\/Under\s+([\d.]+)/i);
  return m ? parseFloat(m[1]) : null;
}
function enrichContract(act: string, contract: string, kind: string): string {
  const c = (contract || "").trim();
  if (!act || !c) return act || "";
  if (/win by over|wins by over|over\s+[\d.]+|under\s+[\d.]+|\bto win\b|total|tie|draw/i.test(c)) return act + " · " + c;
  if (kind === "moneyline" || kind === "teamwin" || kind === "draw") {
    if (!/win/i.test(c)) return act + " · " + c + ( /^(tie|draw)$/i.test(c) ? "" : " to win");
  }
  return act + " · " + c;
}

const PROP_STATS: [RegExp, string][] = [
  [/points?\s*\+\s*rebounds?\s*\+\s*assists?|\bpra\b/i, "points + rebounds + assists"],
  [/points?\s*\+\s*rebounds?|pts\s*\+\s*reb/i, "points + rebounds"],
  [/points?\s*\+\s*assists?|pts\s*\+\s*ast/i, "points + assists"],
  [/rebounds?\s*\+\s*assists?|reb\s*\+\s*ast/i, "rebounds + assists"],
  [/rush(?:ing)?\s*(?:and|&|\+)\s*receiv(?:ing)?\s*yards/i, "rushing and receiving yards"],
  [/passing yards|pass(?:ing)? yds/i, "passing yards"],
  [/rushing yards|rush(?:es|ing)? yds|rushes for/i, "rushing yards"],
  [/receiving yards|rec(?:eiving)? yds/i, "receiving yards"],
  [/passing touchdowns?|pass(?:ing)? tds?/i, "passing touchdowns"],
  [/rushing touchdowns?|rush(?:ing)? tds?/i, "rushing touchdowns"],
  [/receiving touchdowns?|rec(?:eiving)? tds?/i, "receiving touchdowns"],
  [/\breceptions?\b/i, "receptions"],
  [/anytime\s+(?:td|touchdown)|to score a touchdown/i, "a touchdown"],
  [/first touchdown|first td/i, "first touchdown"],
  [/first goal(?:scorer)?/i, "first goal"],
  [/anytime goal(?:scorer)?/i, "a goal"],
  [/\btouchdowns?\b|\btds?\b/i, "touchdowns"],
  [/three[-\s]?pointers?|\bthrees?\b|\b3[-\s]?pt(?:s|ers?)?\b/i, "threes"],
  [/\bpoints?\b|\bpts\b/i, "points"],
  [/\brebounds?\b|\brebs?\b/i, "rebounds"],
  [/\bassists?\b|\basts?\b/i, "assists"],
  [/\bsteals?\b/i, "steals"],
  [/\bblocks?\b/i, "blocks"],
  [/steals?\s*(?:and|&|\+)\s*blocks?|\bstocks?\b/i, "steals + blocks"],
  [/\bhits\b/i, "hits"],
  [/home runs?|\bhrs?\b/i, "home runs"],
  [/strikeouts?|\bks\b/i, "strikeouts"],
  [/\bgoals?\b/i, "goals"],
  [/shots on goal|\bshots\b/i, "shots"],
];
function isBtts(q: string): boolean { return /both teams to score/i.test(q || ""); }
function matchPropStat(text: string): string | null {
  for (let i = 0; i < PROP_STATS.length; i++) if (PROP_STATS[i][0].test(text || "")) return PROP_STATS[i][1];
  return null;
}
function parsePropQ(q: string, label?: string): { player: string; line: number | null; word: string } | null {
  if (isBtts(q)) return null;
  if (/\b(o\/?u|over\/under|total)\b/i.test(q || "") && !/(points|rebounds|assists|yards|touchdown|receptions|threes|strikeouts|home runs|hits|steals|blocks)/i.test(q || "")) return null;
  if (/^.+\svs\.?\s.+:\s*(1st half |first half |1h )?o\/?u\s*[\d.]+(\s*(points?|goals?|runs?))?$/i.test(q || "")) return null;
  const word = matchPropStat(q) || matchPropStat(label || "");
  if (!word) return null;
  let line: number | null = null;
  const lm = (q || "").match(/(\d+(?:\.\d+)?)\s*\+/) || (q || "").match(/(?:o\/?u|over\/under|over|under)\s*(\d+(?:\.\d+)?)/i);
  if (lm) line = parseFloat(lm[1]);
  let player: string | null = null;
  const qm = (q || "").match(/^(.+?)\s*:\s*/);
  if (qm) {
    const head = qm[1].trim();
    if (/\svs\.?\s/i.test(head)) {
      const rest = (q || "").slice(qm[0].length);
      const pm = rest.match(/^(.+?)\s+(?:o\/?u|over|under|\d)/i) || rest.match(/^(.+?)\s*$/);
      if (pm && !matchPropStat(pm[1])) player = pm[1].trim();
    } else player = head;
  }
  if (!player) {
    const pm = (q || "").match(/^(.+?)\s+(?:\d+\+?|over|under|o\/?u|rushes|rushing|receiving|passing|records)/i);
    if (pm && !/\svs\.?\s/i.test(pm[1])) player = pm[1].trim();
  }
  if (!player) return null;
  return { player, line, word };
}
function isPlayerProp(p: { kind?: string; q?: string; label?: string }): boolean {
  if (isBtts(p.q || "")) return false;
  if (p.kind === "prop") return true;
  return !!parsePropQ(p.q || "", p.label || "");
}
function isLongshot(p: Pick, whales: number, now: number): boolean {
  const px = usedPrice(p);
  if (px == null || px < 0.10 || px > 0.20) return false;
  if (whales < 2 || isStarted(p, now)) return false;
  if (oneSidedShare(p) < 0.55) return false;
  return true;
}

interface Explained { headline: string; meaning: string; poly: string; action: string | null; act: string | null; price: number | null; contract: string | null; ok: boolean; kalshiOk: boolean; why: string }
function explainBet(o: { kind?: string; label?: string; q?: string; side?: string; league?: string; teams?: string[]; kAct?: string | null; kContract?: string | null; kPrice?: number | null; kWhy?: string | null; polyPrice?: number | null }): Explained {
  const kind = o.kind || "other";
  const label = (o.label || "").trim();
  const q = o.q || "";
  const side = (o.side || "").toLowerCase();
  const league = o.league || "";
  const teams = o.teams || matchupTeams(q);
  const kOk = !!(o.kAct && o.kContract && (o.kPrice || o.kPrice === 0));
  let headline = label, meaning = "";
  const unitP = unitWord(league, q, true);
  const isDrawLab = /^NO DRAW$/i.test(label) || /^DRAW$/i.test(label) || kind === "draw";
  const isNotWin = /not to win$/i.test(label);
  const prop = (kind === "prop" || (kind !== "total" && kind !== "spread" && kind !== "moneyline" && kind !== "draw" && kind !== "teamwin")) ? parsePropQ(q, label) : null;
  if (prop) {
    const under = side === "no" || /^UNDER$/i.test(label) || (/under/i.test(label) && !/^OVER$/i.test(label) && !/^YES$/i.test(label));
    if (prop.line != null && prop.line === Math.round(prop.line)) {
      headline = under ? prop.player + " under " + prop.line + " " + prop.word : prop.player + " " + prop.line + "+ " + prop.word;
      meaning = "This bet wins if " + prop.player + (under ? " records fewer than " + prop.line + " " + prop.word : " records " + prop.line + " or more " + prop.word);
    } else if (prop.line != null) {
      headline = prop.player + (under ? " under " : " over ") + prop.line + " " + prop.word;
      meaning = "This bet wins if " + prop.player + " records " + (under ? "under " : "over ") + prop.line + " " + prop.word;
    } else {
      headline = under ? prop.player + " not " + prop.word : prop.player + " " + prop.word;
      meaning = "This bet wins if " + prop.player + (under ? " does not record " : " records ") + prop.word;
    }
  } else if (isDrawLab) {
    if (/^NO DRAW$/i.test(label) || side === "no") { headline = "No draw (either team wins)"; meaning = "This bet wins if the match does not end in a draw"; }
    else { headline = "Match ends in a draw"; meaning = "This bet wins if the match ends in a draw"; }
  } else if (kind === "moneyline" || kind === "teamwin" || isNotWin || / WIN$/.test(label)) {
    const team = label.replace(/\s+not to win$/i, "").replace(/\s+win$/i, "").trim();
    if (isNotWin) { headline = team + " not to win"; meaning = "This bet wins if " + team + " do not win the game"; }
    else { headline = team + " to win"; meaning = "This bet wins if " + team + " win the game"; }
  } else if (kind === "total" || parseTotalLine(q) !== null) {
    const line = parseTotalLine(q);
    const under = /^UNDER$/i.test(label) || /^NO$/i.test(label) || (!/^OVER$/i.test(label) && !/^YES$/i.test(label) && (side === "no" || /under/i.test(label)));
    const dir = under ? "Under" : "Over";
    const half = /1H|1st Half/i.test(q) ? " first-half" : "";
    if (line !== null) {
      headline = dir + " " + line + " total" + (half ? half + " " : " ") + unitP;
      meaning = "This bet wins if the combined" + (half ? " first-half" : "") + " score is " + dir.toLowerCase() + " " + line;
    } else { headline = dir + " the total"; meaning = "This bet wins if the combined score is " + dir.toLowerCase() + " the total"; }
  } else if (kind === "spread" || /[+-]\d/.test(label) || /^Spread:/i.test(q) || /Map Handicap/i.test(q)) {
    const sp = parseSpread(label, q, side);
    if (sp) {
      const opp = otherTeam(q, sp.team, teams);
      if (sp.dog) {
        headline = sp.team + " to win, or lose by " + dogMaxLose(sp.line) + " or fewer " + unitP;
        meaning = "This bet wins if " + sp.team + " win, or lose by " + dogMaxLose(sp.line) + " or fewer " + unitP;
      } else if (sp.against) {
        if (opp) {
          headline = opp + " to win, or lose by " + dogMaxLose(sp.line) + " or fewer " + unitP;
          meaning = "This bet wins if " + opp + " win, or lose by " + dogMaxLose(sp.line) + " or fewer " + unitP;
        } else {
          headline = sp.team + " do not win by over " + sp.line + " " + unitP;
          meaning = "This bet wins if " + sp.team + " win by " + dogMaxLose(sp.line) + " or fewer " + unitP + ", or lose";
        }
      } else {
        headline = sp.team + " win by over " + sp.line + " " + unitP;
        meaning = "This bet wins if " + sp.team + " win by " + coverNeed(sp.line) + " or more " + unitP;
      }
    }
  } else if (/(Map|Game) \d+ Winner/i.test(q) && label && !/^No$/i.test(label) && !/^Yes$/i.test(label)) {
    const mm = q.match(/(Map|Game) (\d+)/i);
    const what = mm ? (mm[1].toLowerCase() === "game" ? "Game " : "Map ") + mm[2] : "the map";
    headline = label + " to win " + what;
    meaning = "This bet wins if " + label + " win " + what;
  } else if (/Both Teams to Score/i.test(q)) {
    const half = /First Half|1st Half|1H/i.test(q) ? " in the first half" : "";
    const no = side === "no" || /^No$/i.test(label);
    headline = (no ? "Both teams not to score" : "Both teams to score") + half;
    meaning = "This bet wins if " + (no ? "at least one team does not score" : "both teams score") + half;
  } else if (/^Exact Score:/i.test(q) && /^No$/i.test(label)) {
    const sc = q.match(/(\d+\s*[-–]\s*\d+)/);
    headline = sc ? "Not a " + sc[1].replace(/\s/g, "") + " final" : "Not this exact score";
    meaning = "This bet wins if the final score is not " + (sc ? sc[1] : "the listed score");
  } else if (label) {
    headline = label;
    meaning = q && q !== label ? "Polymarket market: " + q : "This is the outcome the whale bought";
  }
  const polyPrice = o.polyPrice !== undefined && o.polyPrice !== null ? o.polyPrice : null;
  const polyAction = "On Polymarket: BUY '" + headline + "'";
  return {
    headline,
    meaning,
    poly: headline,
    action: kOk ? enrichContract(o.kAct as string, o.kContract as string, kind) : polyAction,
    act: kOk ? (o.kAct as string) : "BUY",
    price: kOk ? (o.kPrice as number) : polyPrice,
    contract: kOk ? (o.kContract as string) : headline,
    ok: kOk || !!headline,
    kalshiOk: kOk,
    why: o.kWhy || "No verified Kalshi equivalent"
  };
}
function explainLine(l: Line, teams?: string[]): Explained {
  return explainBet({ kind: l.kind, label: l.label, q: l.q, side: l.side, league: l.league, teams, kAct: l.kAct, kContract: l.kContract, kPrice: l.kPrice, kWhy: l.kWhy, polyPrice: l.now != null ? l.now : l.entry });
}
function sideOfPick(p: Pick): string {
  const hit = BET_LINES.concat(BUY_LINES).find((l: Line) => pickCatalogKey(l.q, l.label) === pickCatalogKey(p.q, p.label));
  return hit ? (hit.side || "") : "";
}
function explainPick(p: Pick, onPoly?: boolean): Explained {
  const k = p.kalshi;
  const ex = explainBet({ kind: p.kind, label: p.label, q: p.q, side: sideOfPick(p), league: p.league, kAct: !onPoly && k.status === "ok" ? (k.action || null) : null, kContract: k.contract || null, kPrice: k.price === undefined ? null : k.price, kWhy: k.why || null, polyPrice: p.price });
  if (onPoly) {
    const name = ex.headline || p.label || "this outcome";
    ex.ok = true;
    ex.act = "BUY";
    ex.action = "On Polymarket: BUY '" + name + "'";
    ex.price = p.price;
    ex.contract = name;
    const win = (ex.meaning || "").replace(/^This bet wins if\s+/i, "").replace(/\.$/, "");
    if (win) ex.meaning = name + (win && win.toLowerCase() !== name.toLowerCase() ? " — " + win : "");
  }
  return ex;
}
const GO_BIG_MONEY = 10000;
const GO_BIG_OPP = 0.15;
function strengthWord(whales: number, money: number, opp: number): "Go big" | "Normal" | "Small" {
  const light = !opp || opp < money * GO_BIG_OPP;
  if (whales >= 3 || (money >= GO_BIG_MONEY && light)) return "Go big";
  if (whales >= 2) return "Normal";
  return "Small";
}
function pickInfo(p: Pick, whales: number): { word: "Go big" | "Normal" | "Small"; glue: boolean; split: boolean; pricier: boolean; tooPricier: boolean; band: "best" | "mid" | "longshot" | "glue"; share: number; over: number | null; px: number | null } {
  const share = oneSidedShare(p);
  const px = usedPrice(p);
  const band = priceBand(px);
  const over = overCents(p);
  const split = share < 0.65;
  const glue = band === "glue";
  const pricier = over != null && over > 3;
  const tooPricier = over != null && over > 5;
  let word: "Go big" | "Normal" | "Small" = strengthWord(whales, p.invested, p.oppMoney || 0);
  if (band === "longshot" || glue || split) word = "Small";
  else if (p.kind === "spread" && !(whales >= 3 && share >= 0.65) && word === "Go big") word = "Normal";
  return { word, glue, split, pricier, tooPricier, band, share, over, px };
}
function rankKey(p: Pick, whales: number, backers?: Backer[]): [number, number, number, number, number, number] {
  const info = pickInfo(p, whales);
  const band = info.band === "best" ? 0 : info.band === "mid" ? 1 : 2;
  const bs = backers && backers.length ? backers : p.backers;
  const q = backerStats(bs, p.id).quality;
  // Conviction: throwaway-size bets barely count toward net money or agreement; big bets are boosted.
  const net = bs.length ? convNet(bs, p.oppMoney || 0, p.id) : (p.net != null ? p.net : (p.invested - (p.oppMoney || 0)));
  const real = bs.length ? bs.filter((b: Backer) => convOf(b.wallet, b.cost, p.id).tag !== "T").length : whales;
  const best = Math.min(...(bs.length ? bs.map((b: Backer) => b.rankAll || b.rank || 999) : [999]));
  return [band, -q, -net, -info.share, -Math.min(whales, real), best];
}
function cmpRankKey(a: [number, number, number, number, number, number], b: [number, number, number, number, number, number]): number {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}
function topEligible(p: Pick, whales: number, now: number): boolean {
  if (whales < 2 || isStarted(p, now) || isPlayerProp(p)) return false;
  if (p.kalshi.status !== "ok") return false;
  const info = pickInfo(p, whales);
  if (info.band === "longshot" || info.band === "glue") return false;
  if (info.share < 0.55) return false;
  if (info.pricier) return false;
  return true;
}
function strengthColor(w: string): string { return w === "Go big" ? GREEN : w === "Normal" ? BRAND : AMBER; }
function qualityOf(l: Line): number { return (l.golden ? 1000 : 0) - (l.rankAll || l.rank || 999); }
function cmpStrength(wa: number, ma: number, oa: number, qa: number, wb: number, mb: number, ob: number, qb: number): number {
  return wb - wa || mb - ma || oa - ob || qb - qa;
}

interface GamePack { key: string; title: string; teams: string[]; league: string; start: string; src: string; startTs: number | null; phase: string; gDetail: string; gScore: string; rows: Line[]; exposure: number; whales: number; oppMoney: number; heavyName: string; heavyMoney: number; otherName: string; otherMoney: number; overMoney: number; underMoney: number; primary: Line; score: number; quality: number }
function sideTeam(l: Line, teams: string[]): string {
  if (l.kind === "total") return /^UNDER$/i.test(l.label) || (l.side === "no" && !/^OVER$/i.test(l.label)) ? "Under" : "Over";
  const sp = parseSpread(l.label, l.q, l.side);
  if (sp) {
    if (sp.dog) return sp.team;
    if (sp.against) return otherTeam(l.q, sp.team, teams) || ("vs " + sp.team);
    return sp.team;
  }
  if (/not to win$/i.test(l.label)) {
    const team = l.label.replace(/\s+not to win$/i, "").trim();
    return otherTeam(l.q, team, teams) || ("not " + team);
  }
  if (l.kind === "draw") return /NO DRAW/i.test(l.label) || l.side === "no" ? "No draw" : "Draw";
  return l.label.replace(/\s+win$/i, "").trim() || l.label;
}
export function groupGames(rows: Line[], sort: string): GamePack[] {
  const items = rows.map((l: Line) => ({ l, teams: matchupTeams(l.q) }));
  const slotPairs: Record<string, string[][]> = {};
  items.forEach((it) => {
    if (it.teams.length === 2) {
      const k = (it.l.league || "") + "|" + (it.l.startTs || it.l.start || "");
      (slotPairs[k] = slotPairs[k] || []).push(it.teams);
    }
  });
  const resolved = (it: { l: Line; teams: string[] }): { key: string; teams: string[] } => {
    const slot = (it.l.league || "") + "|" + (it.l.startTs || it.l.start || "");
    let teams = it.teams.slice();
    if (teams.length < 2) {
      const name = teams[0];
      const hit = (slotPairs[slot] || []).find((p: string[]) => p.some((t: string) => namesOverlap(t, name)));
      if (hit) teams = hit.slice();
    }
    if (teams.length === 2) {
      const richer = (slotPairs[slot] || []).find((p: string[]) => p.filter((t: string) => teams.some((x: string) => namesOverlap(t, x))).length >= 1 && p.join(" ").length > teams.join(" ").length);
      if (richer) teams = richer.slice();
    }
    const keyTeams = teams.length ? teams.map(normName).sort().join("|") : normName(it.l.q);
    return { key: (it.l.league || "") + "|" + (it.l.startTs || it.l.start || "na") + "|" + keyTeams, teams };
  };
  const m: Record<string, GamePack> = {};
  const order: string[] = [];
  items.forEach((it) => {
    const r = resolved(it);
    if (!m[r.key]) {
      m[r.key] = { key: r.key, title: r.teams.length >= 2 ? r.teams[0] + " vs " + r.teams[1] : (r.teams[0] || matchup(it.l.q) || it.l.q), teams: r.teams, league: it.l.league, start: it.l.start, src: it.l.src, startTs: it.l.startTs, phase: it.l.phase, gDetail: it.l.gDetail, gScore: it.l.gScore, rows: [], exposure: 0, whales: 0, oppMoney: 0, heavyName: "", heavyMoney: 0, otherName: "", otherMoney: 0, overMoney: 0, underMoney: 0, primary: it.l, score: 0, quality: 0 };
      order.push(r.key);
    }
    const g = m[r.key];
    g.rows.push(it.l);
    if (r.teams.length > g.teams.length) { g.teams = r.teams; g.title = r.teams.length >= 2 ? r.teams[0] + " vs " + r.teams[1] : (r.teams[0] || g.title); }
    if (it.l.gScore && !g.gScore) g.gScore = it.l.gScore;
    if (it.l.gDetail && !g.gDetail) g.gDetail = it.l.gDetail;
  });
  const gs = order.map((k: string) => m[k]);
  gs.forEach((g: GamePack) => {
    const buckets: Record<string, number> = {};
    const wallets: Record<string, Set<string>> = {};
    g.rows.forEach((l: Line) => {
      const s = sideTeam(l, g.teams);
      buckets[s] = (buckets[s] || 0) + l.amount;
      (wallets[s] = wallets[s] || new Set()).add((l.wallet || "").toLowerCase());
      if (s === "Over") g.overMoney += l.amount;
      if (s === "Under") g.underMoney += l.amount;
    });
    g.exposure = g.rows.reduce((a: number, l: Line) => a + l.amount, 0);
    const teamNames = g.teams.length ? g.teams : Object.keys(buckets).filter((n: string) => n !== "Over" && n !== "Under" && n !== "Draw" && n !== "No draw");
    const teamAmt = teamNames.map((n: string) => {
      const hit = Object.keys(buckets).filter((b: string) => namesOverlap(b, n) || b === n);
      const amt = hit.reduce((a: number, b: string) => a + buckets[b], 0) || (buckets[n] || 0);
      const ws = new Set<string>();
      hit.forEach((b: string) => (wallets[b] || new Set()).forEach((w: string) => ws.add(w)));
      if (wallets[n]) wallets[n].forEach((w: string) => ws.add(w));
      return { n, amt, ws };
    }).sort((a, b) => b.amt - a.amt);
    if (teamAmt.length && teamAmt[0].amt > 0) {
      g.heavyName = teamAmt[0].n; g.heavyMoney = teamAmt[0].amt; g.whales = teamAmt[0].ws.size;
      if (teamAmt[1]) { g.otherName = teamAmt[1].n; g.otherMoney = teamAmt[1].amt; }
    } else if (g.overMoney + g.underMoney > 0) {
      if (g.overMoney >= g.underMoney) { g.heavyName = "Over"; g.heavyMoney = g.overMoney; g.otherName = "Under"; g.otherMoney = g.underMoney; }
      else { g.heavyName = "Under"; g.heavyMoney = g.underMoney; g.otherName = "Over"; g.otherMoney = g.overMoney; }
      g.whales = (wallets[g.heavyName] || new Set()).size;
    } else {
      const top = Object.keys(buckets).sort((a, b) => buckets[b] - buckets[a])[0] || "";
      g.heavyName = top; g.heavyMoney = buckets[top] || 0; g.whales = (wallets[top] || new Set()).size;
    }
    g.oppMoney = g.otherMoney;
    const onHeavy = g.rows.filter((l: Line) => {
      const s = sideTeam(l, g.teams);
      return s === g.heavyName || namesOverlap(s, g.heavyName);
    });
    const pool = onHeavy.length ? onHeavy : g.rows;
    pool.sort((a: Line, b: Line) => (1 + b.agreeAll) - (1 + a.agreeAll) || b.amount - a.amount);
    g.primary = pool[0];
    g.score = g.rows.reduce((a: number, l: Line) => Math.max(a, l.score), 0);
    g.quality = pool.reduce((a: number, l: Line) => Math.max(a, qualityOf(l)), 0);
  });
  const st = (g: GamePack): number => (g.startTs === null ? BIG : g.startTs);
  if (sort === "start" || sort === "resolving") gs.sort((a: GamePack, b: GamePack) => (a.phase === "live" ? 0 : 1) - (b.phase === "live" ? 0 : 1) || st(a) - st(b));
  else if (sort === "entry") gs.sort((a: GamePack, b: GamePack) => (Math.min(...a.rows.map((l: Line) => l.firstTs || BIG))) - (Math.min(...b.rows.map((l: Line) => l.firstTs || BIG))));
  else if (sort === "exposure") gs.sort((a: GamePack, b: GamePack) => b.exposure - a.exposure);
  else if (sort === "score") gs.sort((a: GamePack, b: GamePack) => b.score - a.score);
  else gs.sort((a: GamePack, b: GamePack) => cmpStrength(a.whales, a.heavyMoney, a.oppMoney, a.quality, b.whales, b.heavyMoney, b.oppMoney, b.quality));
  return gs;
}


function pickCatalogKey(q: string, label: string): string {
  return ((q || "").trim() + "||" + (label || "").trim()).toLowerCase();
}
function pickCatalog(): Record<string, Pick> {
  const m: Record<string, Pick> = {};
  const add = (arr: Pick[] | undefined) => { (arr || []).forEach((p: Pick) => { m[pickCatalogKey(p.q, p.label)] = p; }); };
  add(DATA.props); add(DATA.longshots); add(DATA.biggest); add(DATA.poly); add(DATA.glue); add(DATA.fun); add(DATA.signals);
  return m;
}
function partsFromLine(l: Line): Record<string, number> {
  const o: Record<string, number> = {};
  (DATA.partNames || []).forEach((n: string, i: number) => { o[n] = (l.parts && l.parts[i] !== undefined) ? l.parts[i] : 0; });
  return o;
}
function backerFromLine(l: Line): Backer {
  return { name: l.name, wallet: l.wallet, cost: l.amount, avg: l.entry, wr: l.wr, resolved: l.resolved, pnl: l.pnl, rank: l.rank, golden: l.golden, skill: false, flow: null, buy24: null, sell24: null, sport: null, top100: l.top100, rank30: l.rank30, rankAll: l.rankAll, firstTs: l.firstTs, lastTs: l.ts || l.firstTs, trades: l.fills || null };
}
function uniqLines(rows: Line[]): Line[] {
  const m: Record<string, Line> = {};
  const order: string[] = [];
  rows.forEach((l: Line) => {
    const w = (l.wallet || "").toLowerCase() || l.key;
    if (!m[w]) { m[w] = { ...l }; order.push(w); }
    else {
      const prev = m[w];
      m[w] = { ...prev, amount: prev.amount + l.amount, value: (prev.value || 0) + (l.value || 0), shares: (prev.shares || 0) + (l.shares || 0), firstTs: prev.firstTs && l.firstTs ? Math.min(prev.firstTs, l.firstTs) : (prev.firstTs || l.firstTs), ts: prev.ts && l.ts ? Math.max(prev.ts, l.ts) : (prev.ts || l.ts) };
    }
  });
  return order.map((w: string) => m[w]);
}
function linesToPicks(rows: Line[]): Pick[] {
  const catalog = pickCatalog();
  const groups: Record<string, Line[]> = {};
  const order: string[] = [];
  rows.forEach((l: Line) => {
    const k = pickCatalogKey(l.q, l.label);
    if (!groups[k]) { groups[k] = []; order.push(k); }
    groups[k].push(l);
  });
  const byQ: Record<string, Line[]> = {};
  rows.forEach((l: Line) => { (byQ[l.q] = byQ[l.q] || []).push(l); });
  return order.map((k: string) => {
    const raw = groups[k];
    const lines = uniqLines(raw);
    const primary = lines.slice().sort((a: Line, b: Line) => b.amount - a.amount || (b.agreeAll || 0) - (a.agreeAll || 0))[0];
    const side = (primary.side || "") + "|" + (primary.label || "");
    const opposingLines = uniqLines((byQ[primary.q] || []).filter((l: Line) => ((l.side || "") + "|" + (l.label || "")) !== side));
    const existing = catalog[k];
    const live = primary.phase === "live";
    if (existing) {
      return { ...existing, started: existing.started || live, game: { ...existing.game, state: existing.game.state === "post" ? "post" : (live || existing.game.state === "in" ? "in" : existing.game.state), detail: existing.game.detail || primary.gDetail || "", score: existing.game.score || primary.gScore || "" } };
    }
    const invested = lines.reduce((a: number, l: Line) => a + l.amount, 0);
    const oppMoney = opposingLines.reduce((a: number, l: Line) => a + l.amount, 0);
    let wCost = 0, wEntry = 0, wNow = 0, wNowCost = 0;
    lines.forEach((l: Line) => {
      if (l.entry != null) { wCost += l.amount; wEntry += l.entry * l.amount; }
      if (l.now != null) { wNowCost += l.amount; wNow += l.now * l.amount; }
    });
    const avgEntry = wCost > 0 ? wEntry / wCost : null;
    const price = wNowCost > 0 ? wNow / wNowCost : (primary.now != null ? primary.now : (primary.kPrice != null ? primary.kPrice : 0));
    const kOk = !!(primary.kAct && primary.kContract && (primary.kPrice || primary.kPrice === 0));
    const startTs = primary.startTs || 0;
    const id = "bet|" + primary.q + "|" + primary.label;
    let gameName = vsTitleOf(primary.q) || vsTitleOf(primary.gName || "") || matchup(primary.q);
    if (!/\svs\.?\s/i.test(gameName)) {
      const sib = rows.find((l: Line) => l.league === primary.league && ((primary.startTs && l.startTs === primary.startTs) || (!!primary.start && l.start === primary.start)) && (/\svs\.?\s/i.test(l.q || "") || /\svs\.?\s/i.test(l.gName || "")));
      if (sib) gameName = vsTitleOf(sib.q) || vsTitleOf(sib.gName || "") || matchup(sib.q);
    }
    return {
      id,
      q: primary.q,
      label: primary.label,
      kind: primary.kind,
      league: primary.league,
      slug: "",
      score: lines.reduce((a: number, l: Line) => Math.max(a, l.score || 0), 0),
      parts: partsFromLine(primary),
      price,
      avgEntry,
      whales: lines.length,
      invested,
      golden: lines.filter((l: Line) => l.golden).length,
      oppMoney,
      oppCount: opposingLines.length,
      oppQualified: opposingLines.length,
      fresh24: 0,
      fresh24Opp: 0,
      sideAll: invested,
      sideCountAll: lines.length,
      oppAll: oppMoney,
      oppCountAll: opposingLines.length,
      hedgeAll: 0,
      game: { name: gameName, start: primary.start, src: primary.src, state: live ? "in" : "pre", detail: primary.gDetail || "", score: primary.gScore || "" },
      startTs,
      backers: lines.slice().sort((a: Line, b: Line) => b.amount - a.amount).map(backerFromLine),
      opposing: opposingLines.map((l: Line) => ({ name: l.name, wallet: l.wallet, cost: l.amount, avg: l.entry, wr: l.wr, qualified: true, golden: l.golden, rank: l.rank, rank30: l.rank30, rankAll: l.rankAll })),
      kalshi: { status: kOk ? "ok" : "none", action: primary.kAct || undefined, price: primary.kPrice === null ? undefined : primary.kPrice, contract: primary.kContract || undefined, edge_vs_whales: primary.kEdge, why: primary.kWhy || undefined, light: kOk ? (primary.kEdge != null && primary.kEdge >= 0 ? "green" : "amber") : undefined },
      risks: kOk ? [] : [primary.kWhy || "No verified Kalshi equivalent"],
      net: invested - oppMoney,
      totalBackers: lines.length,
      oneSidedShare: (invested + oppMoney) > 0 ? invested / (invested + oppMoney) : 1,
      started: live
    };
  });
}
function sortBiggest(arr: Pick[]): Pick[] {
  const size = (p: Pick): number => (p.backers && p.backers.length ? Math.max(...p.backers.map((b: Backer) => b.cost)) : (p.invested || 0));
  return arr.slice().sort((a: Pick, b: Pick) => size(b) - size(a) || (b.invested - a.invested));
}
function sortBetPicks(arr: Pick[], sort: string): Pick[] {
  const rows = arr.slice();
  const st = (p: Pick): number => (p.startTs ? p.startTs : BIG);
  const live = (p: Pick): number => ((p.game && p.game.state === "in") || p.started ? 0 : 1);
  if (sort === "start" || sort === "resolving") rows.sort((a: Pick, b: Pick) => live(a) - live(b) || st(a) - st(b));
  else if (sort === "entry") rows.sort((a: Pick, b: Pick) => (Math.min(...(a.backers.length ? a.backers.map((x: Backer) => x.firstTs || BIG) : [BIG]))) - (Math.min(...(b.backers.length ? b.backers.map((x: Backer) => x.firstTs || BIG) : [BIG]))));
  else if (sort === "score") rows.sort((a: Pick, b: Pick) => b.score - a.score);
  else if (sort === "exposure") rows.sort((a: Pick, b: Pick) => b.invested - a.invested);
  else rows.sort((a: Pick, b: Pick) => cmpRankKey(rankKey(a, a.backers.length, a.backers), rankKey(b, b.backers.length, b.backers)));
  return rows;
}

function CardShell(props: { accent: string; children: ReactNode }) {
  const t = useGrokTheme();
  return (
    <div style={{ borderRadius: 22, border: "1px solid " + t.border.default, background: t.bg.base, boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 10px 28px rgba(0,0,0,0.07)", overflow: "hidden", marginBottom: 18, fontFamily: t.font.family, color: t.text.primary }}>
      <div style={{ height: 5, background: props.accent }} />
      <div style={{ padding: 16 }}>{props.children}</div>
    </div>
  );
}
function StrengthChip(props: { word: "Go big" | "Normal" | "Small" }) {
  return <Chip bg={strengthColor(props.word)} color="#FFFFFF">{props.word}</Chip>;
}
function CopyId(props: { id: string }) {
  const t = useGrokTheme();
  const [ok, setOk] = useState<boolean>(false);
  return (
    <button type="button" onClick={() => { try { void navigator.clipboard.writeText(props.id); setOk(true); window.setTimeout(() => setOk(false), 1500); } catch (e) { /* ignore */ } }} style={{ border: "none", background: t.bg.subtle, color: t.text.primary, borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 750, cursor: "pointer", fontFamily: t.font.family }} title="Copy this pick ID to note it when you place the bet">
      ID {props.id}{ok ? " · copied" : " · copy"}
    </button>
  );
}
function ComboCard(props: { a: Pick; b: Pick; rank: number; bankroll: number; now: number }) {
  const t = useGrokTheme();
  const { a, b, rank, bankroll } = props;
  const pa = usedPrice(a), pb = usedPrice(b);
  const combined = (pa || 0) * (pb || 0);
  const stake = dollarStake("Small", bankroll, true);
  const payout = combined > 0 ? stake / combined : 0;
  const exA = explainPick(a), exB = explainPick(b);
  return (
    <CardShell accent={"linear-gradient(90deg, " + GREEN + ", " + BRAND + ")"}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <Chip bg={GREEN} color="#FFFFFF">Combo #{rank}</Chip>
        <Chip bg={t.bg.subtle} color={t.text.primary}>{cents(combined)} combined</Chip>
        <Chip bg={t.bg.subtle} color={t.text.secondary}>2 legs · 1% stake</Chip>
      </div>
      <div style={{ marginTop: 10, fontSize: 16, lineHeight: "22px", fontWeight: 800 }}>
        {exA.headline} <span style={{ color: t.text.tertiary, fontWeight: 600 }}>and</span> {exB.headline}
      </div>
      <div style={{ fontSize: 14, lineHeight: "20px", color: t.text.primary, marginTop: 8 }}>
        A {money(stake)} combo pays about {money(Math.round(payout) === payout ? payout : Math.round(payout * 100) / 100)} if both hit (combined price {cents(combined)}).
      </div>
      <BackersLine backers={(a.backers || []).concat(b.backers || [])} />
      <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.secondary, marginTop: 6 }}>
        <EventMeta ev={resolveEvent(a)} now={props.now} compact={true} />
        <span> at {cents(pa)}</span>
        <EventMeta ev={resolveEvent(b)} now={props.now} compact={true} />
        <span> at {cents(pb)}</span>
      </div>
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: t.text.tertiary, letterSpacing: "0.06em" }}>LEG 1 · HOW IT LOOKS ON KALSHI</div>
        <ActionBtn ex={exA} compact={true} />
        <div style={{ fontSize: 12, fontWeight: 700, color: t.text.tertiary, letterSpacing: "0.06em", marginTop: 10 }}>LEG 2 · HOW IT LOOKS ON KALSHI</div>
        <ActionBtn ex={exB} compact={true} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginTop: 10 }}>
        <span style={{ fontSize: 13, color: t.text.secondary }}>Stake · 1% of {money(bankroll)}</span>
        <span style={{ fontSize: 20, fontWeight: 800 }}>{money(stake)}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        <CopyId id={pickIdOf(a)} />
        <CopyId id={pickIdOf(b)} />
      </div>
    </CardShell>
  );
}
function buildCombos(top: Pick[]): [Pick, Pick][] {
  const pool = top.filter((p: Pick) => {
    const px = usedPrice(p);
    return px != null && px >= 0.65 && px < 0.95;
  });
  const used: Record<string, boolean> = {}, usedGame: Record<string, boolean> = {};
  const out: [Pick, Pick][] = [];
  for (let i = 0; i < pool.length && out.length < 3; i++) {
    if (used[pool[i].id]) continue;
    const gi = gameKey(pool[i]);
    if (usedGame[gi]) continue;
    for (let j = i + 1; j < pool.length; j++) {
      if (used[pool[j].id]) continue;
      const gj = gameKey(pool[j]);
      if (gi === gj || usedGame[gj]) continue;
      out.push([pool[i], pool[j]]);
      used[pool[i].id] = true; used[pool[j].id] = true;
      usedGame[gi] = true; usedGame[gj] = true;
      break;
    }
  }
  return out;
}
function DailyCap() {
  const t = useGrokTheme();
  return <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.secondary, margin: "0 0 14px" }}>{DAILY_CAP}</div>;
}

function ActionBtn(props: { ex: Explained; compact?: boolean; href?: string }) {
  const t = useGrokTheme();
  const yes = props.ex.ok && ((props.ex.act || "").indexOf("YES") >= 0 || (props.ex.act || "") === "BUY");
  const body = props.ex.ok ? (
    <div style={{ ...BTN(yes ? GREEN : RED, "#FFFFFF"), justifyContent: "space-between", marginTop: props.compact ? 6 : 8, width: "100%", minHeight: props.compact ? 42 : 48, height: "auto", padding: "10px 14px", gap: 12, fontSize: 15, cursor: props.href ? "pointer" : "default", whiteSpace: "normal", overflow: "visible", lineHeight: 1.25, textAlign: "left", alignItems: "center", textDecoration: "none", boxSizing: "border-box" }}>
      <span style={{ minWidth: 0, flex: "1 1 auto" }}>{props.ex.action}{props.href ? " ↗" : ""}</span>
      <span style={{ flex: "none", fontSize: props.compact ? 16 : 18, fontVariantNumeric: "tabular-nums" }}>{cents(props.ex.price)}</span>
    </div>
  ) : (
    <div style={{ ...BTN(t.bg.subtle, t.text.secondary), justifyContent: "center", marginTop: props.compact ? 6 : 8, width: "100%", minHeight: props.compact ? 42 : 46, height: "auto", padding: "10px 14px", cursor: "default", whiteSpace: "normal" }}>No Kalshi market</div>
  );
  return (
    <div>
      {props.href && props.ex.ok ? <a href={props.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit", display: "block" }}>{body}</a> : body}
      <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.primary, marginTop: 6, fontWeight: 650 }}>{props.ex.meaning}</div>
      {props.ex.kalshiOk && props.ex.poly && !props.href ? <div style={{ fontSize: 12, lineHeight: "16px", color: t.text.tertiary, marginTop: 2 }}>Polymarket: {props.ex.poly}</div> : null}
      {!props.ex.kalshiOk && props.ex.why ? <div style={{ fontSize: 12, lineHeight: "16px", color: t.text.tertiary, marginTop: 2 }}>Not on Kalshi: {props.ex.why}</div> : null}
    </div>
  );
}
function ExpandBtn(props: { open: boolean; on: () => void; label: string }) {
  const t = useGrokTheme();
  return (
    <button onClick={props.on} style={{ marginTop: 12, minHeight: 48, width: "100%", borderRadius: 14, border: "none", background: t.bg.subtle, color: t.text.primary, fontFamily: t.font.family, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
      {props.open ? "Hide details" : props.label}
      <span style={{ display: "inline-flex", transform: props.open ? "rotate(180deg)" : "none" }}><Icon name="chev" color={t.text.secondary} size={16} /></span>
    </button>
  );
}


function BuyCard(props: { l: Line; now: number; rank: number; bankroll: number; followed: string[]; hidden: string[]; toggle: (kind: string, w: string) => void }) {
  const t = useGrokTheme();
  const { l, now, rank, bankroll } = props;
  const [open, setOpen] = useState<boolean>(false);
  const live = l.phase === "live" || (!!l.startTs && l.startTs > 0 && l.startTs <= now);
  const chance = l.now !== null ? Math.round(l.now * 100) : null;
  const delta = l.kPrice !== null && l.entry !== null ? Math.round((l.kPrice - l.entry) * 1000) / 10 : null;
  const fol = props.followed.indexOf(l.wallet.toLowerCase()) >= 0;
  const whales = 1 + (l.agreeAll || 0);
  const word = strengthWord(whales, l.amount, 0);
  const ex = explainLine(l);
  const stake = ex.ok ? dollarStake(word, bankroll) : 0;
  const pct = ex.ok ? stakePctOf(word) : 0;
  const band = priceBand(ex.price != null ? ex.price : l.now);
  const tile = (icon: string, tint: string, lab: string, v: string, sub: string) => (
    <div style={{ borderRadius: 16, padding: 12, background: t.bg.subtle, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 28, height: 28, borderRadius: 9, background: tint, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={icon} color="#FFFFFF" size={16} /></span>
        <span style={{ fontSize: 12, lineHeight: "15px", fontWeight: 600, color: t.text.secondary }}>{lab}</span>
      </div>
      <div style={{ fontSize: 22, lineHeight: "26px", fontWeight: 800, color: t.text.primary, marginTop: 8 }}>{v}</div>
      <div style={{ fontSize: 12, lineHeight: "16px", color: t.text.tertiary, marginTop: 2 }}>{sub}</div>
    </div>
  );
  return (
    <CardShell accent={"linear-gradient(90deg, " + BRAND2 + ", #059669)"}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <Chip bg={BRAND} color="#FFFFFF">#{rank}</Chip>
        <StrengthChip word={word} />
        <Chip bg={t.bg.subtle} color={t.text.primary}>{l.league}</Chip>
        <Chip bg={t.bg.subtle} color={t.text.secondary}>{kindWord(l.kind)}</Chip>
        <Chip bg={live ? RED : t.bg.subtle} color={live ? "#FFFFFF" : t.text.primary}>{live ? "LIVE" : until(l.startTs || 0, now, l.start)}</Chip>
        {band === "best" ? <Chip bg={GREEN} color="#FFFFFF">65–84¢</Chip> : null}
        {l.hedged ? <Chip bg={AMBER} color="#FFFFFF">Hedged</Chip> : null}
        {fol ? <Chip bg={BRAND} color="#FFFFFF">★ Following</Chip> : null}
        <CopyId id={pickIdOf({ id: l.q + "|" + l.label, q: l.q, label: l.label, slug: "" } as Pick)} />
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
          <EventMeta ev={resolveEvent(l)} now={now} live={live} extra={(l.gScore ? l.gScore : "") + (l.gDetail ? (l.gScore ? " · " : "") + l.gDetail : "") + (chance !== null ? ((l.gScore || l.gDetail) ? " · " : "") + chance + "% chance (market)" : "")} />
          <div style={{ fontSize: 24, lineHeight: "29px", fontWeight: 850, marginTop: 4, overflowWrap: "anywhere" }}>Bet: {ex.headline}</div>
          <BackersLine backers={[{ wallet: l.wallet, cost: l.amount }]} />
        </div>
        <Ring score={l.score} track={t.border.default} text={t.text.primary} sub={t.text.tertiary} />
      </div>
      <ActionBtn ex={ex} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginTop: 14 }}>
        {tile("money", GREEN, "Amount", kMoney(l.amount), l.shares ? l.shares.toLocaleString("en-US") + " shares" : "Whale buy")}
        {tile("clock", BRAND2, "Bought", l.ts || l.firstTs ? ago((l.ts || l.firstTs) as number, now) : "n/a", l.ts ? ptTime(l.ts) : (l.firstTs ? ptTime(l.firstTs) : "Time not supplied"))}
        {tile("star", AMBER, "Evidence", l.score + "/100", conf(l.score).word + " · not a win probability")}
        {tile("whales", BRAND, "Whales on this side", String(whales), l.agree60 ? l.agree60 + " within 60 min" : "This whale" + (l.agreeAll ? " + " + l.agreeAll + " more" : ""))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <Face name={l.name} size={30} />
        <NameLink name={l.name} wallet={l.wallet} bold={true} />
        {l.golden ? <Chip bg={AMBER} color="#FFFFFF">Golden</Chip> : null}
        {l.top100 ? <Chip bg={t.bg.subtle} color={t.text.primary}>{rankLabel(l.rankAll, l.rank, l.rank30) || "Top whale"}</Chip> : <Chip bg={t.bg.subtle} color={t.text.secondary}>Not a top whale</Chip>}
        <span style={{ fontSize: 12, color: t.text.secondary }}>{l.wr !== null ? <Fragment><Pct v={l.wr} /> win rate (all-time)</Fragment> : ""}</span>
      </div>
      <div style={{ marginTop: 14 }}>
        <KalshiBox act={l.kAct} price={l.kPrice} contract={l.kContract} edge={l.kEdge} why={l.kWhy} label={ex.headline} entry={l.entry} now={l.now} compact={true} />
        {stake > 0 ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginTop: 10 }}>
            <span style={{ fontSize: 13, color: t.text.secondary }}>Stake{ex.kalshiOk ? "" : " on Polymarket"} · {word} · {Math.round(pct * 100)}% of {money(bankroll)}{word === "Go big" ? ", max $10" : ""}</span>
            <span style={{ fontSize: 20, fontWeight: 800 }}>{money(stake)}</span>
          </div>
        ) : null}
      </div>
      <ExpandBtn open={open} on={() => setOpen(!open)} label="Value now, position & evidence" />
      {open ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: t.text.tertiary, marginTop: 4 }}>VALUE NOW · BEFORE FEES</div>
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
    </CardShell>
  );
}

function GameCard(props: { g: GamePack; now: number; rank: number; followed: string[]; hidden: string[]; toggle: (kind: string, w: string) => void }) {
  const t = useGrokTheme();
  const { g, now, rank } = props;
  const [open, setOpen] = useState<boolean>(false);
  const live = g.phase === "live";
  const word = strengthWord(g.whales, g.heavyMoney, g.oppMoney);
  const ex = explainLine(g.primary, g.teams);
  const totalSide = g.heavyMoney + g.otherMoney;
  const heavyShare = totalSide > 0 ? g.heavyMoney / totalSide : 1;
  const wallets = Array.from(new Set(g.rows.map((l: Line) => l.wallet + "\t" + l.name)));
  const tile = (icon: string, tint: string, lab: string, v: string, sub: string) => (
    <div style={{ borderRadius: 16, padding: 12, background: t.bg.subtle, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 28, height: 28, borderRadius: 9, background: tint, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={icon} color="#FFFFFF" size={16} /></span>
        <span style={{ fontSize: 12, lineHeight: "15px", fontWeight: 600, color: t.text.secondary }}>{lab}</span>
      </div>
      <div style={{ fontSize: 22, lineHeight: "26px", fontWeight: 800, color: t.text.primary, marginTop: 8 }}>{v}</div>
      <div style={{ fontSize: 12, lineHeight: "16px", color: t.text.tertiary, marginTop: 2 }}>{sub}</div>
    </div>
  );
  const markets: Record<string, Line[]> = {};
  g.rows.forEach((l: Line) => { const k = l.kind + "|" + l.q; (markets[k] = markets[k] || []).push(l); });
  return (
    <CardShell accent={"linear-gradient(90deg, " + BRAND + ", " + BRAND2 + ")"}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <Chip bg={BRAND} color="#FFFFFF">#{rank}</Chip>
        <StrengthChip word={word} />
        <Chip bg={t.bg.subtle} color={t.text.primary}>{g.league}</Chip>
        <Chip bg={live ? RED : t.bg.subtle} color={live ? "#FFFFFF" : t.text.primary}>{live ? "LIVE" : until(g.startTs || 0, now, g.start)}</Chip>
        <Chip bg={t.bg.subtle} color={t.text.secondary}>{g.rows.length} position{g.rows.length === 1 ? "" : "s"}</Chip>
      </div>
      <div style={{ fontSize: 24, lineHeight: "29px", fontWeight: 850, marginTop: 12, overflowWrap: "anywhere" }}>{vsTitleOf(g.title) || g.title}</div>
      <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.tertiary, marginTop: 4 }}>{(g.startTs ? kickoffLabel(g.startTs) : tidyDate(g.start))}{g.startTs ? " · " + until(g.startTs, now, g.start) : ""}{g.gScore ? " · " + g.gScore : ""}{g.gDetail ? " · " + g.gDetail : ""} · {kMoney(g.exposure)} in open whale bets</div>
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: t.text.tertiary }}>MONEY BY SIDE</div>
        <div style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden", background: t.border.default, marginTop: 8 }}>
          <div style={{ width: (heavyShare * 100) + "%", background: GREEN }} />
          <div style={{ flex: "1 1 auto", background: RED, opacity: g.otherMoney > 0 ? 0.85 : 0 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: 6, fontSize: 13, lineHeight: "18px" }}>
          <span style={{ fontWeight: 800, color: GREEN }}>Heavier: {g.heavyName} · {kMoney(g.heavyMoney)}</span>
          {g.otherName ? <span style={{ color: t.text.secondary }}>{g.otherName} · {kMoney(g.otherMoney)}</span> : <span style={{ color: t.text.tertiary }}>No whale money on the other side</span>}
        </div>
        {g.overMoney + g.underMoney > 0 && g.heavyName !== "Over" && g.heavyName !== "Under" ? <div style={{ fontSize: 12, color: t.text.tertiary, marginTop: 2 }}>Totals: Over {kMoney(g.overMoney)} · Under {kMoney(g.underMoney)}</div> : null}
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 14, lineHeight: "19px", fontWeight: 700 }}>Best bet on the heavier side</div>
        <div style={{ fontSize: 20, lineHeight: "25px", fontWeight: 850, marginTop: 4, overflowWrap: "anywhere" }}>Bet: {ex.headline}</div>
        <ActionBtn ex={ex} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginTop: 14 }}>
        {tile("whales", BRAND, "Whales on " + (g.heavyName || "this side"), String(g.whales), "Unique wallets, $500+")}
        {tile("money", GREEN, "Heavier side", kMoney(g.heavyMoney), g.otherMoney ? "vs " + kMoney(g.otherMoney) + " against" : "No money against")}
        {tile("star", AMBER, "Open positions", String(g.rows.length), Object.keys(markets).length + " market" + (Object.keys(markets).length === 1 ? "" : "s"))}
        {tile("against", RED, "Other side", g.otherName ? kMoney(g.otherMoney) : "None", g.otherName || "No opposing whale money")}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex" }}>
          {wallets.slice(0, 5).map((wn: string, i: number) => { const name = wn.split("\t")[1]; const wallet = wn.split("\t")[0]; return (
            <a key={wallet} href={profileUrl(wallet)} target="_blank" rel="noopener noreferrer" title={"Open " + name + " on Polymarket"} style={{ marginLeft: i === 0 ? 0 : -8, borderRadius: 999, border: "2px solid " + t.bg.base, display: "inline-flex" }}><Face name={name} size={30} /></a>
          ); })}
        </div>
        <div style={{ fontSize: 13, color: t.text.secondary }}>{wallets.length} whale{wallets.length === 1 ? "" : "s"} in this game</div>
      </div>
      <ExpandBtn open={open} on={() => setOpen(!open)} label="Every market, both sides & wallets" />
      {open ? (
        <div style={{ marginTop: 12 }}>
          {Object.keys(markets).map((mk: string) => {
            const lines = markets[mk].slice().sort((a: Line, b: Line) => b.amount - a.amount);
            const first = lines[0];
            const bySide: Record<string, Line[]> = {};
            lines.forEach((l: Line) => { const s = sideTeam(l, g.teams); (bySide[s] = bySide[s] || []).push(l); });
            return (
              <div key={mk} style={{ padding: "12px 0", borderBottom: "1px solid " + t.border.subtle }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.text.tertiary, letterSpacing: "0.06em" }}>{kindWord(first.kind).toUpperCase()}</div>
                {Object.keys(bySide).map((sideName: string) => {
                  const sl = bySide[sideName];
                  const amt = sl.reduce((a: number, l: Line) => a + l.amount, 0);
                  const heavier = sideName === g.heavyName || namesOverlap(sideName, g.heavyName);
                  const sx = explainLine(sl[0], g.teams);
                  return (
                    <div key={sideName} style={{ marginTop: 8, padding: 10, borderRadius: 14, background: heavier ? "rgba(22,163,74,0.08)" : t.bg.subtle }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                        <div style={{ fontSize: 16, fontWeight: 800 }}>{sx.headline}{heavier ? " · heavier" : ""}</div>
                        <div style={{ fontSize: 16, fontWeight: 800 }}>{kMoney(amt)}</div>
                      </div>
                      <ActionBtn ex={sx} compact={true} />
                      {sl.map((l: Line) => (
                        <div key={l.key} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
                          <Face name={l.name} size={24} />
                          <NameLink name={l.name} wallet={l.wallet} bold={true} />
                          {rankLabel(l.rankAll, l.rank, l.rank30) ? <Chip bg={t.bg.subtle} color={t.text.primary}>{rankLabel(l.rankAll, l.rank, l.rank30)}</Chip> : null}
                          {l.golden ? <Chip bg={AMBER} color="#FFFFFF">Golden</Chip> : null}
                          <span style={{ fontSize: 13, color: t.text.secondary }}>{money(l.amount)} at {cents(l.entry)} · bought {l.ts || l.firstTs ? ago((l.ts || l.firstTs) as number, now) : "n/a"}</span>
                          <CapperButtons wallet={l.wallet} followed={props.followed} hidden={props.hidden} toggle={props.toggle} />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
          <div style={{ fontSize: 12, lineHeight: "17px", color: t.text.tertiary, marginTop: 8 }}>Start time from {g.src}. Colors describe the held side, not confidence.</div>
        </div>
      ) : null}
    </CardShell>
  );
}

function resultTone(result?: string | null, live?: boolean): { text: string; bg: string; color: string } {
  if (result === "W" || result === "HIT") return { text: "HIT", bg: GREEN, color: "#FFFFFF" };
  if (result === "L" || result === "MISSED") return { text: "MISSED", bg: RED, color: "#FFFFFF" };
  if (result === "push" || result === "PUSH") return { text: "PUSH", bg: "#6B7280", color: "#FFFFFF" };
  return { text: live ? "LIVE" : "OPEN", bg: "#2563EB", color: "#FFFFFF" };
}
function ResultChip(props: { result?: string | null; live?: boolean }) {
  const s = resultTone(props.result, props.live);
  return <span data-result-chip={s.text}><Chip bg={s.bg} color={s.color}>{s.text}</Chip></span>;
}
function histAction(p: CapperHistPick): string {
  if (p.kAct && p.kContract) return p.kAct + " " + p.kContract;
  const lab = (p.label || "").trim();
  const side = (p.side || "").toLowerCase();
  const what = lab || (side === "yes" ? "Yes" : side === "no" ? "No" : "the side");
  return "On Polymarket: BUY " + what;
}
function CapperPickRow(props: { p: CapperHistPick; now: number }) {
  const t = useGrokTheme();
  const { p, now } = props;
  const live = !p.result && !!p.current && !!(p.startTs && p.startTs <= now);
  const ev = resolveEvent({ q: p.q || "", label: p.label || "", league: p.league || "", kind: p.kind || "", startTs: p.startTs, start: p.start || "" });
  return (
    <div data-capper-pick={p.id} style={{ marginTop: 10, padding: 12, borderRadius: 16, background: t.bg.subtle }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 6 }}>
        <ResultChip result={p.result} live={live} />
        {p.league ? <Chip bg={t.bg.base} color={t.text.secondary}>{p.league}</Chip> : null}
        {p.conv ? <Chip bg={p.conv === "H" ? GREEN : p.conv === "T" ? t.bg.base : BRAND} color={p.conv === "T" ? t.text.tertiary : "#FFFFFF"}>{CONV_LABEL[p.conv] + (p.mult != null ? " · " + p.mult + "x usual" : "")}</Chip> : null}
      </div>
      <EventMeta ev={ev} now={now} live={live} compact={true} />
      <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4, overflowWrap: "anywhere" }}>{histAction(p)}</div>
      <div style={{ fontSize: 12, color: t.text.tertiary, marginTop: 4 }}>
        {p.cost ? "Stake " + money(p.cost) : "Stake n/a"}
        {p.avg != null ? " · entry " + cents(p.avg) : ""}
        {p.profit != null ? " · " + (p.profit >= 0 ? "net " : "net -") + money(Math.abs(p.profit)).replace("$-", "$") : ""}
      </div>
    </div>
  );
}

function CapperCard(props: { rec: CapperRec; trader?: Trader; now: number; bankroll: number; livePicks: Pick[]; followed: string[]; hidden: string[]; toggle: (kind: string, w: string) => void }) {
  const t = useGrokTheme();
  const { rec, now } = props;
  const x = props.trader;
  const [open, setOpen] = useState<boolean>(false);
  const [histN, setHistN] = useState<number>(8);
  const wr = rec.n ? rec.wr : null;
  const record = rec.n || rec.push ? (rec.w + "-" + rec.l + (rec.push ? " (" + rec.push + " push)" : "")) : "";
  const sample = rec.qualified ? "" : rec.n > 0 ? "Small sample" : "Record building";
  const livePicks = props.livePicks;
  const history = (rec.picks || []).slice().sort((a: CapperHistPick, b: CapperHistPick) => (b.cost || 0) - (a.cost || 0));
  const win = rec.win || {};
  const cr = rec.convRec || {};
  const crText = (k: string) => cr[k] && (cr[k].w + cr[k].l) ? cr[k].w + "–" + cr[k].l + (cr[k].roi != null ? ", " + (cr[k].roi >= 0 ? "+" : "") + cr[k].roi + "%" : "") : "none";
  const tile = (lab: string, v: string, sub: string) => (
    <div style={{ borderRadius: 16, padding: 12, background: t.bg.subtle, minWidth: 0 }}>
      <div style={{ fontSize: 12, lineHeight: "15px", fontWeight: 600, color: t.text.secondary }}>{lab}</div>
      <div style={{ fontSize: 22, lineHeight: "26px", fontWeight: 800, marginTop: 6, overflowWrap: "anywhere" }}>{v}</div>
      <div style={{ fontSize: 12, lineHeight: "16px", color: t.text.tertiary, marginTop: 2 }}>{sub}</div>
    </div>
  );
  return (
    <CardShell accent={"linear-gradient(90deg, " + BRAND + ", " + AMBER + ")"}>
      <div data-capper-row={rec.wallet} style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        {rec.rankAll || rec.rank ? <Chip bg={BRAND} color="#FFFFFF">{rankLabel(rec.rankAll, rec.rank, x ? x.rank30 : null) || "Top whale"}</Chip> : <Chip bg={t.bg.subtle} color={t.text.secondary}>All-time rank n/a</Chip>}
        {rec.golden || (x && x.golden) ? <Chip bg={AMBER} color="#FFFFFF">Golden</Chip> : null}
        {x && x.skill ? <Chip bg={BRAND} color="#FFFFFF">Skill badge</Chip> : null}
        {sample ? <Chip bg={t.bg.subtle} color={t.text.secondary}>{sample}</Chip> : <Chip bg={GREEN} color="#FFFFFF">{rec.n}+ graded</Chip>}
        {rec.badge && rec.badge !== "n/a" ? <Chip bg={badgeColor(rec.badge)} color="#FFFFFF">{rec.badge === "Hot" ? "Hot · all 4 windows up" : rec.badge === "Cold" ? "Cold · demoted" : rec.badge === "Cooling" ? "Cooling · past week down" : "OK"}</Chip> : <Chip bg={t.bg.subtle} color={t.text.secondary}>Period P&L n/a</Chip>}
        {rec.proven ? <Chip bg={GREEN} color="#FFFFFF">Proven</Chip> : null}
        {rec.coldDemoted ? null : rec.demoted ? <Chip bg={RED} color="#FFFFFF">Low-edge volume</Chip> : rec.qQual ? <Chip bg={GREEN} color="#FFFFFF">Copyable quality</Chip> : null}
        {rec.open ? <Chip bg="#2563EB" color="#FFFFFF">{rec.open} open</Chip> : null}
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
        <Face name={rec.name || rec.wallet} size={48} />
        <div style={{ minWidth: 0, flex: "1 1 auto" }}>
          <div style={{ fontSize: 22, lineHeight: "26px", fontWeight: 850, overflowWrap: "anywhere" }}><NameLink name={rec.name || shortWallet(rec.wallet)} wallet={rec.wallet} bold={true} /></div>
          <div style={{ fontSize: 12, color: t.text.tertiary, marginTop: 2 }}>{shortWallet(rec.wallet)}</div>
          <div style={{ fontSize: 18, lineHeight: "22px", fontWeight: 800, marginTop: 6 }}>
            {rec.n ? <span>{record}{wr != null ? " · " + wr + "%" : ""}{rec.profit || rec.risked ? " · net " + (rec.profit < 0 ? "-" : "") + money(Math.abs(rec.profit)) : ""}</span> : <span style={{ color: t.text.secondary }}>Record building</span>}
          </div>
        </div>
        {wr != null ? <Ring score={Math.round(wr)} label="WIN %" color={wr >= 55 ? GREEN : wr >= 50 ? AMBER : RED} size={64} track={t.border.default} text={t.text.primary} sub={t.text.tertiary} /> : null}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginTop: 14 }}>
        {tile("Scanner record", rec.n ? rec.w + "–" + rec.l : "n/a", rec.n ? (wr != null ? wr + "% win" : "") + (rec.push ? " · " + rec.push + " push" : "") + (sample && rec.n ? " · " + sample : "") + ((rec.cn || 0) ? " · copyable " + rec.cw + "–" + rec.cl + (rec.croi != null ? ", " + (rec.croi >= 0 ? "+" : "") + rec.croi + "% ROI" : "") : "") : "No graded picks yet")}
        {tile("Net on graded", rec.n && (rec.profit || rec.risked) ? (rec.profit < 0 ? "-" : "") + money(Math.abs(rec.profit)) : "n/a", rec.roi != null ? "ROI " + rec.roi + "%" : (rec.risked ? "risked " + money(rec.risked) : "Cost/entry n/a on some picks"))}
        {tile("Live picks now", String(livePicks.length || rec.open), (livePicks.length || rec.open) ? "Unstarted or in-play from this scan" : "No open scan bets")}
        {tile("All-time P&L", x && x.pnl != null ? kMoney(x.pnl) : (rec.pnl != null ? kMoney(rec.pnl) : "n/a"), x && x.pnl30 != null ? "30d P&L " + kMoney(x.pnl30) + (x.rank30 ? " · 30d #" + x.rank30 : "") : "Polymarket all-time, not scanner")}
      </div>
      <div data-capper-windows={rec.wallet} style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6, marginTop: 8 }}>
        {[["week", "Past week"], ["month", "Past month"], ["year", "Past year"], ["all", "All time"]].map((kv: string[]) => {
          const r = win[kv[0]] || {};
          const v = r.pnl;
          return (
            <div key={kv[0]} style={{ borderRadius: 12, padding: "8px 8px", background: t.bg.subtle, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.text.secondary }}>{kv[1]}</div>
              <div style={{ fontSize: 16, fontWeight: 850, marginTop: 2, color: v == null ? t.text.tertiary : v >= 0 ? GREEN : RED }}>{kShort(v)}</div>
              <div style={{ fontSize: 11, color: t.text.tertiary, marginTop: 1 }}>{(r.roi != null ? (r.roi >= 0 ? "+" : "") + r.roi + "%/$ traded" : (kv[0] === "year" && v != null ? "P&L series" : "")) + (r.rec ? (r.roi != null || (kv[0] === "year" && v != null) ? " · " : "") + "ours " + r.rec[0] + "–" + r.rec[1] : "")}</div>
            </div>
          );
        })}
      </div>
      <div data-capper-conv={rec.wallet} style={{ fontSize: 12, lineHeight: "17px", color: t.text.secondary, marginTop: 8 }}>
        {"Usual bet " + (rec.medBet ? money(rec.medBet) : "n/a") + " · High conviction " + crText("H") + " · Normal " + crText("N") + " · Throwaway " + crText("T")}
      </div>
      <div style={{ marginTop: 10 }}><CapperButtons wallet={rec.wallet} followed={props.followed} hidden={props.hidden} toggle={props.toggle} /></div>
      <ExpandBtn open={open} on={() => setOpen(!open)} label={open ? "Hide picks" : "Live picks and history"} />
      {open ? (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: t.text.tertiary }}>CURRENT LIVE PICKS</div>
          {livePicks.length ? livePicks.map((p: Pick, i: number) => {
            const started = isStarted(p, now) || (p.game && p.game.state === "in") || (p.startTs > 0 && p.startTs <= now);
            return <PickCard key={p.id} p={p} fun={false} poly={p.kalshi.status !== "ok"} bankroll={props.bankroll} now={now} rank={i + 1} followed={props.followed} hidden={props.hidden} toggle={props.toggle} resultTag={started ? "LIVE" : "OPEN"} />;
          }) : <div style={{ fontSize: 13, color: t.text.tertiary, marginTop: 8 }}>No unstarted or live bets for this capper in the current scan.</div>}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: t.text.tertiary, marginTop: 16 }}>EVERY PICK WE'VE TRACKED · BIGGEST BET FIRST · HIT / MISSED / PUSH / OPEN</div>
          {history.length ? history.slice(0, histN).map((hp: CapperHistPick) => <CapperPickRow key={hp.id} p={hp} now={now} />) : <div style={{ fontSize: 13, color: t.text.tertiary, marginTop: 8 }}>No tracked picks yet.</div>}
          {history.length > histN ? <Button label={"Show more picks (" + (history.length - histN) + " left)"} onClick={() => setHistN(histN + 12)} /> : null}
        </div>
      ) : null}
    </CardShell>
  );
}

function PickCard(props: { p: Pick; fun: boolean; poly?: boolean; longshot?: boolean; biggest?: boolean; upcoming?: boolean; bankroll: number; now: number; rank: number; followed: string[]; hidden: string[]; toggle: (kind: string, w: string) => void; resultTag?: string | null }) {
  const t = useGrokTheme();
  const { p, fun, bankroll, now, rank } = props;
  const poly = !!props.poly;
  const longshot = !!props.longshot;
  const biggest = !!props.biggest;
  const upcoming = !!props.upcoming;
  const moneyBoxes = biggest || upcoming;
  const [open, setOpen] = useState<boolean>(false);
  const k = p.kalshi;
  const ok = k.status === "ok";
  const c = conf(p.score);
  const backers0 = p.backers.filter((b: Backer) => props.hidden.indexOf((b.wallet || "").toLowerCase()) < 0);
  const info = pickInfo(p, backers0.length);
  const word = info.word;
  const pct = longshot ? 0 : ((ok || poly) ? stakePctOf(word) : 0);
  const stake = longshot ? (rank === 1 ? 2 : 1) : ((ok || poly) ? dollarStake(word, bankroll) : 0);
  const live = p.game.state === "in" || (p.startTs > 0 && p.startTs <= now);
  const backers = backers0;
  const netVal = p.net !== undefined ? p.net : p.invested - (p.oppMoney || 0);
  const sharePct = Math.round(info.share * 100);
  const idCode = pickIdOf(p);
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
  const ex = explainPick(p, poly);
  const marketHref = p.slug ? eventUrl(p.slug) : undefined;
  return (
    <CardShell accent={upcoming ? ("linear-gradient(90deg, " + BRAND2 + ", " + GREEN + ")") : biggest ? ("linear-gradient(90deg, " + GREEN + ", " + AMBER + ")") : longshot ? ("linear-gradient(90deg, " + AMBER + ", " + RED + ")") : fun ? ("linear-gradient(90deg, " + AMBER + ", #F472B6)") : ("linear-gradient(90deg, " + BRAND + ", " + BRAND2 + ")")}>
        <div data-card-league={p.league} data-pick-card="1" style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <Chip bg={BRAND} color="#FFFFFF">#{rank}</Chip>
          <StrengthChip word={word} />
          {info.glue ? <Chip bg={AMBER} color="#FFFFFF">Small, glue leg only</Chip> : null}
          {info.split ? <Chip bg={AMBER} color="#FFFFFF">Split</Chip> : null}
          {info.pricier ? <Chip bg={AMBER} color="#FFFFFF">Pricier</Chip> : null}
          {info.band === "best" ? <Chip bg={GREEN} color="#FFFFFF">65–84¢</Chip> : null}
          <Chip bg={t.bg.subtle} color={t.text.primary}>{p.league}</Chip>
          <Chip bg={t.bg.subtle} color={t.text.secondary}>{kindWord(p.kind)}</Chip>
          <Chip bg={live ? RED : t.bg.subtle} color={live ? "#FFFFFF" : t.text.primary}><Icon name="clock" color={live ? "#FFFFFF" : t.text.secondary} size={12} />{live ? "LIVE" : until(p.startTs, now, p.game && p.game.start)}</Chip>
          {fun ? <Chip bg={AMBER} color="#FFFFFF">Fun</Chip> : null}
          {longshot ? <Chip bg={AMBER} color="#FFFFFF">Longshot · 5–10x</Chip> : null}
          {biggest ? <Chip bg={GREEN} color="#FFFFFF">Biggest</Chip> : null}
          {upcoming ? <Chip bg={BRAND2} color="#FFFFFF">Upcoming</Chip> : null}
          {moneyBoxes && (p.oppCount > 0 || (p.oppMoney || 0) > 0) ? <Chip bg={AMBER} color="#FFFFFF">Split · whales on both sides</Chip> : null}
          {poly ? <Chip bg={BRAND2} color="#FFFFFF">Polymarket</Chip> : null}
          {props.resultTag ? <ResultChip result={props.resultTag === "LIVE" || props.resultTag === "OPEN" ? null : props.resultTag} live={props.resultTag === "LIVE"} /> : null}
          <Chip bg={t.bg.subtle} color={t.text.primary}>{backerStats(backers).text}</Chip>
          <CopyId id={idCode} />
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <EventMeta ev={resolveEvent(p)} now={now} live={live} extra={<Fragment>{p.game.score ? p.game.score + " · " : ""}<span style={{ color: c.color, fontWeight: 700 }}>{c.word} confidence</span> · <Pct v={Math.round(p.price * 100)} /> chance (market)</Fragment>} />
            <div style={{ fontSize: 24, lineHeight: "29px", fontWeight: 850, marginTop: 4, overflowWrap: "anywhere" }}>Bet: {ex.headline}</div>
            <BackersLine backers={backers} pid={p.id} />
            {p.refresh ? (
              <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.secondary, marginTop: 4 }}>
                {p.refresh.final ? <Chip bg={p.refresh.final === "W" ? GREEN : p.refresh.final === "L" ? RED : t.bg.subtle} color="#FFFFFF">{p.refresh.final === "W" ? "WON" : p.refresh.final === "L" ? "LOST" : "PUSH"}</Chip> : null}
                {p.refresh.detail ? " ESPN: " + p.refresh.detail + (p.refresh.score ? " · " + p.refresh.score : "") : ""}
                {p.refresh.pct !== undefined && p.refresh.pct !== null ? <Fragment> · ESPN gives <b><Pct v={p.refresh.pct} /></b> to win{poly ? "" : " vs Kalshi " + cents(p.refresh.kNow !== undefined ? p.refresh.kNow : (k.price === undefined ? null : k.price))}</Fragment> : <Fragment>{p.refresh.why ? " ESPN: " + p.refresh.why : ""}{!poly && p.refresh.kNow !== undefined && p.refresh.kNow !== null ? " · Kalshi now " + cents(p.refresh.kNow) : ""}</Fragment>}
                {" · refreshed " + ptTime(p.refresh.at)}
              </div>
            ) : null}
          </div>
          <Ring score={p.score} track={t.border.default} text={t.text.primary} sub={t.text.tertiary} />
        </div>
        <ActionBtn ex={ex} href={poly ? marketHref : undefined} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginTop: 14 }}>
          {moneyBoxes ? (function () {
            const ordered = backers.slice().sort((a: Backer, b: Backer) => b.cost - a.cost);
            const topW = ordered[0];
            const otherN = Math.max(0, ordered.length - 1);
            const otherMoney = ordered.slice(1).reduce((a: number, b: Backer) => a + b.cost, 0);
            const totalSide = (topW ? topW.cost : 0) + otherMoney;
            const topRank = topW ? rankLabel(topW.rankAll, topW.rank, topW.rank30) : "";
            return (
              <Fragment>
                {tile("money", GREEN, "Biggest whale bet", topW ? money(topW.cost) : "n/a", topW ? (topW.name + (topRank ? " · " + topRank : "")) : "No $500+ whale")}
                {tile("whales", BRAND, "Other whales on same bet", String(otherN), otherN ? "same market and same side" : "no other $500+ whale on this side")}
                {tile("star", AMBER, "Their money", money(otherMoney), otherN ? "from the other whales on this side" : "only one whale on this side")}
                {tile("money", BRAND2, "Total", money(totalSide), "all $500+ whales on this side" + ((p.oppCount > 0 || (p.oppMoney || 0) > 0) ? " · " + kMoney(p.oppMoney) + " against" : ""))}
              </Fragment>
            );
          })() : (
            <Fragment>
              {tile("whales", BRAND, "Top whales on this bet", String(backers.length), "$500+ each · top " + DATA.coverage.cappers + " all-time · " + p.golden + " golden")}
              {tile("money", GREEN, "Net money", kMoney(netVal), "Net " + money(netVal) + " (" + sharePct + "% one-sided)")}
              {tile("star", AMBER, "Total backers", p.totalBackers !== undefined && p.totalBackers !== null ? p.totalBackers.toLocaleString("en-US") : "n/a", "all wallets, any size" + (p.sideAll ? " · " + kMoney(p.sideAll) : ""))}
              {tile("against", RED, "Top whales against", String(p.oppCount), kMoney(p.oppMoney) + " on the other side")}
            </Fragment>
          )}
        </div>
        <div style={{ marginTop: 14 }}>
          {poly ? (
            <div>
              {marketHref ? <a href={marketHref} target="_blank" rel="noopener noreferrer" style={{ ...BTN(BRAND2, "#FFFFFF"), textDecoration: "none", marginTop: 0 }}>Open this market on Polymarket ↗</a> : null}
              <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.secondary, marginTop: 8 }}>Not on Kalshi{k.why ? ": " + k.why : ""}. Whale paid {cents(p.avgEntry)} · Polymarket now {cents(p.price)}.</div>
            </div>
          ) : (
            <KalshiBox act={ok ? (k.action || null) : null} price={k.price === undefined ? null : k.price} contract={k.contract || null} edge={k.edge_vs_whales === undefined ? null : k.edge_vs_whales} why={k.why || null} label={ex.headline} entry={p.avgEntry} now={p.price} />
          )}
          <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.secondary, marginTop: 8 }}>
            Now {cents(info.px)} · whales entered at {cents(p.avgEntry)}{info.over != null ? (info.over > 0 ? " · +" + info.over.toFixed(1).replace(/\.0$/, "") + "¢ vs entry" : " · " + info.over.toFixed(1).replace(/\.0$/, "") + "¢ vs entry") : ""}
          </div>
          <div style={{ fontSize: 14, lineHeight: "20px", fontWeight: 700, color: t.text.primary, marginTop: 6 }}>Net {money(netVal)} ({sharePct}% one-sided)</div>
          {longshot && stake > 0 ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginTop: 10 }}>
              <span style={{ fontSize: 13, color: t.text.secondary }}>Stake{poly ? " on Polymarket" : ""} · flat {rank === 1 ? "$2 for the strongest" : "$1"} (under the daily cap)</span>
              <span style={{ fontSize: 20, fontWeight: 800 }}>{money(stake)}</span>
            </div>
          ) : (ok || poly) && stake > 0 ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginTop: 10 }}>
              <span style={{ fontSize: 13, color: t.text.secondary }}>Stake{poly ? " on Polymarket" : ""} · {word} · {Math.round(pct * 100)}% of {money(bankroll)}{word === "Go big" ? ", max $10" : ""}</span>
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
                    {rankLabel(b.rankAll, b.rank, b.rank30) ? <Chip bg={t.bg.subtle} color={t.text.primary}>{rankLabel(b.rankAll, b.rank, b.rank30)}</Chip> : null}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: "20px", marginTop: 4 }}><b>{money(b.cost)}</b> at {cents(b.avg)} · now {cents(p.price)}</div>
                  <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.secondary, marginTop: 2 }}>
                    {b.lastTs ? "Bought " + ago(b.lastTs, now) + " · " + ptTime(b.lastTs) : "Buy time not supplied"}
                    {b.firstTs && b.lastTs && b.firstTs !== b.lastTs ? " · first buy " + ptTime(b.firstTs) : ""}
                    {b.trades ? " · " + b.trades + (b.trades === 1 ? " fill" : " fills") : ""}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.secondary, marginTop: 2 }}><Pct v={b.wr} /> win rate (all-time){b.resolved ? " · " + b.resolved.toLocaleString("en-US") + " resolved" : ""} · P&L {money(b.pnl)}{b.sport ? " · " + p.league + " record " + b.sport.wr + "% over " + b.sport.n : ""}</div>
                  <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.secondary, marginTop: 2 }}>{b.flow ? "24h: " + b.flow + (b.buy24 ? " · bought " + money(b.buy24) : "") + (b.sell24 ? " · sold " + money(b.sell24) : "") : "24h flow not checked"}</div>
                  <div style={{ marginTop: 6 }}><CapperButtons wallet={b.wallet} followed={props.followed} hidden={props.hidden} toggle={props.toggle} /></div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 14 }}>{label("OPPOSING WHALES · $500+")}</div>
            {p.opposing.length ? p.opposing.map((o: Opp, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", flexWrap: "wrap" }}>
                <Face name={o.name} size={26} />
                <span style={{ fontSize: 14, flex: "1 1 auto", minWidth: 0 }}><NameLink name={o.name} wallet={o.wallet} />{o.wr !== null ? <Fragment> · <Pct v={o.wr} /></Fragment> : null}{rankLabel(o.rankAll, o.rank, o.rank30) ? " · " + rankLabel(o.rankAll, o.rank, o.rank30) : ""}</span>
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
              {ok && !poly ? "Kalshi " + k.ticker + ": “" + k.rule + "” " : ""}{poly && k.why ? "Not on Kalshi: " + k.why + ". " : ""}Start time from {p.game.src}.{p.game.venue ? " Venue: " + p.game.venue + "." : ""}{p.game.records && p.game.records.length ? " Records: " + p.game.records.join(" · ") + "." : ""}{p.game.detail ? " ESPN: " + p.game.detail + "." : ""} Polymarket market: {p.q}{p.slug ? " · " : ""}{p.slug ? <a href={eventUrl(p.slug)} target="_blank" rel="noopener noreferrer" style={{ color: t.text.accent }}>Open event ↗</a> : null}
            </div>
          </div>
        ) : null}
    </CardShell>
  );
}

function LeaguePills(props: { picks: { league: string }[]; value: string; onChange: (v: string) => void; allCount?: number }) {
  const counts: Record<string, number> = {};
  props.picks.forEach((p) => { const lg = (p.league || "").trim(); if (!lg) return; counts[lg] = (counts[lg] || 0) + 1; });
  const leagues = Object.keys(counts).sort((a: string, b: string) => counts[b] - counts[a] || a.localeCompare(b));
  if (!leagues.length) return null;
  const allN = props.allCount != null ? props.allCount : props.picks.length;
  return (
    <div data-league-pills="1" style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "4px 0 14px" }}>
      <span data-league-pill="all" data-count={allN}><Pill label={"All · " + allN} on={!props.value} color={BRAND} onClick={() => props.onChange("")} /></span>
      {leagues.map((lg: string) => (
        <span key={lg} data-league-pill={lg} data-count={counts[lg]}><Pill label={lg + " · " + counts[lg]} on={props.value === lg} color={BRAND} onClick={() => props.onChange(props.value === lg ? "" : lg)} /></span>
      ))}
    </div>
  );
}

export default function App() {
  const t = useGrokTheme();
  const [tab, setTab] = useState<string>("top");
  const [bankrollText, setBankrollText] = useState<string>(DEFAULT_BANKROLL);
  const [minPos, setMinPos] = useState<string>("500");
  const [minWallets, setMinWallets] = useState<string>("2");
  const [f, setF] = useState<Filters>(DEFAULT_FILTERS);
  const [followed, setFollowed] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [buyLimit, setBuyLimit] = useState<number>(500);
  const [lineLimit, setLineLimit] = useState<number>(500);
  const [funLimit, setFunLimit] = useState<number>(100);
  const [polyLimit, setPolyLimit] = useState<number>(100);
  const [propsLimit, setPropsLimit] = useState<number>(100);
  const [longLimit, setLongLimit] = useState<number>(100);
  const [bigLimit, setBigLimit] = useState<number>(100);
  const [sportFilter, setSportFilter] = useState<string>("");
  const [capView, setCapView] = useState<string>("all");
  const [capQ, setCapQ] = useState<string>("");
  const [capSort, setCapSort] = useState<string>("quality");
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
      const br = window.localStorage.getItem(BANKROLL_KEY);
      if (br && STALE_BANKROLLS.indexOf(br.trim()) >= 0) {
        try { window.localStorage.setItem(BANKROLL_KEY, DEFAULT_BANKROLL); } catch (e) { /* ignore */ }
        setBankrollText(DEFAULT_BANKROLL);
      } else if (br && Number(br) > 0) setBankrollText(br);
    } catch (e) {
      setSaved("");
    }
  }, []);
  const setBankroll = (v: string) => {
    setBankrollText(v);
    try { if (v.trim()) window.localStorage.setItem(BANKROLL_KEY, v.trim()); } catch (e) { /* ignore */ }
  };
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
  // Started and ended games are dropped from Top 20, Upcoming, Fun, Polymarket, Props, Longshots, Biggest Bets and combos. Live games stay on Bets.
  const finished = (p: Pick): boolean => (p.refresh && (p.refresh.state === "post" || !!p.refresh.final || !!p.refresh.ended)) || p.game.state === "post";
  const gone = (p: Pick): boolean => finished(p) || isStarted(p, now);
  const pickQuality = (p: Pick): number => Math.max(0, ...p.backers.map((b: Backer) => (b.golden ? 1000 : 0) - (b.rankAll || b.rank || 999)));
  const rankPicks = (arr: Pick[]): Pick[] => arr.slice().sort((a: Pick, b: Pick) => cmpRankKey(rankKey(a, visibleBackers(a).length, visibleBackers(a)), rankKey(b, visibleBackers(b).length, visibleBackers(b))));
  const bySport = (arr: Pick[]): Pick[] => sportFilter ? arr.filter((p: Pick) => p.league === sportFilter) : arr;
  const topPool = rankPicks((DATA.signals || []).concat(DATA.fun || []).filter((p: Pick) => topEligible(p, visibleBackers(p).length, now) && visibleBackers(p).length >= minW && followOk(p)));
  const topAll = topPool.slice(0, 20);
  const top = bySport(topAll);
  const gluePool = rankPicks((DATA.glue || DATA.signals || []).concat(DATA.fun || []).filter((p: Pick) => {
    const n = visibleBackers(p).length;
    return n >= 2 && followOk(p) && !gone(p) && p.kalshi.status === "ok" && pickInfo(p, n).glue && !isPlayerProp(p);
  }));
  // unique by id, not already in top
  const glueIds: Record<string, boolean> = {};
  top.forEach((p: Pick) => { glueIds[p.id] = true; });
  const glueAll = gluePool.filter((p: Pick) => { if (glueIds[p.id]) return false; glueIds[p.id] = true; return true; });
  const glue = bySport(glueAll).slice(0, 12);
  const funPool = rankPicks((DATA.fun || []).concat(DATA.signals || []).filter((p: Pick) => {
    const n = visibleBackers(p).length;
    if (n < 1 || !followOk(p) || gone(p) || p.kalshi.status !== "ok") return false;
    if (isPlayerProp(p) || isLongshot(p, n, now)) return false;
    if (top.some((x: Pick) => x.id === p.id)) return false;
    if (glueAll.some((x: Pick) => x.id === p.id) && n >= 2) return false; // 95¢+ 2-whale stays in Glue, not Fun
    return !topEligible(p, n, now) || n < minW;
  }));
  const funSeen: Record<string, boolean> = {};
  const funAll = funPool.filter((p: Pick) => { if (funSeen[p.id]) return false; funSeen[p.id] = true; return true; });
  const fun = bySport(funAll);
  const polyAll = rankPicks((DATA.poly || []).filter((p: Pick) => visibleBackers(p).length >= 1 && followOk(p) && !gone(p) && p.kalshi.status !== "ok" && !isPlayerProp(p) && !isLongshot(p, visibleBackers(p).length, now)));
  const polyBase = polyAll.slice(0, 20);
  const poly = bySport(polyBase);
  const uniqueByKey = (arr: Pick[]): Pick[] => {
    const seen: Record<string, boolean> = {};
    return arr.filter((p: Pick) => { const k = pickCatalogKey(p.q, p.label); if (seen[k]) return false; seen[k] = true; return true; });
  };
  const catalogPicks = uniqueByKey((DATA.props || []).concat(DATA.longshots || []).concat(DATA.biggest || []).concat(DATA.upcoming || []).concat(DATA.signals || []).concat(DATA.fun || []).concat(DATA.poly || []).concat(DATA.glue || []).concat(linesToPicks(BET_LINES)));
  const propsPool = rankPicks(catalogPicks.filter((p: Pick) => isPlayerProp(p) && visibleBackers(p).length >= 1 && followOk(p) && !gone(p)));
  const propsBase = propsPool.slice(0, 20);
  const propsPicks = bySport(propsBase);
  const longPool = rankPicks(catalogPicks.filter((p: Pick) => isLongshot(p, visibleBackers(p).length, now) && followOk(p) && !gone(p)));
  const longBase = longPool.slice(0, 20);
  const longPicks = bySport(longBase);
  const biggestPool = catalogPicks.filter((p: Pick) => visibleBackers(p).length >= 1 && followOk(p) && !gone(p)).slice().sort((a: Pick, b: Pick) => {
    const qa = backerStats(visibleBackers(a)).quality, qb = backerStats(visibleBackers(b)).quality;
    const sa = Math.max(...visibleBackers(a).map((x: Backer) => x.cost));
    const sb = Math.max(...visibleBackers(b).map((x: Backer) => x.cost));
    return qb - qa || sb - sa || (b.invested - a.invested);
  });
  const biggestAll = biggestPool.slice(0, 30);
  const biggestPicks = bySport(biggestAll);
  const upcomingPool = uniqueByKey((DATA.upcoming || []).concat(catalogPicks)).filter((p: Pick) => visibleBackers(p).length >= 1 && followOk(p) && !gone(p) && p.startTs > now && p.startTs <= now + 24 * 3600).slice().sort((a: Pick, b: Pick) => (a.startTs || 9e12) - (b.startTs || 9e12) || backerStats(visibleBackers(b)).quality - backerStats(visibleBackers(a)).quality || (b.invested - a.invested));
  const upcomingAll = upcomingPool.slice(0, 30);
  const upcomingPicks = bySport(upcomingAll);
  const combos = buildCombos(top);
  const capNum = capN === "custom" ? Math.max(1, Math.floor(Number(capCustom) || 0)) : Number(capN);
  const allPicks = DATA.signals.concat(DATA.fun).concat(DATA.props || []).concat(DATA.longshots || []).concat(DATA.biggest || []);

  const buyAll = sortLines(BUY_LINES.filter((l: Line) => passLine(l, f, followed, hidden, DATA.ts)), f.sort);
  const buys = sportFilter ? buyAll.filter((l: Line) => l.league === sportFilter) : buyAll;
  const betRows = BET_LINES.filter((l: Line) => passLine(l, f, followed, hidden, DATA.ts));
  const betPickAll = sortBetPicks(linesToPicks(betRows).filter((p: Pick) => !finished(p) && followOk(p)), f.lineSort);
  const betAll = betPickAll;
  const betPicks = bySport(betAll);
  const holdingsOf = (w: string): Line[] => BET_LINES.filter((l: Line) => (l.wallet || "").toLowerCase() === (w || "").toLowerCase());
  const activeTraders = Array.from(new Set(BET_LINES.map((l: Line) => l.wallet.toLowerCase())));
  const openValue = BET_LINES.reduce((a: number, l: Line) => a + l.amount, 0);
  const graded = DATA.history.filter((h: Hist) => h.result);
  const wins = graded.filter((h: Hist) => h.result === "W").length;
  const wlOf = (tier: string): { w: number; l: number; text: string } => {
    const rows = DATA.history.filter((h: Hist) => h.result && (tier === "top" ? (h.tier === "top" || !h.tier) : h.tier === tier));
    const w = rows.filter((h: Hist) => h.result === "W").length;
    const l = rows.filter((h: Hist) => h.result === "L").length;
    return { w, l, text: w + "-" + l };
  };
  const wlTop = wlOf("top"), wlFun = wlOf("fun"), wlPoly = wlOf("poly"), wlGlue = wlOf("glue"), wlProps = wlOf("props"), wlLong = wlOf("longshots"), wlBig = wlOf("biggest"), wlUp = wlOf("upcoming");
  const capperRecsAll: CapperRec[] = (DATA.capperHistory && DATA.capperHistory.cappers) ? DATA.capperHistory.cappers : [];
  const capMinSample = (DATA.capperHistory && DATA.capperHistory.minSample) ? DATA.capperHistory.minSample : 5;
  const capWlW = capperRecsAll.reduce((a: number, c: CapperRec) => a + (c.w || 0), 0);
  const capWlL = capperRecsAll.reduce((a: number, c: CapperRec) => a + (c.l || 0), 0);
  const tabRecord = tab === "top" ? "Top 20: " + wlTop.text : tab === "fun" ? "Fun: " + wlFun.text : tab === "poly" ? "Polymarket: " + wlPoly.text : tab === "props" ? "Player Props: " + wlProps.text : tab === "longshots" ? "Longshots: " + wlLong.text : tab === "biggest" ? "Biggest Bets: " + wlBig.text : tab === "upcoming" ? "Upcoming: " + wlUp.text : tab === "cappers" ? "Cappers: " + capWlW + "-" + capWlL + " (per capper; a shared pick can count more than once)" : tab === "more" ? "Top 20 " + wlTop.text + " · Fun " + wlFun.text + " · Polymarket " + wlPoly.text + (wlGlue.w + wlGlue.l ? " · Glue " + wlGlue.text : "") + (wlProps.w + wlProps.l ? " · Props " + wlProps.text : "") + (wlLong.w + wlLong.l ? " · Longshots " + wlLong.text : "") + (wlBig.w + wlBig.l ? " · Biggest " + wlBig.text : "") + (wlUp.w + wlUp.l ? " · Upcoming " + wlUp.text : "") : "";
  const tabCaution = tab === "poly" && wlPoly.l > wlPoly.w ? "Caution: the Polymarket tab is losing so far (" + wlPoly.text + "). Bet smaller or skip until the record turns around." : "";

  const journalRows = DATA.history.filter((h: Hist) => journal === "all" || (journal === "won" && h.result === "W") || (journal === "lost" && h.result === "L") || (journal === "pending" && !h.result) || (journal === "top" && (h.tier === "top" || !h.tier)) || (journal === "fun" && h.tier === "fun") || (journal === "poly" && h.tier === "poly") || (journal === "glue" && h.tier === "glue") || (journal === "props" && h.tier === "props") || (journal === "longshots" && h.tier === "longshots") || (journal === "biggest" && h.tier === "biggest") || (journal === "upcoming" && h.tier === "upcoming"));
  const sportRows = allPicks.flatMap((p: Pick) => p.backers.filter((b: Backer) => b.sport).map((b: Backer) => ({ lead: p.league, title: b.name, detail: b.sport ? b.sport.wr + "% over " + b.sport.n + " resolved " + p.league + " markets, P&L " + money(b.sport.pnl) : "", meta: matchup(p.q) })));
  const activeFilterCount = Object.keys(DEFAULT_FILTERS).filter((k: string) => k !== "sort" && k !== "lineSort" && (f as unknown as Record<string, unknown>)[k] !== (DEFAULT_FILTERS as unknown as Record<string, unknown>)[k]).length;
  // capper directory: join all-time trader stats onto scanner records
  const seen: Record<string, { wallet: string; name: string; wr: number | null; pnl: number; golden: boolean; n: number; amt: number }> = {};
  BUY_LINES.concat(BET_LINES).forEach((l: Line) => { const w = l.wallet.toLowerCase(); if (!seen[w]) seen[w] = { wallet: w, name: l.name, wr: l.wr, pnl: l.pnl, golden: l.golden, n: 0, amt: 0 }; seen[w].n += 1; seen[w].amt += l.amount; });
  const topSet: Record<string, boolean> = {};
  TRADERS.forEach((x: Trader) => { topSet[x.wallet.toLowerCase()] = true; });
  const others: Trader[] = Object.keys(seen).filter((w: string) => !topSet[w]).map((w: string) => ({ wallet: w, name: seen[w].name, rank: 0, pnl: seen[w].pnl, wr: seen[w].wr, resolved: null, wins: null, losses: null, pf: null, skill: false, golden: seen[w].golden, qualified: true, bets: seen[w].n, value: Math.round(seen[w].amt), lastTs: null, skillEdge: null }));
  const directory: Trader[] = TRADERS.map((x: Trader) => ({ ...x, bets: Math.max(x.bets, seen[x.wallet.toLowerCase()] ? seen[x.wallet.toLowerCase()].n : 0), value: Math.max(x.value, seen[x.wallet.toLowerCase()] ? Math.round(seen[x.wallet.toLowerCase()].amt) : 0) })).concat(others);
  const traderByW: Record<string, Trader> = {};
  directory.forEach((x: Trader) => { traderByW[(x.wallet || "").toLowerCase()] = x; });
  const tabPickPool: Pick[] = DATA.signals.concat(DATA.fun).concat(DATA.poly || []).concat(DATA.glue || []).concat(DATA.props || []).concat(DATA.longshots || []).concat(DATA.biggest || []).concat(DATA.upcoming || []);
  const livePicksOf = (w: string): Pick[] => {
    const lw = (w || "").toLowerCase();
    const fromLines = linesToPicks(BET_LINES.filter((l: Line) => (l.wallet || "").toLowerCase() === lw));
    const seenKeys: Record<string, boolean> = {};
    fromLines.forEach((p: Pick) => { seenKeys[pickCatalogKey(p.q, p.label)] = true; });
    const extra: Pick[] = [];
    tabPickPool.forEach((p: Pick) => {
      if (!p.backers.some((b: Backer) => (b.wallet || "").toLowerCase() === lw)) return;
      const k = pickCatalogKey(p.q, p.label);
      if (seenKeys[k]) return;
      seenKeys[k] = true;
      extra.push(p);
    });
    return fromLines.concat(extra);
  };
  const capFiltered = capperRecsAll.filter((c: CapperRec) => {
    const w = (c.wallet || "").toLowerCase();
    const tr = traderByW[w];
    if (capView === "following" && followed.indexOf(w) < 0) return false;
    if (capView === "hidden" && hidden.indexOf(w) < 0) return false;
    if (capView === "golden" && !(c.golden || (tr && tr.golden))) return false;
    if (capView === "active" && !c.open && !(tr && tr.bets > 0)) return false;
    if (capView === "qualified" && !c.qualified) return false;
    if (capView === "small" && !(c.n > 0 && !c.qualified)) return false;
    if (capView === "building" && c.n > 0) return false;
    if (capView === "top100" && !((c.rankAll || c.rank || (tr && tr.rank)) && (c.rankAll || c.rank || (tr ? tr.rank : 0)) > 0)) return false;
    if (capQ && ((c.name || "") + " " + c.wallet).toLowerCase().indexOf(capQ.trim().toLowerCase()) < 0) return false;
    return true;
  });
  const capAll = capFiltered;
  const capLeagueItems: { league: string }[] = [];
  capAll.forEach((c: CapperRec) => {
    const lgs: Record<string, boolean> = {};
    (c.picks || []).forEach((hp: CapperHistPick) => { const lg = (hp.league || "").trim(); if (lg) lgs[lg] = true; });
    Object.keys(lgs).forEach((lg: string) => capLeagueItems.push({ league: lg }));
  });
  let capRows = sportFilter ? capAll.filter((c: CapperRec) => (c.picks || []).some((hp: CapperHistPick) => (hp.league || "").trim() === sportFilter)) : capAll.slice();
  capRows = capRows.slice().sort((a: CapperRec, b: CapperRec) => {
    const pband = (c: CapperRec) => c.proven ? 0 : c.coldDemoted ? 2 : 1;
    if (capSort === "quality") return pband(a) - pband(b) || (b.quality || 0) - (a.quality || 0) || (b.cn || 0) - (a.cn || 0) || (b.wr || 0) - (a.wr || 0);
    if (capSort === "wr") return (b.wr || 0) - (a.wr || 0) || b.n - a.n;
    if (capSort === "open") return b.open - a.open || b.n - a.n;
    if (capSort === "profit") return b.profit - a.profit;
    if (capSort === "n") return b.n - a.n || (b.wr || 0) - (a.wr || 0);
    if (capSort === "rank") return (a.rankAll || a.rank || 999) - (b.rankAll || b.rank || 999);
    // default: payload order (qualified wr, then ROI, then n) — re-apply the same key
    const band = (c: CapperRec) => c.qualified ? 0 : c.n > 0 ? 1 : 2;
    return band(a) - band(b) || (b.wr || 0) - (a.wr || 0) || (b.roi != null ? b.roi : -9999) - (a.roi != null ? a.roi : -9999) || b.n - a.n || b.profit - a.profit;
  });
  const statusOpts = [{ value: "active", label: "Live + next 12 hours" }, { value: "live", label: "Live now" }, { value: "upcoming", label: "Upcoming · next 12 hours" }, { value: "hour", label: "Live + next hour" }, { value: "h3", label: "Live + next 3 hours" }, { value: "h6", label: "Live + next 6 hours" }];
  const filterBlock = (isBets: boolean) => (
    <Section heading={isBets ? "Filter and sort bets" : "Filter and sort buys"} caption={activeFilterCount ? activeFilterCount + " filters on · " + (isBets ? betRows.length + " positions" : buys.length + " buys") + " match" : "Defaults: live + next 12h, hedgers and 24h+ stale hidden"} collapsible defaultOpen={false}>
      <Input label="Search events or wallets" value={f.q} onChange={(v: string) => set("q", v)} placeholder="Team, market, capper or 0x…" />
      <Grid columns={2}>
        <Select label="Game starts" value={f.status} onChange={(v: string) => set("status", v)} options={statusOpts} />
        <Select label="Bet type" value={f.betType} onChange={(v: string) => set("betType", v)} options={[{ value: "all", label: "All sports bets" }, { value: "spread", label: "Spreads" }, { value: "moneyline", label: "Moneylines" }, { value: "total", label: "Totals · Over / Under" }, { value: "prop", label: "Player props" }, { value: "other", label: "Other (maps, futures)" }]} />
        {isBets ? (
          <Select label="Sort picks" value={f.lineSort} onChange={(v: string) => set("lineSort", v)} options={[{ value: "strength", label: "Best first · whales and money" }, { value: "start", label: "Event start · earliest first" }, { value: "entry", label: "Trader entry · oldest first" }, { value: "score", label: "Highest score first" }, { value: "resolving", label: "Resolving soonest" }, { value: "exposure", label: "Largest exposure" }]} />
        ) : (
          <Select label="Sort results" value={f.sort} onChange={(v: string) => set("sort", v)} options={[{ value: "strength", label: "Best first · whales and money" }, { value: "evidence", label: "Best evidence first" }, { value: "soonest", label: "Live, then soonest game" }, { value: "newest", label: "Bought · newest first" }, { value: "game-asc", label: "Game start · ascending" }, { value: "game-desc", label: "Game start · descending" }, { value: "biggest", label: "Amount · descending" }, { value: "smallest", label: "Amount · ascending" }, { value: "oldest", label: "Bought · oldest first" }, { value: "market-asc", label: "Market · A–Z" }, { value: "market-desc", label: "Market · Z–A" }, { value: "capper-asc", label: "Capper · A–Z" }, { value: "capper-desc", label: "Capper · Z–A" }]} />
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
    <Page title="Orca Whale Scanner" summary={{
      top: "The strongest Kalshi picks from all-time sports whales, ranked by price band, then backing-whale quality (graded win rate and ROI on copyable bets), then net money and agreement. Singles are the default; up to 3 suggested 2-leg combos sit at the top. Games that have started are hidden.",
      fun: "Kalshi picks that missed Top 20: one-whale, under 10¢ or other cheap leftovers, Split, or Pricier. 10–20¢ picks backed by 2+ whales moved to Longshots; player props moved to Player Props. Started games are hidden.",
      poly: "Whale picks you can only bet on Polymarket (not on Kalshi), from all-time sports whales. Player props and 10–20¢ longshots have their own tabs. Started games are hidden.",
      props: "Individual player bets whales are backing — yards, points, TDs, rebounds and more, any sport. Kalshi contracts when they exist; otherwise the Polymarket bet. Started games are hidden.",
      longshots: "5x–10x payout picks priced 10–20¢, backed by 2+ proven whales with real money. Most will lose; each hit pays 5–10x. Flat $1 stakes, or $2 for the strongest. Started games are hidden.",
      upcoming: "The next games with $500+ bets from proven whales, soonest first, any sport or market including player props. Use this when you want something to bet in the next 24 hours. Started games are hidden.",
      biggest: "The largest whale bets by single-position size, any sport or market type. Ranked by the biggest single whale bet, with how many other whales are on the same side and their money. Started and ended games are hidden. A pick can also appear on other tabs.",
      buys: "The latest big whale buys, shown like Top 20: rank, strength, and the exact Kalshi (or Polymarket) bet in plain words.",
      bets: "Every whale pick in the next 12 hours, shown like Top 20: rank, strength, and the exact Kalshi (or Polymarket) bet in plain words. Live games stay here with a Live tag. Ended games are removed.",
      cappers: "Cappers ranked by the graded record we have collected from their whale picks — wins, losses, win %, and net $ on those picks. Tap a capper for current live picks and every tracked pick, each labeled HIT, MISSED, PUSH, or OPEN/LIVE. Records need " + capMinSample + " graded picks (pushes don't count) to rank at the top; smaller samples are labeled. Records are saved across scans and never wiped.",
      more: "Bankroll, daily cap, your win/loss results, scan details and how the rankings work.",
    }[tab] || ""} record={tabRecord || undefined} caution={tabCaution || undefined}>
      <Hero top={top.length} fun={fun.length} buys={BUY_LINES.length} bets={BET_LINES.length} active={activeTraders.length} value={openValue} />

      <Section heading="Bankroll and pick rules" caption={"Bankroll " + money(bankroll) + " · " + money(minP) + "+ positions · Top 20 needs " + minW + "+ whales" + (followed.length ? " · " + followed.length + " followed" : "") + (hidden.length ? " · " + hidden.length + " hidden" : "")} collapsible defaultOpen={false}>
        <Grid columns={3}>
          <Input label="Bankroll ($)" type="number" value={bankrollText} onChange={(v: string) => setBankroll(v)} />
          <Select label="Min position" value={minPos} onChange={(v: string) => setMinPos(v)} options={[{ value: "500", label: "$500+" }, { value: "1000", label: "$1,000+" }, { value: "2500", label: "$2,500+" }, { value: "5000", label: "$5,000+" }]} />
          <Select label="Top 20 consensus" value={minWallets} onChange={(v: string) => setMinWallets(v)} options={[{ value: "2", label: "2+ whales" }, { value: "3", label: "3+ whales" }, { value: "4", label: "4+ whales" }]} />
        </Grid>
        <Toggle label="Only picks a followed capper backs" value={f.followedOnly} onChange={(v: boolean) => set("followedOnly", v)} />
      </Section>

      {tab === "top" ? (
        <Section heading="Top 20">
          <LeaguePills picks={topAll} value={sportFilter} onChange={setSportFilter} />
          <DailyCap />
          <Text>Singles are the default. Ranked by price band (65–84¢ first), then totals over spreads, then net money and one-sided share, then whale count, then all-time rank. Under 45¢, 95¢+, Split under 55%, Pricier (current more than 3¢ above whale entry), and games that have started are out.</Text>
          {combos.length ? (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 800, margin: "8px 0 4px" }}>Suggested 2-leg combos</div>
              <Text>Built only from Top 20 singles priced 65¢ or higher, never two legs from the same game, never Fun or Polymarket legs. No 3+ leg parlays (4-legs went 0-9).</Text>
              {combos.map((pair: [Pick, Pick], i: number) => (<ComboCard key={pair[0].id + "+" + pair[1].id} a={pair[0]} b={pair[1]} rank={i + 1} bankroll={bankroll} now={now} />))}
            </div>
          ) : <Text>No 2-leg combo right now (need two Top 20 singles at 65¢+ from different games). No 3+ leg parlays (4-legs went 0-9).</Text>}
          {top.length === 0 && f.followedOnly ? <Text>No pick clears the filter: none of the top picks is backed by a capper you follow. Turn off "Only picks a followed capper backs" to see them.</Text> : top.length === 0 ? <Text>No pick qualifies right now under the Top 20 rules. Fun Picks has {fun.length}.</Text> : top.length < 20 ? <Text>Only {top.length} of 20 qualify right now.</Text> : null}
          <div style={{ fontSize: 16, fontWeight: 800, margin: "12px 0 8px" }}>Singles</div>
          {top.map((p: Pick, i: number) => (<PickCard key={p.id} p={p} fun={false} bankroll={bankroll} now={now} rank={i + 1} followed={followed} hidden={hidden} toggle={toggle} />))}
          {glue.length ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, margin: "8px 0 4px" }}>Glue legs</div>
              <Text>95¢+ picks — labeled Small, glue leg only. Never Go big, and never a Top 20 single. Useful only as a cheap parlay glue, which this scanner does not recommend on its own.</Text>
              {glue.map((p: Pick, i: number) => (<PickCard key={p.id} p={p} fun={false} bankroll={bankroll} now={now} rank={i + 1} followed={followed} hidden={hidden} toggle={toggle} />))}
            </div>
          ) : null}
          <Text>Top 20 rules: {minW}+ all-time sports whales (top {DATA.coverage.cappers}) with {money(minP)}+ each, verified Kalshi contract, no hedgers, game has not started, price 45–94¢, one-sided share at least 55%, current price not more than 3¢ above the whales' average entry.</Text>
        </Section>
      ) : null}


      {tab === "upcoming" ? (
        <Section heading="Upcoming">
          <LeaguePills picks={upcomingAll} value={sportFilter} onChange={setSportFilter} />
          <DailyCap />
          <div style={{ borderRadius: 16, padding: "12px 14px", background: t.bg.subtle, fontFamily: t.font.family, fontSize: 14, lineHeight: "20px", color: t.text.secondary, marginBottom: 14 }}>
            <span style={{ color: BRAND2, fontWeight: 800 }}>Soonest games first. </span>The next 24 hours of games that $500+ proven whales have already bet, any sport or market type (including player props). Each card shows both teams, the date and start time in PT, a countdown, the biggest whale bet (name and all-time rank), how many other big whales are on the same bet and their money, the combined total, and a split flag if whales are on the other side. Strength follows the usual rules: under 45¢ is never Go big, 95¢+ is glue only, and a pricier-than-entry flag is shown. Started and ended games are hidden. Up to 30 cards. Duplicates with other tabs are fine — this is a view by kickoff time.
          </div>
          {upcomingPicks.length === 0 && f.followedOnly ? <Text>No upcoming whale bet is backed by a capper you follow. Turn off "Only picks a followed capper backs" to see them.</Text> : upcomingPicks.length === 0 ? <Text>No $500+ whale bets on games starting in the next 24 hours that have not started yet.</Text> : <Text>{upcomingPicks.length} upcoming game{upcomingPicks.length === 1 ? "" : "s"} with whale bets in the next 24 hours, soonest first.</Text>}
          {upcomingPicks.map((p: Pick, i: number) => (<PickCard key={p.id} p={p} fun={false} poly={p.kalshi.status !== "ok"} upcoming={true} bankroll={bankroll} now={now} rank={i + 1} followed={followed} hidden={hidden} toggle={toggle} />))}
        </Section>
      ) : null}

      {tab === "fun" ? (
        <Section heading="Fun Picks">
          <LeaguePills picks={funAll} value={sportFilter} onChange={setSportFilter} />
          <DailyCap />
          <div style={{ borderRadius: 16, padding: "12px 14px", background: t.bg.subtle, fontFamily: t.font.family, fontSize: 14, lineHeight: "20px", color: t.text.secondary, marginBottom: 14 }}>
            <span style={{ color: AMBER, fontWeight: 800 }}>Not Top 20. </span>One-whale picks, leftover cheap prices (under 10¢, or under 45¢ without 2+ one-sided whales), Split under 55%, and Pricier lines (current more than 3¢ above whale entry). 10–20¢ picks backed by 2+ whales live on Longshots; player props live on Player Props. Games that have started are hidden. Stakes follow the Small / Normal labels.
          </div>
          {fun.slice(0, funLimit).map((p: Pick, i: number) => (<PickCard key={p.id} p={p} fun={true} bankroll={bankroll} now={now} rank={i + 1} followed={followed} hidden={hidden} toggle={toggle} />))}
          {fun.length > funLimit ? <Button label={"Show more Fun Picks (" + (fun.length - funLimit) + " left)"} onClick={() => setFunLimit(funLimit + 10)} /> : null}
        </Section>
      ) : null}

      {tab === "poly" ? (
        <Section heading="Polymarket">
          <LeaguePills picks={polyBase} value={sportFilter} onChange={setSportFilter} />
          <DailyCap />
          <div style={{ borderRadius: 16, padding: "12px 14px", background: t.bg.subtle, fontFamily: t.font.family, fontSize: 14, lineHeight: "20px", color: t.text.secondary, marginBottom: 14 }}>
            <span style={{ color: BRAND2, fontWeight: 800 }}>Polymarket only. </span>These whale picks passed every rule — all-time sports whales, $500+ positions, game within 12 hours and not yet started, no hedgers — but Kalshi has no matching contract. They never appear on Top 20, Fun, Buys or Bets as a Kalshi play. Ranked like Top 20. Tap the green button to open the market on Polymarket.
          </div>
          {poly.length === 0 && f.followedOnly ? <Text>No Polymarket-only pick is backed by a capper you follow. Turn off "Only picks a followed capper backs" to see them.</Text> : poly.length === 0 ? <Text>No Polymarket-only picks right now: every qualifying whale bet either has a Kalshi contract (see Top 20 and Fun) or is outside the 12-hour window.</Text> : poly.length < 20 && polyAll.length <= 20 ? <Text>{poly.length} Polymarket-only pick{poly.length === 1 ? "" : "s"} right now, ranked best first.</Text> : null}
          {poly.slice(0, polyLimit).map((p: Pick, i: number) => (<PickCard key={p.id} p={p} fun={false} poly={true} bankroll={bankroll} now={now} rank={i + 1} followed={followed} hidden={hidden} toggle={toggle} />))}
          {poly.length > polyLimit ? <Button label={"Show more Polymarket picks (" + (poly.length - polyLimit) + " left)"} onClick={() => setPolyLimit(polyLimit + 10)} /> : null}
          <Text>Same rules as the rest of the scan, minus a Kalshi contract. Any sport. Each card says in plain words what to buy on Polymarket, with the price, and links to the market.</Text>
        </Section>
      ) : null}

      {tab === "props" ? (
        <Section heading="Player Props">
          <LeaguePills picks={propsBase} value={sportFilter} onChange={setSportFilter} />
          <DailyCap />
          <div style={{ borderRadius: 16, padding: "12px 14px", background: t.bg.subtle, fontFamily: t.font.family, fontSize: 14, lineHeight: "20px", color: t.text.secondary, marginBottom: 14 }}>
            <span style={{ color: BRAND, fontWeight: 800 }}>Player bets only. </span>Individual player lines whales are backing — points, rebounds, assists, yards, TDs, and the same idea in any sport Kalshi or Polymarket lists. Ranked like Top 20 (price band, net money, whale count, all-time rank). Games that have started are hidden. If Kalshi has the contract, the card shows the plain-words BUY YES/NO; if not, it shows On Polymarket: BUY … These can still appear on Bets.
          </div>
          {propsPicks.length === 0 && f.followedOnly ? <Text>No player prop is backed by a capper you follow. Turn off "Only picks a followed capper backs" to see them.</Text> : propsPicks.length === 0 ? <Text>No player-prop bets from whales in the current window. They show here when a whale backs a player line (points, yards, TDs, rebounds, and so on) and the game has not started. They can also appear on Bets.</Text> : propsPicks.length < 20 && propsPool.length <= 20 ? <Text>{propsPicks.length} player-prop pick{propsPicks.length === 1 ? "" : "s"} right now, ranked best first.</Text> : null}
          {propsPicks.slice(0, propsLimit).map((p: Pick, i: number) => (<PickCard key={p.id} p={p} fun={false} poly={p.kalshi.status !== "ok"} bankroll={bankroll} now={now} rank={i + 1} followed={followed} hidden={hidden} toggle={toggle} />))}
          {propsPicks.length > propsLimit ? <Button label={"Show more player props (" + (propsPicks.length - propsLimit) + " left)"} onClick={() => setPropsLimit(propsLimit + 10)} /> : null}
        </Section>
      ) : null}

      {tab === "longshots" ? (
        <Section heading="Longshots">
          <LeaguePills picks={longBase} value={sportFilter} onChange={setSportFilter} />
          <DailyCap />
          <div style={{ borderRadius: 16, padding: "12px 14px", background: t.bg.subtle, fontFamily: t.font.family, fontSize: 14, lineHeight: "20px", color: t.text.secondary, marginBottom: 14 }}>
            <span style={{ color: AMBER, fontWeight: 800 }}>Most of these will lose. </span>Each hit pays 5–10x. Only 10–20¢ prices, backed by 2+ proven whales with real one-sided money. Games or player props, any sport. Ranked like Top 20. Flat stakes: $1, or $2 for the strongest, kept under the daily cap. These used to sit in Fun Picks; they no longer do.
          </div>
          {longPicks.length === 0 && f.followedOnly ? <Text>No longshot is backed by a capper you follow. Turn off "Only picks a followed capper backs" to see them.</Text> : longPicks.length === 0 ? <Text>No 10–20¢ picks backed by 2+ whales with one-sided money right now. Most longshots lose; this tab stays empty unless the price, whale, and money tests all clear, and the game has not started.</Text> : longPicks.length < 20 && longPool.length <= 20 ? <Text>{longPicks.length} longshot{longPicks.length === 1 ? "" : "s"} right now, ranked best first.</Text> : null}
          {longPicks.slice(0, longLimit).map((p: Pick, i: number) => (<PickCard key={p.id} p={p} fun={false} poly={p.kalshi.status !== "ok"} longshot={true} bankroll={bankroll} now={now} rank={i + 1} followed={followed} hidden={hidden} toggle={toggle} />))}
          {longPicks.length > longLimit ? <Button label={"Show more longshots (" + (longPicks.length - longLimit) + " left)"} onClick={() => setLongLimit(longLimit + 10)} /> : null}
        </Section>
      ) : null}

      {tab === "biggest" ? (
        <Section heading="Biggest Bets">
          <LeaguePills picks={biggestAll} value={sportFilter} onChange={setSportFilter} />
          <DailyCap />
          <div style={{ borderRadius: 16, padding: "12px 14px", background: t.bg.subtle, fontFamily: t.font.family, fontSize: 14, lineHeight: "20px", color: t.text.secondary, marginBottom: 14 }}>
            <span style={{ color: GREEN, fontWeight: 800 }}>Ranked by the biggest single whale bet. </span>Any sport, any market type (including player props). Each card shows that whale's all-time rank and bet size, how many other whales made the same bet (same market and side), their money, and the combined total. Split markets (whales on both sides) are flagged. Strength follows the usual rules: under 45¢ is never Go big, 95¢+ is glue only, and a pricier-than-entry flag is shown. Started and ended games are hidden. Duplicates with other tabs are fine — this is a view by size.
          </div>
          {biggestPicks.length === 0 && f.followedOnly ? <Text>No large whale bet is backed by a capper you follow. Turn off "Only picks a followed capper backs" to see them.</Text> : biggestPicks.length === 0 ? <Text>No open $500+ whale bets on games that have not started. They'll show here after the next scan, ranked by the largest single position.</Text> : <Text>{biggestPicks.length} largest whale bet{biggestPicks.length === 1 ? "" : "s"} right now, ranked by the biggest single position.</Text>}
          {biggestPicks.slice(0, bigLimit).map((p: Pick, i: number) => (<PickCard key={p.id} p={p} fun={false} poly={p.kalshi.status !== "ok"} biggest={true} bankroll={bankroll} now={now} rank={i + 1} followed={followed} hidden={hidden} toggle={toggle} />))}
          {biggestPicks.length > bigLimit ? <Button label={"Show more biggest bets (" + (biggestPicks.length - bigLimit) + " left)"} onClick={() => setBigLimit(Math.min(30, bigLimit + 10))} /> : null}
        </Section>
      ) : null}

      {tab === "buys" ? (
        <Fragment>
          {filterBlock(false)}
          <Section heading={"Recent Buys · " + buys.length}>
            <LeaguePills picks={buyAll} value={sportFilter} onChange={setSportFilter} />
            <Text>{buys.length ? "The newest $500+ whale buys on games live or starting within 12 hours, ranked strongest first (whales on the side, then size). Change sort to “Bought · newest first” if you want them in time order. Scan " + DATA.scannedAt + "." : "No buys match these filters. Reset display filters to see all " + BUY_LINES.length + "."}</Text>
            {buys.slice(0, buyLimit).map((l: Line, i: number) => (<BuyCard key={l.key} l={l} now={now} rank={i + 1} bankroll={bankroll} followed={followed} hidden={hidden} toggle={toggle} />))}
            {buys.length > buyLimit ? <Button label={"Show more buys (" + (buys.length - buyLimit) + " left)"} onClick={() => setBuyLimit(buyLimit + 20)} /> : null}
          </Section>
        </Fragment>
      ) : null}

      {tab === "bets" ? (
        <Fragment>
          {filterBlock(true)}
          <Section heading={"Sports bets · " + betPicks.length + " picks"}>
            <LeaguePills picks={betAll} value={sportFilter} onChange={setSportFilter} />
            <DailyCap />
            <Text>{betPicks.length ? betPicks.length + " picks from " + betRows.length + " open whale positions ($500+) in the next 12 hours, each shown like Top 20: what to buy on Kalshi in plain words, or the Polymarket bet if Kalshi has no contract. Live games stay here with a Live tag. Ranked strongest first." : "No open bets match these filters. Reset display filters to see all " + BET_LINES.length + " positions."}</Text>
            {betPicks.slice(0, lineLimit).map((p: Pick, i: number) => (<PickCard key={p.id} p={p} fun={false} poly={p.kalshi.status !== "ok"} bankroll={bankroll} now={now} rank={i + 1} followed={followed} hidden={hidden} toggle={toggle} />))}
            {betPicks.length > lineLimit ? <Button label={"Show more picks (" + (betPicks.length - lineLimit) + " left)"} onClick={() => setLineLimit(lineLimit + 20)} /> : null}
            <Text>Actual multi-leg combos: OrcaLayer reports single-market positions only, so combos are not listed here. Suggested 2-leg combos sit on the Top 20 tab.</Text>
          </Section>
        </Fragment>
      ) : null}

      {tab === "cappers" ? (
        <Section heading={"Cappers · " + capRows.length}>
          <LeaguePills picks={capLeagueItems} value={sportFilter} onChange={setSportFilter} allCount={capAll.length} />
          <Text>Cappers ranked by quality: Proven first (10+ graded copyable picks, winning record, positive copyable ROI, positive Polymarket P&L in the past month and all time, and not negative in both the past week and past year). Each row shows Polymarket P&L for the past week, month, year and all time with a badge: Hot (all four up), OK, Cooling (past week down, small penalty) or Cold (past month, past year or all time down, demoted on every tab). Conviction: each whale's usual bet is the median of their tracked bets; 2x+ (or a top-3 bet that day) is High conviction, 0.25x or less is Throwaway and barely counts in ranking. Picks inside a capper are listed biggest bet first. A capper needs {capMinSample} graded picks (pushes don't count) to rank at the top; smaller samples are labeled Small sample, and cappers with no grades yet show Record building. Quality ranking for picks uses only Kalshi-copyable singles in the 10–94¢ bands, needs 10 graded copyable picks, and shrinks toward the average; below 10 is treated as neutral, not boosted. High-volume, low-edge whales are demoted. Tap a card for current live picks (PickCards labeled OPEN or LIVE) and every tracked pick labeled HIT, MISSED, PUSH, or OPEN/LIVE. Records are saved across scans and never wiped. The tab W-L adds each capper's record, so a pick two cappers both took is counted twice. Follow to filter other tabs to them; hide to drop them from every count.</Text>
          <Segmented options={[{ value: "all", label: "All", count: capperRecsAll.length }, { value: "qualified", label: "5+ graded" }, { value: "small", label: "Small sample" }, { value: "building", label: "Record building" }, { value: "active", label: "Live now" }, { value: "following", label: "Following", count: followed.length }, { value: "hidden", label: "Hidden", count: hidden.length }, { value: "golden", label: "Golden" }, { value: "top100", label: "Top whales" }]} value={capView} onChange={(v: string) => { setCapView(v); setCapLimit(25); }} />
          <Grid columns={2}>
            <Input label="Search cappers" value={capQ} onChange={(v: string) => { setCapQ(v); setCapLimit(25); }} placeholder="Name or 0x wallet" />
            <Select label="Sort" value={capSort} onChange={(v: string) => setCapSort(v)} options={[{ value: "quality", label: "Quality · proven, period P&L" }, { value: "record", label: "Best scanner record" }, { value: "wr", label: "Win rate" }, { value: "n", label: "Most graded" }, { value: "profit", label: "Net $ on graded" }, { value: "open", label: "Open bets now" }, { value: "rank", label: "All-time rank" }]} />
          </Grid>
          {saved ? <Text>{saved}</Text> : null}
          {capRows.length ? capRows.slice(0, capLimit).map((c: CapperRec) => (
              <CapperCard key={c.wallet} rec={c} trader={traderByW[(c.wallet || "").toLowerCase()]} now={now} bankroll={bankroll} livePicks={livePicksOf(c.wallet)} followed={followed} hidden={hidden} toggle={toggle} />
            )) : <Text>{capperRecsAll.length ? "No cappers match these filters." : "Records are building — run a refresh or scan to start grading capper picks."}</Text>}
          {capRows.length > capLimit ? <Button label={"Show more cappers (" + (capRows.length - capLimit) + " left)"} onClick={() => setCapLimit(capLimit + 25)} /> : null}
        </Section>
      ) : null}

      {tab === "more" ? (
        <Section heading="More">
          <Section heading="Bankroll" caption="Default $166 (from Pikkit). Saved on this device when you edit it. An old $160 or $225.06 default on this device is replaced automatically." defaultOpen={true}>
            <Input label="Bankroll ($)" type="number" value={bankrollText} onChange={(v: string) => setBankroll(v)} />
            <Text>Stakes: Small = 1% · Normal = 2% · Go big = 4% (max $10), rounded to the nearest dollar, minimum $1. Combos = 1%. Longshots are flat $1, or $2 for the strongest.</Text>
            <DailyCap />
          </Section>
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
            <Select label="Show" value={journal} onChange={(v: string) => setJournal(v)} options={[{ value: "all", label: "All saved picks" }, { value: "won", label: "Winning outcomes" }, { value: "lost", label: "Losing outcomes" }, { value: "pending", label: "Pending outcomes" }, { value: "top", label: "Top 20 picks" }, { value: "fun", label: "Fun Picks" }, { value: "poly", label: "Polymarket picks" }, { value: "glue", label: "Glue legs" }, { value: "props", label: "Player props" }, { value: "longshots", label: "Longshots" }, { value: "biggest", label: "Biggest Bets" }, { value: "upcoming", label: "Upcoming" }]} />
            {journalRows.length ? <Rows rows={journalRows.map((h: Hist) => ({ lead: h.tier === "fun" ? "Fun" : h.tier === "poly" ? "Poly" : h.tier === "glue" ? "Glue" : h.tier === "props" ? "Props" : h.tier === "longshots" ? "Longshot" : h.tier === "biggest" ? "Biggest" : h.tier === "upcoming" ? "Upcoming" : "Top", title: (vsTitleOf(h.q) || matchup(h.q)) + " — " + h.label, detail: "Score " + h.score + ", " + h.whales + " whales, " + money(h.invested) + ". " + h.kalshi + ". " + (tidyDate(h.start) || ("Starts " + h.start)) + ".", meta: "First seen " + ptTime(h.first_seen) + " · " + h.scans + (h.scans === 1 ? " scan" : " scans"), status: h.result ? (h.result === "W" ? { label: "Won", tone: "success" as const } : { label: "Lost", tone: "danger" as const }) : { label: h.active ? "Active" : "Waiting for result" } }))} /> : <Text>No saved picks in this view yet.</Text>}
          </Section>
          <Section heading="Scan history" collapsible defaultOpen={false}>
            <Rows rows={DATA.scans.slice().reverse().map((s: Scan) => ({ title: ptTime(s.ts), detail: s.signals + " Top picks · " + s.fun + " Fun picks" + (s.poly !== undefined ? " · " + s.poly + " Polymarket picks" : "") + (s.props !== undefined ? " · " + s.props + " player props" : "") + (s.longshots !== undefined ? " · " + s.longshots + " longshots" : "") + (s.biggest !== undefined ? " · " + s.biggest + " biggest bets" : "") + (s.buys !== undefined ? " · " + s.buys + " buys · " + s.bets + " bets · " + s.wallets + " wallets checked" : ""), meta: (s.cappers ? s.cappers + " cappers · " : "") + s.calls + " OrcaLayer calls" }))} />
          </Section>
          <Section heading="Scan details and coverage" collapsible defaultOpen={false}>
            <Properties items={[
              { label: "Scanned", value: DATA.scannedAt + " in " + DATA.secs + "s · manual scan only" },
              { label: "Whales", value: "Top " + DATA.coverage.cappers + " sports whales by all-time P&L (OrcaLayer /api/v2/whales/leaderboard?sort=pnl; pnl-leaderboard only supports window 7 or 30, verified 2026-11-12" + ((DATA.coverage.lbAll || DATA.coverage.lb30) ? "; read all-time ranks 1–" + (DATA.coverage.lbAll || DATA.coverage.lb30)!.deepestRank + " in order, skipped " + (DATA.coverage.lbAll || DATA.coverage.lb30)!.skippedNonSports + " non-sports and " + (DATA.coverage.lbAll || DATA.coverage.lb30)!.skippedNoPositions + " with no open positions" : "") + "), " + DATA.coverage.golden + " golden. 30-day P&L is attached as secondary info when a whale also appears on the 30-day leaderboard." },
              { label: "Open positions read", value: DATA.coverage.positionsLoaded + " across " + DATA.coverage.walletsLoaded + " wallets; " + DATA.coverage.bets + " qualifying bets kept" },
              { label: "Recent buys", value: DATA.coverage.buysRaw + " whale buys in 24h, " + DATA.coverage.buys + " qualified and in the 12h window" },
              { label: "Sports markets with 2+ whales", value: DATA.coverage.marketsFound + " found, " + DATA.coverage.marketsInWindow + " in window, " + DATA.coverage.marketsScanned + " checked" },
              { label: "Hedges dropped", value: DATA.coverage.hedgedExcluded + " hedged holders + " + DATA.coverage.twoSidedExcluded + " two-sided capper positions" },
              { label: "OrcaLayer calls", value: DATA.coverage.orcaCalls + (DATA.coverage.orcaErrors.length ? ", errors: " + DATA.coverage.orcaErrors.join("; ") : ", no errors") },
              { label: "Kalshi", value: DATA.coverage.kalshiSeries + " series read, " + DATA.coverage.kalshiMatched + " pick contracts verified, " + (DATA.coverage.notOnKalshi || 0) + " side-groups with no Kalshi match (Polymarket tab)" },
              { label: "ESPN", value: DATA.coverage.espnLeagues + " league scoreboards checked" },
              { label: "Times", value: "Pacific Time. Window: next 12 hours, games that have not started. Started games are dropped from Top 20, Upcoming, Fun, Polymarket, Player Props, Longshots, Biggest Bets and combos (they stay on Bets with a Live tag). Ended games are removed everywhere." },
            ]} />
          </Section>
          <Section heading="Methodology" collapsible defaultOpen={false} caption="Scores rank evidence; they are not win probabilities.">
            <Properties items={[
              { label: "Guardrails", value: "Only the top " + DATA.coverage.cappers + " all-time sports whales count (≥50% of open cost in sports) · $500 minimum position · 2+ of them for Top 20 · verified Kalshi contract required for Top 20 and Fun · the Polymarket tab is only for picks with no Kalshi contract (never a duplicate of a Kalshi tab) · player props have their own tab · 10–20¢ 2-whale one-sided picks go to Longshots, not Fun · Biggest Bets ranks remaining open bets by the largest single whale position · Upcoming lists $500+ whale bets on games starting in the next 24 hours, soonest first · games that have started are hidden from Top 20, Upcoming, Fun, Polymarket, Player Props, Longshots, Biggest Bets and combos" },
              { label: "Top 20 ranking", value: "Price band first (65–84¢ best, then 45–64¢ and 85–94¢; under 45¢ and 95¢+ are out of Top 20), then backing-whale quality (graded win rate and ROI on copyable Kalshi singles; 10+ sample, small samples neutral, low-edge volume demoted), then net money (for minus against) and one-sided share, then whale count. Split (share under 65%) is capped at Small and dropped from Top 20 if under 55%. Pricier (current >3¢ above whale avg entry) is dropped from Top 20; >5¢ is hidden from Top 20 entirely." },
              { label: "Polymarket tab", value: "Up to 20 whale picks that passed every rule but have no matching Kalshi contract. Ranked the same way as Top 20. Each card says in plain words what to buy on Polymarket and links to the market. Player props and 10–20¢ longshots are moved to their own tabs. Results are tagged Polymarket in the journal. Refresh drops started and finished ones. A caution is shown while the tab's graded record is losing." },
              { label: "Player Props tab", value: "Individual player bets (yards, points, TDs, rebounds, and similar) in any sport. Ranked like Top 20. Kalshi player-prop contracts are used when they exist; otherwise the card shows On Polymarket: BUY … Started games are hidden. These can still appear on Bets." },
              { label: "Longshots tab", value: "5x–10x payouts: prices 10–20¢, 2+ proven whales, net one-sided (share at least 55%), any type or sport. Ranked like Top 20. Most will lose; each hit pays 5–10x. Flat $1 stakes, or $2 for the strongest, under the daily cap. Moved out of Fun Picks so they are not duplicated there." },
              { label: "Upcoming tab", value: "Up to 30 unstarted games in the next 24 hours that $500+ proven whales have bet, any sport or market including player props, sorted by soonest start time, with backer quality as the tiebreak when start times match. Each card shows both teams, the PT date and start time with a countdown, the biggest whale bet (name and all-time rank), how many other whales are on the same bet and their money, the combined total, a split flag if whales are on the other side, and the backers' graded W-L and ROI. Strength rules still apply." },
              { label: "Biggest Bets tab", value: "Up to 30 open whale bets, ranked first by the backing whales' graded quality, then by the largest single $500+ position and total money on that side. Any sport or market type, including player props. Each card shows the biggest whale's bet size and all-time rank, how many other whales made the same bet, their money, the combined total, and the backers' graded W-L and ROI. Split markets are flagged. Strength rules still apply (under 45¢ never Go big, 95¢+ glue only, pricier-than-entry flag). Started and ended games are hidden. Duplicates with other tabs are expected." },
              { label: "Cappers tab", value: "One card per whale we have collected picks from, ranked by graded scanner record (5+ graded to lead; smaller samples labeled). Tap to see current live picks as PickCards and every tracked pick labeled HIT, MISSED, PUSH, or OPEN/LIVE. Records are stored in capper history, graded on refresh, and never wiped. The tab W-L is the sum of each capper's record (a shared pick can count more than once)." },
              { label: "Whale-quality ranking", value: "Picks on Top 20, Fun, Polymarket, Player Props, Longshots, Biggest Bets, and Bets are ranked by price band first (existing 65–84¢ / mid / other bands; started and overpriced rules still apply), then by the backing whales' quality, then net money and agreement. Quality is each whale's win rate and ROI on Kalshi-copyable singles in the 10–94¢ bands. A whale needs 10+ graded copyable picks to get a non-neutral score; smaller samples shrink toward the average but are treated as neutral (not boosted). High-volume whales with ROI near zero or negative on those copyable bets are heavily demoted. Upcoming stays soonest-first, with quality as the tiebreak. Every card shows Backers W-L and ROI from those graded copyable records. Period P&L rule: whales whose Polymarket P&L is negative over the past month, past year or all time are Cold and demoted; past-week-only negative is Cooling (small penalty). Conviction: each backer's bet is compared with their usual (median) bet; High conviction (2x+ or a top-3 bet that day) weighs 1.5x, Throwaway (0.25x or less) weighs 0.1x in quality, net money and whale count. Cards list the top backers as e.g. 'name $587 = 3.1x usual · High conviction · Hot · Wk/Mo/Yr/All P&L'." },
              { label: "Strength label", value: "Go big: 3+ top whales, or $10,000+ with opposing whale money under 15% (or none) — never on under-45¢, 95¢+, or Split (share under 65%). Spreads cap at Normal unless 3+ whales and share of 65% or more. Normal: exactly 2. Small: 1, or any capped pick. 95¢+ is labeled Small, glue leg only." },
              { label: "Signal score (picks)", value: "Consensus 25 · Capper record 25 · Money 15 · One-sided 15 · Golden 10 · Fresh money 10" },
              { label: "Evidence score (buys, bets)", value: "Recency 25 · Capper record 20 · Independent agreement within 60 min 20 · Kalshi quote 20 · Kalshi price at or below the capper's 10" },
              { label: "Strong evidence only", value: "Golden capper, bought within 60 minutes, another whale agreeing within 60 minutes, verified Kalshi contract" },
              { label: "Confidence colors", value: "Green 65+, yellow 45–64, red under 45" },
              { label: "Stake", value: "Small = 1% of bankroll, Normal = 2%, Go big = 4% (max $10), rounded to the nearest $1 with a $1 minimum. Combos = 1%. Longshots are flat $1, or $2 for the strongest, kept under the daily cap. Bankroll defaults to $166 and saves on this device. Daily cap $40, stop after a losing reload; don't re-bet a pick you already lost today. Each card has a short copyable pick ID for Pikkit grading." },
              { label: "Chance to hit", value: "Polymarket price of the held side; market-implied, not a prediction" },
            ]} />
          </Section>
          <Section heading="Connections" collapsible defaultOpen={false}>
            <Rows rows={[
              { lead: "OrcaLayer", title: "Your Premium key", detail: "Leaderboard, open positions, market holders, whale alerts, buy times. The only whale source.", status: { label: "Connected", tone: "success" as const } },
              { lead: "Kalshi", title: "Public market API", detail: "Contract match, YES/NO wording and ask price only. Never a signal.", status: { label: "Public" } },
              { lead: "ESPN", title: "Public scoreboard", detail: "Start times, live status, scores, venue and records.", status: { label: "Public" } },
              { lead: "Polymarket", title: "Profiles and markets", detail: "Every capper name opens polymarket.com/profile/<wallet>. Polymarket-tab cards link to polymarket.com/event/<slug>.", status: { label: "Links" } },
            ]} />
          </Section>
          <Section heading="Limits" collapsible defaultOpen={false}>
            <NumberedList items={[
              "Scan and Refresh run on GitHub Actions from the buttons at the top. A scan takes about 8–12 minutes; refresh about a minute. Only one runs at a time.",
              "Follow and hide choices save on this device only.",
              "Whale positions come from each top whale's own open positions (up to 200 per wallet), so a whale with more open bets can be missed.",
              "Refresh uses ESPN and Kalshi only; esports and leagues ESPN doesn't cover show no ESPN win chance.",
              "Started games are dropped from Top 20, Upcoming, Fun, Polymarket, Player Props, Longshots, Biggest Bets and combos on refresh (they stay on Bets with a Live tag). Ended games are removed from every list after their W/L is written to the Journal.",
              "Suggested 2-leg combos are built only from Top 20 singles priced 65¢+, never the same game, never Fun or Polymarket legs. No 3+ leg parlays (4-legs went 0-9). OrcaLayer itself does not report parlays. ESPN player stats are not loaded.",
              "Esports start times come from Kalshi contract wording or the same match's markets; some show the date only.",
            ]} />
          </Section>
        </Section>
      ) : null}

      <Floating edge="top" align="center" bar>
        <div data-tab-bar="1">
        <PillTabs
          options={[{ value: "top", label: "Top 20", count: topAll.length }, { value: "upcoming", label: "Upcoming", count: upcomingAll.length }, { value: "fun", label: "Fun", count: funAll.length }, { value: "poly", label: "Polymarket", count: polyBase.length }, { value: "props", label: "Player Props", count: propsBase.length }, { value: "longshots", label: "Longshots", count: longBase.length }, { value: "biggest", label: "Biggest Bets", count: biggestAll.length }, { value: "buys", label: "Buys", count: buyAll.length }, { value: "bets", label: "Bets", count: betAll.length }, { value: "cappers", label: "Cappers" }, { value: "more", label: "More" }]}
          value={tab}
          onChange={(v: string) => { setTab(v); setSportFilter(""); }}
        />
        </div>
      </Floating>
    </Page>
  );
}



