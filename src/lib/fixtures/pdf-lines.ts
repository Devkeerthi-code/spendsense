/**
 * FAKE TEST DATA. Text lines shaped like what PDF extraction returns for each bank's statement layout.
 * No real people, accounts or transactions.
 */

export const SBI_PDF_LINES = [
  "State Bank of India",
  "Account Statement - FAKE TEST DATA",
  "Account Number : 00000012345678",
  "Opening Balance : 11,000.00",
  "Txn Date Value Date Description Ref No./Cheque No. Debit Credit Balance",
  "1 Oct 2026 1 Oct 2026 TO TRANSFER-UPI/DR/412300000001/SWIGGY/YESB/swiggy@ybl/Payment-- 249.00 10,751.00",
  "3 Oct 2026 3 Oct 2026 BY TRANSFER-UPI/CR/412300000003/DEMO PARENT/SBIN/parent.demo@oksbi/Pocket 5,000.00 15,751.00",
  "money--",
  "Page 1 of 2",
  "5 Oct 2026 5 Oct 2026 TO TRANSFER-UPI/DR/412300000004/Spotify India/HDFC/spotify@hdfcbank/Subscription-- 119.00 15,632.00",
  "This is a computer generated statement",
];

export const HDFC_PDF_LINES = [
  "HDFC BANK Ltd. FAKE TEST DATA",
  "Account No : 50100000004321",
  "Date Narration Chq./Ref.No. Value Dt Withdrawal Amt. Deposit Amt. Closing Balance",
  "01/10/26 UPI-SWIGGY INSTAMART-swiggyinstamart@ybl- 0000412300000011 01/10/26 412.50 8,587.50",
  "YESB0YBLUPI-412300000011-UPI",
  "04/10/26 UPI-PRIYA S-9876543210@ybl-SBIN0000001- 0000412300000013 04/10/26 150.00 8,737.50",
  "412300000013-MOVIE",
];

export const ICICI_PDF_LINES = [
  "ICICI Bank Limited - FAKE TEST DATA",
  "Account Number XXXXXXXX7788",
  "S No. Value Date Transaction Date Cheque Number Transaction Remarks Withdrawal Amount (INR ) Deposit Amount (INR ) Balance (INR )",
  "1 01/10/2026 01/10/2026 - UPI/412300000021/Payment from Ph/uber.india@icici/ICICI 180.00 0.00 6,820.00",
  "BANK LIMITED",
  "2 05/10/2026 05/10/2026 - NEFT-DEMOCOLLEGE-SCHOLARSHIP OCT 0.00 2,000.00 8,820.00",
];

export const AXIS_PDF_LINES = [
  "AXIS BANK - FAKE TEST DATA",
  "Statement of Account No - 912010000005566",
  "Tran Date Chq No Particulars Debit Credit Balance Init. Br",
  "01-10-2026 UPI/P2M/412300000031/AMAZON PAY/Payment/YES BANK 1,299.00 3,701.00 1234",
  "02-10-2026 UPI/P2A/412300000032/KARTHIK M/rent share/AXIS BANK 4,000.00 299.00 Dr 1234",
];

export const KOTAK_PDF_LINES = [
  "Kotak Mahindra Bank - FAKE TEST DATA",
  "Account No. XXXXXXXXXX2468",
  "# Date Narration Chq/Ref No Withdrawal (Dr) Deposit (Cr) Balance",
  "1 01 Oct 2026 UPI/NETFLIX/412300000041/Monthly plan UPI-412300000041 199.00 2,801.00 (Cr)",
  "2 03 Oct 2026 UPI/DEMO FRIEND/412300000043/Refund UPI-412300000043 600.00 3,401.00 (Cr)",
];
