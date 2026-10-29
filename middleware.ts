import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static assets, images and the SMS webhook (it authenticates with its own secret).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/sms|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
