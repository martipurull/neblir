export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <section className="w-full max-w-lg rounded-lg bg-white/90 p-6 shadow-md">
        <h1 className="text-2xl font-bold text-customPrimary">
          You are offline
        </h1>
        <p className="mt-3 text-sm text-slate-700">
          Your connection looks unstable right now. If this page was opened
          before, the Neblir app will use cached data when possible.
        </p>
      </section>
    </main>
  );
}
