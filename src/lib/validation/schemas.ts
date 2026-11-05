import { z } from "zod";
import { CATEGORIES } from "@/lib/categories";

export const categorySchema = z.enum(CATEGORIES, { error: "Pick one of the listed categories." });

const email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(72),
});

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Tell us what to call you.").max(60, "Keep the name under 60 characters."),
  email,
  password: z
    .string()
    .min(8, "Use at least 8 characters for the password.")
    .max(72, "Passwords can be at most 72 characters."),
});

const columnIndex = z.number().int().min(0).max(60);

export const columnMappingSchema = z
  .object({
    date: columnIndex,
    description: columnIndex,
    debit: columnIndex.nullish(),
    credit: columnIndex.nullish(),
    amount: columnIndex.nullish(),
    drCr: columnIndex.nullish(),
    balance: columnIndex.nullish(),
  })
  .refine((m) => m.debit != null || m.credit != null || m.amount != null, {
    message: "Pick the column that has the money: Debit/Credit, or a single Amount column.",
  })
  .refine(
    (m) => {
      const picked = Object.values(m).filter((v): v is number => typeof v === "number");
      return new Set(picked).size === picked.length;
    },
    { message: "Each column can only be used once." },
  );

export const importOptionsSchema = z.object({
  mode: z.enum(["preview", "commit"]),
  password: z.string().max(100).optional(),
  mapping: z
    .object({ headerIndex: z.number().int().min(0).max(60), columns: columnMappingSchema })
    .optional(),
});

export const recategoriseSchema = z.object({
  category: categorySchema,
  applyToMerchant: z.boolean().default(false),
});

export const MAX_BUDGET_PAISE = 10_00_000_00;

export const budgetSchema = z.object({
  category: categorySchema,
  /** Null removes the budget. */
  limitPaise: z
    .number()
    .int("Budgets are whole paise.")
    .positive("A budget has to be more than ₹0.")
    .max(MAX_BUDGET_PAISE, "That's more than ₹10 lakh a month; try a smaller limit.")
    .nullable(),
});

export const deleteDataSchema = z.object({
  confirm: z.literal("DELETE", { error: 'Type DELETE in capitals to confirm.' }),
  scope: z.enum(["data", "account"]),
});

export const monthKeySchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must look like 2026-11.");

export const transactionQuerySchema = z.object({
  month: monthKeySchema.optional(),
  category: categorySchema.optional(),
  q: z.string().trim().max(60).optional(),
  cursor: z.string().max(40).optional(),
});

/** What Gemini must send back. Anything outside this shape is discarded. */
export const aiCategoryResponseSchema = z.object({
  results: z.array(z.object({ id: z.number().int(), category: z.string() })),
});
