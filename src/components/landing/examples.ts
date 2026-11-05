import type { CategoryId } from "@/lib/categories";

export interface ExampleLine {
  raw: string;
  merchant: string;
  category: CategoryId;
  amount: string;
  credit?: boolean;
}

/** Made-up lines in the exact format Indian banks print. Shown on the landing page, always labelled "Example". */
export const EXAMPLE_LINES: ExampleLine[] = [
  { raw: "UPI/DR/XXXXXXXX8901/SWIGGY/YESB/swiggy@ybl/Payment", merchant: "Swiggy", category: "FOOD", amount: "₹248" },
  { raw: "UPI/DR/XXXXXXXX2214/RAMESH TEA STALL/PYTM/paytmqr2810@paytm/UPI", merchant: "Ramesh Tea Stall", category: "FOOD", amount: "₹20" },
  { raw: "UPI/DR/XXXXXXXX7730/IRCTC/SBIN/irctc.uts@sbi/Ticket", merchant: "IRCTC", category: "TRAVEL", amount: "₹145" },
  { raw: "UPI/DR/XXXXXXXX5521/SPOTIFY/HDFC/spotify.mandate@hdfcbank/AutoPay", merchant: "Spotify", category: "SUBSCRIPTIONS", amount: "₹119" },
  { raw: "UPI/CR/XXXXXXXX0093/RAHUL S/ICIC/rahul.s@okicici/split", merchant: "Rahul S", category: "TRANSFERS", amount: "₹300", credit: true },
];
