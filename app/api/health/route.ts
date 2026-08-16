import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PostgREST error codes meaning "connected fine, this table just doesn't
// exist yet" - expected pre-Phase-1, and still proof the connection works.
const TABLE_NOT_FOUND_CODES = new Set(["42P01", "PGRST205"]);

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

    const { error } = await supabase
      .from("_health_check_placeholder")
      .select("*")
      .limit(1);

    const supabaseReachable = !error || TABLE_NOT_FOUND_CODES.has(error.code ?? "");

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
