import { Page, Section, Rows, Properties, Segmented, Select, Input, Toggle, Grid, NumberedList, Floating, Text, Button, CardGrid, Fragment, useState, useEffect, useGrokTheme } from "./kit";
import type { ReactNode } from "./kit";

interface Backer { name: string; cost: number; avg: number | null; wr: number | null; resolved: number | null; pnl: number; rank: number | null; golden: boolean; skill: boolean; flow: string | null; buy24: number | null; sell24: number | null; sport: { n: number; wr: number; pnl: number } | null; wallet: string; top100?: boolean | null; rank30?: number | null; rankAll?: number | null; firstTs: number | null; lastTs: number | null; trades: number | null }
interface Kalshi { status: string; why?: string; action?: string; price?: number; ticker?: string; contract?: string; rule?: string; edge_vs_whales?: number | null; edge_vs_poly?: number; slip?: number | null; light?: string; yesAsk?: number | null; noAsk?: number | null; marketTitle?: string; eventTitle?: string; oppTicker?: string; oppContract?: string; oppAction?: string; oppPrice?: number | null }
interface Game { name: string | null; start: string; src: string; state: string | null; detail: string; score: string; venue?: string | null; records?: string[]; url?: string | null; teams?: string[] }
interface Opp { name: string; wallet: string; cost: number; avg: number | null; wr: number | null; qualified: boolean; golden: boolean; rank?: number | null; rank30?: number | null; rankAll?: number | null }
interface Refresh { at: number; state?: string | null; detail?: string; score?: string; pct?: number | null; src?: string; team?: string; kNow?: number; final?: string; ended?: boolean; why?: string }
interface Pick { id: string; q: string; label: string; kind: string; league: string; slug: string; score: number; parts: Record<string, number>; price: number; avgEntry: number | null; whales: number; invested: number; golden: number; oppMoney: number; oppCount: number; oppQualified: number; fresh24: number; fresh24Opp: number; sideAll: number; sideCountAll: number | null; oppAll: number; oppCountAll: number | null; hedgeAll: number; game: Game; startTs: number; backers: Backer[]; opposing: Opp[]; kalshi: Kalshi; risks: string[]; net?: number; totalBackers?: number | null; refresh?: Refresh; oneSidedShare?: number | null; priceBand?: string; split?: boolean; glue?: boolean; pricier?: boolean; overCents?: number | null; pickId?: string; strength?: string; started?: boolean; fromProven?: boolean }
interface Hist { id: string; tier?: string; q: string; label: string; score: number; whales: number; invested: number; start: string; kalshi: string; kprice?: number | null; first_seen: number; last_seen: number; scans: number; result: string | null; graded?: number; active: boolean }
interface CapperHistPick { id: string; q?: string | null; label?: string | null; side?: string | null; league?: string | null; start?: string | null; startTs?: number | null; kind?: string | null; cost?: number | null; avg?: number | null; result?: string | null; graded?: number | null; kAct?: string | null; kContract?: string | null; kprice?: number | null; profit?: number | null; current?: boolean; conv?: string | null; mult?: number | null }
interface CapperRec { firstTs?: number | null; ageDays?: number | null; big?: { w?: number; l?: number; n?: number; profit?: number | null; risked?: number | null; roi?: number | null; spanDays?: number | null; firstTs?: number | null; lastTs?: number | null; floor?: number | null; med?: number | null }; kShare?: number | null; wallet: string; name: string; rankAll?: number | null; rank?: number | null; golden?: boolean; w: number; l: number; push: number; open: number; n: number; profit: number; risked: number; wr?: number | null; roi?: number | null; qualified: boolean; pnl?: number | null; wrAll?: number | null; picks: CapperHistPick[]; cw?: number; cl?: number; cn?: number; cwr?: number | null; croi?: number | null; cprofit?: number; crisked?: number; quality?: number; qQual?: boolean; demoted?: boolean; shrunkWr?: number | null; shrunkRoi?: number | null; win?: Record<string, { pnl?: number; roi?: number | null; rec?: number[] }>; badge?: string; proven?: boolean; coldDemoted?: boolean; medBet?: number | null; maxBet?: number | null; convRec?: Record<string, { w: number; l: number; roi: number | null }>; winStale?: string[]; tracked?: boolean; isNew?: boolean; addedTs?: number | null; trackedReason?: string | null; hotBoost?: number; f14?: { w: number; l: number; n: number; roi: number | null }; formCooling?: boolean; sports?: Record<string, { w: number; l: number; n: number; roi: number | null }>; copies?: { w: number; l: number; n: number; push: number; open: number; tickets: number; tw: number; tl: number; stake: number }; bf?: { n: number; med: number | null; ts: number; days: number; recent: (string | number)[][] }; recSrc?: { scanner: number; backfill: number }; qwr?: number | null; qroi?: number | null; avgEntry?: number | null; avgN?: number; nearCertN?: number; mm?: boolean; mmWhy?: string | null; oneOff?: boolean; oneOffWhy?: string | null }
interface NewCap { wallet: string; name: string; reason?: string | null; badge?: string | null; month?: number | null }
interface CapperHistory { minSample: number; updatedAt?: string; cappers: CapperRec[]; newThisScan?: NewCap[]; newRecent?: NewCap[]; trackedCount?: number; sportMap?: Record<string, string>; copiesInfo?: { updatedTs?: number; tickets?: number; ticketsMatched?: number; legs?: number; legsMatched?: number }; backfillDays?: number }
interface ProvenRow { smallSample?: boolean; cn?: number | null; pid: string; wallet: string; name: string; league: string; sport: string; game: string; market: string; pick: string; opp: string; slug: string; startTs: number | null; start: string; cost: number; avg: number; now: number | null; usual: number | null; mult: number | null; kalshi: { action: string; price: number | null; ticker: string; contract?: string | null; src?: string; live?: boolean; yesAsk?: number | null; noAsk?: number | null; marketTitle?: string | null; eventTitle?: string | null; oppTicker?: string | null; oppContract?: string | null; oppAction?: string | null; oppPrice?: number | null } | null; sportRec: { w: number; l: number; n: number; roi: number | null }; f14?: { w: number; l: number; n: number; roi: number | null }; rec: number[]; roi: number | null; badge?: string; verdict: string; why: string[]; hedged?: boolean; inTop?: boolean; group?: ProvenRow[]; firstTs?: number | null; lastTs?: number | null; stale?: boolean; slip?: number | null }
interface ProvenData { updatedAt: string; updatedTs: number; rule: string; splitGames?: string[]; elite: { wallet: string; name: string; rec: number[]; roi: number | null; wr?: number | null; sports?: { sport: string; w: number; l: number; n: number; roi: number }[]; f14?: { w: number; l: number; n: number; roi: number | null }; badge?: string; usual?: number | null; open?: number }[]; nearMiss?: { wallet: string; name: string; why: string[]; rec: number[]; roi: number | null }[]; picks: ProvenRow[]; counts: Record<string, number> }
interface ComingBacker { wallet?: string; name: string; cost: number; avg?: number | null; lastTs?: number | null; sport?: string; sw?: number; sl?: number; sn?: number; sroi?: number | null; roi?: number | null; wr?: number | null; elite?: boolean }
interface ComingSide { id: string; side: string; label: string; kPrice: number | null; avgEntry: number | null; slip: number | null; action?: string | null; contract?: string | null; ticker?: string | null; marketTitle?: string | null; eventTitle?: string | null; yesAsk?: number | null; noAsk?: number | null; yesSubTitle?: string | null; noSubTitle?: string | null; oppTicker?: string | null; oppContract?: string | null; oppAction?: string | null; oppPrice?: number | null; cappers: number; usd: number; names?: string[]; backers?: ComingBacker[]; lastTs?: number | null }
interface ComingMarket { id: string; kind: string; q?: string; sides: ComingSide[] }
interface ComingGame { id: string; game: string; league: string; startTs: number; start: string; capperCount?: number; capperRoi?: number | null; state?: string | null; phase?: string | null; markets: ComingMarket[] }
interface Scan { ts: number; signals: number; fun: number; poly?: number; glue?: number; props?: number; longshots?: number; biggest?: number; upcoming?: number; calls: number; cappers?: number; bets?: number; buys?: number; wallets?: number }
interface Cols { f: string[]; r: unknown[][] }
interface ScanData { scannedAt: string; ts: number; secs: number; settings: { cappers: number; min: number; wallets: number; markets: number; windowH: number }; coverage: { cappers: number; qualified: number; golden: number; marketsFound: number; marketsInWindow: number; marketsScanned: number; hedgedExcluded: number; twoSidedExcluded: number; walletsLoaded: number; positionsLoaded: number; bets: number; buysRaw: number; buys: number; orcaCalls: number; orcaErrors: string[]; kalshiSeries: number; kalshiMatched: number; espnLeagues: number; lb30?: { asOf: string | null; start: string | null; end: string | null; scanned: number; deepestRank: number; skippedNonSports: number; skippedNoPositions: number; endpoint?: string; params?: string }; lbAll?: { asOf: string | null; start: string | null; end: string | null; scanned: number; deepestRank: number; skippedNonSports: number; skippedNoPositions: number; endpoint?: string; params?: string }; notOnKalshi?: number }; signals: Pick[]; totalSignals: number; fun: Pick[]; totalFun: number; poly?: Pick[]; totalPoly?: number; glue?: Pick[]; totalGlue?: number; props?: Pick[]; totalProps?: number; longshots?: Pick[]; totalLongshots?: number; biggest?: Pick[]; totalBiggest?: number; upcoming?: Pick[]; totalUpcoming?: number; history: Hist[]; scans: Scan[]; buysC: Cols; betsC: Cols; tradersC: Cols; partNames: string[]; refreshedAt?: string; refreshTs?: number; capperHistory?: CapperHistory; provenPicks?: ProvenData; comingUp?: ComingGame[]; totalComingUp?: number; comingUpCappers?: number }
interface BuyRaw { ts: number; firstTs: number; fills: number; wallet: string; name: string; wr: number | null; wpnl: number; top100: boolean; rank: number | null; golden: boolean; q: string; side: string; label: string; kind: string; league: string; price: number | null; now: number | null; usd: number; shares: number | null; posCost: number; hedged: boolean; agree60: number; agreeAll: number; score: number; parts: number[]; kAct: string | null; kPrice: number | null; kContract: string | null; kEdge: number | null; kWhy: string | null; start: string; src: string; startTs: number | null; phase: string; gDetail: string; gScore: string; rank30?: number | null; rankAll?: number | null; gName?: string }
interface BetRaw { firstTs: number | null; lastBuyTs: number | null; wallet: string; name: string; wr: number | null; resolved: number | null; cpnl: number; rank: number | null; golden: boolean; skill: boolean; top100: boolean; src: string; q: string; side: string; label: string; outcome: string; kind: string; league: string; shares: number | null; avg: number | null; now: number | null; cost: number; value: number | null; upnl: number | null; upct: number | null; consYes: number | null; consNo: number | null; agree60: number; agreeAll: number; score: number; parts: number[]; kAct: string | null; kPrice: number | null; kContract: string | null; kEdge: number | null; kWhy: string | null; start: string; src2: string; startTs: number | null; phase: string; gDetail: string; gScore: string; rank30?: number | null; rankAll?: number | null; gName?: string }
interface Trader { wallet: string; name: string; rank: number; pnl: number; wr: number | null; resolved: number | null; wins: number | null; losses: number | null; pf: number | null; skill: boolean; golden: boolean; qualified: boolean; bets: number; value: number; lastTs: number | null; skillEdge: number | null; rank30?: number | null; sportsPct?: number | null; rankAll?: number | null; pnl30?: number | null }
interface Line { key: string; type: string; ts: number | null; firstTs: number | null; fills: number; wallet: string; name: string; wr: number | null; resolved: number | null; pnl: number; top100: boolean; rank: number | null; golden: boolean; q: string; side: string; label: string; kind: string; league: string; entry: number | null; now: number | null; amount: number; shares: number | null; value: number | null; upnl: number | null; upct: number | null; hedged: boolean; agree60: number; agreeAll: number; score: number; parts: number[]; kAct: string | null; kPrice: number | null; kContract: string | null; kEdge: number | null; kWhy: string | null; start: string; src: string; startTs: number | null; phase: string; gDetail: string; gScore: string; source: string; rank30?: number | null; rankAll?: number | null; gName?: string }
interface Filters { q: string; status: string; betType: string; evidence: string; sort: string; lineSort: string; side: string; capper: string; min: string; max: string; bought: string; kSide: string; kStatus: string; kText: string; platform: string; followedOnly: boolean; showHidden: boolean; hideHedgers: boolean; freshOnly: boolean; props: boolean }

const DATA: ScanData = (window as any).__DATA;

const BRAND = "#7C3AED";
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
const PROVEN: ProvenData | undefined = DATA.provenPicks;
const ELITE_W: Record<string, boolean> = (() => { const m: Record<string, boolean> = {}; ((PROVEN && PROVEN.elite) || []).forEach((e) => { m[(e.wallet || "").toLowerCase()] = true; }); return m; })();
// Per-sport records (Noel, Nov 15): league code -> sport bucket (same mapping as scanner/backfill.py)
const SPORT_MAP: Record<string, string> = (DATA.capperHistory && DATA.capperHistory.sportMap) || {};
function sportOf(lg: string | null | undefined): string {
  const L = (lg || "").toUpperCase();
  if (!L) return "Other";
  if (SPORT_MAP[L]) return SPORT_MAP[L];
  const ex: Record<string, string> = { NBA: "NBA", WNBA: "WNBA", CBB: "NCAAB", CWBB: "NCAAB", NFL: "NFL", CFB: "NCAAF", NHL: "NHL", MLB: "MLB", ATP: "Tennis", WTA: "Tennis", ITF: "Tennis", UFC: "MMA", CS2: "Esports", DOTA2: "Esports", LOL: "Esports", VAL: "Esports", OW: "Esports" };
  return ex[L] || (L.indexOf("BK") === 0 ? "Basketball (intl)" : "Soccer");
}
const PID_LEAGUE: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  ["signals", "fun", "poly", "glue", "props", "longshots", "biggest", "upcoming"].forEach((k: string) => { (((DATA as any)[k] || []) as Pick[]).forEach((p: Pick) => { if (p && p.id && p.league) m[p.id] = p.league; }); });
  return m;
})();
function pid0(pid: string | undefined): boolean { return !!(pid && PID_LEAGUE[pid]); }
const SPORT_BAR_N = 10;
const SPORT_GOOD_N = 30;
const SPORT_BAR_ROI = 20;
// Loosened Nov 15: +10% sport ROI is enough for cappers with 100+ graded bets total; +20% under 100.
const SPORT_BAR_ROI_VOL = 10;
const SPORT_BAR_VOL_N = 100;
function sportBarRoiOf(rec: { n?: number } | null | undefined): number { return rec && (rec.n || 0) >= SPORT_BAR_VOL_N ? SPORT_BAR_ROI_VOL : SPORT_BAR_ROI; }
// Track-record floor (Noel, Nov 16): big bets only (>= max($500, 1.5x median)), 30+ graded big bets,
// +5% big-bet ROI, +$10k big-bet profit, account age 60+ days. ROI never qualifies on its own.
// Year still has to be profitable when we have a Polymarket year window.
const LT_MIN_ROI = 5;
const ELIG_MIN_AGE_DAYS = 60;
const ELIG_MIN_BIG_N = 30;
const ELIG_MIN_BIG_ROI = 5;
const ELIG_MIN_BIG_PROFIT = 10000;
function longTermOk(rec: CapperRec | null | undefined): boolean {
  if (!rec) return false;
  const y = rec.win && rec.win.year && rec.win.year.pnl != null ? rec.win.year.pnl : null;
  if (y == null) return true;
  return y > 0;
}
function ageDaysOf(rec: CapperRec | null | undefined, now?: number): number | null {
  if (!rec || rec.firstTs == null) return rec && rec.ageDays != null ? rec.ageDays : null;
  const n = now || (Math.floor(Date.now() / 1000));
  return (n - rec.firstTs) / 86400;
}
function recentStreak(rec: CapperRec | null | undefined, now?: number): boolean {
  if (!rec || !rec.win) return false;
  const allp = rec.win.all && rec.win.all.pnl != null ? rec.win.all.pnl : null;
  const month = rec.win.month && rec.win.month.pnl != null ? rec.win.month.pnl : null;
  const year = rec.win.year && rec.win.year.pnl != null ? rec.win.year.pnl : null;
  if (allp == null || allp <= 0) return false;
  const age = ageDaysOf(rec, now);
  const bn = rec.big && rec.big.n != null ? rec.big.n : 0;
  const thin = age == null || age < ELIG_MIN_AGE_DAYS || bn < ELIG_MIN_BIG_N;
  const monthHeavy = month != null && month > 0.5 * allp;
  const yearEq = year != null && year >= 0.9 * allp;
  if (thin && monthHeavy) return true;
  if (thin && yearEq && (age == null || age < 180)) return true;
  return false;
}
// Mirrors scanner/capper_history.py eligibility. Fun/small bets are ignored; big-bet record is the floor.
function eligibilityOf(rec: CapperRec | null | undefined): string[] {
  if (!rec) return ["no record"];
  const why: string[] = [];
  const f = rec.f14;
  if (!f || !f.n || f.roi == null || f.roi <= 0) why.push("Cold 14d");
  if (!rec.n || rec.roi == null || rec.roi <= 0) why.push("Cold 30d");
  if (!longTermOk(rec)) why.push("Year down");
  if (rec.kShare == null) why.push("Kalshi share unknown"); else if (rec.kShare < 0.5) why.push("Mostly non-Kalshi");
  if (rec.avgEntry != null && rec.avgEntry >= 0.9) why.push("90¢+ favorites");
  if (rec.mm) why.push("market maker / bot");
  if (rec.oneOff) why.push("one-off");
  const age = ageDaysOf(rec);
  if (age == null) why.push("account age unknown");
  else if (age < ELIG_MIN_AGE_DAYS) why.push("account younger than 60 days");
  const b = rec.big || {};
  const bn = b.n || 0;
  if (bn < ELIG_MIN_BIG_N) why.push("under 30 graded big bets");
  if (b.profit == null || b.profit <= 0) why.push("big-bet profit not positive");
  if (b.roi == null || b.roi < ELIG_MIN_BIG_ROI) why.push("big-bet ROI under +5%");
  if (b.profit != null && b.profit < ELIG_MIN_BIG_PROFIT) why.push("big-bet profit under $10k");
  if (recentStreak(rec)) why.push("recent-streak P&L");
  return why;
}
function walletLongTermOk(w: string | null | undefined): boolean { return eligibilityOf(QMAP[(w || "").toLowerCase()]).length === 0; }
const KALSHI_TAKER = 0.07;
const SLIP_CAP_CENTS = 2;
const STALE_SECS = 3600;
function kalshiFee(p: number): number { return KALSHI_TAKER * p * (1 - p); }
function slipCents(kprice: number | null | undefined, entry: number | null | undefined): number | null {
  if (kprice == null || entry == null) return null;
  return (kprice + kalshiFee(kprice) - entry) * 100;
}
function pickTooExpensive(p: Pick): boolean {
  const k = p.kalshi;
  if (!k || k.status !== "ok" || k.price == null) return false;
  const s = k.slip != null ? k.slip : slipCents(k.price, p.avgEntry);
  return s != null && s >= SLIP_CAP_CENTS;
}
function provenTooExpensive(r: ProvenRow): boolean {
  const k = r.kalshi;
  const px = k && k.price != null ? k.price : null;
  const s = r.slip != null ? r.slip : slipCents(px, r.avg);
  return s != null && s >= SLIP_CAP_CENTS;
}
function pickFreshTs(p: Pick): number | null {
  let m = 0;
  (p.backers || []).forEach((b: Backer) => { const t = b.lastTs || b.firstTs || 0; if (t > m) m = t; });
  return m || null;
}
function pickIsStale(p: Pick, now: number): boolean {
  const t = pickFreshTs(p);
  return t != null && now - t > STALE_SECS;
}
function provenIsStale(r: ProvenRow, now: number): boolean {
  if (r.stale) return true;
  const t = r.lastTs || r.firstTs || 0;
  return !!t && now - t > STALE_SECS;
}

