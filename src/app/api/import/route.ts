import { NextResponse } from "next/server";
import { importOptionsSchema } from "@/lib/validation/schemas";
import { HttpError, withUser } from "@/server/http";
import { handleImport, MAX_FILE_BYTES } from "@/server/import";

// PDF parsing and the AI call can take a while on a cold start.
export const maxDuration = 60;

export const POST = withUser(async (req, userId) => {
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_FILE_BYTES + 64 * 1024) throw new HttpError(413, "That file is over 4 MB. Download a shorter date range and try again.");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new HttpError(400, "Upload a statement file.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Upload a statement file.");

  const mappingRaw = form.get("mapping");
  const options = importOptionsSchema.parse({
    mode: form.get("mode"),
    password: (form.get("password") as string | null) || undefined,
    mapping: typeof mappingRaw === "string" && mappingRaw ? safeJson(mappingRaw) : undefined,
  });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = await handleImport(userId, bytes, options.mode, { password: options.password, mapping: options.mapping });
  return NextResponse.json(result);
});

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Column mapping was not valid.");
  }
}
