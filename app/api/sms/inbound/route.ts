import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { MAX_SMS_LENGTH, ingestSms } from "@/lib/sms/ingest";

// POST /api/sms/inbound
// Headers: x-webhook-secret: <SMS_WEBHOOK_SECRET>
// Body (JSON or form): { from, message } — also accepts From/Body (Twilio) and number/message (Semaphore-style).
// Response: { reply, result, qr_token?, status? }. Add ?format=text for a plain-text reply the gateway can send back.

export const dynamic = "force-dynamic";

function secretMatches(given: string | null) {
  const expected = process.env.SMS_WEBHOOK_SECRET;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function readBody(req: NextRequest): Promise<Record<string, string>> {
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const json = await req.json().catch(() => null);
    return json && typeof json === "object" ? Object.fromEntries(Object.entries(json).map(([k, v]) => [k, String(v ?? "")])) : {};
  }
  const form = await req.formData().catch(() => null);
  return form ? Object.fromEntries(Array.from(form.entries()).map(([k, v]) => [k, String(v)])) : {};
}

export async function POST(req: NextRequest) {
  if (!secretMatches(req.headers.get("x-webhook-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await readBody(req);
  const from = (body.from ?? body.From ?? body.number ?? body.sender ?? "").trim();
  const message = (body.message ?? body.Body ?? body.text ?? "").trim();
  if (!from || !message) {
    return NextResponse.json({ error: "Send 'from' and 'message'." }, { status: 400 });
  }
  if (message.length > MAX_SMS_LENGTH) {
    return NextResponse.json({ error: `Message longer than ${MAX_SMS_LENGTH} characters.` }, { status: 413 });
  }

  const outcome = await ingestSms(from, message);
  if (req.nextUrl.searchParams.get("format") === "text") {
    return new NextResponse(outcome.reply, { headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  return NextResponse.json({ reply: outcome.reply, result: outcome.result, qr_token: outcome.qrToken, status: outcome.status });
}