// Proven-floor cappers (including elites) count from $250 on All Picks / Proven; everyone else stays $500+ (Noel, Nov 16).
const FLOOR_MIN_BET = 250;
const ELITE_MIN_BET = FLOOR_MIN_BET;
const ELITE_FULL_N = 20;
const OVERALL_ROI_FLOOR = 15;
function sportRecOf(wallet: string | null | undefined, pid?: string): { sport: string; sr: { w: number; l: number; n: number; roi: number | null } } | null {
  const rec = QMAP[(wallet || "").toLowerCase()];
  if (!rec || !pid || !PID_LEAGUE[pid]) return null;
  const sport = sportOf(PID_LEAGUE[pid]);
  const sr = rec.sports ? rec.sports[sport] : undefined;
  if (!sr) return null;
  return { sport, sr };
}
function sportBarOk(wallet: string | null | undefined, pid?: string): boolean {
  const rec = QMAP[(wallet || "").toLowerCase()];
  if (!rec || rec.croi == null || rec.croi < OVERALL_ROI_FLOOR) return false;
  const info = sportRecOf(wallet, pid);
  return !!(info && info.sr.n >= SPORT_BAR_N && info.sr.roi != null && info.sr.roi >= sportBarRoiOf(rec));
}
function highRoiBacker(wallet: string | null | undefined, pid?: string): boolean {
  return !!ELITE_W[(wallet || "").toLowerCase()] && sportBarOk(wallet, pid);
}
function pickHasHighRoiBacker(p: Pick, backers?: Backer[]): boolean {
  return (backers || p.backers || []).some((b: Backer) => highRoiBacker(b.wallet, p.id));
}
const COMBO_MIN_BET = 500;
const COMBO_MIN_MULT = 1.5;
function highConvictionBet(wallet: string | null | undefined, cost: number | null | undefined, pid?: string | null): boolean {
  const c = cost || 0;
  if (c < COMBO_MIN_BET) return false;
  const cv = convOf(wallet, c, pid);
  if (cv.tag === "H") return true;
  return cv.mult != null && cv.mult >= COMBO_MIN_MULT;
}
function pickHasComboConviction(p: Pick, backers?: Backer[]): boolean {
  return (backers || p.backers || []).some((b: Backer) => highRoiBacker(b.wallet, p.id) && highConvictionBet(b.wallet, b.cost, p.id));
}
const GOOD_LO = 0.45, GOOD_HI = 0.92;
function sportRecFor(wallet: string | null | undefined, league?: string | null, pid?: string): { sport: string; sr: { w: number; l: number; n: number; roi: number | null } } | null {
  const rec = QMAP[(wallet || "").toLowerCase()];
  if (!rec) return null;
  const lg = (league || (pid && PID_LEAGUE[pid]) || "").toString();
  if (!lg) return null;
  const sport = sportOf(lg);
  const sr = rec.sports ? rec.sports[sport] : undefined;
  if (!sr) return null;
  return { sport, sr };
}
// Same bars as Proven Picks: GOOD = elite + sport ROI, $500+ and about 1x usual, winning sport record, Kalshi 45-92¢.
// OK = a real-size elite sport-ROI bet that misses one of those bars (price, size under 1x, thin sport record).
// CAUTION = small/throwaway bet or no Kalshi market. "" = no elite sport-ROI backer.
function pickVerdictOf(p: Pick, backers?: Backer[]): { verdict: "GOOD" | "OK" | "CAUTION" | ""; why: string[] } {
  const bs = backers && backers.length ? backers : (p.backers || []);
  const k = p.kalshi;
  const hasK = !!(k && k.status === "ok" && k.price != null && (k.ticker || k.contract || k.action));
  const kp = hasK && k.price != null ? k.price : null;
  let anyEliteBar = false, anyReal = false, anyGood = false;
  const okWhy: string[] = [];
  bs.forEach((b: Backer) => {
    const w = (b.wallet || "").toLowerCase();
    if (!ELITE_W[w] || !walletLongTermOk(w)) return;
    const rec = QMAP[w];
    if (!rec || rec.croi == null || rec.croi < OVERALL_ROI_FLOOR) return;
    const info = sportRecFor(w, p.league, p.id);
    const bar = !!(info && info.sr.n >= SPORT_BAR_N && info.sr.roi != null && info.sr.roi >= sportBarRoiOf(rec));
    if (!bar) return;
    anyEliteBar = true;
    const cost = b.cost || 0;
    const cv = convOf(w, cost, p.id);
    const small = cost < ELITE_MIN_BET || (cv.mult != null && cv.mult < 0.5) || cv.tag === "T";
    if (small) return;
    anyReal = true;
    const winning = !!(info && info.sr.w > info.sr.l);
    const sizeOk = cv.mult == null || cv.mult >= 1;
    if (sizeOk && cost >= ELITE_MIN_BET && winning && kp != null && kp >= GOOD_LO && kp <= GOOD_HI) {
      if (info && (info.sr.n || 0) >= SPORT_GOOD_N) anyGood = true;
      else okWhy.push("under 30 graded in " + ((info && info.sport) || "this sport"));
    } else {
      if (cv.mult != null && cv.mult < 1) okWhy.push(cv.mult + "x usual (under 1x)");
      if (!winning) okWhy.push("thin record in " + ((info && info.sport) || "this sport"));
      if (kp != null && !(kp >= GOOD_LO && kp <= GOOD_HI)) okWhy.push("Kalshi " + Math.round(kp * 100) + "¢ outside 45-92¢");
    }
  });
  if (!hasK) return anyEliteBar || anyReal ? { verdict: "CAUTION", why: ["no Kalshi market"] } : { verdict: "", why: [] };
  if (!anyEliteBar) return { verdict: "", why: [] };
  if (!anyReal) return { verdict: "CAUTION", why: ["small bet"] };
  if (anyGood) return { verdict: "GOOD", why: [] };
  const seen: Record<string, boolean> = {};
  return { verdict: "OK", why: okWhy.filter((r: string) => { if (seen[r]) return false; seen[r] = true; return true; }) };
}
function isGoodOrOk(p: Pick, backers?: Backer[]): boolean {
  const v = pickVerdictOf(p, backers).verdict;
  return v === "GOOD" || v === "OK";
}
function verdictRank(p: Pick, backers?: Backer[]): number {
  const v = pickVerdictOf(p, backers).verdict;
  return v === "GOOD" ? 0 : v === "OK" ? 1 : 2;
}
function VerdictChip(props: { verdict: string }) {
  if (props.verdict !== "GOOD" && props.verdict !== "OK") return null;
  return <Chip bg={props.verdict === "GOOD" ? GREEN : AMBER} color="#FFFFFF">{props.verdict}</Chip>;
}
function propSizeOk(p: Pick, backers?: Backer[]): boolean {
  return (backers || p.backers || []).some((b: Backer) => {
    if (!highRoiBacker(b.wallet, p.id)) return false;
    const c = b.cost || 0;
    if (c < COMBO_MIN_BET) return false;
    return convOf(b.wallet, c, p.id).tag !== "T";
  });
}
function bestSportOf(c: CapperRec): { sport: string; sr: { w: number; l: number; n: number; roi: number | null } } | null {
  let best: { sport: string; sr: { w: number; l: number; n: number; roi: number | null } } | null = null;
  const sports = c.sports || {};
  Object.keys(sports).forEach((sp: string) => {
    const sr = sports[sp];
    if (sr && sr.n >= SPORT_BAR_N && sr.roi != null && sr.roi >= sportBarRoiOf(c)) {
      if (!best || (sr.roi as number) > ((best.sr.roi as number) || -999) || (sr.roi === best.sr.roi && sr.n > best.sr.n)) best = { sport: sp, sr };
    }
  });
  return best;
}
function capperLastBetTs(c: CapperRec): number {
  let last = 0;
  (c.picks || []).forEach((p: CapperHistPick) => {
    const t = Number(p.graded || p.startTs || 0);
    if (t > last) last = t;
  });
  ((c.bf && c.bf.recent) || []).forEach((r: (string | number)[]) => {
    const t = Number(r[5] || 0);
    if (t > last) last = t;
  });
  return last;
}
// Hot Cappers tab: all of 14d P&L/ROI up on 10+ graded $500+ bets, +20% ROI in a sport over 10+, 55%+ win rate, average entry under 90¢, 20+ graded $500+ bets.
function isHotTabCapper(c: CapperRec): boolean {
  if (eligibilityOf(c).length > 0) return false;
  const f = c.f14;
  if (!f || f.n < 10 || f.roi == null || f.roi <= 0) return false;
  if (!bestSportOf(c)) return false;
  if (c.wr == null || c.wr < 55) return false;
  if (c.avgEntry == null || c.avgEntry >= 0.90) return false;
  return true;
}
function evKey(slug: string | null | undefined): string {
  const m = (slug || "").match(/(.+-20\d{2}-\d{2}-\d{2})/);
  return m ? m[1] : (slug || "");
}
function namesClash(a: string | null | undefined, b: string | null | undefined): boolean {
  const xx = (a || "").trim().toLowerCase(), yy = (b || "").trim().toLowerCase();
  if (!xx || !yy) return false;
  if (xx === "yes" || xx === "no" || yy === "yes" || yy === "no") return false;
  if (xx.indexOf("over ") === 0 || xx.indexOf("under ") === 0 || xx === "over" || xx === "under") return false;
  if (yy.indexOf("over ") === 0 || yy.indexOf("under ") === 0 || yy === "over" || yy === "under") return false;
  return xx === yy || (xx.length >= 4 && yy.indexOf(xx) >= 0) || (yy.length >= 4 && xx.indexOf(yy) >= 0);
}
const SPLIT_GAMES: Record<string, boolean> = (() => {
  const m: Record<string, boolean> = {};
  ((PROVEN && PROVEN.splitGames) || []).forEach((g: string) => { if (g) m[g] = true; });
  ["signals", "fun", "poly", "glue", "props", "longshots", "biggest", "upcoming"].forEach((k: string) => {
    (((DATA as any)[k] || []) as Pick[]).forEach((p: Pick) => {
      const eliteBack = (p.backers || []).some((b: Backer) => ELITE_W[(b.wallet || "").toLowerCase()]);
      const eliteOpp = (p.opposing || []).some((o: Opp) => ELITE_W[(o.wallet || "").toLowerCase()]);
      if (eliteBack && eliteOpp) m[evKey(p.slug)] = true;
    });
  });
  const byEv: Record<string, ProvenRow[]> = {};
  ((PROVEN && PROVEN.picks) || []).forEach((r: ProvenRow) => { const k = evKey(r.slug); (byEv[k] = byEv[k] || []).push(r); });
  Object.keys(byEv).forEach((k: string) => {
    const rs = byEv[k];
    const mk: Record<string, Record<string, boolean>> = {};
    rs.forEach((r: ProvenRow) => {
      const market = (r.market || "").trim().toLowerCase();
      const pick = (r.pick || "").trim().toLowerCase();
      (mk[market] = mk[market] || {})[pick] = true;
    });
    if (Object.keys(mk).some((market: string) => Object.keys(mk[market]).length > 1)) m[k] = true;
    for (let i = 0; i < rs.length; i++) {
      for (let j = i + 1; j < rs.length; j++) {
        if (namesClash(rs[i].opp, rs[j].pick) || namesClash(rs[j].opp, rs[i].pick)) m[k] = true;
      }
    }
  });
  return m;
})();
function isEliteSplitGame(slug: string | null | undefined): boolean { return !!SPLIT_GAMES[evKey(slug || "")]; }
function pickHasCapperHedge(p: Pick): boolean {
  const set: Record<string, boolean> = {};
  (p.backers || []).forEach((b: Backer) => { const w = (b.wallet || "").toLowerCase(); if (w) set[w] = true; });
  if ((p.opposing || []).some((o: Opp) => set[(o.wallet || "").toLowerCase()])) return true;
  return (p.risks || []).some((r: string) => /hedg|both sides|two-sided/i.test(r));
}
function pct(v: number | null | undefined): string { return v == null ? "n/a" : (v >= 0 ? "+" : "") + v + "%"; }
function f14Text(r: { w: number; l: number; n: number; roi: number | null } | undefined): string { return r && r.n ? r.w + "–" + r.l + (r.roi != null ? ", " + pct(r.roi) + " ROI" : "") : "no graded picks"; }
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
  if (c >= 1.5 * med) return { tag: "H", mult };
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
function nameOf(n: string | null | undefined, w: string): string { const x = n || ""; return !x || (x.indexOf("0x") === 0 && x.length > 14) ? shortWallet(w) : x; }
function isHot(wallet: string | null | undefined): boolean { const r = QMAP[(wallet || "").toLowerCase()]; return !!(r && r.badge === "Hot"); }
// Hot backers who bet a real (High or Normal conviction) amount on this pick
function hotBackers(bs: { wallet?: string | null; cost?: number | null }[], pid?: string): { wallet?: string | null; cost?: number | null }[] {
  return bs.filter((b) => isHot(b.wallet) && backerVerdict(b.wallet, b.cost, pid).counts);
}
function badgeColor(b: string | undefined): string { return b === "Hot" ? GREEN : b === "Cold" ? RED : b === "Cooling" ? AMBER : "#64748B"; }
function convNet(backers: { wallet?: string | null; cost?: number | null }[], opp: number, pid?: string): number {
  let s = 0;
  backers.forEach((b) => { const c = b.cost || 0; s += c * (CONV_W[convOf(b.wallet, c, pid).tag] || 1); });
  return s - opp;
}
// Vetting (Noel, Nov 14): a backer only counts if the whale has a real winning, positive-ROI graded record AND bet real size.
// Negative-ROI, Cold, ungraded, losing, low-edge whales and throwaway/small bets contribute nothing to any ranking.
const VET_MIN_N = 10;          // full sample
const VET_SMALL_N = 5;         // 5-9 allowed only when clearly positive
const VET_SMALL_WR = 60;       // small sample: 60%+ copyable win rate
const VET_SMALL_ROI = 10;      // small sample: +10%+ copyable ROI
const VET_MIN_BET = 500;       // absolute bet floor ($)
const VET_MIN_MULT = 0.5;      // and at least half the whale's usual bet
interface Verdict { counts: boolean; tier: number; why: string; bet: string }
function backerVerdict(wallet: string | null | undefined, cost: number | null | undefined, pid?: string): Verdict {
  const rec = QMAP[(wallet || "").toLowerCase()];
  const c = cost || 0;
  const cv = convOf(wallet, c, pid);
  let bet = "";
  if (cv.tag === "T") bet = "throwaway bet: " + (cv.mult != null && cv.mult <= 0.25 ? cv.mult + "x usual" : "tiny next to their biggest bets" + (cv.mult != null ? ", " + cv.mult + "x usual" : ""));
  else if (c < ((ELITE_W[(wallet || "").toLowerCase()] || walletLongTermOk(wallet)) ? FLOOR_MIN_BET : VET_MIN_BET)) bet = "small bet (" + money(c) + ")";
  else if (cv.mult != null && cv.mult < VET_MIN_MULT) bet = "small bet (" + cv.mult + "x usual)";
  const n = rec ? (rec.cn || 0) : 0, w = rec ? (rec.cw || 0) : 0, l = rec ? (rec.cl || 0) : 0;
  const roi = rec && rec.croi != null ? rec.croi : null;
  const wr = rec && rec.cwr != null ? rec.cwr : null;
  let why = "";
  if (!rec || n === 0) why = "ungraded";
  else if (rec.badge === "Cold" || rec.coldDemoted) why = "Cold: P&L down over past month, year or all time";
  else if (roi == null || roi <= 0) why = "negative ROI";
  else if (w <= l) why = "losing record";
  else if (n < VET_SMALL_N) why = "only " + n + " graded";
  else if (n < VET_MIN_N && !((wr || 0) >= VET_SMALL_WR && roi >= VET_SMALL_ROI)) why = "small sample, not clearly positive";
  else if (n >= VET_MIN_N && rec.demoted) why = "low-edge ROI";
  if (!why && rec && pid && PID_LEAGUE[pid]) {
    const sp = sportOf(PID_LEAGUE[pid]);
    const sr = rec.sports ? rec.sports[sp] : undefined;
    if (sr && sr.n >= 5 && sr.roi != null && sr.roi < 0) why = "losing in " + sp + " (" + sr.w + "–" + sr.l + ", " + sr.roi + "% ROI)";
  }
  const tier = why ? 2 : (n >= VET_MIN_N ? 0 : 1);
  return { counts: !why && !bet, tier: why || bet ? 2 : tier, why, bet };
}
function countedBackers<T extends { wallet?: string | null; cost?: number | null }>(bs: T[] | undefined, pid?: string): T[] {
  return (bs || []).filter((b: T) => backerVerdict(b.wallet, b.cost, pid).counts);
}
// 0 = backed by a vetted 10+ sample whale, 1 = vetted small sample (5-9) only, 2 = no vetted backer
function vetTier(bs: { wallet?: string | null; cost?: number | null }[] | undefined, pid?: string): number {
  return (bs || []).reduce((m: number, b) => Math.min(m, backerVerdict(b.wallet, b.cost, pid).tier), 2);
}
function backerStats(backers: { wallet?: string | null; cost?: number | null }[] | undefined, pid?: string): { quality: number; w: number; l: number; roi: number | null; oroi: number | null; text: string; counted: number; tier: number } {
  let tw = 0, tq = 0, w = 0, l = 0, rNum = 0, rDen = 0, sw = 0, sl = 0, sNum = 0, sDen = 0;
  const sportName = pid && PID_LEAGUE[pid] ? sportOf(PID_LEAGUE[pid]) : null;
  const cb = countedBackers(backers, pid);
  cb.forEach((b) => {
    const rec = QMAP[(b.wallet || "").toLowerCase()];
    const cost = (b.cost != null && b.cost > 0) ? b.cost : 0;
    const wt = (cost || 1) * (CONV_W[convOf(b.wallet, cost, pid).tag] || 1);
    tw += wt;
    tq += wt * ((rec && rec.quality) ? rec.quality : 0);
    if (rec) {
      w += rec.cw || 0;
      l += rec.cl || 0;
      if (rec.croi != null && (rec.crisked || 0) > 0) { rNum += wt * rec.croi; rDen += wt; }
      if (sportName && rec.sports && rec.sports[sportName]) {
        const sr = rec.sports[sportName];
        sw += sr.w || 0;
        sl += sr.l || 0;
        if (sr.roi != null) { sNum += wt * sr.roi; sDen += wt; }
      }
    }
  });
  const oroi = rDen ? Math.round((rNum / rDen) * 10) / 10 : null;
  const sroi = sDen ? Math.round((sNum / sDen) * 10) / 10 : null;
  const roi = sroi != null ? sroi : oroi;
  const tier = vetTier(backers, pid);
  const text = cb.length
    ? (sportName && (sw + sl)
      ? ("Vetted backers in " + sportName + " " + sw + "–" + sl + (sroi != null ? ", " + pct(sroi) + " ROI" : "") + " · overall " + w + "–" + l + (oroi != null ? ", " + pct(oroi) + " ROI" : "") + (tier === 1 ? " · small sample" : ""))
      : ("Vetted backers " + w + "–" + l + (oroi != null ? ", " + pct(oroi) + " ROI" : "") + (tier === 1 ? " · small sample" : "")))
    : "⚠ No vetted backer";
  // Quality only from vetted backers; no vetted backer sinks the pick (it is also filtered off ranked tabs). Headline ROI is the sport ROI when we have it.
  return { quality: tw ? tq / tw : -999, w, l, roi, oroi, text, counted: cb.length, tier };
}
function BackersLine(props: { backers: { wallet?: string | null; cost?: number | null; name?: string | null }[] | undefined; pid?: string }) {
  const t = useGrokTheme();
  const s = backerStats(props.backers, props.pid);
  const all = (props.backers || []).filter((b) => (b.cost || 0) > 0).slice().sort((a, b) => {
    const va = backerVerdict(a.wallet, a.cost, props.pid).counts ? 0 : 1, vb = backerVerdict(b.wallet, b.cost, props.pid).counts ? 0 : 1;
    return va - vb || (b.cost || 0) - (a.cost || 0);
  });
  const top = all.slice(0, 4);
  const nameFor = (b: { wallet?: string | null; name?: string | null }) => { const rec = QMAP[(b.wallet || "").toLowerCase()]; return nameOf((rec && rec.name && rec.name.indexOf("0x") !== 0 ? rec.name : b.name), b.wallet || ""); };
  const cautions = all.filter((b) => !backerVerdict(b.wallet, b.cost, props.pid).counts);
  return (
    <div data-backers-line="1" style={{ marginTop: 6 }}>
      <div data-vetted={s.counted ? (s.tier === 0 ? "full" : "small") : "none"} style={{ fontSize: 14, lineHeight: "20px", fontWeight: 800, color: !s.counted ? RED : (s.roi != null && s.roi < 0 ? RED : t.text.primary) }}>{s.text}</div>
      {top.map((b, i: number) => {
        const rec = QMAP[(b.wallet || "").toLowerCase()];
        const cv = convOf(b.wallet, b.cost, props.pid);
        const vd = backerVerdict(b.wallet, b.cost, props.pid);
        const nm = nameFor(b);
        const n = rec ? (rec.cw || 0) + (rec.cl || 0) : 0;
        const roi = rec && rec.croi != null ? rec.croi : null;
        const spInfo = sportRecOf(b.wallet, props.pid);
        const sr = spInfo ? spInfo.sr : null;
        const recTxt = sr && sr.n
          ? ((spInfo!.sport) + " " + sr.w + "–" + sr.l + (sr.roi != null ? " · " + pct(sr.roi) + " ROI" : ""))
          : (n ? (rec!.cw || 0) + "–" + (rec!.cl || 0) + (roi != null ? " · " + pct(roi) + " ROI" : "") : "ungraded");
        const bad = sr && sr.n && sr.roi != null ? sr.roi <= 0 : (!n || roi == null || roi <= 0);
        return (
          <div key={i} data-backer-conv={cv.tag} data-backer-counts={vd.counts ? "1" : "0"} style={{ fontSize: 12, lineHeight: "18px", color: t.text.secondary, marginTop: 4, opacity: vd.counts ? 1 : 0.92 }}>
            <span data-backer-rec="1" style={{ display: "inline-block", marginRight: 6, padding: "0 7px", borderRadius: 999, background: bad ? RED : (vd.counts ? GREEN : "#64748B"), color: "#FFFFFF", fontWeight: 800, fontSize: 12, lineHeight: "18px" }}>{(bad && n ? "⚠ " : "") + recTxt}</span>
            <span style={{ fontWeight: 750, color: vd.counts ? (cv.tag === "H" ? GREEN : t.text.primary) : t.text.tertiary }}>{nm} {money(b.cost || 0)}{cv.mult != null ? " = " + cv.mult + "x usual" : ""} · {CONV_LABEL[cv.tag]}</span>
            {sr && sr.n && n ? <span>{" · overall " + (rec!.cw || 0) + "–" + (rec!.cl || 0) + (roi != null ? ", " + pct(roi) + " ROI" : "")}</span> : null}
            {rec && rec.badge === "Hot" ? <span data-hot-badge="1" style={{ display: "inline-block", marginLeft: 6, padding: "0 7px", borderRadius: 999, background: "#EA580C", color: "#FFFFFF", fontWeight: 800, fontSize: 11, lineHeight: "17px" }}>🔥 Hot{rec.proven ? " · Proven" : ""}</span> : rec && rec.badge && rec.badge !== "n/a" ? <span style={{ fontWeight: 750, color: badgeColor(rec.badge) }}>{" · " + rec.badge}</span> : null}
            {vd.counts && vd.tier === 1 ? <span style={{ fontWeight: 750, color: AMBER }}>{" · small sample"}</span> : null}
            {!vd.counts ? <span style={{ fontWeight: 800, color: RED }}>{" · doesn't count: " + [vd.why, vd.bet].filter(Boolean).join(", ")}</span> : null}
            {rec && rec.f14 && rec.f14.n ? <span data-backer-f14="1" style={{ fontWeight: 750, color: rec.formCooling ? RED : (rec.f14.roi != null && rec.f14.roi > 0 ? GREEN : t.text.secondary) }}>{" · 14d " + f14Text(rec.f14) + (rec.formCooling ? " · Cooling (14d)" : "")}</span> : null}
            {rec && rec.win ? <span>{" · " + winShort(rec)}</span> : null}
          </div>
        );
      })}
      {cautions.length ? <div data-caution="1" style={{ fontSize: 12, lineHeight: "17px", fontWeight: 750, color: RED, marginTop: 4 }}>{"⚠ Caution: " + cautions.slice(0, 4).map((b) => { const vd = backerVerdict(b.wallet, b.cost, props.pid); return nameFor(b) + " (" + [vd.why, vd.bet].filter(Boolean).join(", ") + ")"; }).join("; ") + (cautions.length > 4 ? " +" + (cautions.length - 4) + " more" : "") + " — on this bet but not counted in the ranking."}</div> : null}
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
function BetAmt(props: { n: number | null | undefined }) {
  return <span data-bet-dollars="1" style={{ fontSize: 22, lineHeight: "26px", fontWeight: 850, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{money(props.n)}</span>;
}
function slipWords(slip: number | null | undefined, entry?: number | null): string | null {
  const bits: string[] = [];
  if (entry != null) bits.push("capper paid " + cents(entry));
  if (slip != null) {
    const amt = Math.abs(slip).toFixed(1).replace(/\.0$/, "") + "¢";
    if (slip > 0.05) bits.push(amt + " worse than capper's price");
    else if (slip < -0.05) bits.push(amt + " better than capper's price");
    else bits.push("about the same as capper's price");
  }
  return bits.length ? bits.join(" · ") : null;
}

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
const LIVE_SECS = Math.round(3.5 * 3600);
function espnIsFinal(state?: string | null, refresh?: Refresh | null): boolean {
  if (state === "post") return true;
  if (refresh && (refresh.state === "post" || !!refresh.final || !!refresh.ended)) return true;
  return false;
}
function espnIsLive(state?: string | null, refresh?: Refresh | null, phase?: string | null): boolean {
  if (espnIsFinal(state, refresh)) return false;
  if (state === "in") return true;
  if (refresh && refresh.state === "in") return true;
  if (phase === "live") return true;
  return false;
}
function startStatus(startTs: number, now: number, opts?: { state?: string | null; refresh?: Refresh | null; phase?: string | null }): "upcoming" | "live" | "final" {
  if (opts && espnIsFinal(opts.state, opts.refresh)) return "final";
  if (opts && espnIsLive(opts.state, opts.refresh, opts.phase)) return "live";
  if (!startTs || startTs > now) return "upcoming";
  if (now - startTs <= LIVE_SECS) return "live";
  return "final";
}
function pickStatus(p: Pick, now: number): "upcoming" | "live" | "final" {
  const state = (p.refresh && p.refresh.state) || (p.game && p.game.state) || null;
  return startStatus(p.startTs || 0, now, { state: state, refresh: p.refresh, phase: null });
}
function pickIsOver(p: Pick, now: number): boolean {
  return pickStatus(p, now) === "final";
}
function pickIsLive(p: Pick, now: number): boolean {
  return pickStatus(p, now) === "live";
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
  if (l.hedged) return false;
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

function nextScanLabel(now: number): string {
  const d = new Date(now * 1000);
  const target = new Date(d);
  target.setHours(5, 50, 0, 0);
  if (d.getTime() >= target.getTime()) target.setDate(target.getDate() + 1);
  const sameDay = target.getDate() === d.getDate() && target.getMonth() === d.getMonth() && target.getFullYear() === d.getFullYear();
  return "next scan " + (sameDay ? "today" : "tomorrow") + " 5:50 AM PT";
}

function journalWL(): { wins: number; losses: number } {
  const graded = (DATA.history || []).filter((h: Hist) => h.result === "W" || h.result === "L");
  const wins = graded.filter((h: Hist) => h.result === "W").length;
  return { wins, losses: graded.length - wins };
}

function EmptyState(props: { title: string; body: string }) {
  const t = useGrokTheme();
  return (
    <div data-empty-state="1" style={{ margin: "8px 0 16px", borderRadius: 18, border: "1.5px dashed " + BRAND, background: "linear-gradient(180deg, #F5F0FF 0%, #FFFFFF 100%)", padding: "22px 18px", textAlign: "center", boxShadow: "0 6px 18px rgba(124,58,237,0.08)" }}>
      <div style={{ fontSize: 28, lineHeight: 1 }}>🐋</div>
      <div style={{ fontSize: 16, lineHeight: "22px", fontWeight: 850, color: t.text.primary, marginTop: 8 }}>{props.title}</div>
      <div style={{ fontSize: 13, lineHeight: "19px", color: t.text.secondary, marginTop: 6 }}>{props.body}</div>
    </div>
  );
}

function RecordStrip(props: { wins: number; losses: number; tiles?: { label: string; value: string; color?: string }[] }) {
  const t = useGrokTheme();
  const n = props.wins + props.losses;
  const wr = n ? Math.round((1000 * props.wins) / n) / 10 : null;
  const good = n ? props.wins >= props.losses : null;
  const recColor = good == null ? t.text.primary : good ? GREEN : RED;
  const recBg = good == null ? t.bg.subtle : good ? "#DCFCE7" : "#FEE2E2";
  const tile = (label: string, value: string, color?: string, bg?: string) => (
    <div style={{ flex: "1 1 72px", minWidth: 72, background: bg || t.bg.subtle, borderRadius: 14, padding: "10px 8px 9px", textAlign: "center", boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset" }}>
      <div style={{ fontSize: 18, lineHeight: "22px", fontWeight: 850, color: color || t.text.primary, letterSpacing: "-0.02em", overflowWrap: "anywhere" }}>{value}</div>
      <div style={{ fontSize: 10, lineHeight: "13px", fontWeight: 750, color: t.text.tertiary, marginTop: 3, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
  return (
    <div data-record-strip="1" style={{ display: "flex", gap: 8, margin: "4px 0 14px", flexWrap: "wrap" }}>
      {tile("Wins", String(props.wins), GREEN, "#DCFCE7")}
      {tile("Losses", String(props.losses), RED, "#FEE2E2")}
      {tile("Record", n ? (props.wins + "–" + props.losses) : "—", recColor, recBg)}
      {tile("Win rate", wr == null ? "—" : wr + "%", recColor, recBg)}
      {(props.tiles || []).map((x) => tile(x.label, x.value, x.color))}
    </div>
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
    <div style={{ position: "sticky", top: 0, zIndex: 20, width: "100%", background: "rgba(244,240,255,0.94)", boxShadow: "0 4px 14px rgba(124,58,237,0.12)", padding: "8px 0", borderBottom: "1px solid #DDD6FE" }}>
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
  const [n, setN] = useState<string>("400");
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
                {["20", "40", "60", "80", "100", "200", "400", "custom"].map((v: string) => (
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
              <div style={{ marginTop: 4, color: "rgba(255,255,255,0.85)" }}>Checks live status, final results and ESPN win chances, logs W/L to the Journal, and drops games that have already started from Top 20, Upcoming, Fun, Polymarket, Player Props, Longshots and Biggest Bets (live games stay on Bets). Ended games are removed everywhere. No OrcaLayer calls.</div>
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
    <div style={{ borderRadius: 22, padding: 18, background: `linear-gradient(135deg, #1E1B4B 0%, ${BRAND} 50%, #F97316 100%)`, color: "#FFFFFF", boxShadow: "0 14px 36px rgba(76, 29, 149, 0.35)" }}>
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

interface KMarketDisp { ticker: string; title?: string; yes_sub_title?: string; no_sub_title?: string; yes_ask?: number | null; no_ask?: number | null }
interface KEventDisp { title: string; sub_title?: string; markets: KMarketDisp[] }
const KDISP: { events?: Record<string, KEventDisp>; byTicker?: Record<string, string> } = ((window as any).__KALSHI_DISPLAY) || {};
function kalshiNameHit(a: string, b: string): boolean {
  const x = (a || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const y = (b || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!x || !y) return false;
  if (x === y || x.indexOf(y) >= 0 || y.indexOf(x) >= 0) return true;
  const xs = x.split(" ").filter((w: string) => w.length > 2);
  const ys = y.split(" ").filter((w: string) => w.length > 2);
  return xs.some((w: string) => ys.indexOf(w) >= 0 && w.length > 3);
}
function eventTickerOf(ticker: string | null | undefined): string | null {
  if (!ticker) return null;
  if (KDISP.byTicker && KDISP.byTicker[ticker]) return KDISP.byTicker[ticker];
  const cut = ticker.replace(/-[A-Z0-9]+$/, "");
  return cut && cut !== ticker ? cut : null;
}
interface KalshiView { backing: string; marketTitle: string; outcome: string; yesNo: "Yes" | "No" | null; price: number | null; ticker: string | null }
function resolveKalshiView(side: { label?: string | null; action?: string | null; kPrice?: number | null; price?: number | null; ticker?: string | null; contract?: string | null; marketTitle?: string | null; eventTitle?: string | null; yesAsk?: number | null; noAsk?: number | null; yesSubTitle?: string | null; noSubTitle?: string | null }): KalshiView {
  const backing = (side.label || "").trim();
  const evTk = eventTickerOf(side.ticker || null);
  const ev = evTk && KDISP.events ? KDISP.events[evTk] : null;
  const storedPx = side.kPrice != null ? side.kPrice : (side.price != null ? side.price : null);
  if (ev && ev.markets && ev.markets.length) {
    const own = ev.markets.find((m: KMarketDisp) => kalshiNameHit(backing, m.yes_sub_title || m.title || ""));
    if (own && own.yes_ask != null) {
      return { backing, marketTitle: ev.title || side.eventTitle || side.marketTitle || "", outcome: own.yes_sub_title || own.title || backing, yesNo: "Yes", price: own.yes_ask, ticker: own.ticker };
    }
    const cur = ev.markets.find((m: KMarketDisp) => m.ticker === side.ticker) || ev.markets[0];
    const isYes = (side.action || "").toUpperCase().indexOf("YES") >= 0;
    const px = isYes ? cur.yes_ask : cur.no_ask;
    const outcome = isYes ? (cur.yes_sub_title || cur.title) : (cur.no_sub_title || cur.title);
    return { backing, marketTitle: ev.title || side.eventTitle || side.marketTitle || "", outcome: outcome || side.contract || backing, yesNo: isYes ? "Yes" : "No", price: px != null ? px : storedPx, ticker: cur.ticker || side.ticker || null };
  }
  const isYes = (side.action || "").toUpperCase().indexOf("YES") >= 0;
  const outcome = isYes ? (side.yesSubTitle || side.contract || backing) : (side.noSubTitle || side.contract || backing);
  return { backing, marketTitle: side.eventTitle || side.marketTitle || "", outcome: outcome || backing, yesNo: side.action ? (isYes ? "Yes" : "No") : null, price: storedPx, ticker: side.ticker || null };
}
function applyResolvedSide(s: ComingSide): ComingSide {
  const v = resolveKalshiView(s);
  if (v.price == null || !v.yesNo) return { ...s, marketTitle: v.marketTitle || s.marketTitle };
  return {
    ...s,
    ticker: v.ticker || s.ticker,
    contract: v.outcome || s.contract,
    action: v.yesNo === "Yes" ? "BUY YES" : "BUY NO",
    kPrice: v.price,
    marketTitle: v.marketTitle || s.marketTitle,
    yesSubTitle: v.yesNo === "Yes" ? v.outcome : s.yesSubTitle,
    noSubTitle: v.yesNo === "No" ? v.outcome : s.noSubTitle,
    slip: s.avgEntry != null ? slipCents(v.price, s.avgEntry) : s.slip,
  };
}

interface KalshiLineView {
  key: string;
  marketId: string;
  sideId: string;
  kind: string;
  marketName: string;
  label: string;
  action: string | null;
  price: number | null;
  ticker: string | null;
  contract: string | null;
  slip: number | null;
  eliteN: number;
  provenN: number;
  usd: number;
  view: KalshiView;
  side: ComingSide;
}

function isEliteBacker(b: ComingBacker): boolean {
  return !!ELITE_W[(b.wallet || "").toLowerCase()];
}
function bigBetRoiOf(wallet: string | null | undefined, fallback: number | null): number {
  const rec = QMAP[(wallet || "").toLowerCase()];
  if (rec && rec.big && rec.big.roi != null) return rec.big.roi;
  if (fallback != null) return fallback;
  if (rec && rec.roi != null) return rec.roi;
  return -999;
}
function kalshiLinesOfGame(g: ComingGame): KalshiLineView[] {
  const lines: KalshiLineView[] = [];
  (g.markets || []).forEach((m: ComingMarket) => {
    const rel = relabelMarketSides(m, g.game || "");
    (rel.sides || []).forEach((raw: ComingSide) => {
      const s = applyResolvedSide(raw);
      if (s.kPrice == null && !s.action) return;
      const backers = s.backers || [];
      if (s.kPrice == null || !backers.length) return;
      const view = resolveKalshiView(s);
      lines.push({
        key: s.id || ((m.id || "") + ":" + (s.side || s.label)),
        marketId: m.id,
        sideId: s.id,
        kind: m.kind || "moneyline",
        marketName: view.marketTitle || s.marketTitle || s.contract || s.label,
        label: s.label,
        action: s.action || null,
        price: s.kPrice,
        ticker: s.ticker || null,
        contract: s.contract || null,
        slip: s.slip != null ? s.slip : null,
        eliteN: backers.filter(isEliteBacker).length,
        provenN: backers.length,
        usd: s.usd || 0,
        view,
        side: s,
      });
    });
  });
  return lines;
}
function pickBestKalshiKey(lines: KalshiLineView[]): string | null {
  if (!lines.length) return null;
  const ranked = lines.slice().sort((a: KalshiLineView, b: KalshiLineView) => {
    if (b.eliteN !== a.eliteN) return b.eliteN - a.eliteN;
    if (b.provenN !== a.provenN) return b.provenN - a.provenN;
    const sa = a.slip == null ? 999 : a.slip;
    const sb = b.slip == null ? 999 : b.slip;
    if (sa !== sb) return sa - sb;
    return (b.price || 0) - (a.price || 0);
  });
  return ranked[0].key;
}
function KalshiGreenBox(props: { view: KalshiView; badge?: "best" | null; compact?: boolean; why?: string | null; onPick?: (() => void) | null; selected?: boolean }) {
  const t = useGrokTheme();
  const v = props.view;
  const ok = !!(v.yesNo && v.price != null);
  const yes = v.yesNo === "Yes";
  const pillBg = yes ? GREEN : (ok ? RED : "#9CA3AF");
  const clickable = !!props.onPick;
  const row = ok ? (v.outcome + " — " + v.yesNo) : "";
  return (
    <div>
      {v.backing ? <div data-kalshi-backing="1" style={{ fontSize: 14, fontWeight: 750, color: t.text.primary, margin: "0 0 6px", lineHeight: "20px" }}>{"You're backing: "}<span style={{ fontWeight: 850 }}>{v.backing}</span></div> : null}
      <div
        data-kalshi-box={props.badge === "best" ? "best" : (ok ? "ok" : "none")}
        data-best-bet={props.badge === "best" ? "1" : undefined}
        data-kalshi-row={ok ? row : undefined}
        role={clickable ? "button" : undefined}
        onClick={clickable ? props.onPick! : undefined}
        style={{
          borderRadius: props.compact ? 12 : 16,
          border: "1.5px solid " + (props.badge === "best" ? GREEN : ok ? "#86EFAC" : t.border.default),
          background: ok ? (props.badge === "best" ? "linear-gradient(180deg, #BBF7D0 0%, #DCFCE7 100%)" : "linear-gradient(180deg, #ECFDF3 0%, #D1FAE5 100%)") : t.bg.subtle,
          padding: props.compact ? "8px 10px" : "12px 12px",
          boxShadow: props.badge === "best" ? "0 6px 16px rgba(22,163,74,0.18)" : "none",
          cursor: clickable ? "pointer" : "default",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontSize: 11, fontWeight: 850, letterSpacing: "0.12em", color: GREEN, textTransform: "uppercase" }}>Kalshi</div>
          {props.badge === "best" ? (
            <span data-best-bet-badge="1" style={{ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 999, background: GREEN, color: "#FFFFFF", fontSize: 10, fontWeight: 850, letterSpacing: "0.05em", textTransform: "uppercase" }}>BEST BET · Submit this</span>
          ) : null}
          {props.selected ? <Chip bg={BRAND} color="#FFFFFF">In parlay</Chip> : null}
        </div>
        {ok ? (
          <div>
            {v.marketTitle ? <div style={{ fontSize: props.compact ? 13 : 15, fontWeight: 800, lineHeight: props.compact ? "18px" : "20px", marginTop: 6, color: t.text.primary, overflowWrap: "anywhere" }}>{v.marketTitle}</div> : null}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 8 }}>
              <span style={{ display: "inline-flex", alignItems: "center", padding: props.compact ? "4px 9px" : "6px 12px", borderRadius: 999, background: pillBg, color: "#FFFFFF", fontSize: props.compact ? 13 : 15, fontWeight: 850 }}>{row}</span>
              <span style={{ fontSize: props.compact ? 22 : 32, fontWeight: 850, fontVariantNumeric: "tabular-nums", color: t.text.primary, letterSpacing: "-0.03em", lineHeight: 1 }}>{cents(v.price)}</span>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.secondary, marginTop: 6 }}><span style={{ fontWeight: 700, color: t.text.primary }}>Not on Kalshi.</span> {props.why || "No verified contract for this pick."}</div>
        )}
      </div>
    </div>
  );
}
function KalshiGameLines(props: { game: ComingGame; onPick?: (marketId: string, sideId: string) => void; selectedId?: string | null }) {
  const lines = kalshiLinesOfGame(props.game);
  if (!lines.length) return <div style={{ margin: "8px 0 10px" }}><KalshiGreenBox view={{ backing: "", marketTitle: "", outcome: "", yesNo: null, price: null, ticker: null }} why="No verified Kalshi contract on a backed side." /></div>;
  const bestKey = pickBestKalshiKey(lines);
  const showBadge = lines.length > 1;
  const best = lines.find((l: KalshiLineView) => l.key === bestKey) || lines[0];
  const others = lines.filter((l: KalshiLineView) => l.key !== best.key);
  const box = (l: KalshiLineView, compact: boolean, badge: "best" | null) => (
    <KalshiGreenBox
      key={l.key}
      view={l.view}
      badge={badge}
      compact={compact}
      selected={!!props.selectedId && props.selectedId === l.sideId}
      onPick={props.onPick ? () => props.onPick!(l.marketId, l.sideId) : null}
    />
  );
  return (
    <div data-kalshi-game="1" style={{ display: "flex", flexDirection: "column", gap: 8, margin: "8px 0 10px" }}>
      {box(best, false, showBadge ? "best" : null)}
      {others.map((l: KalshiLineView) => box(l, true, null))}
    </div>
  );
}
function KalshiBox(props: { act: string | null; price: number | null; contract: string | null; edge: number | null; why: string | null; label: string; entry: number | null; now: number | null; compact?: boolean; ticker?: string | null; marketTitle?: string | null; yesSubTitle?: string | null; noSubTitle?: string | null }) {
  const ok = props.act !== null;
  const good = props.edge !== null && props.edge >= 0;
  const t = useGrokTheme();
  const view = resolveKalshiView({ label: props.label, action: props.act, price: props.price, kPrice: props.price, ticker: props.ticker, contract: props.contract, marketTitle: props.marketTitle, yesSubTitle: props.yesSubTitle, noSubTitle: props.noSubTitle });
  return (
    <div>
      <KalshiGreenBox view={view} compact={props.compact} why={props.why} />
      {ok && (props.edge != null || props.entry != null) ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {props.edge !== null ? <Chip bg={good ? GREEN : AMBER} color="#FFFFFF">{props.edge > 0.05 ? Math.abs(props.edge) + "¢ worse than capper's price" : props.edge < -0.05 ? Math.abs(props.edge) + "¢ better than capper's price" : "About the same as capper's price"}</Chip> : null}
          <span style={{ fontSize: 12, lineHeight: "17px", color: t.text.secondary }}>{props.entry != null ? "capper paid " + cents(props.entry) : ""}{props.now != null ? (props.entry != null ? " · " : "") + "Polymarket now " + cents(props.now) : ""}</span>
        </div>
      ) : null}
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
function rankKey(p: Pick, whales: number, backers?: Backer[]): number[] {
  const info = pickInfo(p, whales);
  const band = info.band === "best" ? 0 : info.band === "mid" ? 1 : 2;
  const bs = backers && backers.length ? backers : p.backers;
  const st = backerStats(bs, p.id);
  // Only vetted backers (winning, positive-ROI, real-size bets) count toward quality, net money and agreement.
  const cb = countedBackers(bs, p.id);
  const net = convNet(cb, p.oppMoney || 0, p.id);
  const best = Math.min(...(cb.length ? cb.map((b: Backer) => b.rankAll || b.rank || 999) : [999]));
  return [st.tier, band, -st.quality, -net, -info.share, -cb.length, best];
}
function cmpRankKey(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}
function clampNum(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)); }
// Single quality score (0–100) used on every tab. Higher is better.
// Started/settled games are not penalized in the number; sort puts them last.
function pickQualityScore(p: Pick, backers?: Backer[]): number {
  const bs = backers && backers.length ? backers : (p.backers || []);
  const st = backerStats(bs, p.id);
  const cb = countedBackers(bs, p.id);
  const info = pickInfo(p, bs.length);
  let s = 0;
  s += st.tier === 0 ? 20 : st.tier === 1 ? 12 : 0;
  let backerBand = 0;
  cb.forEach((b: Backer) => {
    const w = (b.wallet || "").toLowerCase();
    const rec = QMAP[w];
    if (ELITE_W[w]) backerBand = Math.max(backerBand, 16);
    else if (rec && rec.proven) backerBand = Math.max(backerBand, 10);
    else if (rec && rec.badge === "Hot") backerBand = Math.max(backerBand, 6);
  });
  s += backerBand;
  const qPart = (!st.counted || st.quality <= -900) ? 0 : clampNum((st.quality + 20) / 120, 0, 1) * 12;
  // Headline ranking uses sport ROI; overall +20% is a bonus, not the main bar.
  const roiPart = st.roi == null ? 0 : clampNum((st.roi + 10) / 80, 0, 1) * 4;
  const overallBonus = st.oroi != null && st.oroi >= 20 ? 4 : 0;
  let sportPart = 0;
  const sp = sportOf(p.league);
  cb.forEach((b: Backer) => {
    const rec = QMAP[(b.wallet || "").toLowerCase()];
    const sr = rec && rec.sports ? rec.sports[sp] : undefined;
    if (sr && sr.n >= 10 && sr.roi != null) sportPart = Math.max(sportPart, clampNum((sr.roi + 10) / 80, 0, 1) * 10);
    else if (sr && sr.n >= 5 && sr.roi != null) sportPart = Math.max(sportPart, clampNum((sr.roi + 10) / 80, 0, 1) * 4);
  });
  s += qPart + roiPart + overallBonus + sportPart;
  let convPart = 0;
  cb.forEach((b: Backer) => {
    const cv = convOf(b.wallet, b.cost, p.id);
    convPart = Math.max(convPart, cv.tag === "H" ? 10 : cv.tag === "N" ? 6 : 0);
    if (cv.mult != null && cv.mult >= 3) convPart = Math.max(convPart, 10);
  });
  s += convPart;
  s += p.kalshi && p.kalshi.status === "ok" ? 8 : 0;
  const over = overCents(p);
  const edge = p.kalshi && p.kalshi.edge_vs_whales != null ? p.kalshi.edge_vs_whales : (over != null ? -over : null);
  if (edge != null) s += clampNum((edge + 5) / 10, 0, 1) * 8;
  else s += 3;
  s += info.band === "best" ? 4 : info.band === "mid" ? 2 : 0;
  s += clampNum(info.share, 0, 1) * 5;
  s += clampNum(convNet(cb, p.oppMoney || 0, p.id) / 20000, 0, 1) * 5;
  s += clampNum(cb.length / 5, 0, 1) * 8;
  if (pickIsStale(p, Date.now() / 1000)) s -= 12;
  return Math.round(clampNum(s, 0, 100));
}
function provenQualityScore(r: ProvenRow): number {
  let s = 0;
  s += r.verdict === "GOOD" ? 20 : r.verdict === "OK" ? 12 : 4;
  s += 16;
  const n = r.rec ? ((r.rec[0] || 0) + (r.rec[1] || 0)) : 0;
  const roi = r.roi;
  s += (roi != null && roi >= 20 && n >= 10) ? 4 : (roi != null && n >= 10) ? clampNum((roi + 10) / 80, 0, 1) * 6 : 0;
  const sr = r.sportRec;
  if (sr && sr.n >= 10 && sr.roi != null) s += clampNum((sr.roi + 10) / 80, 0, 1) * 12;
  else if (sr && sr.n >= 5 && sr.roi != null) s += clampNum((sr.roi + 10) / 80, 0, 1) * 6;
  else s += 2;
  const recW = r.rec ? (r.rec[0] || 0) : 0, recL = r.rec ? (r.rec[1] || 0) : 0;
  if (n >= 10) s += clampNum((recW - recL) / 20, 0, 1) * 4;
  if (r.mult != null) s += r.mult >= 2 ? 10 : r.mult >= 1 ? 8 : r.mult >= 0.5 ? 5 : 1;
  else s += 5;
  if (r.hedged) s -= 6;
  s += r.kalshi ? 8 : 0;
  if (r.kalshi && r.kalshi.price != null && r.avg != null) {
    s += clampNum(((r.avg - r.kalshi.price) * 100 + 5) / 10, 0, 1) * 8;
    const c = r.kalshi.price * 100;
    s += (c >= 65 && c <= 84) ? 4 : (c >= 45 && c < 95) ? 2 : 0;
  } else s += 3;
  s += clampNum((r.cost || 0) / 20000, 0, 1) * 8;
  s += r.inTop ? 4 : 0;
  s += clampNum((((r.group && r.group.length) || 1) / 5), 0, 1) * 8;
  if (r.stale) s -= 12;
  return Math.round(clampNum(s, 0, 100));
}
function capperQualityScore(c: CapperRec): number {
  const w = (c.wallet || "").toLowerCase();
  let s = 0;
  if (ELITE_W[w]) s += 40;
  else if (c.proven) s += 28;
  else if (c.badge === "Hot") s += 16;
  else if (c.coldDemoted || c.badge === "Cold") s += 0;
  else s += 8;
  const n = c.cn || 0;
  const roi = c.croi != null ? c.croi : (c.roi != null ? c.roi : null);
  if (roi != null && n >= 10) s += clampNum((roi + 20) / 80, 0, 1) * 40;
  else if (roi != null && n >= 5) s += clampNum((roi + 20) / 80, 0, 1) * 20;
  else if (n < 5 && c.roi != null && (c.n || 0) >= 10) s += clampNum((c.roi + 20) / 80, 0, 1) * 20;
  const wr = c.cwr != null ? c.cwr : c.wr;
  const cw = c.cw || 0, cl = c.cl || 0;
  if (n >= 10 && wr != null) {
    s += clampNum((wr - 40) / 40, 0, 1) * 16;
    s += clampNum((cw - cl) / 25, 0, 1) * 4;
  } else if (((n >= 5) || ((c.n || 0) >= 5)) && wr != null) {
    s += clampNum((wr - 40) / 40, 0, 1) * 8;
  }
  const bestSp = bestSportOf(c);
  if (bestSp && bestSp.sr.roi != null) s += clampNum((bestSp.sr.roi + 10) / 80, 0, 1) * 10;
  if (c.formCooling) s -= 6;
  if (c.coldDemoted || c.badge === "Cold") s -= 8;
  return Math.round(clampNum(s, 0, 100));
}
function pickBetSize(p: Pick, backers?: Backer[]): number {
  const bs = backers && backers.length ? backers : (p.backers || []);
  const mx = Math.max(0, ...bs.map((b: Backer) => b.cost || 0));
  return mx || p.invested || 0;
}
function pickIsDone(p: Pick, now: number): boolean {
  return isStarted(p, now) || !!(p.refresh && (p.refresh.state === "post" || p.refresh.final || p.refresh.ended)) || !!(p.game && p.game.state === "post");
}
function sortPicksBy(arr: Pick[], sort: string, backersOf: (p: Pick) => Backer[], now: number): Pick[] {
  return arr.slice().sort((a: Pick, b: Pick) => {
    const ad = pickIsDone(a, now) ? 1 : 0, bd = pickIsDone(b, now) ? 1 : 0;
    if (ad !== bd) return ad - bd;
    if (sort === "start") return (a.startTs || 9e12) - (b.startTs || 9e12) || pickQualityScore(b, backersOf(b)) - pickQualityScore(a, backersOf(a));
    if (sort === "size") return pickBetSize(b, backersOf(b)) - pickBetSize(a, backersOf(a)) || pickQualityScore(b, backersOf(b)) - pickQualityScore(a, backersOf(a));
    const d = pickQualityScore(b, backersOf(b)) - pickQualityScore(a, backersOf(a));
    return sort === "worst" ? -d : d;
  });
}
function takeSortedPicks(pool: Pick[], sort: string, limit: number, backersOf: (p: Pick) => Backer[], now: number): Pick[] {
  if (sort === "start" || sort === "size") return sortPicksBy(pool, sort, backersOf, now).slice(0, limit);
  const best = sortPicksBy(pool, "best", backersOf, now).slice(0, limit);
  return sort === "worst" ? sortPicksBy(best, "worst", backersOf, now) : best;
}
function sortTopBy(arr: Pick[], sort: string, backersOf: (p: Pick) => Backer[], now: number): Pick[] {
  return arr.slice().sort((a: Pick, b: Pick) => {
    const ad = pickIsDone(a, now) ? 1 : 0, bd = pickIsDone(b, now) ? 1 : 0;
    if (ad !== bd) return ad - bd;
    if (sort !== "start" && sort !== "size") {
      const as0 = pickIsStale(a, now) ? 1 : 0, bs0 = pickIsStale(b, now) ? 1 : 0;
      if (as0 !== bs0) return sort === "worst" ? bs0 - as0 : as0 - bs0;
    }
    if (sort === "start") return (a.startTs || 9e12) - (b.startTs || 9e12) || verdictRank(a, backersOf(a)) - verdictRank(b, backersOf(b)) || pickQualityScore(b, backersOf(b)) - pickQualityScore(a, backersOf(a));
    if (sort === "size") return pickBetSize(b, backersOf(b)) - pickBetSize(a, backersOf(a)) || verdictRank(a, backersOf(a)) - verdictRank(b, backersOf(b)) || pickQualityScore(b, backersOf(b)) - pickQualityScore(a, backersOf(a));
    const vr = verdictRank(a, backersOf(a)) - verdictRank(b, backersOf(b));
    if (vr) return sort === "worst" ? -vr : vr;
    const d = pickQualityScore(b, backersOf(b)) - pickQualityScore(a, backersOf(a));
    return sort === "worst" ? -d : d;
  });
}
function takeSortedTop(pool: Pick[], sort: string, limit: number, backersOf: (p: Pick) => Backer[], now: number): Pick[] {
  if (sort === "start" || sort === "size") return sortTopBy(pool, sort, backersOf, now).slice(0, limit);
  const best = sortTopBy(pool, "best", backersOf, now).slice(0, limit);
  return sort === "worst" ? sortTopBy(best, "worst", backersOf, now) : best;
}
function sortProvenBy(arr: ProvenRow[], sort: string, now: number): ProvenRow[] {
  return arr.slice().sort((a: ProvenRow, b: ProvenRow) => {
    const ad = (a.startTs && a.startTs <= now) ? 1 : 0, bd = (b.startTs && b.startTs <= now) ? 1 : 0;
    if (ad !== bd) return ad - bd;
    if (sort !== "start" && sort !== "size") {
      const as0 = provenIsStale(a, now) ? 1 : 0, bs0 = provenIsStale(b, now) ? 1 : 0;
      if (as0 !== bs0) return sort === "worst" ? bs0 - as0 : as0 - bs0;
    }
    if (sort === "start") return (a.startTs || 9e12) - (b.startTs || 9e12) || provenQualityScore(b) - provenQualityScore(a);
    if (sort === "size") return (b.cost || 0) - (a.cost || 0) || provenQualityScore(b) - provenQualityScore(a);
    const d = provenQualityScore(b) - provenQualityScore(a);
    return sort === "worst" ? -d : d;
  });
}
function ScoreChip(props: { rank: number; score: number }) {
  const t = useGrokTheme();
  return (
    <span data-quality-score={props.score} data-rank={props.rank} style={{ display: "inline-flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      <Chip bg={BRAND} color="#FFFFFF">{"#" + props.rank}</Chip>
      <Chip bg={t.bg.subtle} color={t.text.primary}>{"Score " + props.score}</Chip>
    </span>
  );
}
function distinctBackerCount(bs: { wallet?: string | null; name?: string | null }[] | undefined): number {
  const m: Record<string, boolean> = {};
  (bs || []).forEach((b) => { const k = (b.wallet || b.name || "").toLowerCase(); if (k) m[k] = true; });
  return Object.keys(m).length;
}
function CapperCountBadge(props: { count: number; open?: boolean; onToggle?: () => void }) {
  if (props.count < 2) return null;
  return (
    <button type="button" data-capper-count={props.count} onClick={props.onToggle} title={props.count + " cappers made this same pick (one row, not repeated). Tap to see their sport ROI."} style={{ width: 28, height: 28, borderRadius: 999, border: props.open ? "2px solid #FFFFFF" : "none", boxShadow: props.open ? "0 0 0 2px " + BRAND : "none", background: BRAND, color: "#FFFFFF", fontWeight: 850, fontSize: 13, cursor: props.onToggle ? "pointer" : "default", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none", lineHeight: 1, padding: 0, fontFamily: "inherit" }}>
      {props.count}
    </button>
  );
}
function CapperSportList(props: { backers: { wallet?: string | null; cost?: number | null; name?: string | null }[] | undefined; pid?: string }) {
  const t = useGrokTheme();
  const rows = (props.backers || []).slice().sort((a, b) => (b.cost || 0) - (a.cost || 0));
  if (!rows.length) return null;
  return (
    <div data-capper-sport-list="1" style={{ marginTop: 8, padding: "8px 10px", borderRadius: 14, background: t.bg.subtle }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: t.text.tertiary, marginBottom: 4 }}>QUALIFYING CAPPERS · SPORT ROI</div>
      {rows.map((b, i: number) => {
        const rec = QMAP[(b.wallet || "").toLowerCase()];
        const sp = sportRecOf(b.wallet, props.pid);
        const nm = nameOf((rec && rec.name && rec.name.indexOf("0x") !== 0 ? rec.name : b.name), b.wallet || "");
        const sportTxt = sp && sp.sr && sp.sr.n ? (sp.sport + " " + f14Text(sp.sr)) : "no sport record";
        const overall = rec && (rec.cw || rec.cl) ? ("overall " + (rec.cw || 0) + "–" + (rec.cl || 0) + (rec.croi != null ? ", " + pct(rec.croi) + " ROI" : "")) : "";
        const sportGood = !!(sp && sp.sr && sp.sr.roi != null && sp.sr.roi >= 20 && sp.sr.n >= 10);
        return (
          <div key={i} style={{ fontSize: 13, lineHeight: "19px", marginTop: i ? 4 : 0, color: t.text.secondary }}>
            <span style={{ fontWeight: 800, color: sportGood ? GREEN : t.text.primary }}>{sportTxt}</span>
            {" · " + nm + (b.cost ? " " + money(b.cost) : "") + (overall ? " · " + overall : "")}
          </div>
        );
      })}
    </div>
  );
}
function pickMergeKey(p: Pick): string {
  if (p.kalshi && p.kalshi.status === "ok" && p.kalshi.ticker && (p.kalshi.action || p.label)) return ("k|" + p.kalshi.ticker + "|" + (p.kalshi.action || "")).toLowerCase();
  return "p|" + pickCatalogKey(p.q, p.label);
}
function mergePickPair(a: Pick, b: Pick): Pick {
  const byW: Record<string, Backer> = {};
  (a.backers || []).concat(b.backers || []).forEach((bk: Backer) => {
    const w = (bk.wallet || bk.name || "").toLowerCase();
    if (!w) return;
    if (!byW[w] || (bk.cost || 0) > (byW[w].cost || 0)) byW[w] = bk;
  });
  const backers = Object.keys(byW).map((w: string) => byW[w]).sort((x: Backer, y: Backer) => (y.cost || 0) - (x.cost || 0));
  const prefer = (a.kalshi && a.kalshi.status === "ok") || backers.length === (a.backers || []).length ? a : b;
  return { ...prefer, backers, whales: Math.max(a.whales || 0, b.whales || 0, backers.length), invested: Math.max(a.invested || 0, b.invested || 0), fromProven: !!(a.fromProven || b.fromProven) };
}
function uniqueMergedPicks(arr: Pick[]): Pick[] {
  const m: Record<string, Pick> = {}, order: string[] = [];
  arr.forEach((p: Pick) => {
    const k = pickMergeKey(p);
    if (!m[k]) { m[k] = p; order.push(k); }
    else m[k] = mergePickPair(m[k], p);
  });
  return order.map((k: string) => m[k]);
}
function provenMergeKey(r: ProvenRow): string {
  if (r.kalshi && r.kalshi.ticker) return ("k|" + r.kalshi.ticker + "|" + (r.kalshi.action || "") + "|" + (r.pick || "")).toLowerCase();
  return ("p|" + (r.slug || "") + "||" + (r.market || "") + "||" + (r.pick || "")).toLowerCase();
}
function mergeProvenRows(rows: ProvenRow[]): ProvenRow[] {
  const m: Record<string, ProvenRow[]> = {}, order: string[] = [];
  rows.forEach((r: ProvenRow) => {
    const k = provenMergeKey(r);
    if (!m[k]) { m[k] = []; order.push(k); }
    m[k].push(r);
  });
  const vo: Record<string, number> = { GOOD: 0, OK: 1, CAUTION: 2 };
  return order.map((k: string) => {
    const g = m[k].slice().sort((a: ProvenRow, b: ProvenRow) => (vo[a.verdict] ?? 9) - (vo[b.verdict] ?? 9) || (b.cost || 0) - (a.cost || 0));
    return { ...g[0], group: g };
  });
}
function provenKind(r: ProvenRow): string {
  const m = (r.market || "").toLowerCase();
  if (/spread|handicap/.test(m)) return "spread";
  if (/o\/?u|over\/?under|total/.test(m)) return "total";
  if (parsePropQ(r.market, r.pick) || parsePropQ(r.game, r.pick)) return "prop";
  return "moneyline";
}
function provenTeams(r: ProvenRow): string[] {
  const g = (r.game || "").replace(/\s+-\s+More Markets$/i, "");
  const parts = g.split(/\s+vs\.?\s+/i);
  if (parts.length === 2) return [parts[0].trim(), parts[1].trim()].filter(Boolean);
  const out: string[] = [];
  if (r.pick && !/^(over|under|yes|no)$/i.test(r.pick)) out.push(r.pick);
  if (r.opp && !/^(over|under|yes|no)$/i.test(r.opp)) out.push(r.opp);
  return out;
}
function backerFromProven(r: ProvenRow): Backer {
  const rec = QMAP[(r.wallet || "").toLowerCase()];
  return { name: r.name, cost: r.cost, avg: r.avg, wr: rec && rec.cwr != null ? rec.cwr : null, resolved: rec ? (rec.cn || null) : null, pnl: rec && rec.cprofit != null ? rec.cprofit : 0, rank: rec && rec.rank != null ? rec.rank : null, golden: !!(rec && rec.golden), skill: false, flow: null, buy24: null, sell24: null, sport: null, wallet: r.wallet, rankAll: rec && rec.rankAll != null ? rec.rankAll : null, rank30: rec && rec.rank != null ? rec.rank : null, firstTs: null, lastTs: null, trades: null };
}
function provenToPick(r: ProvenRow): Pick | null {
  const k = r.kalshi;
  if (!k || k.price == null || !k.ticker) return null;
  const group = (r.group && r.group.length ? r.group : [r]);
  const backers = group.map(backerFromProven);
  const invested = backers.reduce((a: number, b: Backer) => a + (b.cost || 0), 0);
  const teams = provenTeams(r);
  return {
    id: r.pid, q: r.game || r.market, label: r.pick, kind: provenKind(r), league: r.league, slug: r.slug,
    score: 0, parts: {}, price: r.now != null ? r.now : k.price, avgEntry: r.avg, whales: backers.length,
    invested, golden: 0, oppMoney: 0, oppCount: 0, oppQualified: 0, fresh24: 0, fresh24Opp: 0,
    sideAll: invested, sideCountAll: backers.length, oppAll: 0, oppCountAll: 0, hedgeAll: 0,
    game: { name: r.game || r.market, start: r.start, src: "proven", state: "pre", detail: "", score: "", teams: teams.length ? teams : undefined },
    startTs: r.startTs || 0, backers, opposing: [],
    kalshi: { status: "ok", action: k.action, price: k.price, ticker: k.ticker, contract: k.contract || undefined },
    risks: [], net: invested, totalBackers: backers.length, oneSidedShare: 1, fromProven: true
  };
}
function pickTeams(p: Pick): string[] {
  const fromGame = (p.game && p.game.teams) || [];
  const raw = (fromGame.length >= 2 ? fromGame : matchupTeams(p.q)).slice();
  return raw.map((t: string) => normName(t)).filter(Boolean);
}
const PICK_SORT_OPTS = [{ value: "best", label: "Best to worst" }, { value: "worst", label: "Worst to best" }, { value: "start", label: "Start time · earliest first" }, { value: "size", label: "Bet size · largest first" }];
const CAPPER_SORT_OPTS = [{ value: "best", label: "Best to worst" }, { value: "worst", label: "Worst to best" }, { value: "wr", label: "Win rate" }, { value: "n", label: "Most graded" }, { value: "profit", label: "Net $ on graded" }, { value: "open", label: "Open bets now" }, { value: "rank", label: "All-time rank" }];
const HOT_SORT_OPTS = [{ value: "f14", label: "14-day ROI · best first" }, { value: "best", label: "Best to worst" }, { value: "worst", label: "Worst to best" }];
function sortHotCappers(rows: CapperRec[], sort: string): CapperRec[] {
  return rows.slice().sort((a: CapperRec, b: CapperRec) => {
    const last = () => capperLastBetTs(b) - capperLastBetTs(a);
    const f14 = () => ((b.f14 && b.f14.roi != null ? b.f14.roi : -999) - (a.f14 && a.f14.roi != null ? a.f14.roi : -999)) || last();
    if (sort === "best" || sort === "worst") {
      const d = capperQualityScore(b) - capperQualityScore(a);
      if (d) return sort === "worst" ? -d : d;
      const r = f14();
      return sort === "worst" ? -r : r;
    }
    return f14();
  });
}
function TabSortBar(props: { value: string; onChange: (v: string) => void; options?: { value: string; label: string }[]; label?: string }) {
  return (
    <div data-tab-sort="1" style={{ margin: "0 0 12px", maxWidth: 420, width: "100%" }}>
      <Select label={props.label || "Sort picks"} value={props.value} onChange={props.onChange} options={props.options || PICK_SORT_OPTS} />
    </div>
  );
}
// Ranked tabs only list picks with at least one vetted backer (Upcoming keeps everything, with caution labels).
function vetted(p: Pick, backers?: Backer[]): boolean { return backerStats(backers || p.backers, p.id).counted > 0; }
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
    <div style={{ borderRadius: 22, border: "1.5px solid " + t.border.default, background: t.bg.base, boxShadow: "0 8px 24px rgba(76,29,149,0.12)", overflow: "hidden", marginBottom: 18, fontFamily: t.font.family, color: t.text.primary }}>
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
function shortUpdatedAt(at?: string): string {
  if (!at) return "";
  const i = at.lastIndexOf("·");
  return i >= 0 ? at.slice(i + 1).trim() : at;
}
function eliteSportLine(e: { wallet: string; name: string; sports?: { sport: string; w: number; l: number; n: number; roi: number }[] }): string {
  const sport = e.sports && e.sports[0];
  const name = nameOf(e.name, e.wallet);
  return sport ? name + " · " + sport.sport + " " + pct(sport.roi) + " ROI" : name;
}
function EliteCapperList() {
  const t = useGrokTheme();
  const [open, setOpen] = useState<boolean>(false);
  const elite = (PROVEN && PROVEN.elite) || [];
  return (
    <div data-elite-list="1" style={{ marginBottom: 10 }}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, width: "100%", minHeight: 44, padding: "8px 12px", borderRadius: 14, border: "1px solid " + t.border.default, background: t.bg.subtle, color: t.text.primary, fontFamily: t.font.family, fontSize: 14, fontWeight: 800, cursor: "pointer", textAlign: "left" }}>
        <span>{"Elite cappers (" + elite.length + ")"}</span>
        <span style={{ color: t.text.tertiary, fontWeight: 700 }}>{open ? "Hide" : "Show"}</span>
      </button>
      {open ? (elite.length ? elite.map((e) => (
        <div key={e.wallet} style={{ fontSize: 13, lineHeight: "20px", color: t.text.secondary, padding: "6px 12px 0" }}>{eliteSportLine(e)}</div>
      )) : <div style={{ fontSize: 13, color: t.text.tertiary, padding: "8px 12px 0" }}>none qualify right now</div>) : null}
    </div>
  );
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
          <div style={{ fontSize: 13, lineHeight: "20px", color: t.text.secondary, marginTop: 4 }}>Capper paid {cents(l.entry)} · Polymarket now {cents(l.now)} · Kalshi buy {cents(l.kPrice)}{delta !== null ? " · " + (delta > 0.05 ? (Math.abs(delta) + "¢ worse than capper's price") : delta < -0.05 ? (Math.abs(delta) + "¢ better than capper's price") : "about the same as capper's price") : ""}</div>
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

function CapperCard(props: { rec: CapperRec; trader?: Trader; now: number; bankroll: number; livePicks: Pick[]; openPicks?: Pick[]; followed: string[]; hidden: string[]; toggle: (kind: string, w: string) => void; rank: number }) {
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
        <ScoreChip rank={props.rank} score={capperQualityScore(rec)} />
        {rec.rankAll || rec.rank ? <Chip bg={BRAND} color="#FFFFFF">{rankLabel(rec.rankAll, rec.rank, x ? x.rank30 : null) || "Top whale"}</Chip> : <Chip bg={t.bg.subtle} color={t.text.secondary}>All-time rank n/a</Chip>}
        {rec.golden || (x && x.golden) ? <Chip bg={AMBER} color="#FFFFFF">Golden</Chip> : null}
        {x && x.skill ? <Chip bg={BRAND} color="#FFFFFF">Skill badge</Chip> : null}
        {sample ? <Chip bg={t.bg.subtle} color={t.text.secondary}>{sample}</Chip> : <Chip bg={GREEN} color="#FFFFFF">{rec.n}+ graded</Chip>}
        {rec.badge && rec.badge !== "n/a" ? <Chip bg={badgeColor(rec.badge)} color="#FFFFFF">{rec.badge === "Hot" ? "Hot · all 4 windows up" : rec.badge === "Cold" ? "Cold · demoted" : rec.badge === "Cooling" ? "Cooling · past week down" : "OK"}</Chip> : <Chip bg={t.bg.subtle} color={t.text.secondary}>Period P&L n/a</Chip>}
        {rec.proven ? <Chip bg={GREEN} color="#FFFFFF">Proven</Chip> : null}
        {rec.formCooling ? <span data-form-cooling="1"><Chip bg={RED} color="#FFFFFF">{"Cooling (14d) · " + f14Text(rec.f14)}</Chip></span> : null}
        {ELITE_W[(rec.wallet || "").toLowerCase()] ? <Chip bg="#7C3AED" color="#FFFFFF">Elite · Proven Picks</Chip> : null}
        {rec.oneOff ? <Chip bg={AMBER} color="#FFFFFF" title={rec.oneOffWhy || "Profit concentrated in a few bets"}>One-off</Chip> : null}
        {rec.isNew ? <Chip bg="#7C3AED" color="#FFFFFF">{"New" + (rec.trackedReason ? " · " + rec.trackedReason : "")}</Chip> : rec.tracked ? <Chip bg={t.bg.subtle} color={t.text.secondary}>Tracked</Chip> : null}
        {rec.coldDemoted ? null : rec.demoted ? <Chip bg={RED} color="#FFFFFF">Low-edge volume</Chip> : rec.qQual ? <Chip bg={GREEN} color="#FFFFFF">Copyable quality</Chip> : null}
        {rec.open ? <Chip bg="#2563EB" color="#FFFFFF">{rec.open} open</Chip> : null}
        {props.openPicks && capperWeakLong(rec) ? <span data-inelig="1" style={{ display: "contents" }}>{eligibilityOf(rec).map((r: string) => <Chip key={r} bg={RED} color="#FFFFFF">{r}</Chip>)}<Chip bg={t.bg.subtle} color={RED}>Picks hidden</Chip></span> : null}
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
        <Face name={rec.name || rec.wallet} size={48} />
        <div style={{ minWidth: 0, flex: "1 1 auto" }}>
          <div style={{ fontSize: 22, lineHeight: "26px", fontWeight: 850, overflowWrap: "anywhere" }}><NameLink name={nameOf(rec.name, rec.wallet)} wallet={rec.wallet} bold={true} /></div>
          <div style={{ fontSize: 12, color: t.text.tertiary, marginTop: 2 }}>{shortWallet(rec.wallet)}</div>
          <div style={{ fontSize: 18, lineHeight: "22px", fontWeight: 800, marginTop: 6 }}>
            {(function () { const bestSp = bestSportOf(rec); return bestSp ? <span>{bestSp.sport + " " + bestSp.sr.w + "–" + bestSp.sr.l + " · " + pct(bestSp.sr.roi) + " ROI"}</span> : rec.n ? <span>{record}{wr != null ? " · " + wr + "%" : ""}{rec.profit || rec.risked ? " · net " + (rec.profit < 0 ? "-" : "") + money(Math.abs(rec.profit)) : ""}</span> : <span style={{ color: t.text.secondary }}>Record building</span>; })()}
          </div>
          {bestSportOf(rec) && rec.n ? <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.secondary, marginTop: 2 }}>{"Overall " + record + (wr != null ? " · " + wr + "%" : "") + (rec.profit || rec.risked ? " · net " + (rec.profit < 0 ? "-" : "") + money(Math.abs(rec.profit)) : "") + (rec.croi != null ? " · " + pct(rec.croi) + " copyable ROI" : "")}</div> : null}
        </div>
        {wr != null ? <Ring score={Math.round(wr)} label="WIN %" color={wr >= 55 ? GREEN : wr >= 50 ? AMBER : RED} size={64} track={t.border.default} text={t.text.primary} sub={t.text.tertiary} /> : null}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginTop: 14 }}>
        {tile("Record (" + (rec.bf ? rec.bf.days + "-day backfill + scanner" : "scanner") + ")", rec.n ? rec.w + "–" + rec.l : "n/a", rec.n ? (wr != null ? wr + "% win" : "") + (rec.push ? " · " + rec.push + " push" : "") + (sample && rec.n ? " · " + sample : "") + ((rec.cn || 0) ? " · copyable " + rec.cw + "–" + rec.cl + (rec.croi != null ? ", " + (rec.croi >= 0 ? "+" : "") + rec.croi + "% ROI" : "") : "") : "No graded picks yet")}
        {tile("Net on graded", rec.n && (rec.profit || rec.risked) ? (rec.profit < 0 ? "-" : "") + money(Math.abs(rec.profit)) : "n/a", rec.roi != null ? "ROI " + rec.roi + "%" : (rec.risked ? "risked " + money(rec.risked) : "Cost/entry n/a on some picks"))}
        <div data-capper-f14={rec.wallet}>{tile("Last 14 days (counts 2x)", rec.f14 && rec.f14.n ? rec.f14.w + "–" + rec.f14.l : "n/a", rec.f14 && rec.f14.n ? (rec.f14.roi != null ? pct(rec.f14.roi) + " ROI" : "") + (rec.formCooling ? " · Cooling: down-ranked" : "") : "No graded picks in 14 days")}</div>
        <div data-capper-copies={rec.wallet}>{tile("Your copies", rec.copies && (rec.copies.n || rec.copies.open) ? rec.copies.w + "–" + rec.copies.l : "none yet", rec.copies && rec.copies.tickets ? rec.copies.tickets + " of your Kalshi tickets used this whale's picks · tickets " + rec.copies.tw + "–" + rec.copies.tl + " · staked " + money(rec.copies.stake) + (rec.copies.open ? " · " + rec.copies.open + " open" : "") : "No matched tickets in your ledger")}</div>
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
      {props.openPicks ? <CapperRoiAndPicks rec={rec} trader={x} now={now} picks={props.openPicks} /> : null}
      {rec.sports && Object.keys(rec.sports).length ? (
        <div data-capper-sports={rec.wallet} style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: t.text.tertiary }}>{"BY SPORT · PICKS NEED +" + sportBarRoiOf(rec) + "% ROI OVER 10+ GRADED IN THAT SPORT"}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            {Object.keys(rec.sports).slice().sort((a: string, b: string) => { const ra = rec.sports![a], rb = rec.sports![b]; const qa = ra.n >= SPORT_BAR_N && ra.roi != null && ra.roi >= sportBarRoiOf(rec) ? 1 : 0; const qb = rb.n >= SPORT_BAR_N && rb.roi != null && rb.roi >= sportBarRoiOf(rec) ? 1 : 0; return qb - qa || (rb.roi || -999) - (ra.roi || -999); }).slice(0, 10).map((sp: string) => { const r = rec.sports![sp]; const bar = r.n >= SPORT_BAR_N && r.roi != null && r.roi >= sportBarRoiOf(rec); const losing = r.n >= 5 && r.roi != null && r.roi < 0; return <span key={sp} style={{ display: "inline-block", padding: "2px 9px", borderRadius: 999, background: losing ? RED : (bar ? GREEN : (r.roi != null && r.roi > 0 ? "#15803D" : t.bg.subtle)), color: losing || (r.roi != null && r.roi > 0) ? "#FFFFFF" : t.text.primary, fontSize: 12, fontWeight: bar ? 850 : 750 }}>{sp + " " + r.w + "–" + r.l + (r.roi != null ? " · " + pct(r.roi) : "") + (bar ? " · qualifies" : "")}</span>; })}
          </div>
        </div>
      ) : null}
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
          {rec.bf && rec.bf.recent && rec.bf.recent.length ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: t.text.tertiary }}>{"LATEST GRADED FROM THE " + rec.bf.days + "-DAY POLYMARKET BACKFILL ($500+ SPORTS BETS · " + rec.bf.n + " GRADED)"}</div>
              {rec.bf.recent.map((r: (string | number)[], i: number) => <div key={i} style={{ fontSize: 13, lineHeight: "19px", marginTop: 4, color: t.text.secondary }}><span style={{ fontWeight: 800, color: r[4] === "W" ? GREEN : r[4] === "L" ? RED : t.text.tertiary }}>{r[4] === "W" ? "HIT" : r[4] === "L" ? "MISSED" : "PUSH"}</span>{" · " + String(r[0]).split("-")[0].toUpperCase() + " · " + r[1] + " (" + String(r[0]).replace(/-\d{4}-\d{2}-\d{2}.*$/, "").split("-").slice(1).join(" vs ").toUpperCase() + ") · " + money(Number(r[2])) + " at " + Math.round(Number(r[3]) * 100) + "¢"}</div>)}
            </div>
          ) : null}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: t.text.tertiary, marginTop: 16 }}>EVERY PICK WE'VE TRACKED · BIGGEST BET FIRST · HIT / MISSED / PUSH / OPEN</div>
          {history.length ? history.slice(0, histN).map((hp: CapperHistPick) => <CapperPickRow key={hp.id} p={hp} now={now} />) : <div style={{ fontSize: 13, color: t.text.tertiary, marginTop: 8 }}>No tracked picks yet.</div>}
          {history.length > histN ? <Button label={"Show more picks (" + (history.length - histN) + " left)"} onClick={() => setHistN(histN + 12)} /> : null}
        </div>
      ) : null}
    </CardShell>
  );
}

