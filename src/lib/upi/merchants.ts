import type { CategoryId } from "@/lib/categories";

export interface KnownMerchant {
  /** Canonical display name. Omitted for generic patterns ("cafe", "hostel") where the payee's own name is better. */
  name?: string;
  category: CategoryId;
  pattern: RegExp;
}

/**
 * Built-in merchant dictionary, checked in order against the payee name and VPA (never the free-text
 * remarks, so a friend's note saying "zomato split" doesn't turn a transfer into food).
 * More specific entries come first: "amazon prime" before "amazon", "jiohotstar" before "jio".
 */
export const KNOWN_MERCHANTS: KnownMerchant[] = [
  { name: "Swiggy", category: "FOOD", pattern: /swiggy|instamart/ },
  { name: "Blinkit", category: "GROCERIES", pattern: /blinkit|grofers/ },
  { name: "Zomato", category: "FOOD", pattern: /zomato/ },
  { name: "Zepto", category: "GROCERIES", pattern: /zepto|kiranakart/ },
  { name: "BigBasket", category: "GROCERIES", pattern: /bigbasket|\bbbnow\b/ },
  { name: "DMart", category: "GROCERIES", pattern: /\bd ?mart\b|avenue ?supermarts/ },
  { name: "JioMart", category: "GROCERIES", pattern: /jiomart/ },
  { name: "Domino's", category: "FOOD", pattern: /domino/ },
  { name: "McDonald's", category: "FOOD", pattern: /mcdonald/ },
  { name: "KFC", category: "FOOD", pattern: /\bkfc\b/ },
  { name: "Starbucks", category: "FOOD", pattern: /starbucks/ },
  { name: "Chaayos", category: "FOOD", pattern: /chaayos/ },
  { name: "Burger King", category: "FOOD", pattern: /burger ?king/ },
  { name: "EatSure", category: "FOOD", pattern: /eatsure/ },
  { name: "Prime Video", category: "SUBSCRIPTIONS", pattern: /amazon ?prime|primevideo/ },
  { name: "Netflix", category: "SUBSCRIPTIONS", pattern: /netflix/ },
  { name: "Spotify", category: "SUBSCRIPTIONS", pattern: /spotify/ },
  { name: "JioHotstar", category: "SUBSCRIPTIONS", pattern: /hotstar/ },
  { name: "JioSaavn", category: "SUBSCRIPTIONS", pattern: /saavn/ },
  { name: "YouTube Premium", category: "SUBSCRIPTIONS", pattern: /youtube/ },
  { name: "Google Play", category: "SUBSCRIPTIONS", pattern: /google ?play|googleplay/ },
  { name: "Apple", category: "SUBSCRIPTIONS", pattern: /apple ?(services|media)|itunes|apple\.com/ },
  { name: "ChatGPT", category: "SUBSCRIPTIONS", pattern: /openai|chatgpt/ },
  { name: "Amazon", category: "SHOPPING", pattern: /amazon|amzn/ },
  { name: "Flipkart", category: "SHOPPING", pattern: /flipkart/ },
  { name: "Myntra", category: "SHOPPING", pattern: /myntra/ },
  { name: "Meesho", category: "SHOPPING", pattern: /meesho/ },
  { name: "Ajio", category: "SHOPPING", pattern: /\bajio\b/ },
  { name: "Nykaa", category: "SHOPPING", pattern: /nykaa/ },
  { name: "Decathlon", category: "SHOPPING", pattern: /decathlon/ },
  { name: "Uber", category: "TRAVEL", pattern: /\buber\b|uberindia|uber ?india/ },
  { name: "Ola", category: "TRAVEL", pattern: /\bola ?(cabs?|money)?\b|olacabs|ani ?technologies/ },
  { name: "Rapido", category: "TRAVEL", pattern: /rapido|roppen/ },
  { name: "Namma Yatri", category: "TRAVEL", pattern: /namma ?yatri/ },
  { name: "IRCTC", category: "TRAVEL", pattern: /irctc/ },
  { name: "redBus", category: "TRAVEL", pattern: /redbus/ },
  { name: "MakeMyTrip", category: "TRAVEL", pattern: /makemytrip|\bmmt\b/ },
  { name: "Metro", category: "TRAVEL", pattern: /\bmetro\b|\bdmrc\b|bmrcl|mmrcl|cmrl/ },
  { name: "FASTag", category: "TRAVEL", pattern: /fastag/ },
  { name: "Fuel", category: "TRAVEL", pattern: /\b(hpcl|bpcl|iocl|indian ?oil|bharat ?petroleum|hindustan ?petroleum|petrol|fuel)\b/ },
  { name: "Jio", category: "BILLS", pattern: /\bjio\b|reliance ?jio|jioprepaid/ },
  { name: "Airtel", category: "BILLS", pattern: /airtel/ },
  { name: "Vi", category: "BILLS", pattern: /vodafone|\bvi ?(prepaid|postpaid|recharge)\b/ },
  { name: "ACT Fibernet", category: "BILLS", pattern: /act ?fibernet/ },
  { category: "BILLS", pattern: /bescom|tangedco|tneb|msedcl|bses|electricity|power ?distribution|indane|bharat ?gas|broadband/ },
  { name: "Udemy", category: "EDUCATION", pattern: /udemy/ },
  { name: "Coursera", category: "EDUCATION", pattern: /coursera/ },
  { name: "Unacademy", category: "EDUCATION", pattern: /unacademy/ },
  { name: "Physics Wallah", category: "EDUCATION", pattern: /physics ?wallah|physicswallah/ },
  { category: "EDUCATION", pattern: /college|university|institute|school|exam ?fee|tuition|academy|nptel|bookstore|stationery|xerox/ },
  { category: "RENT", pattern: /hostel|\bpg\b|paying ?guest|\brent\b|nestaway|stanza|\bzolo\b/ },
  { category: "GROCERIES", pattern: /kirana|general ?store|provision|supermarket|vegetable|fruits|dairy|\bmilk\b/ },
  { category: "FOOD", pattern: /cafe|canteen|\bchai\b|\btea\b|bakery|bakers|restaurant|\bhotel\b|dhaba|juice|\bmess\b|tiffin|biryani|sweets|\bfoods?\b/ },
];

export function matchKnownMerchant(haystack: string): KnownMerchant | null {
  const text = haystack.toLowerCase();
  return KNOWN_MERCHANTS.find((m) => m.pattern.test(text)) ?? null;
}
