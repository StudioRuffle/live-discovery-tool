import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      {
        ok: false,
        supabase: "unconfigured",
        error: "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set. Copy .env.example to .env.local and fill in your Supabase project's values.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }

  try {
    const supabase = await createClient();

    // Any real error here is enough to prove connectivity + credentials work;
    // "table not found" still counts as a successful connection at this phase.
    const { error } = await supabase
      .from("_health_check_placeholder")
      .select("*")
      .limit(1);

    const supabaseReachable =
      !error || error.code === "42P01" /* undefined_table */;

    return NextResponse.json(
      {
        ok: supabaseReachable,
        supabase: supabaseReachable ? "connected" : "unreachable",
        error: supabaseReachable ? null : error?.message,
        timestamp: new Date().toISOString(),
      },
      { status: supabaseReachable ? 200 : 500 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        supabase: "unreachable",
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