// Cappers tab (Nov 15): 14d / 30d / year / all-time ROI with counts, Weak long-term flag, and open picks inline.
function capperWeakLong(rec: CapperRec): boolean { return eligibilityOf(rec).length > 0; }
function CapperRoiAndPicks(props: { rec: CapperRec; trader?: Trader; now: number; picks: Pick[] }) {
  const t = useGrokTheme();
  const { rec, now, picks } = props;
  const x = props.trader;
  const win = rec.win || {};
  const yr = win.year || {}, all = win.all || {}, mo = win.month || {};
  const f = rec.f14;
  const days = (rec.bf && rec.bf.days) || 30;
  const col = (v: number | null | undefined) => v == null ? t.text.tertiary : v >= 0 ? GREEN : RED;
  const box = (key: string, lab: string, big: string, v: number | null | undefined, sub: string) => (
    <div key={key} data-cap-roi={key} style={{ borderRadius: 12, padding: "8px 8px", background: t.bg.subtle, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: t.text.secondary }}>{lab}</div>
      <div style={{ fontSize: 17, fontWeight: 850, marginTop: 2, color: col(v), overflowWrap: "anywhere" }}>{big}</div>
      <div style={{ fontSize: 11, lineHeight: "14px", color: t.text.tertiary, marginTop: 1, overflowWrap: "anywhere" }}>{sub}</div>
    </div>
  );
  return (
    <div>
      <div data-cap-roi-grid={rec.wallet} style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6, marginTop: 8 }}>
        {box("14d", "14-day ROI", f && f.n && f.roi != null ? pct(f.roi) : "—", f && f.n ? f.roi : null, f && f.n ? f.w + "–" + f.l + " · " + f.n + " bets" : "0 bets")}
        {box("30d", days + "-day ROI", rec.n && rec.roi != null ? pct(rec.roi) : "—", rec.n ? rec.roi : null, rec.n ? rec.w + "–" + rec.l + " · " + rec.n + " bets" + (mo.roi != null ? " · acct " + pct(mo.roi) : "") : "0 bets")}
        {box("year", "Year profit", yr.pnl != null ? kShort(yr.pnl) : "—", yr.pnl, "Polymarket P&L · bets n/a")}
        {box("all", "All-time ROI", all.roi != null ? pct(all.roi) : "—", all.roi != null ? all.roi : all.pnl, (all.pnl != null ? kShort(all.pnl) + " P&L" : "no data") + " · " + (x && x.resolved ? x.resolved.toLocaleString("en-US") + " mkts" : "bets n/a"))}
      </div>
      <div data-cap-open-picks={rec.wallet} style={{ marginTop: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: t.text.tertiary }}>{"OPEN PICKS · " + picks.length}</div>
        {eligibilityOf(rec).length ? <div style={{ fontSize: 13, color: RED, marginTop: 4 }}>{"Picks hidden (" + eligibilityOf(rec).join(", ") + "). " + picks.length + " open."}</div> : picks.length ? picks.map((p: Pick) => {
          const mine = (p.backers || []).filter((b: Backer) => (b.wallet || "").toLowerCase() === (rec.wallet || "").toLowerCase())[0];
          const live = p.game.state === "in" || (p.startTs > 0 && p.startTs <= now);
          const ok = p.kalshi && p.kalshi.status === "ok";
          const ex = explainPick(p, !ok);
          const n = distinctBackerCount(p.backers);
          const v = pickVerdictOf(p).verdict;
          return (
            <div key={p.id} data-cap-pick={p.id} style={{ marginTop: 6, padding: "8px 10px", borderRadius: 12, background: t.bg.subtle }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                <Chip bg={t.bg.base} color={t.text.primary}>{p.league}</Chip>
                <VerdictChip verdict={v} />
                <CapperCountBadge count={n} />
                <Chip bg={live ? RED : t.bg.base} color={live ? "#FFFFFF" : t.text.secondary}>{live ? "LIVE" : until(p.startTs, now, p.game && p.game.start)}</Chip>
                {!ok ? <Chip bg={BRAND2} color="#FFFFFF">No Kalshi</Chip> : null}
              </div>
              <div style={{ fontSize: 14, lineHeight: "19px", fontWeight: 800, marginTop: 4, overflowWrap: "anywhere" }}>{ok ? (ex.action || ex.headline || p.label) + (p.kalshi.price != null ? " at " + cents(p.kalshi.price) : "") : (ex.action || p.label)}</div>
              <div style={{ fontSize: 12, color: t.text.tertiary, marginTop: 2, overflowWrap: "anywhere" }}>{matchup(p.q) + (mine ? " · his bet " + money(mine.cost) + (mine.avg != null ? " at " + cents(mine.avg) : "") : "") + (n > 1 ? " · " + n + " cappers on it" : "")}</div>
            </div>
          );
        }) : <div style={{ fontSize: 13, color: t.text.tertiary, marginTop: 4 }}>No open picks from this capper in the latest scan.</div>}
      </div>
    </div>
  );
}

