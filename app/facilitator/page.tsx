import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Client } from "@/lib/types";
import { createClientRecord } from "./actions";

// PIN-gated live dashboard - never statically prerender it. (Also sidesteps
// Netlify not exposing --secret env vars at build time, which would break
// prerendering here anyway since this reads the service-role key.)
export const dynamic = "force-dynamic";

export default async function FacilitatorHome() {
  const supabase = createAdminClient();
  const { data: clients, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <h1 className="font-display text-3xl">Clients</h1>

      <form action={createClientRecord} className="flex gap-2">
        <input
          type="text"
          name="name"
          placeholder="New client name"
          required
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark"
        >
          Add
        </button>
      </form>

      {clients?.length === 0 && (
        <p className="text-ink/50">No clients yet — add one above.</p>
      )}

      <ul className="flex flex-col gap-2">
        {(clients as Client[] | null)?.map((client) => (
          <li key={client.id}>
            <Link
              href={`/facilitator/clients/${client.id}`}
              className="block rounded border border-ink/15 px-4 py-3 hover:bg-brand/5"
            >
              {client.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
