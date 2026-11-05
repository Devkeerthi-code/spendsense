/**
 * Creates a DEMO account filled with made-up DEMO transactions so the app can be explored without a real
 * bank statement. Every narration starts with "DEMO" and the account is flagged isDemo, which makes the UI
 * show a "demo data" banner. Login comes from SEED_DEMO_EMAIL / SEED_DEMO_PASSWORD (never hard-coded).
 *
 * Run: npm run db:seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { categorise } from "../src/lib/categorise";
import { addDays, isoToUTCDate, shiftMonth, todayIST } from "../src/lib/dates";
import { enrichRows } from "../src/lib/enrich";
import type { ParsedTxn } from "../src/lib/parsers/types";
import { db } from "../src/server/db";

type Draft = Omit<ParsedTxn, "balancePaise">;

// Deterministic so every seed run produces the same demo story.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = rng(20261105);
const between = (min: number, max: number) => Math.round(min + random() * (max - min));
const chance = (p: number) => random() < p;
let refCounter = 0;
const ref = () => String(900000000000 + ++refCounter);

const upi = (payee: string, vpa: string, note: string) => `DEMO UPI/DR/${ref()}/${payee}/YESB/${vpa}/${note}`;
const upiIn = (payee: string, vpa: string, note: string) => `DEMO UPI/CR/${ref()}/${payee}/SBIN/${vpa}/${note}`;
const debit = (date: string, rupees: number, description: string): Draft => ({ date, description, amountPaise: rupees * 100, direction: "DEBIT" });
const credit = (date: string, rupees: number, description: string): Draft => ({ date, description, amountPaise: rupees * 100, direction: "CREDIT" });

const FRIENDS = [
  ["DEMO FRIEND ARJUN", "arjun.demo@okaxis"],
  ["DEMO FRIEND MEERA", "meera.demo@oksbi"],
  ["DEMO FRIEND KABIR", "kabir.demo@okhdfcbank"],
] as const;

function dayOf(date: string): number {
  return isoToUTCDate(date).getUTCDay();
}

function draftsForDay(date: string): Draft[] {
  const out: Draft[] = [];
  const dom = Number(date.slice(8, 10));
  const weekday = dayOf(date) >= 1 && dayOf(date) <= 5;

  if (dom === 1) {
    out.push(credit(date, 10000, upiIn("DEMO PARENT", "parent.demo@oksbi", "Monthly allowance")));
    out.push(debit(date, 6500, upi("SUNRISE PG DEMO", "sunrisepg.demo@ybl", "Hostel rent")));
  }
  if (dom === 5) out.push(debit(date, 119, upi("Spotify India", "spotify@hdfcbank", "Subscription")));
  if (dom === 12) out.push(debit(date, 199, upi("NETFLIX", "netflix@icici", "Monthly plan")));
  if (dom === 20) out.push(debit(date, 299, upi("JIO PREPAID", "jioprepaid@ybl", "Recharge")));

  if (weekday) {
    const chais = chance(0.7) ? between(1, 2) : 0;
    for (let i = 0; i < chais; i++) out.push(debit(date, between(15, 30), upi("SHARMA TEA STALL DEMO", "sharmatea.demo@paytm", "Chai")));
    if (chance(0.55)) out.push(debit(date, between(40, 90), upi("ANNAPURNA CANTEEN DEMO", "annapurna.demo@ybl", "Lunch")));
    if (chance(0.25)) out.push(debit(date, between(10, 40), upi("STAR XEROX DEMO", "starxerox.demo@ybl", "Printouts")));
    if (chance(0.3)) out.push(debit(date, between(20, 45), upi("NAMMA METRO", "bmrcl@axisbank", "Metro card")));
  }
  if (chance(0.35)) out.push(debit(date, between(180, 450), (chance(0.6) ? upi("SWIGGY", "swiggy@ybl", "Order") : upi("ZOMATO", "zomato@hdfcbank", "Order"))));
  if (dayOf(date) === 6 && chance(0.8)) out.push(debit(date, between(150, 600), (chance(0.5) ? upi("BLINKIT", "blinkit@ybl", "Groceries") : upi("ZEPTO", "zeptonow@ybl", "Groceries"))));
  if (chance(0.12)) out.push(debit(date, between(45, 160), upi("RAPIDO", "rapido.bike@axisbank", "Ride")));
  if (chance(0.06)) out.push(debit(date, between(350, 1800), (chance(0.5) ? upi("AMAZON PAY", "amazon@apl", "Order") : upi("MYNTRA", "myntra@icici", "Order"))));
  if (chance(0.08)) {
    const [name, vpa] = FRIENDS[between(0, FRIENDS.length - 1)]!;
    out.push(debit(date, between(100, 800), upi(name, vpa, "Split")));
  }
  if (chance(0.03)) out.push(debit(date, between(120, 900), upi("SRI LAKSHMI ENTERPRISES DEMO", "q555555555@ybl", "Payment")));
  return out;
}

function buildDemoStatement(today: string): ParsedTxn[] {
  const start = `${shiftMonth(today.slice(0, 7), -3)}-01`;
  const drafts: Draft[] = [];
  for (let date = start; date <= today; date = addDays(date, 1)) drafts.push(...draftsForDay(date));

  let balance = 18_000_00;
  return drafts.map((d) => {
    balance += d.direction === "CREDIT" ? d.amountPaise : -d.amountPaise;
    return { ...d, balancePaise: balance };
  });
}

async function main() {
  const email = process.env.SEED_DEMO_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_DEMO_PASSWORD;
  if (!email || !password || password.length < 8) {
    throw new Error("Set SEED_DEMO_EMAIL and SEED_DEMO_PASSWORD (8+ characters) in .env before seeding.");
  }

  const user = await db.user.upsert({
    where: { email },
    create: { email, name: "Demo Student", passwordHash: await bcrypt.hash(password, 10), isDemo: true },
    update: { isDemo: true, passwordHash: await bcrypt.hash(password, 10) },
  });
  await db.transaction.deleteMany({ where: { userId: user.id } });
  await db.import.deleteMany({ where: { userId: user.id } });
  await db.budget.deleteMany({ where: { userId: user.id } });
  await db.bankAccount.deleteMany({ where: { userId: user.id } });
  await db.merchantRule.deleteMany({ where: { userId: user.id } });

  const rows = enrichRows(buildDemoStatement(todayIST()), "SBI");
  const { assignments } = await categorise(
    rows.map((r) => ({ merchantKey: r.merchantKey, merchant: r.merchant, direction: r.direction, builtinCategory: r.builtinCategory, sample: r.description })),
    { user: new Map(), ai: new Map() },
    null,
  );
  const account = await db.bankAccount.upsert({
    where: { userId_bank_last4: { userId: user.id, bank: "SBI", last4: "0000" } },
    create: { userId: user.id, bank: "SBI", last4: "0000" },
    update: {},
  });
  const record = await db.import.create({
    data: { userId: user.id, accountId: account.id, bank: "SBI", fileType: "demo", rowsParsed: rows.length, inserted: rows.length, duplicates: 0, aiCategorised: 0 },
  });
  await db.transaction.createMany({
    data: rows.map((r, i) => ({
      userId: user.id,
      accountId: account.id,
      importId: record.id,
      date: isoToUTCDate(r.date),
      description: r.description,
      amountPaise: r.amountPaise,
      direction: r.direction,
      balancePaise: r.balancePaise,
      merchant: r.merchant,
      merchantKey: r.merchantKey,
      vpa: r.vpa,
      category: assignments[i]!.category,
      categorySource: assignments[i]!.source,
      fingerprint: r.fingerprint,
    })),
  });
  await db.budget.createMany({
    data: [
      { userId: user.id, category: "FOOD", limitPaise: 4000_00 },
      { userId: user.id, category: "TRAVEL", limitPaise: 800_00 },
      { userId: user.id, category: "SHOPPING", limitPaise: 2000_00 },
    ],
  });
  console.log(`Seeded ${rows.length} DEMO transactions for ${email}.`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