// All Picks card (Nov 15): same layout and look as the Cappers card (chip row, face + title, ring, 2-column stat tiles, 4-box strip).
function AllPickCard(props: { p: Pick; rank: number; now: number; bankroll: number; followed: string[]; hidden: string[]; toggle: (kind: string, w: string) => void; biggest?: boolean }) {
  const t = useGrokTheme();
  const { p, now } = props;
  const [open, setOpen] = useState<boolean>(false);
  const [openCaps, setOpenCaps] = useState<boolean>(false);
  const backers = p.backers.filter((b: Backer) => props.hidden.indexOf((b.wallet || "").toLowerCase()) < 0);
  const sorted = backers.slice().sort((a: Backer, b: Backer) => (b.cost || 0) - (a.cost || 0));
  const top = sorted[0];
  const rec = top ? QMAP[(top.wallet || "").toLowerCase()] : undefined;
  const k = p.kalshi;
  const ok = !!(k && k.status === "ok");
  const ex = explainPick(p, !ok);
  const info = pickInfo(p, backers.length);
  const qScore = pickQualityScore(p, backers);
  const verdict = pickVerdictOf(p, backers).verdict;
  const nCap = distinctBackerCount(backers);
  const total = backers.reduce((a: number, b: Backer) => a + (b.cost || 0), 0);
  const bst = backerStats(backers, p.id);
  const live = p.game.state === "in" || (p.startTs > 0 && p.startTs <= now);
  const stake = ok ? dollarStake(info.word, props.bankroll) : 0;
  const cv = top ? convOf(top.wallet, top.cost, p.id) : { tag: "N", mult: null };
  const sp = top ? sportRecFor(top.wallet, p.league, p.id) : null;
  const small = backers.some((b: Backer) => { const lw = (b.wallet || "").toLowerCase(); const r0 = QMAP[lw]; return !!(ELITE_W[lw] && r0 && (r0.cn || 0) < ELITE_FULL_N); });
  const title = vsTitleOf(p.q) || matchup(p.q);
  const tile = (lab: string, v: string, sub: string) => (
    <div style={{ borderRadius: 16, padding: 12, background: t.bg.subtle, minWidth: 0 }}>
      <div style={{ fontSize: 12, lineHeight: "15px", fontWeight: 600, color: t.text.secondary }}>{lab}</div>
      <div style={{ fontSize: 22, lineHeight: "26px", fontWeight: 800, marginTop: 6, overflowWrap: "anywhere" }}>{v}</div>
      <div style={{ fontSize: 12, lineHeight: "16px", color: t.text.tertiary, marginTop: 2 }}>{sub}</div>
    </div>
  );
  const win = (rec && rec.win) || {};
  const f = rec ? rec.f14 : undefined;
  const strip: [string, string, number | null | undefined, string][] = [
    ["14 days", f && f.n && f.roi != null ? pct(f.roi) : "—", f && f.n ? f.roi : null, f && f.n ? f.w + "–" + f.l + " · " + f.n + " bets" : "0 bets"],
    [((rec && rec.bf && rec.bf.days) || 30) + " days", rec && rec.n && rec.roi != null ? pct(rec.roi) : "—", rec && rec.n ? rec.roi : null, rec && rec.n ? rec.w + "–" + rec.l + " · " + rec.n + " bets" : "0 bets"],
    ["Year profit", win.year && win.year.pnl != null ? kShort(win.year.pnl) : "—", win.year ? win.year.pnl : null, "Polymarket P&L"],
    ["All-time ROI", win.all && win.all.roi != null ? pct(win.all.roi) : "—", win.all ? (win.all.roi != null ? win.all.roi : win.all.pnl) : null, win.all && win.all.pnl != null ? kShort(win.all.pnl) + " P&L" : "no data"],
  ];
  return (
    <CardShell accent={"linear-gradient(90deg, " + BRAND + ", " + AMBER + ")"}>
      <div data-pick-card="1" data-all-pick={p.id} data-card-league={p.league} style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <ScoreChip rank={props.rank} score={qScore} />
        <VerdictChip verdict={verdict} />
        <CapperCountBadge count={nCap} open={openCaps} onToggle={() => setOpenCaps(!openCaps)} />
        <Chip bg={BRAND} color="#FFFFFF">{p.league}</Chip>
        <Chip bg={t.bg.subtle} color={t.text.secondary}>{kindWord(p.kind)}</Chip>
        <Chip bg={live ? RED : t.bg.subtle} color={live ? "#FFFFFF" : t.text.primary}>{live ? "LIVE" : until(p.startTs, now, p.game && p.game.start)}</Chip>
        {small ? <Chip bg={AMBER} color="#FFFFFF">Small sample (12–19 graded)</Chip> : null}
        {info.split ? <Chip bg={AMBER} color="#FFFFFF">Split</Chip> : null}
        {info.pricier ? <Chip bg={AMBER} color="#FFFFFF">Pricier</Chip> : null}
        {pickIsStale(p, now) ? <Chip bg={AMBER} color="#FFFFFF">Stale</Chip> : null}
        {!ok ? <Chip bg={BRAND2} color="#FFFFFF">No Kalshi</Chip> : null}
        {props.biggest ? <Chip bg={GREEN} color="#FFFFFF">Biggest</Chip> : null}
      </div>
      {openCaps ? <CapperSportList backers={backers} pid={p.id} /> : null}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
        <Face name={(top && top.name) || p.label} size={48} />
        <div style={{ minWidth: 0, flex: "1 1 auto" }}>
          <div style={{ fontSize: 22, lineHeight: "26px", fontWeight: 850, overflowWrap: "anywhere" }}>{title}</div>
          <div style={{ fontSize: 12, color: t.text.tertiary, marginTop: 2 }}>{p.league + " · " + kindWord(p.kind) + (p.startTs ? " · " + ptTime(p.startTs) : "")}</div>
          <div style={{ fontSize: 18, lineHeight: "22px", fontWeight: 800, marginTop: 6, overflowWrap: "anywhere" }}>{ex.action || ex.headline || p.label}</div>
          {top ? <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.secondary, marginTop: 2 }}><NameLink name={nameOf(top.name, top.wallet)} wallet={top.wallet} />{(nCap > 1 ? " + " + (nCap - 1) + " more" : "") + (sp && sp.sr.n ? " · " + sp.sport + " " + sp.sr.w + "–" + sp.sr.l + (sp.sr.roi != null ? ", " + pct(sp.sr.roi) + " ROI" : "") : "")}</div> : null}
        </div>
        <Ring score={qScore} label="SCORE" color={qScore >= 65 ? GREEN : qScore >= 45 ? AMBER : RED} size={64} track={t.border.default} text={t.text.primary} sub={t.text.tertiary} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginTop: 14 }}>
        {tile("Kalshi price", ok && k.price != null ? cents(k.price) : "n/a", (ok && p.avgEntry != null ? "whale entry " + cents(p.avgEntry) : "") + (ok ? (((k.action || "") + (k.contract ? " " + k.contract : "")).trim() ? ((p.avgEntry != null ? " · " : "") + ((k.action || "") + (k.contract ? " " + k.contract : "")).trim()) : (p.avgEntry != null ? "" : "Verified contract")) : ((k && k.why) || "No Kalshi market")))}
        {tile("Top capper bet", top ? money(top.cost) : "n/a", top ? nameOf(top.name, top.wallet) + (cv.mult != null ? " · " + cv.mult + "x usual" : "") + (cv.tag === "H" ? " · High conviction" : "") : "")}
        {tile("Cappers on this pick", String(nCap), "total " + money(total) + ((p.oppMoney || 0) > 0 ? " · " + kMoney(p.oppMoney) + " against" : ""))}
        {tile("Backers record", bst.w + bst.l ? bst.w + "–" + bst.l : "n/a", bst.roi != null ? pct(bst.roi) + " ROI on graded bets" : "No graded bets yet")}
        {tile("Stake", ok ? money(stake) : "—", ok ? info.word + " · " + stakePctOf(info.word) + "% of bankroll" : "No Kalshi bet")}
        {tile("Starts", live ? "LIVE" : until(p.startTs, now, p.game && p.game.start).replace("starts in ", ""), p.startTs ? ptTime(p.startTs) : "Time n/a")}
      </div>
      {rec ? (
        <div data-all-pick-windows={p.id} style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6, marginTop: 8 }}>
          {strip.map((x) => (
            <div key={x[0]} style={{ borderRadius: 12, padding: "8px 8px", background: t.bg.subtle, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.text.secondary }}>{x[0]}</div>
              <div style={{ fontSize: 16, fontWeight: 850, marginTop: 2, color: x[2] == null ? t.text.tertiary : x[2] >= 0 ? GREEN : RED }}>{x[1]}</div>
              <div style={{ fontSize: 11, color: t.text.tertiary, marginTop: 1 }}>{x[3]}</div>
            </div>
          ))}
        </div>
      ) : null}
      <div style={{ marginTop: 10 }}><ActionBtn ex={ex} /></div>
      <ExpandBtn open={open} on={() => setOpen(!open)} label={open ? "Hide full details" : "Full pick details"} />
      {open ? <div style={{ marginTop: 8 }}><PickCard p={p} fun={false} poly={!ok} biggest={props.biggest} bankroll={props.bankroll} now={now} rank={props.rank} followed={props.followed} hidden={props.hidden} toggle={props.toggle} /></div> : null}
    </CardShell>
  );
}

