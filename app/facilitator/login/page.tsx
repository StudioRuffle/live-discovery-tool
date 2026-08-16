import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next = "/facilitator", error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <form
        action={login}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border p-8"
      >
        <h1 className="text-xl font-bold">Facilitator sign-in</h1>
        <input type="hidden" name="next" value={next} />
        <input
          type="password"
          name="pin"
          placeholder="PIN"
          autoFocus
          required
          inputMode="numeric"
          className="rounded border px-4 py-3 text-lg"
        />
        {error && <p className="text-sm text-red-600">Incorrect PIN.</p>}
        <button
          type="submit"
          className="rounded bg-black px-4 py-3 text-lg font-semibold text-white"
        >
          Enter
        </button>
      </form>
    </main>
  );
}
