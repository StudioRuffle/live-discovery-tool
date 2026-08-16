async function getHealth() {
  // Server Component: hit our own health route on the server so this page
  // also proves server -> Supabase connectivity, not just client -> API.
  const base =
    process.env.URL ?? process.env.DEPLOY_PRIME_URL ?? "http://localhost:3000";

  try {
    const res = await fetch(`${base}/api/health`, { cache: "no-store" });
    return (await res.json()) as {
      ok: boolean;
      supabase: string;
      error: string | null;
    };
  } catch {
    return { ok: false, supabase: "unreachable", error: "fetch failed" };
  }
}

export default async function Home() {
  const health = await getHealth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-bold">Live Discovery Session Tool</h1>
      <p className="text-lg text-gray-500">Phase 0 — scaffold + deploy pipeline</p>

      <div
        className={`mt-6 rounded-lg border px-6 py-4 ${
          health.ok
            ? "border-green-500 bg-green-50 text-green-800"
            : "border-red-500 bg-red-50 text-red-800"
        }`}
      >
        <p className="font-mono text-sm">
          Supabase: <strong>{health.supabase}</strong>
        </p>
        {health.error && (
          <p className="mt-1 font-mono text-xs opacity-70">{health.error}</p>
        )}
      </div>
    </main>
  );
}