function ProvenCard(props: { r: ProvenRow; rank: number; now: number }) {
  const t = useGrokTheme();
  const r = props.r;
  const [openCaps, setOpenCaps] = useState<boolean>(false);
  const vc = r.verdict === "GOOD" ? GREEN : r.verdict === "OK" ? AMBER : RED;
  const k = r.kalshi;
  const sr = r.sportRec || { w: 0, l: 0, n: 0, roi: null };
  const group = r.group && r.group.length ? r.group : [r];
  return (
    <div data-proven-card={r.verdict} style={{ borderRadius: 18, border: "1px solid " + t.border.default, padding: "12px 14px", marginBottom: 10, background: t.bg.base, fontFamily: t.font.family }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <ScoreChip rank={props.rank} score={provenQualityScore(r)} />
        <CapperCountBadge count={group.length} open={openCaps} onToggle={() => setOpenCaps(!openCaps)} />
        <span style={{ display: "inline-block", padding: "1px 10px", borderRadius: 999, background: vc, color: "#FFFFFF", fontWeight: 850, fontSize: 13 }}>{r.verdict}</span>
        {r.smallSample || ((QMAP[(r.wallet || "").toLowerCase()] || {} as CapperRec).cn || 99) < ELITE_FULL_N ? <Chip bg={AMBER} color="#FFFFFF">Small sample</Chip> : null}
        {provenIsStale(r, props.now) ? <Chip bg={AMBER} color="#FFFFFF">Stale</Chip> : null}
        <span style={{ fontSize: 12, fontWeight: 800, color: t.text.secondary }}>{r.league + (r.sport && r.sport !== r.league ? " (" + r.sport + ")" : "") + " · " + r.start}</span>
        {r.inTop ? <Chip bg={BRAND} color="#FFFFFF">Also on Top 20</Chip> : null}
      </div>
      <div style={{ fontSize: 18, lineHeight: "23px", fontWeight: 850, marginTop: 6 }}>{r.game}</div>
      {r.market && r.market !== r.game ? <div style={{ fontSize: 13, color: t.text.secondary, marginTop: 2 }}>{r.market}</div> : null}
      <div style={{ fontSize: 15, lineHeight: "21px", fontWeight: 800, marginTop: 6, color: k ? t.text.primary : RED }}>
        {k ? "Kalshi: " + k.action + " " + (k.contract || r.pick) + (k.price != null ? " at " + Math.round(k.price * 100) + "¢" : "") + (r.avg != null ? " · whale entry " + Math.round(r.avg * 100) + "¢" : "") + (k.live ? "" : " (last scan price)") : "No Kalshi market found for this bet"}
      </div>
      {k ? <div style={{ fontSize: 11, color: t.text.tertiary }}>{k.ticker}</div> : null}
      <div style={{ fontSize: 13, lineHeight: "19px", marginTop: 6, color: t.text.secondary }}>
        <span style={{ fontWeight: 800, color: t.text.primary }}>{group.length > 1 ? (group.length + " elite cappers") : nameOf(r.name, r.wallet)}</span>
        {" back" + (group.length > 1 ? "" : "s") + " " + r.pick + " · " + (group.length > 1 ? "biggest " : "") + money(r.cost) + " at " + Math.round(r.avg * 100) + "¢" + (r.mult != null && group.length === 1 ? " = " + r.mult + "x usual (" + money(r.usual) + ")" : "")}
      </div>
      {group.length === 1 ? (
      <div style={{ fontSize: 13, lineHeight: "19px", marginTop: 2, color: t.text.secondary }}>
        <span style={{ fontWeight: 800, color: sr.n >= 5 && sr.roi != null && sr.roi < 0 ? RED : sr.roi != null && sr.roi > 0 ? GREEN : t.text.secondary }}>{r.sport + " " + f14Text(sr)}</span>
        {" · overall " + (r.rec ? r.rec[0] + "–" + r.rec[1] : "n/a") + ", " + pct(r.roi) + " ROI · 14d " + f14Text(r.f14)}
      </div>
      ) : null}
      {openCaps || group.length > 1 ? (
        <div style={{ marginTop: 6 }}>
          {(openCaps ? group : group.slice(0, 0)).length || openCaps ? (
            <div data-capper-sport-list="1">
              {group.map((g: ProvenRow, i: number) => {
                const gsr = g.sportRec || { w: 0, l: 0, n: 0, roi: null };
                return <div key={g.wallet + i} style={{ fontSize: 13, lineHeight: "19px", marginTop: 4, color: t.text.secondary }}><span style={{ fontWeight: 800, color: gsr.roi != null && gsr.roi >= 20 ? GREEN : t.text.primary }}>{g.sport + " " + f14Text(gsr)}</span>{" · " + nameOf(g.name, g.wallet) + " " + money(g.cost) + (g.mult != null ? " = " + g.mult + "x usual" : "") + " · overall " + (g.rec ? g.rec[0] + "–" + g.rec[1] : "n/a") + ", " + pct(g.roi) + " ROI"}</div>;
              })}
            </div>
          ) : <div style={{ fontSize: 12, color: t.text.tertiary, marginTop: 4 }}>Tap the {group.length} badge to see each capper's sport ROI.</div>}
        </div>
      ) : null}
      {r.why && r.why.length ? <div style={{ fontSize: 12, fontWeight: 750, color: r.verdict === "CAUTION" ? RED : AMBER, marginTop: 4 }}>{(r.verdict === "CAUTION" ? "⚠ " : "") + r.why.join(" · ")}</div> : null}
    </div>
  );
}
function PickCard(props: { p: Pick; fun: boolean; poly?: boolean; longshot?: boolean; longshotTop?: boolean; biggest?: boolean; upcoming?: boolean; bankroll: number; now: number; rank: number; followed: string[]; hidden: string[]; toggle: (kind: string, w: string) => void; resultTag?: string | null }) {
  const t = useGrokTheme();
  const { p, fun, bankroll, now, rank } = props;
  const poly = !!props.poly;
  const longshot = !!props.longshot;
  const biggest = !!props.biggest;
  const upcoming = !!props.upcoming;
  const moneyBoxes = biggest || upcoming;
  const [open, setOpen] = useState<boolean>(false);
  const [openCaps, setOpenCaps] = useState<boolean>(false);
  const k = p.kalshi;
  const ok = k.status === "ok";
  const c = conf(p.score);
  const backers0 = p.backers.filter((b: Backer) => props.hidden.indexOf((b.wallet || "").toLowerCase()) < 0);
  const info = pickInfo(p, backers0.length);
  const word = info.word;
  const pct = longshot ? 0 : ((ok || poly) ? stakePctOf(word) : 0);
  const qScore = pickQualityScore(p, backers0);
  const stake = longshot ? (props.longshotTop ? 2 : 1) : ((ok || poly) ? dollarStake(word, bankroll) : 0);
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
          <ScoreChip rank={rank} score={qScore} />
          <VerdictChip verdict={pickVerdictOf(p, backers).verdict} />
          <CapperCountBadge count={distinctBackerCount(backers)} open={openCaps} onToggle={() => setOpenCaps(!openCaps)} />
          <StrengthChip word={word} />
          {backers.some((b: Backer) => { const lw = (b.wallet || "").toLowerCase(); const r0 = QMAP[lw]; return !!(ELITE_W[lw] && r0 && (r0.cn || 0) < ELITE_FULL_N); }) ? <Chip bg={AMBER} color="#FFFFFF">Small sample (12–19 graded)</Chip> : null}
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
          {hotBackers(backers, p.id).length ? <Chip bg="#EA580C" color="#FFFFFF">{"🔥 Hot-backed" + (hotBackers(backers, p.id).length > 1 ? " ×" + hotBackers(backers, p.id).length : "")}</Chip> : null}
          {(function () { const bs = backerStats(backers, p.id); return <span data-vet-chip="1"><Chip bg={!bs.counted ? RED : bs.roi != null && bs.roi > 0 ? GREEN : t.bg.subtle} color={!bs.counted || (bs.roi != null && bs.roi > 0) ? "#FFFFFF" : t.text.primary}>{bs.text}</Chip></span>; })()}
          <CopyId id={idCode} />
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <EventMeta ev={resolveEvent(p)} now={now} live={live} extra={<Fragment>{p.game.score ? p.game.score + " · " : ""}<span style={{ color: c.color, fontWeight: 700 }}>{c.word} confidence</span> · <Pct v={Math.round(p.price * 100)} /> chance (market)</Fragment>} />
            <div style={{ fontSize: 24, lineHeight: "29px", fontWeight: 850, marginTop: 4, overflowWrap: "anywhere" }}>Bet: {ex.headline}</div>
            {openCaps ? <CapperSportList backers={countedBackers(backers, p.id)} pid={p.id} /> : <BackersLine backers={backers} pid={p.id} />}
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
            <KalshiBox act={ok ? (k.action || null) : null} price={k.price === undefined ? null : k.price} contract={k.contract || null} edge={k.edge_vs_whales === undefined ? null : k.edge_vs_whales} why={k.why || null} label={ex.headline} entry={p.avgEntry} now={p.price} ticker={k.ticker || null} marketTitle={k.marketTitle || k.eventTitle || null} />
          )}
          <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.secondary, marginTop: 8 }}>
            {"Now " + cents(info.px) + (slipWords(info.over, p.avgEntry) ? " · " + slipWords(info.over, p.avgEntry) : "")}
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
                    {isHot(b.wallet) ? <Chip bg="#EA580C" color="#FFFFFF">🔥 Hot</Chip> : null}
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

function comingCaps(n: number): string { return n + (n === 1 ? " capper" : " cappers"); }
function comingRoiOf(b: ComingBacker): number | null {
  if (b.sroi != null && (b.sn || 0) >= 5) return b.sroi;
  if (b.roi != null) return b.roi;
  if (b.sroi != null) return b.sroi;
  return null;
}
function comingSportLine(b: ComingBacker): string {
  if (b.sport && (b.sn || 0)) return b.sport + " " + (b.sw || 0) + "–" + (b.sl || 0) + (b.sroi != null ? ", " + pct(b.sroi) + " ROI" : "");
  return "";
}
function isHotSideCapper(wallet: string | null | undefined): boolean {
  const lw = (wallet || "").toLowerCase();
  if (!lw) return false;
  const rec = QMAP[lw];
  if (rec && (rec.mm || rec.oneOff)) return false;
  if (ELITE_W[lw]) return true;
  return !!(rec && isHotTabCapper(rec));
}
function comingBackerFrom(wallet: string, name: string, cost: number, avg: number | null | undefined, lastTs: number | null | undefined, league: string): ComingBacker | null {
  const lw = (wallet || "").toLowerCase();
  if (!isHotSideCapper(lw)) return null;
  const rec = QMAP[lw];
  const sport = sportOf(league);
  const sr = rec && rec.sports ? rec.sports[sport] : undefined;
  return { wallet: wallet, name: name || (rec ? rec.name : wallet), cost: cost, avg: avg != null ? avg : null, lastTs: lastTs || null, sport: sport, sw: sr ? sr.w : 0, sl: sr ? sr.l : 0, sn: sr ? sr.n : 0, sroi: sr ? sr.roi : null, roi: rec && rec.f14 && rec.f14.roi != null ? rec.f14.roi : (rec ? rec.roi : null), wr: rec ? rec.wr : null, elite: !!ELITE_W[lw] };
}
type GameHint = { state?: string | null; refresh?: Refresh | null; phase?: string | null };
let _gameHints: { byStart: Record<string, GameHint>; byTitle: Record<string, GameHint> } | null = null;
function hintRank(h?: GameHint | null): number {
  if (!h) return 0;
  if (espnIsFinal(h.state, h.refresh)) return 3;
  if (espnIsLive(h.state, h.refresh, h.phase)) return 2;
  return 1;
}
function gameHints(): { byStart: Record<string, GameHint>; byTitle: Record<string, GameHint> } {
  if (_gameHints) return _gameHints;
  const byStart: Record<string, GameHint> = {};
  const byTitle: Record<string, GameHint> = {};
  const add = (league: string, startTs: number, title: string, h: GameHint) => {
    if (startTs) {
      const k1 = (league || "").toUpperCase() + "|" + startTs;
      if (hintRank(h) >= hintRank(byStart[k1])) byStart[k1] = h;
    }
    const k2 = (title || "").toLowerCase().replace(/\s+/g, " ").replace(/\s+@\s+/g, " vs ").trim();
    if (k2 && hintRank(h) >= hintRank(byTitle[k2])) byTitle[k2] = h;
  };
  const arrays: Pick[][] = [DATA.signals || [], DATA.fun || [], DATA.poly || [], DATA.glue || [], DATA.props || [], DATA.longshots || [], DATA.biggest || [], DATA.upcoming || []];
  arrays.forEach((arr: Pick[]) => {
    arr.forEach((p: Pick) => {
      const title = vsTitleOf(p.q) || gameTitle(p);
      add(p.league, p.startTs || 0, title, { state: (p.refresh && p.refresh.state) || (p.game && p.game.state) || null, refresh: p.refresh, phase: (p.game && p.game.state === "in") || (p.refresh && p.refresh.state === "in") ? "live" : null });
    });
  });
  _gameHints = { byStart, byTitle };
  return _gameHints;
}
function hintForComing(g: ComingGame): GameHint {
  const hints = gameHints();
  const k1 = (g.league || "").toUpperCase() + "|" + (g.startTs || 0);
  const k2 = (g.game || "").toLowerCase().replace(/\s+/g, " ").replace(/\s+@\s+/g, " vs ").trim();
  const a = hints.byStart[k1];
  const b = hints.byTitle[k2];
  return hintRank(a) >= hintRank(b) ? (a || b || { state: g.state, phase: g.phase }) : (b || a || { state: g.state, phase: g.phase });
}
function comingStatus(g: ComingGame, now: number): "upcoming" | "live" | "final" {
  const h = hintForComing(g);
  return startStatus(g.startTs || 0, now, { state: g.state || h.state, refresh: h.refresh, phase: g.phase || h.phase });
}
function comingIsLive(g: ComingGame, now: number): boolean {
  return comingStatus(g, now) === "live";
}
function partitionComing(games: ComingGame[], now: number): { live: ComingGame[]; upcoming: ComingGame[] } {
  const live: ComingGame[] = [];
  const upcoming: ComingGame[] = [];
  games.forEach((g: ComingGame) => { if (comingIsLive(g, now)) live.push(g); else upcoming.push(g); });
  return { live, upcoming };
}
function sortComingGames(games: ComingGame[], sort: string, now: number): ComingGame[] {
  const rows = games.filter((g: ComingGame) => comingStatus(g, now) !== "final").slice();
  const liveCmp = (a: ComingGame, b: ComingGame) => (comingIsLive(a, now) === comingIsLive(b, now) ? 0 : comingIsLive(a, now) ? -1 : 1);
  // Single-capper cards always sit below multi-capper cards (Noel, Nov 16). ROI is only a tiebreak after that.
  const bandCmp = (a: ComingGame, b: ComingGame) => ((b.capperCount || 0) >= 2 ? 1 : 0) - ((a.capperCount || 0) >= 2 ? 1 : 0);
  if (sort === "start") rows.sort((a: ComingGame, b: ComingGame) => liveCmp(a, b) || bandCmp(a, b) || (a.startTs || 0) - (b.startTs || 0));
  else rows.sort((a: ComingGame, b: ComingGame) => liveCmp(a, b) || bandCmp(a, b) || ((b.capperCount || 0) - (a.capperCount || 0)) || ((b.capperRoi != null ? b.capperRoi : -999) - (a.capperRoi != null ? a.capperRoi : -999)) || ((a.startTs || 0) - (b.startTs || 0)));
  return rows;
}
function fillGameStats(g: ComingGame): ComingGame {
  const seen: Record<string, ComingBacker> = {};
  const rois: number[] = [];
  (g.markets || []).forEach((m: ComingMarket) => {
    (m.sides || []).forEach((s: ComingSide) => {
      (s.backers || []).forEach((b: ComingBacker) => {
        const w = (b.wallet || b.name || "").toLowerCase();
        if (w) seen[w] = b;
        const r = comingRoiOf(b);
        if (r != null) rois.push(r);
      });
    });
  });
  return { ...g, capperCount: Object.keys(seen).length, capperRoi: rois.length ? Math.round((rois.reduce((a: number, x: number) => a + x, 0) / rois.length) * 10) / 10 : null };
}
function asComingGames(raw: ComingGame[] | ComingSide[] | unknown[]): ComingGame[] {
  const arr = (raw || []) as Record<string, unknown>[];
  if (!arr.length) return [];
  const first = arr[0] || {};
  if (first.markets && Array.isArray((first as ComingGame).markets) && ((first as ComingGame).markets[0] || {} as ComingMarket).sides) {
    return (arr as unknown as ComingGame[]).map(fillGameStats);
  }
  // Flat-list leftover from the previous Coming Up version: group into game cards.
  const groups: Record<string, Record<string, unknown>[]> = {};
  arr.forEach((r: Record<string, unknown>) => {
    if (!r || !(r as ComingSide).label) return;
    const gid = String(r.gameId || r.id || "");
    (groups[gid] = groups[gid] || []).push(r);
  });
  const out: ComingGame[] = [];
  Object.keys(groups).forEach((gid: string) => {
    const rows = groups[gid];
    const r0 = rows[0] as ComingSide & ComingGame & { gameId?: string; oppBackers?: ComingBacker[]; oppCappers?: number; oppUsd?: number; oppNames?: string[]; kind?: string; q?: string };
    const markets: ComingMarket[] = [];
    const byCid: Record<string, Record<string, unknown>[]> = {};
    rows.forEach((r: Record<string, unknown>) => {
      const cid = String(r.id || "").split(":")[0] || String(r.gameId || gid);
      (byCid[cid] = byCid[cid] || []).push(r);
    });
    Object.keys(byCid).forEach((cid: string) => {
      const sides: ComingSide[] = [];
      byCid[cid].forEach((r: Record<string, unknown>) => {
        const row = r as ComingSide & { oppBackers?: ComingBacker[]; oppCappers?: number; oppUsd?: number; oppNames?: string[]; kind?: string };
        sides.push({ id: row.id, side: row.side, label: row.label, kPrice: row.kPrice, avgEntry: row.avgEntry, slip: row.slip, action: row.action, contract: row.contract, ticker: row.ticker, cappers: row.cappers, usd: row.usd, names: row.names, backers: row.backers, lastTs: row.lastTs });
        if ((row.oppCappers || 0) > 0 && (row.oppBackers || []).length) {
          const oppSide = row.side === "yes" ? "no" : "yes";
          if (!sides.some((x: ComingSide) => x.side === oppSide)) {
            sides.push({ id: cid + ":" + oppSide, side: oppSide, label: (row.oppNames && row.oppNames[0]) || "Other side", kPrice: null, avgEntry: null, slip: null, cappers: row.oppCappers || 0, usd: row.oppUsd || 0, names: row.oppNames, backers: row.oppBackers, lastTs: null });
          }
        }
      });
      if (sides.length === 1) sides.push({ id: cid + ":other", side: sides[0].side === "yes" ? "no" : "yes", label: "Other side", kPrice: null, avgEntry: null, slip: null, cappers: 0, usd: 0, backers: [] });
      markets.push({ id: cid, kind: (byCid[cid][0] as { kind?: string }).kind || "other", q: (byCid[cid][0] as { q?: string }).q || "", sides: sides });
    });
    out.push(fillGameStats({ id: gid, game: r0.game, league: r0.league, startTs: r0.startTs, start: r0.start, markets: markets }));
  });
  return out;
}
function picksToGameCards(picks: Pick[]): ComingGame[] {
  const groups: Record<string, Pick[]> = {};
  picks.forEach((p: Pick) => { const k = gameKey(p); (groups[k] = groups[k] || []).push(p); });
  const out: ComingGame[] = [];
  Object.keys(groups).forEach((gid: string) => {
    const ps = groups[gid];
    const p0 = ps[0];
    const byCid: Record<string, { yes?: Pick; no?: Pick; any: Pick }> = {};
    ps.forEach((p: Pick) => {
      const parts = (p.id || "").split(":");
      const cid = parts[0] || p.id;
      const side = parts[1] || "yes";
      const slot = byCid[cid] || (byCid[cid] = { any: p });
      if (side === "no") slot.no = p; else slot.yes = p;
    });
    const markets: ComingMarket[] = [];
    Object.keys(byCid).forEach((cid: string) => {
      const slot = byCid[cid];
      const mkSide = (side: string, p: Pick | undefined, oppOf: Pick | undefined, labelGuess: string): ComingSide => {
        const src = p || oppOf;
        const raw = (p ? p.backers : (oppOf ? oppOf.opposing : [])).map((b: Backer | Opp) => comingBackerFrom(b.wallet, b.name, b.cost, (b as Backer).avg, (b as Backer).lastTs || (b as Backer).firstTs, (src && src.league) || p0.league)).filter((b: ComingBacker | null): b is ComingBacker => !!b);
        const seen: Record<string, ComingBacker> = {};
        raw.forEach((b: ComingBacker) => { const w = (b.wallet || "").toLowerCase(); if (!seen[w] || b.cost > seen[w].cost) seen[w] = b; });
        const backers = Object.keys(seen).map((w: string) => seen[w]).sort((a: ComingBacker, b: ComingBacker) => ((comingRoiOf(b) != null ? comingRoiOf(b) : -999) as number) - ((comingRoiOf(a) != null ? comingRoiOf(a) : -999) as number));
        const usd = backers.reduce((a: number, b: ComingBacker) => a + (b.cost || 0), 0);
        const inv = backers.reduce((a: number, b: ComingBacker) => a + (b.cost || 0) * (b.avg || 0), 0);
        const avg = usd && inv ? inv / usd : null;
        const k = p && p.kalshi && p.kalshi.status === "ok" ? p.kalshi : null;
        let label = p ? p.label : "";
        if (!label && oppOf) {
          const title = vsTitleOf(oppOf.q) || gameTitle(oppOf);
          const parts = title.split(/\s+vs\s+/i);
          if (parts.length === 2) label = parts[1] && (oppOf.label || "").toLowerCase().indexOf(parts[0].toLowerCase()) >= 0 ? parts[1] : parts[0];
        }
        return { id: cid + ":" + side, side: side, label: label || labelGuess, kPrice: k && k.price != null ? k.price : null, avgEntry: avg, slip: k ? slipCents(k.price, avg) : null, action: k ? k.action : null, contract: k ? k.contract : null, ticker: k ? k.ticker : null, marketTitle: k ? (k.eventTitle || k.marketTitle || null) : null, yesAsk: k ? k.yesAsk : null, noAsk: k ? k.noAsk : null, oppTicker: k ? k.oppTicker : null, oppContract: k ? k.oppContract : null, oppAction: k ? k.oppAction : null, oppPrice: k ? k.oppPrice : null, cappers: backers.length, usd: Math.round(usd), names: backers.map((b: ComingBacker) => b.name), backers: backers, lastTs: backers.reduce((a: number, b: ComingBacker) => Math.max(a, b.lastTs || 0), 0) || null };
      };
      const yes = mkSide("yes", slot.yes, slot.no, "Yes");
      const no = mkSide("no", slot.no, slot.yes, "No");
      const sides = [yes, no].sort((a: ComingSide, b: ComingSide) => (b.cappers - a.cappers) || (((comingRoiOf((b.backers || [])[0] || {} as ComingBacker) || -999) - (comingRoiOf((a.backers || [])[0] || {} as ComingBacker) || -999))));
      if (sides.some((x: ComingSide) => x.cappers > 0)) markets.push({ id: cid, kind: (slot.any.kind || "other"), q: slot.any.q, sides: sides });
    });
    if (!markets.length) return;
    const st = (p0.refresh && p0.refresh.state) || (p0.game && p0.game.state) || null;
    out.push(fillGameStats({ id: gid, game: vsTitleOf(p0.q) || gameTitle(p0), league: p0.league, startTs: p0.startTs, start: p0.game && p0.game.start ? p0.game.start : "", state: st, phase: st === "in" ? "live" : null, markets: markets }));
  });
  return out;
}
function provenToGameCards(rows: ProvenRow[]): ComingGame[] {
  const flat: ProvenRow[] = [];
  rows.forEach((r: ProvenRow) => { if (r.group && r.group.length) r.group.forEach((g: ProvenRow) => flat.push(g)); else flat.push(r); });
  const groups: Record<string, ProvenRow[]> = {};
  flat.forEach((r: ProvenRow) => {
    const k = evKey(r.slug) || ((r.league || "") + "|" + (r.startTs || 0) + "|" + (r.game || ""));
    (groups[k] = groups[k] || []).push(r);
  });
  const out: ComingGame[] = [];
  Object.keys(groups).forEach((gid: string) => {
    const rs = groups[gid];
    const r0 = rs[0];
    const byPick: Record<string, ProvenRow[]> = {};
    rs.forEach((r: ProvenRow) => { const lab = (r.pick || "").trim() || "Pick"; (byPick[lab] = byPick[lab] || []).push(r); });
    const labels = Object.keys(byPick);
    const sides: ComingSide[] = labels.map((lab: string, i: number) => {
      const set = byPick[lab];
      const raw = set.map((r: ProvenRow) => comingBackerFrom(r.wallet, r.name, r.cost, r.avg, r.lastTs || r.firstTs, r.league)).filter((b: ComingBacker | null): b is ComingBacker => !!b);
      const seen: Record<string, ComingBacker> = {};
      raw.forEach((b: ComingBacker) => { const w = (b.wallet || "").toLowerCase(); if (!seen[w] || b.cost > seen[w].cost) seen[w] = b; });
      const backers = Object.keys(seen).map((w: string) => seen[w]).sort((a: ComingBacker, b: ComingBacker) => ((comingRoiOf(b) != null ? comingRoiOf(b) : -999) as number) - ((comingRoiOf(a) != null ? comingRoiOf(a) : -999) as number));
      const usd = backers.reduce((a: number, b: ComingBacker) => a + (b.cost || 0), 0);
      const k = set[0].kalshi;
      const inv = backers.reduce((a: number, b: ComingBacker) => a + (b.cost || 0) * (b.avg || 0), 0);
      const avg = usd && inv ? inv / usd : (set[0].avg || null);
      return { id: (set[0].pid || gid) + ":" + i, side: i === 0 ? "yes" : "no", label: lab, kPrice: k && k.price != null ? k.price : null, avgEntry: avg, slip: k ? slipCents(k.price, avg) : null, action: k ? k.action : null, contract: k ? k.contract : null, ticker: k ? k.ticker : null, marketTitle: k ? (k.eventTitle || k.marketTitle || null) : null, yesAsk: k ? k.yesAsk : null, noAsk: k ? k.noAsk : null, oppTicker: k ? k.oppTicker : null, oppContract: k ? k.oppContract : null, oppAction: k ? k.oppAction : null, oppPrice: k ? k.oppPrice : null, cappers: backers.length, usd: Math.round(usd), names: backers.map((b: ComingBacker) => b.name), backers: backers, lastTs: backers.reduce((a: number, b: ComingBacker) => Math.max(a, b.lastTs || 0), 0) || null };
    });
    if (sides.length === 1) {
      const other = (rs[0].opp || "").trim();
      sides.push({ id: gid + ":other", side: "no", label: other || "Other side", kPrice: null, avgEntry: null, slip: null, cappers: 0, usd: 0, backers: [] });
    }
    sides.sort((a: ComingSide, b: ComingSide) => b.cappers - a.cappers);
    if (!sides.some((x: ComingSide) => x.cappers > 0)) return;
    out.push(fillGameStats({ id: gid, game: r0.game, league: r0.league, startTs: r0.startTs || 0, start: r0.start || "", markets: [{ id: gid, kind: "moneyline", q: r0.market || r0.game, sides: sides }] }));
  });
  return out;
}
function suggestComing(games: ComingGame[], now: number): { gameId: string; sideId: string }[] {
  const picked: { gameId: string; sideId: string }[] = [];
  const seen: Record<string, boolean> = {};
  sortComingGames(games, "best", now).forEach((g: ComingGame) => {
    if (picked.length >= 2 || seen[g.id] || !(g.startTs > now)) return;
    const sides = ((g.markets || [])[0] || { sides: [] }).sides || [];
    const lead = sides.slice().sort((a: ComingSide, b: ComingSide) => (b.cappers - a.cappers))[0];
    const other = sides.find((s: ComingSide) => s.id !== (lead && lead.id));
    if (!lead || !lead.cappers || lead.kPrice == null || lead.kPrice < 0.20 || lead.kPrice > 0.90) return;
    if (lead.slip != null && lead.slip >= SLIP_CAP_CENTS) return;
    if (other && other.cappers > lead.cappers) return;
    seen[g.id] = true;
    picked.push({ gameId: g.id, sideId: lead.id });
  });
  return picked;
}

function CapperProfile(props: { wallet: string; onClose: () => void }) {
  const t = useGrokTheme();
  const rec = QMAP[(props.wallet || "").toLowerCase()];
  const name = rec ? nameOf(rec.name, rec.wallet) : shortWallet(props.wallet);
  const win = (rec && rec.win) || {};
  const period = (lab: string, w?: { pnl?: number; roi?: number | null; rec?: number[] }) => (
    <div style={{ borderRadius: 14, padding: 12, background: t.bg.subtle, minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: t.text.secondary }}>{lab}</div>
      <div style={{ fontSize: 20, fontWeight: 850, marginTop: 4, color: w && w.roi != null ? (w.roi >= 0 ? GREEN : RED) : t.text.primary }}>{w && w.roi != null ? pct(w.roi) : "—"}</div>
      <div style={{ fontSize: 12, color: t.text.tertiary, marginTop: 2 }}>{w && w.pnl != null ? kShort(w.pnl) + " P&L" : "no P&L"}{w && w.rec && (w.rec[0] + w.rec[1] ? " · " + w.rec[0] + "–" + w.rec[1] : "")}</div>
    </div>
  );
  const sports = rec && rec.sports ? Object.keys(rec.sports).map((sp: string) => ({ sport: sp, sr: rec.sports![sp] })).filter((x: { sport: string; sr: { w: number; l: number; n: number; roi: number | null } }) => (x.sr.n || 0) >= 5 && x.sr.roi != null && x.sr.roi > 0).sort((a, b) => ((b.sr.roi || 0) - (a.sr.roi || 0))) : [];
  return (
    <div data-capper-profile="1" onClick={props.onClose} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(15,15,20,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 12 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, maxHeight: "86vh", overflow: "auto", background: t.bg.base, borderRadius: 22, padding: 18, boxShadow: "0 16px 48px rgba(0,0,0,0.2)", fontFamily: t.font.family, color: t.text.primary }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Face name={name} size={56} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 850, overflowWrap: "anywhere" }}>{name}</div>
            <div style={{ fontSize: 13, color: t.text.secondary, marginTop: 2 }}>{rec && rec.wr != null ? rec.wr + "% win rate" : "Win rate n/a"}{rec && rec.n ? " · " + rec.w + "–" + rec.l + " (" + rec.n + " graded)" : ""}{rec && rec.roi != null ? " · " + pct(rec.roi) + " 30d ROI" : ""}</div>
          </div>
          <button type="button" onClick={props.onClose} style={{ border: "none", background: t.bg.subtle, borderRadius: 999, width: 36, height: 36, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>×</button>
        </div>
        {rec && rec.f14 && rec.f14.n ? <div style={{ fontSize: 13, marginTop: 10, color: t.text.secondary }}>Last 14 days: {rec.f14.w}–{rec.f14.l}{rec.f14.roi != null ? ", " + pct(rec.f14.roi) + " ROI" : ""}</div> : null}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginTop: 12 }}>
          {period("Week", win.week)}
          {period("Month", win.month)}
          {period("Year", win.year)}
        </div>
        <div style={{ fontSize: 15, fontWeight: 850, marginTop: 16 }}>Sports they're sharp in</div>
        {sports.length ? sports.map((x) => (
          <div key={x.sport} style={{ fontSize: 14, lineHeight: "20px", marginTop: 6, color: t.text.secondary }}>
            <span style={{ fontWeight: 800, color: (x.sr.roi || 0) >= 20 ? GREEN : t.text.primary }}>{x.sport + " " + pct(x.sr.roi)}</span>
            {" · " + x.sr.w + "–" + x.sr.l + " over " + x.sr.n + " graded"}
          </div>
        )) : <div style={{ fontSize: 13, color: t.text.tertiary, marginTop: 4 }}>No sport with 5+ graded wins and a positive ROI yet.</div>}
        <a href={profileUrl(props.wallet)} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 16, color: BRAND, fontWeight: 800, textDecoration: "none" }}>Open on Polymarket ↗</a>
      </div>
    </div>
  );
}

