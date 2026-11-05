/**
 * Prints honest usage numbers from the UsageEvent table, excluding the demo account.
 * Run: npm run stats
 */
import "dotenv/config";
import { db } from "../src/server/db";

async function main() {
  const [users, activeUsers, events, transactions] = await Promise.all([
    db.user.count({ where: { isDemo: false } }),
    db.user.count({ where: { isDemo: false, imports: { some: {} } } }),
    db.usageEvent.groupBy({ by: ["type"], _count: { _all: true }, where: { OR: [{ userId: null }, { user: { isDemo: false } }] } }),
    db.transaction.count({ where: { user: { isDemo: false } } }),
  ]);
  console.log(`Accounts: ${users}`);
  console.log(`People who imported at least one statement: ${activeUsers}`);
  console.log(`Transactions analysed: ${transactions}`);
  for (const e of events.sort((a, b) => a.type.localeCompare(b.type))) console.log(`  ${e.type}: ${e._count._all}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
