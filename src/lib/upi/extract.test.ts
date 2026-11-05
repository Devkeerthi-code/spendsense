import { describe, expect, it } from "vitest";
import { extractMerchant } from "./extract";

describe("UPI merchant extraction", () => {
  it.each([
    ["SBI", "TO TRANSFER-UPI/DR/412300000001/SWIGGY/YESB/swiggy@ybl/Payment--", "Swiggy", "FOOD"],
    ["HDFC", "UPI-SWIGGY INSTAMART-swiggyinstamart@ybl-YESB0YBLUPI-412300000011-UPI", "Swiggy", "FOOD"],
    ["HDFC", "UPI-ZOMATO LTD-zomato.payu@hdfcbank-HDFC0MERUPI-412300000012-PAYMENT", "Zomato", "FOOD"],
    ["ICICI", "UPI/412300000021/Payment from Ph/uber.india@icici/ICICI BANK LIMITED", "Uber", "TRAVEL"],
    ["Axis", "UPI/P2M/412300000031/AMAZON PAY/Payment/YES BANK", "Amazon", "SHOPPING"],
    ["Kotak", "UPI/NETFLIX/412300000041/Monthly plan", "Netflix", "SUBSCRIPTIONS"],
    ["generic", "UPI/DR/412300000051/BLINKIT/Groceries", "Blinkit", "GROCERIES"],
    ["card", "POS 512345XXXXXX1234 DMART AVENUE", "DMart", "GROCERIES"],
  ])("%s: %s -> %s", (_bank, description, merchant, category) => {
    const info = extractMerchant(description);
    expect(info.merchant).toBe(merchant);
    expect(info.builtinCategory).toBe(category);
  });

  it("normalises different spellings of one merchant to the same key", () => {
    const keys = [
      "UPI/DR/412300000001/SWIGGY/YESB/swiggy@ybl/Payment",
      "UPI-SWIGGY INSTAMART-swiggyinstamart@ybl-YESB0YBLUPI-412300000011-UPI",
      "UPI/P2M/412300000099/Swiggy Ltd/Order/YES BANK",
    ].map((d) => extractMerchant(d).merchantKey);
    expect(new Set(keys)).toEqual(new Set(["swiggy"]));
  });

  it("pulls out the VPA and the 12-digit reference", () => {
    const info = extractMerchant("UPI/DR/412300000002/RAHUL KU/SBIN/rahul.k@oksbi/Dinner split");
    expect(info.vpa).toBe("rahul.k@oksbi");
    expect(info.ref).toBe("412300000002");
    expect(info.channel).toBe("UPI");
  });

  it("uses the payee name for unknown merchants and keys them by VPA", () => {
    const info = extractMerchant("UPI/P2M/412300000033/CHAI POINT DEMO/Payment/PAYTM PAYMENTS BANK");
    expect(info.merchant).toBe("Chai Point Demo");
    expect(info.builtinCategory).toBe("FOOD");
    const unknown = extractMerchant("UPI/DR/412300000077/SHREE GANESH ENT/YESB/q123456789@ybl/Pay");
    expect(unknown.merchant).toBe("Shree Ganesh Ent");
    expect(unknown.builtinCategory).toBeNull();
    expect(unknown.merchantKey).toBe("q123456789@ybl");
  });

  it("marks person-to-person payments as transfers and masks phone-number VPAs", () => {
    const gpay = extractMerchant("UPI/DR/412300000002/RAHUL KU/SBIN/rahul.k@oksbi/Dinner split");
    expect(gpay.builtinCategory).toBe("TRANSFERS");
    expect(gpay.merchant).toBe("Rahul Ku");

    const phone = extractMerchant("UPI-PRIYA S-9876543210@ybl-SBIN0000001-412300000013-MOVIE");
    expect(phone.builtinCategory).toBe("TRANSFERS");
    expect(phone.vpa).toBe("XXXXXX3210@ybl");
    expect(phone.merchantKey).not.toContain("9876543210");

    expect(extractMerchant("UPI/P2A/412300000032/KARTHIK M/rent share/AXIS BANK").builtinCategory).toBe("TRANSFERS");
  });

  it("reads ICICI's name from the VPA, since the remark comes first there", () => {
    const info = extractMerchant("UPI/412300000022/dinner/ananya.r@okicici/ICICI Bank", { preferVpaName: true });
    expect(info.merchant).toBe("Ananya R");
    expect(info.builtinCategory).toBe("TRANSFERS");
  });

  it("does not let a friend's remark decide the merchant", () => {
    const info = extractMerchant("UPI/DR/412300000060/NEHA P/SBIN/neha.p@okaxis/zomato split");
    expect(info.merchant).toBe("Neha P");
    expect(info.builtinCategory).toBe("TRANSFERS");
  });

  it("handles ATM withdrawals and non-UPI lines", () => {
    expect(extractMerchant("ATM WDL ATM CASH 0000 DEMO ROAD")).toMatchObject({ merchant: "ATM cash withdrawal", channel: "ATM" });
    expect(extractMerchant("NEFT-DEMOCOLLEGE-SCHOLARSHIP OCT").merchant).toBe("Democollege");
  });
});