function titleTeamsOf(title: string): string[] {
  return matchupTeams(title || "");
}
function otherTeamLabel(known: string, teams: string[], nick?: boolean): string | null {
  if (!known || teams.length < 2) return null;
  const hit = teams.find((t: string) => namesOverlap(known, t));
  const rest = teams.filter((t: string) => t !== hit);
  if (!rest.length) return null;
  const other = rest[0];
  if (nick && hit) {
    const hp = hit.split(" "), op = other.split(" "), knownLast = (known.split(" ").pop() || "");
    if (hp.length >= 2 && op.length >= 2 && hp[hp.length - 1].toLowerCase() === knownLast.toLowerCase()) return op[op.length - 1];
  }
  return other;
}
function willWinTeamOf(q: string, contract: string, lab: string): string | null {
  const m = (q || "").match(/^Will (.+?) win\b/i);
  if (m) return m[1].trim();
  const m2 = (lab || "").match(/^(.+?)\s+(?:NOT TO WIN|to win|not to win|WIN)\s*$/i);
  if (m2) return m2[1].trim();
  if (contract && !/^(tie|draw)$|over|under|wins? by over/i.test(contract)) return contract.trim();
  return null;
}
function marketSideLabels(m: ComingMarket, gameTitle: string): { yes: string; no: string } {
  const yesS = (m.sides || []).find((s: ComingSide) => s.side === "yes");
  const noS = (m.sides || []).find((s: ComingSide) => s.side === "no");
  const q = m.q || "";
  const kind = m.kind || "";
  const contract = (yesS && yesS.contract) || (noS && noS.contract) || "";
  let yesLab = (yesS && yesS.label) || "";
  let noLab = (noS && noS.label) || "";
  const teams = titleTeamsOf(gameTitle) || matchupTeams(q);
  if (kind === "draw" || /\bend in a (?:tie|draw)\b/i.test(q) || /^(tie|draw)$/i.test(contract) || /^draw$/i.test(yesLab) || /no\s*draw/i.test(noLab)) {
    return { yes: "DRAW", no: "NO DRAW" };
  }
  const team = willWinTeamOf(q, contract, yesLab || noLab);
  if ((kind === "teamwin" || /^Will .+ win\b/i.test(q) || /(?:NOT TO WIN|not to win|\bWIN|\bto win)\s*$/i.test(yesLab || noLab)) && team && (kind === "teamwin" || /^Will .+ win\b/i.test(q) || /NOT TO WIN|not to win/i.test(yesLab || noLab))) {
    return { yes: team + " to win", no: team + " not to win" };
  }
  const isSpread = kind === "spread" || /^Spread:/i.test(q) || /wins? by over/i.test(contract) || (/[+-][\d.]+/.test((yesLab || "") + " " + (noLab || "")) && !/\bO\/?U\s+/i.test(q));
  if (isSpread) {
    let yes = /wins? by over/i.test(contract) ? contract.trim() : "";
    const sm = q.match(/^Spread:\s*(.+?)\s*\((-?[\d.]+)\)/i);
    let fav = sm ? sm[1].trim() : "";
    let line = sm ? Math.abs(parseFloat(sm[2])) : NaN;
    if (!(line >= 0)) {
      const mLine = contract.match(/wins? by over\s+([\d.]+)/i) || (noLab || yesLab || "").match(/([+-])([\d.]+)/);
      if (mLine) line = Math.abs(parseFloat(mLine[2] || mLine[1]));
    }
    if (!fav) {
      const mFav = (noLab || yesLab || "").match(/^(.+?)\s+[+-][\d.]+/);
      if (mFav) fav = mFav[1].trim();
    }
    const dog = fav ? otherTeamLabel(fav, teams, true) : null;
    const lineStr = line >= 0 ? String(line).replace(/\\.0$/, "") : "";
    if (!yes && fav && line >= 0) {
      const favFull = teams.find((t: string) => namesOverlap(fav, t)) || fav;
      yes = favFull + " wins by over " + lineStr;
    }
    const no = dog && line >= 0 ? dog + " +" + lineStr : "";
    if (yes && no) return { yes, no };
    if (yes) return { yes, no: no || (fav && line >= 0 ? fav + " +" + lineStr : "Under the spread") };
    if (no && fav && line >= 0) return { yes: fav + " -" + lineStr, no };
  }
  if (kind === "total" || /\bO\/?U\s+[\d.]+/i.test(q) || /^(?:Over|Under)\s+[\d.]+/i.test(contract) || /^over$/i.test(yesLab) || /^under$/i.test(noLab)) {
    const lm = q.match(/O\/?U\s+([\d.]+)/i) || (contract || "").match(/^(?:Over|Under)\s+([\d.]+)/i);
    if (lm) return { yes: "Over " + lm[1], no: "Under " + lm[1] };
    return { yes: "Over", no: "Under" };
  }
  if (yesLab && noLab && !/or better for the other side|^Other side$/i.test(yesLab + " " + noLab)) return { yes: yesLab, no: noLab };
  const known = yesLab || noLab;
  if (known && teams.length >= 2 && (kind === "moneyline" || kind === "teamwin" || kind === "other" || kind === "") && !/draw|over|under|not to win|[+-][\d.]+/i.test(known)) {
    const other = otherTeamLabel(known, teams, false);
    if (other) return { yes: yesLab || (noLab ? other : known), no: noLab || (yesLab ? other : known) };
  }
  if (known) {
    let flipped = "Not " + known;
    if (/\bover\b/i.test(known)) flipped = known.replace(/\bover\b/i, "Under");
    else if (/\bunder\b/i.test(known)) flipped = known.replace(/\bunder\b/i, "Over");
    else if (/no\s*draw/i.test(known)) flipped = "DRAW";
    else if (/^draw$/i.test(known)) flipped = "NO DRAW";
    return { yes: yesLab || flipped, no: noLab || flipped };
  }
  return { yes: yesLab || "Yes", no: noLab || "No" };
}

function flipAct(act?: string | null): string | null {
  const a = (act || "").toUpperCase();
  if (a.endsWith("NO")) return "BUY YES";
  if (a.endsWith("YES")) return "BUY NO";
  return null;
}
function isBinaryKMarket(kind?: string, contract?: string | null, q?: string | null): boolean {
  const k = (kind || "").toLowerCase();
  if (k === "spread" || k === "total" || k === "draw" || k === "teamwin" || k === "prop") return true;
  const t = ((contract || "") + " " + (q || "")).toLowerCase();
  return /wins?\s+by\s+over|\bo\/?u\s+|end in a (?:tie|draw)|\b(?:over|under)\s+[\d.]+|^(?:tie|draw)$/.test(t);
}
function completeComingSides(sides: ComingSide[], kind: string, gameTitle: string, q?: string): ComingSide[] {
  const list = (sides || []).slice();
  if (list.length < 2) return list.map(applyResolvedSide);
  const src = list.find((s: ComingSide) => !!(s.ticker && s.action)) || list.find((s: ComingSide) => !!(s.contract || s.action));
  if (!src) return list.map(applyResolvedSide);
  const binary = isBinaryKMarket(kind, src.contract, q);
  const title = src.marketTitle || (!binary && gameTitle && /\svs\.?\s/i.test(gameTitle) ? gameTitle + " winner" : "") || src.contract || "";
  return list.map((s: ComingSide) => {
    if (s.ticker && s.action) {
      return s.marketTitle ? s : { ...s, marketTitle: title || s.marketTitle };
    }
    if (!binary && (src.oppTicker || src.oppContract || src.oppAction)) {
      const act = src.oppAction || "BUY YES";
      const px = src.oppPrice != null ? src.oppPrice : (s.kPrice != null ? s.kPrice : null);
      return { ...s, ticker: src.oppTicker || s.ticker, contract: src.oppContract || s.contract || s.label, action: act, kPrice: px, marketTitle: title || s.marketTitle || null };
    }
    const act = s.action || flipAct(src.action) || (s.side === "no" ? "BUY NO" : "BUY YES");
    let px = s.kPrice;
    if (px == null && act) {
      if (act.toUpperCase().endsWith("NO") && src.noAsk != null) px = src.noAsk;
      else if (act.toUpperCase().endsWith("YES") && src.yesAsk != null) px = src.yesAsk;
    }
    return { ...s, ticker: s.ticker || src.ticker, contract: s.contract || src.contract, action: act, kPrice: px, marketTitle: s.marketTitle || title || null, yesAsk: s.yesAsk != null ? s.yesAsk : src.yesAsk, noAsk: s.noAsk != null ? s.noAsk : src.noAsk };
  }).map(applyResolvedSide);
}
function kalshiActionWords(act?: string | null): string {
  const a = (act || "").toUpperCase().trim();
  if (a.endsWith("NO")) return "Buy NO";
  if (a.endsWith("YES")) return "Buy YES";
  return (act || "").replace(/^BUY\s+/i, "Buy ") || "Buy YES/NO";
}
function kalshiHowLine(side: ComingSide): string {
  const act = kalshiActionWords(side.action);
  const price = side.kPrice != null ? cents(side.kPrice) : "price not loaded";
  const contract = (side.contract || "").trim();
  const market = ((side.marketTitle || "").trim()) || contract;
  if (contract && market && market.toLowerCase() !== contract.toLowerCase() && /winner/i.test(market)) {
    return "Kalshi: " + market + " · " + contract + " · " + act + " · " + price;
  }
  const looksLikeTeam = !!(contract && market && market.toLowerCase() !== contract.toLowerCase() && !/wins\s+by|over\s+[\d.]|under\s+[\d.]|draw/i.test(contract) && contract.length < 40);
  if (looksLikeTeam && market) return "Kalshi: " + market + " · " + contract + " · " + act + " · " + price;
  if (market) return "Kalshi: " + market + " · " + act + " · " + price;
  if (side.action) return "Kalshi: " + act + " · " + price;
  return "Kalshi: market not matched · " + act + " · price not loaded";
}
function comingSideRoi(side: ComingSide): number {
  const vals = (side.backers || []).map(comingRoiOf).filter((x): x is number => x != null);
  if (!vals.length) return -999;
  return vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
}
function pickSideId(sides: ComingSide[]): string | null {
  const scored = (sides || []).slice(0, 2).filter((s: ComingSide) => (s.cappers || 0) > 0);
  if (!scored.length) return null;
  scored.sort((a: ComingSide, b: ComingSide) => ((b.cappers || 0) - (a.cappers || 0)) || (comingSideRoi(b) - comingSideRoi(a)));
  return scored[0].id;
}
function SideTag(props: { pick: boolean }) {
  const color = props.pick ? GREEN : "#6B7280";
  return (
    <span style={{ display: "inline-block", fontSize: 10, fontWeight: 850, letterSpacing: "0.08em", lineHeight: "14px", padding: "2px 7px", borderRadius: 6, border: "1.5px solid " + color, color: color, background: "transparent", marginBottom: 6 }}>{props.pick ? "PICK" : "OPPOSITE"}</span>
  );
}

function relabelMarketSides(m: ComingMarket, gameTitle: string): ComingMarket {
  const pair = marketSideLabels(m, gameTitle);
  const relabeled = (m.sides || []).map((s: ComingSide) => {
    const next = s.side === "yes" ? pair.yes : s.side === "no" ? pair.no : s.label;
    return next && next !== s.label ? { ...s, label: next } : s;
  });
  return { ...m, sides: completeComingSides(relabeled, m.kind || "", gameTitle, m.q) };
}

