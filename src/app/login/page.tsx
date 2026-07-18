import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <div className="min-h-dvh flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
        <h1 className="text-xl font-bold text-neutral-900 mb-1">Agenda de Medicamentos</h1>
        <p className="text-sm text-neutral-500 mb-6">Ingresa el codigo compartido para continuar.</p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2 border border-red-200">
            Codigo incorrecto. Intenta de nuevo.
          </p>
        )}

        <form action={loginAction} className="space-y-4">
          <input type="hidden" name="next" value={next ?? "/"} />
          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-neutral-700 mb-1">
              Codigo
            </label>
            <input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              autoFocus
              required
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-lg tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 text-white font-semibold py-3 text-base active:bg-blue-700"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
