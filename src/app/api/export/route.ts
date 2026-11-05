import { todayIST } from "@/lib/dates";
import { exportCsv } from "@/server/account";
import { withUser } from "@/server/http";

export const GET = withUser(async (_req, userId) => {
  const csv = await exportCsv(userId);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="spendsense-${todayIST()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
});