function SidesGameCard(props: { g: ComingGame; now: number; rank?: number; suggested?: boolean; selectedSideId?: string; onSelectSide?: (g: ComingGame, s: ComingSide) => void; onCapper: (wallet: string) => void }) {
  const t = useGrokTheme();
  const g = props.g;
  const on = !!props.selectedSideId;
  const live = comingIsLive(g, props.now);
  const liveIn = until(g.startTs, props.now, g.start);
  return (
    <div data-coming-game={g.id} data-coming-selected={on ? "1" : "0"} data-coming-live={live ? "1" : "0"} style={{ borderRadius: 20, border: on ? "2px solid " + BRAND : "1.5px solid " + (live ? "#FECACA" : t.border.default), background: t.bg.base, boxShadow: on ? "0 8px 22px rgba(124,58,237,0.18)" : live ? "0 8px 22px rgba(220,38,38,0.14)" : "0 6px 18px rgba(76,29,149,0.10)", overflow: "hidden", marginBottom: 14, fontFamily: t.font.family }}>
      <div style={{ height: 6, background: live ? "linear-gradient(90deg,#DC2626,#F97316)" : "linear-gradient(90deg," + BRAND + "," + BRAND2 + ")" }} />
      <div style={{ padding: 14 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {props.rank != null ? <Chip bg={BRAND} color="#FFFFFF">#{props.rank}</Chip> : null}
          {live ? <Chip bg={RED} color="#FFFFFF">LIVE</Chip> : null}
          <Chip bg={BRAND} color="#FFFFFF">{g.league}</Chip>
          <Chip bg={t.bg.subtle} color={t.text.primary}>{g.start || ptTime(g.startTs)}</Chip>
          {live ? null : <Chip bg={t.bg.subtle} color={t.text.secondary}>{liveIn.replace("starts in ", "in ")}</Chip>}
          <Chip bg={(g.capperCount || 0) >= 2 ? GREEN : AMBER} color="#FFFFFF">{comingCaps(g.capperCount || 0)}</Chip>
          {g.capperRoi != null ? <Chip bg={t.bg.subtle} color={g.capperRoi >= 0 ? GREEN : RED}>{pct(g.capperRoi)} ROI</Chip> : null}
          {props.suggested ? <Chip bg={GREEN} color="#FFFFFF">Suggested</Chip> : null}
        </div>
        <div style={{ fontSize: 20, lineHeight: "25px", fontWeight: 850, marginTop: 8, overflowWrap: "anywhere" }}>{g.game}</div>
        <KalshiGameLines game={g} onPick={props.onSelectSide ? (marketId: string, sideId: string) => { const s = findComingSide(g, sideId); if (s) props.onSelectSide!(g, s); } : undefined} selectedId={props.selectedSideId || null} />
        {(g.markets || []).map((raw: ComingMarket, mi: number) => {
          const m = relabelMarketSides(raw, g.game || "");
          const shown = (m.sides || []).slice(0, 2);
          const leadId = pickSideId(shown);
          return (
          <div key={m.id || mi} style={{ marginTop: 12 }}>
            {m.kind && m.kind !== "moneyline" && m.kind !== "teamwin" && m.kind !== "draw" ? <div style={{ fontSize: 12, fontWeight: 800, color: t.text.tertiary, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>{kindWord(m.kind)}</div> : null}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
              {shown.map((side: ComingSide) => {
                const sel = props.selectedSideId === side.id;
                const stale = !!(side.lastTs && props.now - side.lastTs > STALE_SECS);
                const clickable = !!props.onSelectSide && side.kPrice != null;
                const isPick = !!(leadId && side.id === leadId);
                return (
                  <div key={side.id} data-coming-side={side.id} onClick={clickable ? () => props.onSelectSide && props.onSelectSide(g, side) : undefined} style={{ borderRadius: 14, border: sel ? "2px solid " + BRAND : isPick ? "1.5px solid " + GREEN : "1.5px solid " + t.border.default, background: sel ? "#F5F0FF" : isPick ? "#ECFDF3" : t.bg.subtle, padding: 10, cursor: clickable ? "pointer" : "default", minWidth: 0, boxShadow: sel ? "0 4px 12px rgba(124,58,237,0.16)" : "none" }}>
                    <div><SideTag pick={isPick} /></div>
                    <div style={{ fontSize: 15, fontWeight: 850, lineHeight: "20px", overflowWrap: "anywhere" }}>{side.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 850, marginTop: 8, color: side.cappers ? t.text.primary : t.text.tertiary }}>{comingCaps(side.cappers || 0)}</div>
                    {side.cappers ? <div style={{ marginTop: 4 }}><BetAmt n={side.usd} /></div> : null}
                    {slipWords(side.slip, side.avgEntry) ? <div style={{ fontSize: 12, fontWeight: 700, marginTop: 3, color: t.text.tertiary }}>{slipWords(side.slip, side.avgEntry)}</div> : null}
                    {stale ? <div style={{ marginTop: 6 }}><Chip bg={AMBER} color="#FFFFFF">Stale</Chip></div> : null}
                    {sel ? <div style={{ marginTop: 6 }}><Chip bg={BRAND} color="#FFFFFF">In parlay</Chip></div> : null}
                    <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
                      {(side.backers || []).length ? (side.backers || []).map((b: ComingBacker, i: number) => {
                        const roi = comingRoiOf(b);
                        return (
                          <button key={(b.wallet || b.name) + i} type="button" onClick={() => b.wallet && props.onCapper(b.wallet)} style={{ display: "block", width: "100%", textAlign: "left", border: "none", background: "transparent", padding: "3px 0", cursor: b.wallet ? "pointer" : "default", fontFamily: "inherit" }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: BRAND, overflowWrap: "anywhere" }}>{nameOf(b.name, b.wallet || "")}</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: roi == null ? t.text.tertiary : roi >= 0 ? GREEN : RED }}>{"  " + (roi != null ? pct(roi) + " ROI" : "n/a")}</span>
                            {comingSportLine(b) ? <div style={{ fontSize: 11, color: t.text.tertiary }}>{comingSportLine(b)}</div> : null}
                          </button>
                        );
                      }) : <div style={{ fontSize: 12, color: t.text.tertiary }}>No hot cappers on this side</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

function ComingGroups(props: { games: ComingGame[]; now: number; keyPrefix: string; onCapper: (wallet: string) => void; suggested?: { gameId: string; sideId: string }[]; selSideOf?: (g: ComingGame) => string; onSelectSide?: (g: ComingGame, s: ComingSide) => void; limit?: number; onMore?: () => void; leftover?: number }) {
  const t = useGrokTheme();
  const parts = partitionComing(props.games, props.now);
  const limit = props.limit;
  const live = parts.live;
  const upcoming = limit == null ? parts.upcoming : parts.upcoming.slice(0, Math.max(0, limit - live.length));
  const leftover = props.leftover != null ? props.leftover : (limit == null ? 0 : Math.max(0, parts.upcoming.length - upcoming.length));
  const rankOf = (arr: ComingGame[], i: number, extra: number) => extra + i + 1;
  const card = (g: ComingGame, rank: number) => (
    <SidesGameCard key={props.keyPrefix + g.id} g={g} now={props.now} rank={rank} suggested={!!(props.suggested && props.suggested.some((x) => x.gameId === g.id))} selectedSideId={props.selSideOf ? props.selSideOf(g) : undefined} onSelectSide={props.onSelectSide} onCapper={props.onCapper} />
  );
  if (!live.length && !upcoming.length) return null;
  return (
    <div>
      {live.length ? (
        <div data-live-now="1" style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0 10px", background: "linear-gradient(90deg,#FEE2E2,#FFEDD5)", borderRadius: 14, padding: "8px 12px" }}>
            <Chip bg={RED} color="#FFFFFF">LIVE</Chip>
            <div style={{ fontSize: 16, fontWeight: 850, color: RED }}>{"Live now · " + live.length}</div>
          </div>
          <div style={{ fontSize: 12, lineHeight: "16px", color: t.text.tertiary, margin: "-2px 0 10px" }}>Prices are from the last scan and may have moved in-game.</div>
          {live.map((g: ComingGame, i: number) => card(g, rankOf(live, i, 0)))}
        </div>
      ) : null}
      {upcoming.length && live.length ? <div style={{ fontSize: 16, fontWeight: 850, color: t.text.primary, margin: "12px 0 10px" }}>{"Coming up · " + parts.upcoming.length}</div> : null}
      {upcoming.map((g: ComingGame, i: number) => card(g, rankOf(upcoming, i, live.length)))}
      {leftover > 0 && props.onMore ? <Button label={"Show more (" + leftover + " left)"} onClick={props.onMore} /> : null}
    </div>
  );
}

function parlayCombined(prices: number[]): number | null {
  if (!prices.length) return null;
  return prices.reduce((a: number, p: number) => a * p, 1);
}
function comingGameKey(g: ComingGame): string {
  const id = evKey(g.id);
  if (id) return id;
  return (g.league || "") + "|" + (g.startTs || 0) + "|" + (g.game || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function mergeBackerLists(a: ComingBacker[], b: ComingBacker[]): ComingBacker[] {
  const seen: Record<string, ComingBacker> = {};
  (a || []).concat(b || []).forEach((x: ComingBacker) => {
    const w = (x.wallet || x.name || "").toLowerCase();
    if (!w) return;
    const prev = seen[w];
    if (!prev || (x.cost || 0) > (prev.cost || 0)) seen[w] = prev ? { ...prev, ...x, cost: Math.max(prev.cost || 0, x.cost || 0) } : x;
  });
  return Object.keys(seen).map((k: string) => seen[k]);
}
function mergeComingSides(a: ComingSide, b: ComingSide): ComingSide {
  const backers = mergeBackerLists(a.backers || [], b.backers || []);
  const usd = backers.reduce((s: number, x: ComingBacker) => s + (x.cost || 0), 0);
  const inv = backers.reduce((s: number, x: ComingBacker) => s + (x.cost || 0) * (x.avg || 0), 0);
  const avg = usd && inv ? inv / usd : (a.avgEntry != null ? a.avgEntry : b.avgEntry);
  const kPrice = a.kPrice != null ? a.kPrice : b.kPrice;
  return {
    ...a, ...b,
    label: a.label && a.label !== "Other side" ? a.label : b.label,
    kPrice,
    action: a.action || b.action,
    contract: a.contract || b.contract,
    ticker: a.ticker || b.ticker,
    marketTitle: a.marketTitle || b.marketTitle,
    avgEntry: avg,
    slip: slipCents(kPrice, avg),
    backers,
    cappers: backers.length,
    usd: Math.round(usd),
    names: backers.map((x: ComingBacker) => x.name),
    lastTs: Math.max(a.lastTs || 0, b.lastTs || 0) || null,
  };
}
function sideMergeKey(s: ComingSide): string {
  if (s.ticker && (s.action || s.side)) return (s.ticker + "|" + (s.action || s.side || "")).toLowerCase();
  return ((s.id || "") + "|" + (s.side || "") + "|" + (s.label || "")).toLowerCase();
}
function mergeComingGames(lists: ComingGame[][]): ComingGame[] {
  const by: Record<string, ComingGame> = {};
  lists.forEach((list: ComingGame[]) => {
    (list || []).forEach((g: ComingGame) => {
      const k = comingGameKey(g);
      const cur = by[k];
      if (!cur) { by[k] = { ...g, markets: (g.markets || []).slice() }; return; }
      const markets = (cur.markets || []).slice();
      (g.markets || []).forEach((m: ComingMarket) => {
        const idx = markets.findIndex((x: ComingMarket) => x.id === m.id || ((x.kind || "") === (m.kind || "") && (x.q || "") === (m.q || "")));
        if (idx < 0) { markets.push(m); return; }
        const prev = markets[idx];
        const sides = (prev.sides || []).slice();
        (m.sides || []).forEach((s: ComingSide) => {
          const si = sides.findIndex((x: ComingSide) => x.id === s.id || sideMergeKey(x) === sideMergeKey(s) || !!(x.label && s.label && x.label.toLowerCase() === s.label.toLowerCase()));
          if (si < 0) sides.push(s);
          else sides[si] = mergeComingSides(sides[si], s);
        });
        markets[idx] = { ...prev, kind: prev.kind || m.kind, q: prev.q || m.q, sides };
      });
      by[k] = fillGameStats({
        ...cur,
        game: (cur.game && cur.game.length >= (g.game || "").length) ? cur.game : (g.game || cur.game),
        start: cur.start || g.start,
        startTs: cur.startTs || g.startTs,
        league: cur.league || g.league,
        markets,
      });
    });
  });
  return Object.keys(by).map((k: string) => fillGameStats(by[k]));
}
function openSlateGames(eliteOnly: boolean): ComingGame[] {
  const coming = asComingGames((DATA.comingUp || []) as ComingGame[]);
  if (!eliteOnly) return coming.filter((g: ComingGame) => (g.capperCount || 0) > 0);
  const proven = provenToGameCards(((PROVEN && PROVEN.picks) || []) as ProvenRow[]);
  return mergeComingGames([coming, proven]).filter((g: ComingGame) => (g.capperCount || 0) > 0);
}
interface ComboLeg { game: ComingGame; market: ComingMarket; side: ComingSide; eliteN: number; provenN: number; bestRoi: number }
interface ComboPick { legs: ComboLeg[]; combined: number }
function comboLegEligible(g: ComingGame, s: ComingSide, now: number): boolean {
  if (comingStatus(g, now) !== "upcoming") return false;
  if (s.kPrice == null || s.kPrice < 0.20 || s.kPrice > 0.90) return false;
  if (s.slip != null && s.slip >= SLIP_CAP_CENTS) return false;
  if (s.lastTs && now - s.lastTs > STALE_SECS) return false;
  return true;
}
function suggestCombos(games: ComingGame[], now: number, eliteOnly: boolean, want = 3): ComboPick[] {
  const legs: ComboLeg[] = [];
  games.forEach((g: ComingGame) => {
    if (comingStatus(g, now) === "final") return;
    const cands: ComboLeg[] = [];
    (g.markets || []).forEach((m: ComingMarket) => {
      const rel = relabelMarketSides(m, g.game || "");
      (rel.sides || []).forEach((s: ComingSide) => {
        const backs = (s.backers || []).filter((b: ComingBacker) => eliteOnly ? isEliteBacker(b) : true);
        if (!backs.length || !comboLegEligible(g, s, now)) return;
        cands.push({
          game: g,
          market: rel,
          side: s,
          eliteN: (s.backers || []).filter(isEliteBacker).length,
          provenN: backs.length,
          bestRoi: Math.max(-999, ...backs.map((b: ComingBacker) => bigBetRoiOf(b.wallet, comingRoiOf(b)))),
        });
      });
    });
    if (!cands.length) return;
    cands.sort((a: ComboLeg, b: ComboLeg) => (b.eliteN - a.eliteN) || (b.provenN - a.provenN) || (b.bestRoi - a.bestRoi) || ((a.side.slip == null ? 999 : a.side.slip) - (b.side.slip == null ? 999 : b.side.slip)) || ((b.side.kPrice || 0) - (a.side.kPrice || 0)));
    legs.push(cands[0]);
  });
  legs.sort((a: ComboLeg, b: ComboLeg) => (b.eliteN - a.eliteN) || (b.provenN - a.provenN) || (b.bestRoi - a.bestRoi) || ((a.side.slip == null ? 999 : a.side.slip) - (b.side.slip == null ? 999 : b.side.slip)));
  const combos: ComboPick[] = [];
  const used: Record<string, boolean> = {};
  const pool = legs.slice();
  while (pool.length >= 1 && combos.length < want) {
    const a = pool.shift() as ComboLeg;
    if (used[a.game.id]) continue;
    const j = pool.findIndex((b: ComboLeg) => b.game.id !== a.game.id && !used[b.game.id]);
    if (j < 0) continue;
    const b = pool.splice(j, 1)[0];
    const combined = parlayCombined([a.side.kPrice as number, b.side.kPrice as number]);
    if (combined == null) continue;
    used[a.game.id] = true;
    used[b.game.id] = true;
    combos.push({ legs: [a, b], combined });
  }
  if (combos.length < Math.min(2, want) && legs.length >= 2) {
    for (let i = 0; i < legs.length && combos.length < want; i++) {
      for (let j = i + 1; j < legs.length && combos.length < want; j++) {
        if (legs[i].game.id === legs[j].game.id) continue;
        const ids2 = [legs[i].side.id, legs[j].side.id].slice().sort().join("|");
        const same = combos.some((c: ComboPick) => c.legs.map((l: ComboLeg) => l.side.id).slice().sort().join("|") === ids2);
        if (same) continue;
        const combined = parlayCombined([legs[i].side.kPrice as number, legs[j].side.kPrice as number]);
        if (combined == null) continue;
        combos.push({ legs: [legs[i], legs[j]], combined });
      }
    }
  }
  return combos.slice(0, want);
}
interface CapperPickRow { wallet: string; name: string; cost: number; game: ComingGame; market: ComingMarket; side: ComingSide; bothSides: boolean }
function capperPicksFromGames(games: ComingGame[], pred: (b: ComingBacker) => boolean): CapperPickRow[] {
  const out: CapperPickRow[] = [];
  games.forEach((g: ComingGame) => {
    (g.markets || []).forEach((m: ComingMarket) => {
      const rel = relabelMarketSides(m, g.game || "");
      const bothSides = (rel.sides || []).filter((s: ComingSide) => (s.backers || []).some(pred)).length >= 2;
      (rel.sides || []).forEach((s: ComingSide) => {
        (s.backers || []).forEach((b: ComingBacker) => {
          if (!pred(b) || !b.wallet) return;
          out.push({ wallet: (b.wallet || "").toLowerCase(), name: nameOf(b.name, b.wallet || ""), cost: b.cost || 0, game: g, market: rel, side: s, bothSides });
        });
      });
    });
  });
  const seen: Record<string, CapperPickRow> = {};
  out.forEach((r: CapperPickRow) => {
    const k = r.wallet + "|" + r.side.id;
    if (!seen[k] || r.cost > seen[k].cost) seen[k] = r;
  });
  return Object.keys(seen).map((k: string) => seen[k]);
}
interface CapperGroup { wallet: string; name: string; rec: CapperRec | undefined; bigRoi: number | null; picks: CapperPickRow[]; hasLive: boolean; nextTs: number }
function groupCapperPicks(rows: CapperPickRow[], now: number): CapperGroup[] {
  const by: Record<string, CapperPickRow[]> = {};
  rows.forEach((r: CapperPickRow) => { (by[r.wallet] = by[r.wallet] || []).push(r); });
  const statusRank = (g: ComingGame) => { const s = comingStatus(g, now); return s === "live" ? 0 : s === "upcoming" ? 1 : 2; };
  return Object.keys(by).map((w: string) => {
    const picks = by[w].filter((p: CapperPickRow) => comingStatus(p.game, now) !== "final").slice().sort((a: CapperPickRow, b: CapperPickRow) => {
      if (statusRank(a.game) !== statusRank(b.game)) return statusRank(a.game) - statusRank(b.game);
      return (a.game.startTs || 0) - (b.game.startTs || 0);
    });
    const rec = QMAP[w];
    const bigRoi = rec && rec.big && rec.big.roi != null ? rec.big.roi : (rec && rec.roi != null ? rec.roi : null);
    return {
      wallet: w,
      name: rec ? nameOf(rec.name, rec.wallet) : (picks[0] ? picks[0].name : shortWallet(w)),
      rec,
      bigRoi,
      picks,
      hasLive: picks.some((p: CapperPickRow) => comingStatus(p.game, now) === "live"),
      nextTs: picks.length ? Math.min(...picks.map((p: CapperPickRow) => p.game.startTs || 9e15)) : 9e15,
    };
  }).filter((g: CapperGroup) => g.picks.length).sort((a: CapperGroup, b: CapperGroup) => {
    if (a.hasLive !== b.hasLive) return a.hasLive ? -1 : 1;
    if (a.nextTs !== b.nextTs) return a.nextTs - b.nextTs;
    return (b.bigRoi || -999) - (a.bigRoi || -999);
  });
}
function bundleCapperGames(picks: CapperPickRow[]): { game: ComingGame; picks: CapperPickRow[] }[] {
  const order: string[] = [];
  const by: Record<string, CapperPickRow[]> = {};
  picks.forEach((p: CapperPickRow) => {
    if (!by[p.game.id]) { order.push(p.game.id); by[p.game.id] = []; }
    by[p.game.id].push(p);
  });
  return order.map((id: string) => ({ game: by[id][0].game, picks: by[id] }));
}
function eliteTabCount(now: number): number {
  const games = openSlateGames(true).filter((g: ComingGame) => comingStatus(g, now) !== "final");
  return groupCapperPicks(capperPicksFromGames(games, isEliteBacker), now).length;
}
function findComingSide(g: ComingGame, sideId: string): ComingSide | null {
  let hit: ComingSide | null = null;
  (g.markets || []).forEach((m: ComingMarket) => (m.sides || []).forEach((s: ComingSide) => { if (s.id === sideId) hit = s; }));
  return hit;
}

function CapperSlateTab(props: { now: number; mode: "elite" | "coming" }) {
  const t = useGrokTheme();
  const eliteOnly = props.mode === "elite";
  const allGames = openSlateGames(eliteOnly).filter((g: ComingGame) => comingStatus(g, props.now) !== "final");
  const pred = eliteOnly ? isEliteBacker : ((b: ComingBacker) => !!b.wallet);
  const groups = groupCapperPicks(capperPicksFromGames(allGames, pred), props.now);
  const liveN = groups.filter((g: CapperGroup) => g.hasLive).length;
  const pickN = groups.reduce((n: number, g: CapperGroup) => n + g.picks.length, 0);
  const gamesN = (() => { const s: Record<string, boolean> = {}; groups.forEach((g: CapperGroup) => g.picks.forEach((p: CapperPickRow) => { s[p.game.id] = true; })); return Object.keys(s).length; })();
  const combos = suggestCombos(allGames, props.now, eliteOnly, 3);
  const [sel, setSel] = useState<{ gameId: string; sideId: string }[]>([]);
  const [stakeText, setStakeText] = useState<string>("2");
  const [profile, setProfile] = useState<string>("");
  const byId: Record<string, ComingGame> = {};
  const sideOf: Record<string, ComingSide> = {};
  allGames.forEach((g: ComingGame) => {
    byId[g.id] = g;
    (g.markets || []).forEach((m: ComingMarket) => (m.sides || []).forEach((s: ComingSide) => { sideOf[s.id] = s; }));
  });
  const toggleSide = (g: ComingGame, s: ComingSide) => {
    if (sel.some((x) => x.sideId === s.id)) { setSel(sel.filter((x) => x.sideId !== s.id)); return; }
    const withoutGame = sel.filter((x) => x.gameId !== g.id);
    if (withoutGame.length >= 3) return;
    setSel(withoutGame.concat([{ gameId: g.id, sideId: s.id }]));
  };
  const onKalshiPick = (g: ComingGame, _marketId: string, sideId: string) => {
    const s = findComingSide(g, sideId);
    if (s) toggleSide(g, s);
  };
  const stake = Math.max(0, Number(stakeText) || 0);
  const selectedSides: { g: ComingGame; s: ComingSide }[] = [];
  sel.forEach((x) => { if (byId[x.gameId] && sideOf[x.sideId]) selectedSides.push({ g: byId[x.gameId], s: sideOf[x.sideId] }); });
  const prices = selectedSides.map((x) => x.s.kPrice).filter((p: number | null): p is number => p != null && p > 0);
  const combined = prices.length === selectedSides.length && selectedSides.length >= 1 ? parlayCombined(prices) : null;
  const payout = combined && stake > 0 && combined > 0 ? stake / combined : null;
  const stakeLabel = "$" + (stake % 1 ? stake.toFixed(2) : String(stake));
  let parlayLine = "No legs yet";
  if (selectedSides.length === 1) parlayLine = "Add 1 or 2 more legs";
  else if (selectedSides.length >= 2 && combined != null) parlayLine = selectedSides.length + "-leg · " + cents(combined) + (payout != null ? " · " + stakeLabel + " pays $" + payout.toFixed(2) + " if all hit" : "");
  else if (selectedSides.length >= 2) parlayLine = "Need a Kalshi price on every leg";
  const useCombo = (c: ComboPick) => setSel(c.legs.map((l: ComboLeg) => ({ gameId: l.game.id, sideId: l.side.id })));
  const heading = eliteOnly
    ? ("Elite · " + groups.length)
    : ("Coming Up · " + gamesN);
  const caption = eliteOnly
    ? ("Today's picks from elite cappers, grouped by capper · live first · 2–3 ready $2 combos when they clear the bar" + (liveN ? " · " + liveN + " live" : ""))
    : ("Today's picks from proven-floor cappers (60+ day accounts, 30+ big bets, +5% big-bet ROI, $10k+ big-bet profit), grouped by capper · live first, then start time" + (liveN ? " · " + liveN + " live" : ""));
  const blurb = eliteOnly
    ? "Each elite capper's live and upcoming bets, with the Polymarket size and the Kalshi line to submit. When a game has more than one Kalshi contract (winner vs spread), the one to submit is marked BEST BET — most elite backing, then the smallest slip vs their entry, then the higher win probability. Ready-made two-leg $2 combos use Kalshi prices, skip stale or 2¢+ slip legs, and stay on different games. Tap a line to add it to the parlay builder (one leg per game)."
    : "Each proven-floor capper's live and upcoming bets, with the Polymarket size and the Kalshi line to submit. PICK and OPPOSITE stay on a game when both sides are backed. When a game has more than one Kalshi contract (winner vs spread), the one to submit is marked BEST BET. Ready-made two-leg $2 combos prefer more proven backing and a better big-bet ROI, and they skip stale or 2¢+ slip legs. Tap a line to add it to the parlay builder (one leg per game). This is a lean view — not a GOOD or OK verdict.";
  const emptyTitle = eliteOnly ? "No elite picks right now" : "No proven-capper games yet";
  const emptyBody = (eliteOnly
    ? "No live or upcoming sports bets from elite cappers right now. Live games stay until they finish — "
    : "Nothing live or upcoming from proven-floor cappers right now. Live games stay until they finish — ") + nextScanLabel(props.now) + ".";
  return (
    <Section heading={heading} caption={caption}>
      <Text>{blurb}</Text>
      <RecordStrip wins={journalWL().wins} losses={journalWL().losses} tiles={[{ label: eliteOnly ? "Cappers" : "Games", value: String(eliteOnly ? groups.length : gamesN) }, { label: "Picks", value: String(pickN) }, { label: "Live", value: String(liveN), color: liveN ? RED : undefined }]} />
      <div data-combo-list="1" style={{ margin: "4px 0 14px" }}>
        <div style={{ fontSize: 16, fontWeight: 850, color: t.text.primary, marginBottom: 8 }}>Suggested $2 combos</div>
        {combos.length ? combos.map((c: ComboPick, i: number) => {
          const pay = c.combined > 0 ? 2 / c.combined : null;
          return (
            <div key={c.legs.map((l: ComboLeg) => l.side.id).join("+")} data-combo={String(i + 1)} style={{ borderRadius: 18, border: "1.5px solid #86EFAC", background: "linear-gradient(180deg,#ECFDF3 0%, #FFFFFF 100%)", padding: "12px 14px", marginBottom: 10, boxShadow: "0 6px 16px rgba(22,163,74,0.10)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontSize: 15, fontWeight: 850, color: GREEN }}>Combo {i + 1} · 2-leg · $2</div>
                <button type="button" data-combo-use={String(i + 1)} onClick={() => useCombo(c)} style={{ padding: "7px 14px", borderRadius: 999, border: "none", background: GREEN, color: "#FFFFFF", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Use this combo</button>
              </div>
              {c.legs.map((l: ComboLeg, li: number) => (
                <div key={l.side.id} style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: t.text.secondary }}>{(li + 1) + ". " + l.game.league + " · " + l.game.game + " — " + l.side.label}</div>
                  <KalshiGreenBox view={resolveKalshiView(applyResolvedSide(l.side))} compact={true} />
                </div>
              ))}
              <div style={{ fontSize: 20, fontWeight: 850, marginTop: 10, fontVariantNumeric: "tabular-nums" }}>{"Combined " + cents(c.combined) + (pay != null ? " · $2 pays $" + pay.toFixed(2) + " if both hit" : "")}</div>
              <div style={{ fontSize: 12, color: t.text.tertiary, marginTop: 2 }}>Product of the current Kalshi ask prices, before fees. Actual payout may be a bit less.</div>
            </div>
          );
        }) : <div style={{ fontSize: 13, color: t.text.secondary, padding: "10px 12px", borderRadius: 14, background: t.bg.subtle }}>No 2-leg combo clears the bar right now (Kalshi price, under 2¢ slip, different upcoming games, not stale).</div>}
      </div>
      <div data-parlay-builder="1" style={{ borderRadius: 18, border: "1.5px solid " + BRAND, padding: "12px 14px", background: "linear-gradient(180deg,#F5F0FF 0%, #EDE9FE 100%)", margin: "4px 0 14px", boxShadow: "0 6px 16px rgba(124,58,237,0.10)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontSize: 16, fontWeight: 850, color: BRAND }}>Parlay builder</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: t.text.secondary }}>Stake $</span>
            <input data-parlay-stake="1" type="number" min="0.01" step="1" value={stakeText} onChange={(e) => setStakeText(e.target.value)} style={{ width: 72, height: 36, borderRadius: 10, border: "1px solid " + t.border.default, padding: "0 8px", fontSize: 16, fontWeight: 800, fontFamily: "inherit" }} />
          </div>
        </div>
        {selectedSides.length === 0 ? <div style={{ fontSize: 13, color: t.text.secondary, marginTop: 8 }}>Tap a Kalshi line below, or use a suggested combo.</div> : (
          <div style={{ marginTop: 8 }}>
            {selectedSides.map((x, i: number) => (
              <div key={x.s.id} style={{ fontSize: 14, lineHeight: "20px", fontWeight: 700, marginTop: 2 }}>{(i + 1) + ". " + x.g.game + " — " + x.s.label + (x.s.kPrice != null ? " @ " + cents(x.s.kPrice) : "")}</div>
            ))}
          </div>
        )}
        <div style={{ fontSize: 20, fontWeight: 850, marginTop: 10, fontVariantNumeric: "tabular-nums" }}>{parlayLine}</div>
        {combined != null && selectedSides.length >= 2 ? <div style={{ fontSize: 12, color: t.text.tertiary, marginTop: 2 }}>Product of the current Kalshi ask prices, before fees. Actual payout may be a bit less.</div> : null}
        {sel.length >= 3 ? <div style={{ fontSize: 12, color: AMBER, marginTop: 4, fontWeight: 700 }}>Max 3 legs. Unselect one to swap.</div> : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {sel.length ? <button type="button" onClick={() => setSel([])} style={{ padding: "8px 14px", borderRadius: 999, border: "1px solid " + t.border.default, background: t.bg.base, color: t.text.primary, fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Clear</button> : null}
        </div>
      </div>
      {groups.length === 0 ? <EmptyState title={emptyTitle} body={emptyBody} /> : groups.map((cg: CapperGroup) => {
        const rec = cg.rec;
        const big = rec && rec.big;
        const recLine = [
          big && big.n ? ((big.w || 0) + "–" + (big.l || 0) + " big") : (rec && rec.n ? (rec.w + "–" + rec.l) : ""),
          cg.bigRoi != null ? pct(cg.bigRoi) + " big-bet ROI" : "",
        ].filter(Boolean).join(" · ");
        return (
          <div key={cg.wallet} data-capper-slate={cg.wallet} style={{ borderRadius: 20, border: "1.5px solid " + t.border.default, background: t.bg.base, boxShadow: "0 6px 18px rgba(76,29,149,0.10)", overflow: "hidden", marginBottom: 16, fontFamily: t.font.family }}>
            <div style={{ height: 6, background: cg.hasLive ? "linear-gradient(90deg,#DC2626,#F97316)" : "linear-gradient(90deg," + BRAND + "," + BRAND2 + ")" }} />
            <div style={{ padding: "12px 14px 6px", display: "flex", gap: 10, alignItems: "center" }}>
              <Face name={cg.name} size={44} />
              <button type="button" onClick={() => setProfile(cg.wallet)} style={{ flex: 1, minWidth: 0, textAlign: "left", border: "none", background: "transparent", padding: 0, cursor: "pointer", fontFamily: "inherit" }}>
                <div style={{ fontSize: 18, fontWeight: 850, color: t.text.primary, overflowWrap: "anywhere" }}>{cg.name}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: (cg.bigRoi || 0) >= 0 ? GREEN : RED, marginTop: 2 }}>{recLine || "Record n/a"}</div>
              </button>
              {eliteOnly ? <Chip bg={GREEN} color="#FFFFFF">Elite</Chip> : (ELITE_W[cg.wallet] ? <Chip bg={GREEN} color="#FFFFFF">Elite</Chip> : <Chip bg={t.bg.subtle} color={t.text.primary}>Proven</Chip>)}
              <Chip bg={t.bg.subtle} color={t.text.secondary}>{cg.picks.length === 1 ? "1 pick" : cg.picks.length + " picks"}</Chip>
            </div>
            {bundleCapperGames(cg.picks).map((bundle) => {
              const g = bundle.game;
              const live = comingStatus(g, props.now) === "live";
              const selectedSide = (sel.find((x) => x.gameId === g.id) || { sideId: "" }).sideId;
              const leadSide = pickSideId((bundle.picks[0].market.sides || []).slice());
              return (
                <div key={cg.wallet + g.id} data-capper-game={g.id} style={{ padding: "4px 14px 14px", borderTop: "1px solid " + t.border.default, marginTop: 8 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginTop: 10 }}>
                    {live ? <Chip bg={RED} color="#FFFFFF">LIVE</Chip> : null}
                    <Chip bg={BRAND} color="#FFFFFF">{g.league}</Chip>
                    <Chip bg={t.bg.subtle} color={t.text.primary}>{g.start || ptTime(g.startTs)}</Chip>
                  </div>
                  <div style={{ fontSize: 18, lineHeight: "23px", fontWeight: 850, marginTop: 6, overflowWrap: "anywhere" }}>{g.game}</div>
                  {bundle.picks.map((row: CapperPickRow) => (
                    <div key={row.side.id} style={{ marginTop: 8 }}>
                      {row.bothSides ? <SideTag pick={!!(leadSide && row.side.id === leadSide)} /> : null}
                      <div style={{ fontSize: 16, fontWeight: 850, color: t.text.primary }}>{row.side.label}</div>
                      <div style={{ marginTop: 4, display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}><BetAmt n={row.cost} /><span style={{ fontSize: 13, fontWeight: 700, color: t.text.secondary }}>on Polymarket</span></div>
                      {slipWords(applyResolvedSide(row.side).slip, row.side.avgEntry) ? <div style={{ fontSize: 12, fontWeight: 700, color: t.text.tertiary, marginTop: 2 }}>{slipWords(applyResolvedSide(row.side).slip, row.side.avgEntry)}</div> : null}
                    </div>
                  ))}
                  <KalshiGameLines game={g} onPick={(marketId: string, sideId: string) => onKalshiPick(g, marketId, sideId)} selectedId={selectedSide || null} />
                </div>
              );
            })}
          </div>
        );
      })}
      {profile ? <CapperProfile wallet={profile} onClose={() => setProfile("")} /> : null}
    </Section>
  );
}
function EliteTab(props: { now: number }) {
  return <CapperSlateTab now={props.now} mode="elite" />;
}
function ComingUpTab(props: { now: number }) {
  return <CapperSlateTab now={props.now} mode="coming" />;
}

export default function App() {
  const t = useGrokTheme();
  const [tab, setTab] = useState<string>("picks");
  const [bigOnly, setBigOnly] = useState<boolean>(false);
  const [provenLimit, setProvenLimit] = useState<number>(5);
  const [rankedLimit, setRankedLimit] = useState<number>(30);
  const [rankedNoK, setRankedNoK] = useState<boolean>(false);
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
  const [tabSort, setTabSort] = useState<Record<string, string>>({});
  const sortOf = (k?: string): string => tabSort[k || tab] || ({ hot: "f14", top: "start", biggest: "size" } as Record<string, string>)[k || tab] || "best";
  const setSortOf = (v: string, k?: string) => setTabSort({ ...tabSort, [k || tab]: v });
  const [capLimit, setCapLimit] = useState<number>(25);
  const [journal, setJournal] = useState<string>("all");
  const [capN, setCapN] = useState<string>("100");
  const [capCustom, setCapCustom] = useState<string>("");
  const [saved, setSaved] = useState<string>("");
  const [now] = useState<number>(Math.floor(Date.now() / 1000));
  const [allBets, setAllBets] = useState<boolean>(false);
  const [pickProfile, setPickProfile] = useState<string>("");
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
  const floorMin = (w: string | null | undefined): number => (minP <= 500 && (ELITE_W[(w || "").toLowerCase()] || walletLongTermOk(w)) ? FLOOR_MIN_BET : minP);
  const visibleBackers = (p: Pick): Backer[] => p.backers.filter((b: Backer) => b.cost >= floorMin(b.wallet) && hidden.indexOf((b.wallet || "").toLowerCase()) < 0);
  const followOk = (p: Pick): boolean => !f.followedOnly || p.backers.some((b: Backer) => followed.indexOf((b.wallet || "").toLowerCase()) >= 0);
  // Started and ended games are dropped from Top 20, Upcoming, Fun, Polymarket, Props, Longshots and Biggest Bets. Live games stay on Bets.
  const finished = (p: Pick): boolean => (p.refresh && (p.refresh.state === "post" || !!p.refresh.final || !!p.refresh.ended)) || p.game.state === "post";
  const gone = (p: Pick): boolean => finished(p) || isStarted(p, now);
  const pickQuality = (p: Pick): number => Math.max(0, ...p.backers.map((b: Backer) => (b.golden ? 1000 : 0) - (b.rankAll || b.rank || 999)));
  const rankPicks = (arr: Pick[]): Pick[] => arr.slice().sort((a: Pick, b: Pick) => cmpRankKey(rankKey(a, visibleBackers(a).length, visibleBackers(a)), rankKey(b, visibleBackers(b).length, visibleBackers(b))));
  const bySport = (arr: Pick[]): Pick[] => sportFilter ? arr.filter((p: Pick) => p.league === sportFilter) : arr;
  const vb = (p: Pick): Backer[] => visibleBackers(p);
  const notHedged = (p: Pick): boolean => !pickHasCapperHedge(p);
  const provenRows: ProvenRow[] = sortProvenBy(mergeProvenRows(((PROVEN && PROVEN.picks) || []).filter((r: ProvenRow) => walletLongTermOk(r.wallet) && startStatus(r.startTs || 0, now, hintForComing({ id: "", game: r.game || "", league: r.league || "", startTs: r.startTs || 0, start: r.start || "", markets: [] })) !== "final" && !r.hedged && !isEliteSplitGame(r.slug) && !provenTooExpensive(r))), sortOf("proven"), now);
  // Pinned Proven section hides sub-$250 throwaway positions (still counted in the CAUTION total).
  const provenPinned: ProvenRow[] = provenRows.filter((r: ProvenRow) => r.verdict !== "CAUTION" || (r.cost || 0) >= FLOOR_MIN_BET);
  const provenComboPicks: Pick[] = provenRows.map((r: ProvenRow) => provenToPick(r)).filter((p: Pick | null): p is Pick => !!p);
  // GOOD first; fill remaining slots with the best OK Kalshi legs. Never CAUTION, no-Kalshi, hedges, or elite-split games.
  const topCandidates = uniqueMergedPicks((DATA.signals || []).concat(DATA.fun || []).concat(DATA.biggest || []).concat(DATA.upcoming || []).concat(provenComboPicks)).filter((p: Pick) => {
    const vb0 = visibleBackers(p);
    if (gone(p) || isPlayerProp(p) || !followOk(p) || !notHedged(p) || isEliteSplitGame(p.slug)) return false;
    if (!p.kalshi || p.kalshi.status !== "ok") return false;
    const info = pickInfo(p, vb0.length);
    if (info.band === "glue") return false;
    return isGoodOrOk(p, vb0);
  });
  const topAll = takeSortedTop(topCandidates, sortOf("top"), 20, vb, now);
  const top = bySport(topAll);
  const gluePool = rankPicks(uniqueMergedPicks((DATA.glue || DATA.signals || []).concat(DATA.fun || [])).filter((p: Pick) => {
    const n = visibleBackers(p).length;
    return n >= 2 && followOk(p) && !gone(p) && p.kalshi.status === "ok" && pickInfo(p, n).glue && !isPlayerProp(p) && vetted(p, visibleBackers(p)) && notHedged(p);
  }));
  // unique by id, not already in top
  const glueIds: Record<string, boolean> = {};
  top.forEach((p: Pick) => { glueIds[p.id] = true; });
  const glueAll = sortPicksBy(gluePool.filter((p: Pick) => { if (glueIds[p.id]) return false; glueIds[p.id] = true; return true; }), sortOf("top"), vb, now);
  const glue = bySport(glueAll).slice(0, 12);
  const funPool = rankPicks(uniqueMergedPicks((DATA.fun || []).concat(DATA.signals || [])).filter((p: Pick) => {
    const n = visibleBackers(p).length;
    if (n < 1 || !followOk(p) || gone(p) || p.kalshi.status !== "ok" || !notHedged(p)) return false;
    if (!vetted(p, visibleBackers(p))) return false;
    if (isPlayerProp(p) || isLongshot(p, n, now)) return false;
    if (top.some((x: Pick) => x.id === p.id)) return false;
    if (glueAll.some((x: Pick) => x.id === p.id) && n >= 2) return false; // 95¢+ 2-whale stays in Glue, not Fun
    return !topEligible(p, n, now) || n < minW;
  }));
  const funSeen: Record<string, boolean> = {};
  const funAll = sortPicksBy(funPool.filter((p: Pick) => { if (funSeen[p.id]) return false; funSeen[p.id] = true; return true; }), sortOf("longfun"), vb, now);
  const fun = bySport(funAll);
  const polyAll = rankPicks(uniqueMergedPicks(DATA.poly || []).filter((p: Pick) => visibleBackers(p).length >= 1 && vetted(p, visibleBackers(p)) && followOk(p) && !gone(p) && notHedged(p) && p.kalshi.status !== "ok" && !isPlayerProp(p) && !isLongshot(p, visibleBackers(p).length, now)));
  const polyBase = polyAll.slice(0, 20);
  const poly = bySport(polyBase);
  const uniqueByKey = (arr: Pick[]): Pick[] => uniqueMergedPicks(arr);
  const catalogPicks = uniqueByKey((DATA.props || []).concat(DATA.longshots || []).concat(DATA.biggest || []).concat(DATA.upcoming || []).concat(DATA.signals || []).concat(DATA.fun || []).concat(DATA.poly || []).concat(DATA.glue || []).concat(linesToPicks(BET_LINES))).filter(notHedged);
  const propsPool = catalogPicks.filter((p: Pick) => isPlayerProp(p) && visibleBackers(p).length >= 1 && followOk(p) && !gone(p) && notHedged(p) && !isEliteSplitGame(p.slug) && p.kalshi.status === "ok" && pickHasHighRoiBacker(p, visibleBackers(p)) && propSizeOk(p, visibleBackers(p)));
  const propsBase = takeSortedPicks(propsPool, sortOf("props"), 20, vb, now);
  const propsPicks = bySport(propsBase);
  const longPool = catalogPicks.filter((p: Pick) => isLongshot(p, visibleBackers(p).length, now) && vetted(p, visibleBackers(p)) && followOk(p) && !gone(p));
  const longBase = takeSortedPicks(longPool, sortOf("longfun"), 20, vb, now);
  const longPicks = bySport(longBase);
  const ltPick = (p: Pick): Pick => ({ ...p, backers: (p.backers || []).filter((b: Backer) => walletLongTermOk(b.wallet)) });
  const biggestPool = catalogPicks.map(ltPick).filter((p: Pick) => p.backers.length > 0).filter((p: Pick) => visibleBackers(p).length >= 1 && vetted(p, visibleBackers(p)) && followOk(p) && !pickIsOver(p, now) && !isEliteSplitGame(p.slug));
  const biggestAll = takeSortedPicks(biggestPool, sortOf("biggest"), 30, vb, now);
  const biggestPicks = bySport(biggestAll);
  // Ranked feed (Nov 15): every open pick from an elite or Hot capper, verdict then quality. No filtering by Noel's own tickets.
  const qualCapper = (w: string | null | undefined): boolean => { const lw = (w || "").toLowerCase(); if (!walletLongTermOk(lw)) return false; if (ELITE_W[lw]) return true; const r = QMAP[lw]; return !!(r && isHotTabCapper(r)); };
  const qualBackersOf = (p: Pick): Backer[] => visibleBackers(p).filter((b: Backer) => {
    if (!qualCapper(b.wallet)) return false;
    const info = sportRecFor(b.wallet, p.league, p.id);
    return !(info && info.sr.n >= 5 && info.sr.roi != null && info.sr.roi < 0);
  });
  const rankedPoolAll = uniqueMergedPicks(catalogPicks.concat(provenComboPicks)).map(ltPick).filter((p: Pick) => p.backers.length > 0).filter((p: Pick) => qualBackersOf(p).length >= 1 && followOk(p) && !pickIsOver(p, now) && notHedged(p) && !isEliteSplitGame(p.slug) && !pickTooExpensive(p));
  const rankedNoKCount = rankedPoolAll.filter((p: Pick) => !p.kalshi || p.kalshi.status !== "ok").length;
  const rankedPool = rankedNoK ? rankedPoolAll : rankedPoolAll.filter((p: Pick) => p.kalshi && p.kalshi.status === "ok");
  const rankedAll = sortTopBy(rankedPool, sortOf("picks"), vb, now);
  try { (window as any).__RANKED = { all: rankedPoolAll.length, kalshi: rankedPool.length }; } catch (e) { /* debug only */ }
  const ranked = bySport(rankedAll);
  const allPickGames = sortComingGames(picksToGameCards(ranked), sortOf("picks") === "start" ? "start" : "best", now);
  const biggestGames = picksToGameCards(biggestPicks).slice().sort((a: ComingGame, b: ComingGame) => {
    const usd = (g: ComingGame) => (g.markets || []).reduce((s: number, m: ComingMarket) => s + (m.sides || []).reduce((t: number, x: ComingSide) => t + (x.usd || 0), 0), 0);
    return usd(b) - usd(a);
  });
  const provenGames = sortComingGames(provenToGameCards(provenPinned), "best", now);
  const upcomingPool = uniqueByKey((DATA.upcoming || []).concat(catalogPicks)).filter((p: Pick) => visibleBackers(p).length >= 1 && followOk(p) && !gone(p) && notHedged(p) && p.startTs > now && p.startTs <= now + 24 * 3600);
  const upcomingAll = takeSortedPicks(upcomingPool, sortOf("upcoming"), 30, vb, now);
  const upcomingPicks = bySport(upcomingAll);
  const longFunPicks = sortPicksBy(longPicks.concat(fun), sortOf("longfun"), vb, now);
  const bestLongId = (longPicks.slice().sort((a: Pick, b: Pick) => pickQualityScore(b, vb(b)) - pickQualityScore(a, vb(a)))[0] || { id: "" }).id;
  try { const dbg = (arr: Pick[]) => arr.map((p: Pick) => ({ id: p.id, q: p.q, label: p.label, ticker: p.kalshi && p.kalshi.ticker, act: p.kalshi && p.kalshi.action, contract: p.kalshi && p.kalshi.contract, price: usedPrice(p), startTs: p.startTs, backers: visibleBackers(p).map((b: Backer) => { const r = QMAP[(b.wallet || "").toLowerCase()]; const cv = convOf(b.wallet, b.cost, p.id); return { name: b.name, wallet: b.wallet, cost: b.cost, conv: cv.tag, mult: cv.mult, cw: r ? r.cw : null, cl: r ? r.cl : null, croi: r ? r.croi : null, badge: r ? r.badge : null, quality: r ? r.quality : null }; }), bq: backerStats(visibleBackers(p), p.id).quality })); (window as any).__RANK = { top: dbg(topAll), fun: dbg(funAll), poly: dbg(polyBase), props: dbg(propsBase), long: dbg(longBase), biggest: dbg(biggestAll), upcoming: dbg(upcomingAll) };  } catch (e) { /* debug only */ }
  const capNum = capN === "custom" ? Math.max(1, Math.floor(Number(capCustom) || 0)) : Number(capN);
  const allPicks = DATA.signals.concat(DATA.fun).concat(DATA.props || []).concat(DATA.longshots || []).concat(DATA.biggest || []).filter((p: Pick) => !pickHasCapperHedge(p));

  const buyAll = sortLines(BUY_LINES.filter((l: Line) => passLine(l, f, followed, hidden, DATA.ts)), f.sort);
  const buys = sportFilter ? buyAll.filter((l: Line) => l.league === sportFilter) : buyAll;
  const betRows = BET_LINES.filter((l: Line) => passLine(l, f, followed, hidden, DATA.ts));
  const betPickAll = sortBetPicks(uniqueMergedPicks(linesToPicks(betRows)).filter((p: Pick) => !finished(p) && followOk(p) && (allBets || vetted(p))), f.lineSort);
  const betUnvetted = allBets ? 0 : linesToPicks(betRows).filter((p: Pick) => !finished(p) && followOk(p) && !vetted(p)).length;
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
  const hotCapAll = capperRecsAll.filter((c: CapperRec) => {
    const w = (c.wallet || "").toLowerCase();
    if (hidden.indexOf(w) >= 0) return false;
    if (f.followedOnly && followed.indexOf(w) < 0) return false;
    return isHotTabCapper(c);
  });
  const hotCapLeagueItems: { league: string }[] = hotCapAll.map((c: CapperRec) => {
    const b = bestSportOf(c);
    return { league: b ? b.sport : "" };
  }).filter((x: { league: string }) => !!x.league);
  const hotCapVisible = sportFilter ? hotCapAll.filter((c: CapperRec) => {
    const b = bestSportOf(c);
    return !!(b && b.sport === sportFilter);
  }) : hotCapAll;
  const hotCapRows = sortHotCappers(hotCapVisible, sortOf("hot"));
  const tabRecord = tab === "top" ? "Top 20: " + wlTop.text : tab === "longfun" ? "Longshots: " + wlLong.text + " · Fun: " + wlFun.text : tab === "fun" ? "Fun: " + wlFun.text : tab === "poly" ? "Polymarket: " + wlPoly.text : tab === "props" ? "Player Props: " + wlProps.text : tab === "longshots" ? "Longshots: " + wlLong.text : tab === "biggest" ? "Biggest Bets: " + wlBig.text : tab === "upcoming" ? "Upcoming: " + wlUp.text : tab === "cappers" ? "Cappers: " + capWlW + "-" + capWlL + " (per capper; a shared pick can count more than once)" : tab === "picks" || tab === "coming" || tab === "elite" ? "Journal: " + wins + "–" + (graded.length - wins) + (graded.length ? "  ·  " + Math.round((100 * wins) / graded.length) + "%  ·  " : "  ·  ") + nextScanLabel(now) : tab === "more" ? "Top 20 " + wlTop.text + " · Fun " + wlFun.text + " · Polymarket " + wlPoly.text + (wlGlue.w + wlGlue.l ? " · Glue " + wlGlue.text : "") + (wlProps.w + wlProps.l ? " · Props " + wlProps.text : "") + (wlLong.w + wlLong.l ? " · Longshots " + wlLong.text : "") + (wlBig.w + wlBig.l ? " · Biggest " + wlBig.text : "") + (wlUp.w + wlUp.l ? " · Upcoming " + wlUp.text : "") : "";
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
  const tabPickPool: Pick[] = DATA.signals.concat(DATA.fun).concat(DATA.poly || []).concat(DATA.glue || []).concat(DATA.props || []).concat(DATA.longshots || []).concat(DATA.biggest || []).concat(DATA.upcoming || []).filter((p: Pick) => !pickHasCapperHedge(p));
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
    return fromLines.concat(extra).filter((p: Pick) => !pickHasCapperHedge(p));
  };
  const hotOpenPicksOf = (w: string): Pick[] => sortPicksBy(uniqueMergedPicks(livePicksOf(w)).filter((p: Pick) => !finished(p) && !isEliteSplitGame(p.slug)), "start", vb, now);
  const capFiltered = capperRecsAll.filter((c: CapperRec) => {
    const w = (c.wallet || "").toLowerCase();
    const tr = traderByW[w];
    if (capView === "following" && followed.indexOf(w) < 0) return false;
    if (capView === "hidden" && hidden.indexOf(w) < 0) return false;
    if (capView === "golden" && !(c.golden || (tr && tr.golden))) return false;
    if (capView === "active" && !c.open && !(tr && tr.bets > 0)) return false;
    if (capView === "qualified" && !c.qualified) return false;
    if (capView === "new" && !c.isNew) return false;
    if (capView === "hot" && c.badge !== "Hot") return false;
    if (capView === "hotcap" && !isHotTabCapper(c)) return false;
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
  const capSortKey = (sortOf("cappers") === "quality" ? "best" : sortOf("cappers"));
  capRows = capRows.slice().sort((a: CapperRec, b: CapperRec) => {
    if (capSortKey === "best" || capSortKey === "worst") {
      const d = capperQualityScore(b) - capperQualityScore(a);
      return capSortKey === "worst" ? -d : d;
    }
    if (capSortKey === "wr") return (b.wr || 0) - (a.wr || 0) || b.n - a.n;
    if (capSortKey === "open") return b.open - a.open || b.n - a.n;
    if (capSortKey === "profit") return b.profit - a.profit;
    if (capSortKey === "n") return b.n - a.n || (b.wr || 0) - (a.wr || 0);
    if (capSortKey === "rank") return (a.rankAll || a.rank || 999) - (b.rankAll || b.rank || 999);
    const d = capperQualityScore(b) - capperQualityScore(a);
    return d;
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
        <Toggle label="Hide stale (no buy in 24h)" value={f.freshOnly} onChange={(v: boolean) => set("freshOnly", v)} />
        <Toggle label="Include player props" value={f.props} onChange={(v: boolean) => set("props", v)} />
      </Grid>
      <Button label="Reset display filters" onClick={() => { setF(DEFAULT_FILTERS); setBuyLimit(20); setLineLimit(20); }} />
    </Section>
  );
  return (
    <Page title="Orca Whale Scanner" summary="Kalshi whale picks, best first." record={tabRecord || undefined} caution={tabCaution || undefined}>
      <Hero top={top.length} fun={fun.length} buys={BUY_LINES.length} bets={BET_LINES.length} active={activeTraders.length} value={openValue} />

      <Section heading="Bankroll and pick rules" caption={"Bankroll " + money(bankroll) + " · " + money(minP) + "+ positions · Top 20 needs " + minW + "+ whales" + (followed.length ? " · " + followed.length + " followed" : "") + (hidden.length ? " · " + hidden.length + " hidden" : "")} collapsible defaultOpen={false}>
        <Grid columns={3}>
          <Input label="Bankroll ($)" type="number" value={bankrollText} onChange={(v: string) => setBankroll(v)} />
          <Select label="Min position" value={minPos} onChange={(v: string) => setMinPos(v)} options={[{ value: "500", label: "$500+" }, { value: "1000", label: "$1,000+" }, { value: "2500", label: "$2,500+" }, { value: "5000", label: "$5,000+" }]} />
          <Select label="Top 20 consensus" value={minWallets} onChange={(v: string) => setMinWallets(v)} options={[{ value: "2", label: "2+ whales" }, { value: "3", label: "3+ whales" }, { value: "4", label: "4+ whales" }]} />
        </Grid>
        <Toggle label="Only picks a followed capper backs" value={f.followedOnly} onChange={(v: boolean) => set("followedOnly", v)} />
      </Section>

      {tab === "picks" ? (
        <Section heading={"All Picks · " + (bigOnly ? biggestGames.length : allPickGames.length)}>
          <RecordStrip wins={wins} losses={graded.length - wins} tiles={[{ label: "Open", value: String(bigOnly ? biggestGames.length : allPickGames.length) }, { label: "Proven", value: String(provenGames.length), color: provenGames.length ? GREEN : undefined }]} />
          {bigOnly ? null : (
            <div data-sort-quick="1" style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", margin: "0 0 10px" }}>
              {[["best", "★ Best first"], ["start", "⏱ Soonest"]].map((o: string[]) => { const on = sortOf("picks") === o[0]; return <button key={o[0]} type="button" data-sort-btn={o[0]} onClick={() => setSortOf(o[0], "picks")} style={{ padding: "8px 16px", borderRadius: 999, border: on ? "none" : "1px solid " + t.border.default, background: on ? BRAND : t.bg.base, color: on ? "#FFFFFF" : t.text.primary, fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>{o[1]}</button>; })}
            </div>
          )}
          {bigOnly ? null : <TabSortBar value={sortOf("picks")} onChange={(v: string) => setSortOf(v, "picks")} />}
          <LeaguePills picks={bigOnly ? biggestAll : rankedAll} value={sportFilter} onChange={setSportFilter} />
          <div data-pinned-proven="1" style={{ borderRadius: 16, padding: "10px 12px", background: "linear-gradient(180deg,#F5F0FF 0%, #EDE9FE 100%)", margin: "4px 0 12px", border: "1.5px solid #DDD6FE", boxShadow: "0 6px 16px rgba(124,58,237,0.08)" }}>
            <div style={{ fontSize: 15, fontWeight: 850, color: "#7C3AED" }}>{"📌 Proven Picks · " + provenGames.length + (PROVEN ? " · GOOD " + (PROVEN.counts.GOOD || 0) + " · OK " + (PROVEN.counts.OK || 0) : "")}</div>
            <div style={{ fontSize: 12, color: t.text.tertiary, margin: "2px 0 6px" }}>{"Elite cappers' own open bets, $300+, both sides on each game, with the Kalshi line on each side" + (provenRows.length > provenPinned.length ? " · " + (provenRows.length - provenPinned.length) + " smaller positions hidden" : "") + (PROVEN ? " · updated " + shortUpdatedAt(PROVEN.updatedAt) : "")}</div>
            <EliteCapperList />
            {provenGames.length === 0 ? <EmptyState title="No proven-capper picks yet" body={"No live or upcoming sports bets from elite cappers in the next 48 hours — " + nextScanLabel(now) + "."} /> : <ComingGroups games={provenGames} now={now} keyPrefix="P" onCapper={setPickProfile} limit={provenLimit} onMore={() => setProvenLimit(provenGames.length)} />}
          </div>
          <Grid columns={2}>
            <Toggle label="Biggest bets only · largest $ first" value={bigOnly} onChange={(v: boolean) => { setBigOnly(v); setRankedLimit(30); }} />
            {bigOnly ? <div /> : <Toggle label={"Include picks with no Kalshi market (" + rankedNoKCount + ")"} value={rankedNoK} onChange={(v: boolean) => { setRankedNoK(v); setRankedLimit(30); }} />}
          </Grid>
          {bigOnly ? (
            <Fragment>
              {biggestGames.length ? <Text>{biggestGames.length + " games with vetted whale bets, largest combined dollars first. Live games stay on the list until they are final."}</Text> : <EmptyState title="No vetted whale bets right now" body={"No open vetted whale bets on live or upcoming games — " + nextScanLabel(now) + "."} />}
              {biggestGames.length ? <ComingGroups games={biggestGames} now={now} keyPrefix="B" onCapper={setPickProfile} limit={rankedLimit} onMore={() => setRankedLimit(rankedLimit + 30)} /> : null}
            </Fragment>
          ) : (
            <Fragment>
              {allPickGames.length === 0 ? <EmptyState title="No proven-capper picks yet" body={"No open picks from elite or Hot cappers right now. Live games stay until they finish — " + nextScanLabel(now) + "."} /> : <ComingGroups games={allPickGames} now={now} keyPrefix="R" onCapper={setPickProfile} limit={rankedLimit} onMore={() => setRankedLimit(rankedLimit + 30)} />}
            </Fragment>
          )}
          {pickProfile ? <CapperProfile wallet={pickProfile} onClose={() => setPickProfile("")} /> : null}
        </Section>
      ) : null}

      {tab === "cappers" ? (
        <Section heading={"Cappers · " + capRows.length}>
          <RecordStrip wins={capWlW} losses={capWlL} tiles={[{ label: "Shown", value: String(capRows.length) }, { label: "Hot", value: String(hotCapAll.length), color: hotCapAll.length ? GREEN : undefined }]} />
          <TabSortBar value={sortOf("cappers")} onChange={(v: string) => setSortOf(v, "cappers")} options={CAPPER_SORT_OPTS} label="Sort cappers" />
          <LeaguePills picks={capLeagueItems} value={sportFilter} onChange={setSportFilter} allCount={capAll.length} />
          <Text>Cappers ranked by quality: Proven first (10+ graded copyable picks, winning record, positive copyable ROI, positive Polymarket P&L in the past month and all time, and not negative in both the past week and past year). Each row shows Polymarket P&L for the past week, month, year and all time with a badge: Hot (all four up), OK, Cooling (past week down, small penalty) or Cold (past month, past year or all time down, demoted on every tab). Conviction: each whale's usual bet is the median of their tracked bets; 2x+ (or a top-3 bet that day) is High conviction, 0.25x or less is Throwaway and barely counts in ranking. Picks inside a capper are listed biggest bet first. A capper needs {capMinSample} graded picks (pushes don't count) to rank at the top; smaller samples are labeled Small sample, and cappers with no grades yet show Record building. Quality ranking for picks uses only Kalshi-copyable singles in the 10–94¢ bands, needs 10 graded copyable picks, and shrinks toward the average; below 10 is treated as neutral, not boosted. High-volume, low-edge whales are demoted. Tap a card for current live picks (PickCards labeled OPEN or LIVE) and every tracked pick labeled HIT, MISSED, PUSH, or OPEN/LIVE. Records are saved across scans and never wiped. The tab W-L adds each capper's record, so a pick two cappers both took is counted twice. Follow to filter other tabs to them; hide to drop them from every count. New Hot or Proven whales found in each scan (including Polymarket's sports week and month leaderboards) are added to a tracked list and scanned every time, even if they fall off the leaderboard. Upgrades (Nov 15): records now include every $500+ settled sports bet from the last 30 days (Polymarket backfill), the last 14 days count 2x in quality and a whale with 5+ picks and negative 14-day ROI is flagged Cooling (14d) and down-ranked, each whale has a by-sport record (a backer doesn't count on a pick in a sport where they are losing with 5+ graded), and Your copies shows how the Kalshi tickets you placed from their picks did.</Text>
          <div data-new-cappers="1" style={{ borderRadius: 16, padding: "12px 14px", background: t.bg.subtle, fontFamily: t.font.family, fontSize: 14, lineHeight: "20px", color: t.text.secondary, margin: "10px 0" }}>
            <span style={{ color: "#7C3AED", fontWeight: 800 }}>New good cappers this scan: </span>
            {((DATA.capperHistory && DATA.capperHistory.newThisScan) || []).length ? ((DATA.capperHistory && DATA.capperHistory.newThisScan) || []).map((x: NewCap) => nameOf(x.name, x.wallet) + " (" + (x.reason || "Hot") + (x.month != null ? ", month " + kShort(x.month) : "") + ")").join(", ") : "none"}
            {" · Tracked: " + ((DATA.capperHistory && DATA.capperHistory.trackedCount) || 0) + " whales. New ones show a New tag for 3 days."}
          </div>
          <Segmented options={[{ value: "all", label: "All", count: capperRecsAll.length }, { value: "hotcap", label: "🔥 Hot Cappers", count: hotCapAll.length }, { value: "hot", label: "Hot badge", count: capperRecsAll.filter((c: CapperRec) => c.badge === "Hot").length }, { value: "new", label: "New", count: capperRecsAll.filter((c: CapperRec) => c.isNew).length }, { value: "qualified", label: "5+ graded" }, { value: "small", label: "Small sample" }, { value: "building", label: "Record building" }, { value: "active", label: "Live now" }, { value: "following", label: "Following", count: followed.length }, { value: "hidden", label: "Hidden", count: hidden.length }, { value: "golden", label: "Golden" }, { value: "top100", label: "Top whales" }]} value={capView} onChange={(v: string) => { setCapView(v); setCapLimit(25); }} />
          <Grid columns={2}>
            <Input label="Search cappers" value={capQ} onChange={(v: string) => { setCapQ(v); setCapLimit(25); }} placeholder="Name or 0x wallet" />
          </Grid>
          {saved ? <Text>{saved}</Text> : null}
          {capRows.length ? <CardGrid>{capRows.slice(0, capLimit).map((c: CapperRec, i: number) => (
              <CapperCard key={c.wallet} rec={c} trader={traderByW[(c.wallet || "").toLowerCase()]} now={now} bankroll={bankroll} livePicks={livePicksOf(c.wallet)} openPicks={hotOpenPicksOf(c.wallet)} followed={followed} hidden={hidden} toggle={toggle} rank={i + 1} />
            ))}</CardGrid> : <EmptyState title={capperRecsAll.length ? "No cappers match these filters" : "Records are still building"} body={capperRecsAll.length ? "Try All, clear search, or switch off a sport filter. " + nextScanLabel(now) + "." : "Run a refresh or scan to start grading capper picks — " + nextScanLabel(now) + "."} />}
          {capRows.length > capLimit ? <Button label={"Show more cappers (" + (capRows.length - capLimit) + " left)"} onClick={() => setCapLimit(capLimit + 25)} /> : null}
        </Section>
      ) : null}

      {tab === "elite" ? <EliteTab now={now} /> : null}
      {tab === "coming" ? <ComingUpTab now={now} /> : null}

      {(
        <Section heading="More · bankroll, record, scan details" collapsible defaultOpen={false}>
          <Section heading="Bankroll" caption="Default $166 (from Pikkit). Saved on this device when you edit it. An old $160 or $225.06 default on this device is replaced automatically." defaultOpen={true}>
            <Input label="Bankroll ($)" type="number" value={bankrollText} onChange={(v: string) => setBankroll(v)} />
            <Text>Stakes: Small = 1% · Normal = 2% · Go big = 4% (max $10), rounded to the nearest dollar, minimum $1. Longshots are flat $1, or $2 for the strongest.</Text>
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
              { label: "Times", value: "Pacific Time. Window: next 36 hours (was 12), games that have not started. Started games are dropped from Top 20, Upcoming, Fun, Polymarket, Player Props, Longshots and Biggest Bets (they stay on Bets with a Live tag). Ended games are removed everywhere." },
              { label: "Capper and pick rules", value: "The capper pool is Polymarket's overall and sports (week, month, all-time) leaderboards. Picks only count from cappers who are green over 14 and 30 days, have +5% all-time ROI and a profitable year, make at least half of their recent $500+ bets on Kalshi-listed games, and average under 90¢ entry. Market makers and bots (huge trade or market counts, big maker rebates or fee refunds, or heavy both-sides hedging) are dropped. A one-off jackpot record (biggest win over 40% of lifetime profit, or under 20 markets with most profit in a few bets) cannot be elite. Elite still needs 12+ graded big bets, but a pick is only GOOD if that capper has 30+ graded bets in that sport. If Kalshi's price plus its taker fee is 2¢ or more worse than the whale's entry, the pick is hidden. Buys older than about an hour are tagged Stale and ranked lower." },
            ]} />
          </Section>
          <Section heading="Methodology" collapsible defaultOpen={false} caption="Scores rank evidence; they are not win probabilities.">
            <Properties items={[
              { label: "Guardrails", value: "Only the top " + DATA.coverage.cappers + " all-time sports whales count (≥50% of open cost in sports) · $500 minimum position · 2+ of them for Top 20 · verified Kalshi contract required for Top 20 and Fun · the Polymarket tab is only for picks with no Kalshi contract (never a duplicate of a Kalshi tab) · player props have their own tab · 10–20¢ 2-whale one-sided picks go to Longshots, not Fun · Biggest Bets ranks remaining open bets by the largest single whale position · Upcoming lists $500+ whale bets on games starting in the next 24 hours, soonest first · games that have started are hidden from Top 20, Upcoming, Fun, Polymarket, Player Props, Longshots and Biggest Bets" },
              { label: "Quality score (every tab)", value: "Every tab defaults to Best to worst, with Worst to best, start time, and bet size in the same menu. Each card shows its # rank and a 0–100 quality score. For picks the score uses the existing ranking signals plus: vetted backer sample (10+ first), elite/proven/Hot backer status, graded ROI and the sport-specific record, conviction (bet size vs usual), whether a Kalshi market is matched, and Kalshi price vs the whales' entry (edge). Started or settled games, when shown, always go last. For Cappers (and as the main idea on Hot Cappers), best means elite first, then ROI with a minimum sample, then record." },
              { label: "Top 20 ranking", value: "Price band first (65–84¢ best, then 45–64¢ and 85–94¢; under 45¢ and 95¢+ are out of Top 20), then backing-whale quality (graded win rate and ROI on copyable Kalshi singles; 10+ sample, small samples neutral, low-edge volume demoted), then net money (for minus against) and one-sided share, then whale count. Split (share under 65%) is capped at Small and dropped from Top 20 if under 55%. Pricier (current >3¢ above whale avg entry) is dropped from Top 20; >5¢ is hidden from Top 20 entirely." },
              { label: "Polymarket tab", value: "Up to 20 whale picks that passed every rule but have no matching Kalshi contract. Ranked the same way as Top 20. Each card says in plain words what to buy on Polymarket and links to the market. Player props and 10–20¢ longshots are moved to their own tabs. Results are tagged Polymarket in the journal. Refresh drops started and finished ones. A caution is shown while the tab's graded record is losing." },
              { label: "Player Props tab", value: "Only player props backed by an elite capper with +20% sport ROI, and only when Kalshi has a matching player-prop contract (NFL TDs or yards, NBA points, rebounds or assists, and similar). Cards show the exact Kalshi wording, ticker, price, player, both teams, league, PT time, and the backer's record, ROI and size vs usual. Unmatched or weak props are hidden. Started games are hidden." },
              { label: "Longshots tab", value: "5x–10x payouts: prices 10–20¢, 2+ proven whales, net one-sided (share at least 55%), any type or sport. Ranked like Top 20. Most will lose; each hit pays 5–10x. Flat $1 stakes, or $2 for the strongest, under the daily cap. Moved out of Fun Picks so they are not duplicated there." },
              { label: "Upcoming tab", value: "Up to 30 unstarted games in the next 24 hours that $500+ proven whales have bet, any sport or market including player props. Sorted best to worst by the quality score (start time and bet size are in the sort menu). Each card shows both teams, the PT date and start time with a countdown, the biggest whale bet (name and all-time rank), how many other whales are on the same bet and their money, the combined total, a split flag if whales are on the other side, and the backers' graded W-L and ROI. Strength rules still apply." },
              { label: "Biggest Bets tab", value: "Up to 30 open whale bets, sorted best to worst by the quality score (switch to bet size for the largest single $500+ position first). Any sport or market type, including player props. Each card shows the biggest whale's bet size and all-time rank, how many other whales made the same bet, their money, the combined total, and the backers' graded W-L and ROI. Split markets are flagged. Strength rules still apply (under 45¢ never Go big, 95¢+ glue only, pricier-than-entry flag). Started and ended games are hidden. Duplicates with other tabs are expected." },
              { label: "Cappers tab", value: "One card per whale we have collected picks from, sorted best to worst: elite (Proven Picks list) first, then copyable ROI with a 10+ graded sample (5–9 counts at half weight), then win rate and record. Tap to see current live picks as PickCards and every tracked pick labeled HIT, MISSED, PUSH, or OPEN/LIVE. Records are stored in capper history, graded on refresh, and never wiped. The tab W-L is the sum of each capper's record (a shared pick can count more than once)." },
              { label: "Whale-quality ranking", value: "Vetting rule (Nov 14): a backer only counts if they have a winning graded record and positive copyable ROI on 10+ picks (5–9 allowed only at 60%+ wins and +10% ROI, labeled small sample), are not Cold, and bet real size ($500+, at least 0.5x their usual bet, not a throwaway). Negative-ROI, Cold, ungraded and small-bet backers add nothing to quality, net money or whale count, and are shown on cards as a red caution. Top 20, Fun, Polymarket, Player Props, Longshots, Biggest Bets, Hot Cappers and Bets (unless you switch on unvetted bets) only list picks with at least one vetted backer, and lists are not padded. The Hot boost only applies to positive-ROI whales. Picks on Top 20, Fun, Polymarket, Player Props, Longshots, Biggest Bets, and Bets are ranked by price band first (existing 65–84¢ / mid / other bands; started and overpriced rules still apply), then by the backing whales' quality, then net money and agreement. Quality is each whale's win rate and ROI on Kalshi-copyable singles in the 10–94¢ bands. A whale needs 10+ graded copyable picks to get a non-neutral score; smaller samples shrink toward the average but are treated as neutral (not boosted). High-volume whales with ROI near zero or negative on those copyable bets are heavily demoted. Upcoming stays soonest-first, with quality as the tiebreak. Every card shows Backers W-L and ROI from those graded copyable records. Period P&L rule: whales whose Polymarket P&L is negative over the past month, past year or all time are Cold and demoted; past-week-only negative is Cooling (small penalty). Conviction: each backer's bet is compared with their usual (median) bet; High conviction (2x+ or a top-3 bet that day) weighs 1.5x, Throwaway (0.25x or less) weighs 0.1x in quality, net money and whale count. Cards list the top backers as e.g. 'name $587 = 3.1x usual · High conviction · Hot · Wk/Mo/Yr/All P&L'." },
              { label: "Strength label", value: "Go big: 3+ top whales, or $10,000+ with opposing whale money under 15% (or none) — never on under-45¢, 95¢+, or Split (share under 65%). Spreads cap at Normal unless 3+ whales and share of 65% or more. Normal: exactly 2. Small: 1, or any capped pick. 95¢+ is labeled Small, glue leg only." },
              { label: "Signal score (picks)", value: "Consensus 25 · Capper record 25 · Money 15 · One-sided 15 · Golden 10 · Fresh money 10" },
              { label: "Evidence score (buys, bets)", value: "Recency 25 · Capper record 20 · Independent agreement within 60 min 20 · Kalshi quote 20 · Kalshi price at or below the capper's 10" },
              { label: "Strong evidence only", value: "Golden capper, bought within 60 minutes, another whale agreeing within 60 minutes, verified Kalshi contract" },
              { label: "Confidence colors", value: "Green 65+, yellow 45–64, red under 45" },
              { label: "Stake", value: "Small = 1% of bankroll, Normal = 2%, Go big = 4% (max $10), rounded to the nearest $1 with a $1 minimum. Longshots are flat $1, or $2 for the strongest, kept under the daily cap. Bankroll defaults to $166 and saves on this device. Each card has a short copyable pick ID for Pikkit grading." },
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
              "Started games are dropped from Top 20, Upcoming, Fun, Polymarket, Player Props, Longshots and Biggest Bets on refresh (they stay on Bets with a Live tag). Ended games are removed from every list after their W/L is written to the Journal.",
              "OrcaLayer itself does not report parlays. ESPN player stats are not loaded.",
              "Esports start times come from Kalshi contract wording or the same match's markets; some show the date only.",
            ]} />
          </Section>
        </Section>
      )}

      <Floating edge="top" align="center" bar>
        <div data-tab-bar="1">
        <PillTabs
          options={[{ value: "picks", label: "All Picks", count: bigOnly ? biggestAll.length : rankedAll.length }, { value: "elite", label: "Elite", count: eliteTabCount(now) }, { value: "coming", label: "Coming Up", count: sortComingGames(asComingGames((DATA.comingUp || []) as ComingGame[]), "best", now).length }, { value: "cappers", label: "Cappers", count: capRows.length }]}
          value={tab}
          onChange={(v: string) => { setTab(v); setSportFilter(""); }}
        />
        </div>
      </Floating>
    </Page>
  );
}



