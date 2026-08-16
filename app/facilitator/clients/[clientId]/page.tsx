import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Session } from "@/lib/types";
import { createSession } from "../../actions";

export default async function ClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = createAdminClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (!client) notFound();

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <div>
        <Link href="/facilitator" className="text-sm text-gray-500">
          &larr; Clients
        </Link>
        <h1 className="text-2xl font-bold">{client.name}</h1>
      </div>

      <form action={createSession} className="flex gap-2">
        <input type="hidden" name="client_id" value={clientId} />
        <input
          type="text"
          name="name"
          placeholder="New session name"
          required
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-black px-4 py-2 font-semibold text-white"
        >
          Create session
        </button>
      </form>

      {sessions?.length === 0 && (
        <p className="text-gray-500">No sessions yet — create one above.</p>
      )}

      <ul className="flex flex-col gap-2">
        {(sessions as Session[] | null)?.map((session) => (
          <li key={session.id}>
            <Link
              href={`/facilitator/sessions/${session.id}`}
              className="flex items-center justify-between rounded border px-4 py-3 hover:bg-gray-50"
            >
              <span>{session.name}</span>
              <span
                className={`text-xs uppercase ${
                  session.status === "open" ? "text-green-600" : "text-gray-400"
                }`}
              >
                {session.status}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
