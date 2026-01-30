import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="grid gap-10">
      <section className="card">
        <h1 className="text-3xl font-bold">Track every sen of your car spending</h1>
        <p className="mt-3 text-slate-600">
          Manage multiple cars, capture receipts, and stay ahead of service, battery, roadtax, and insurance reminders.
        </p>
        <div className="mt-6 flex gap-4">
          <Link className="rounded-md bg-slate-900 px-4 py-2 text-white" href="/register">
            Get started
          </Link>
          <Link className="rounded-md border border-slate-300 px-4 py-2" href="/login">
            Login
          </Link>
        </div>
      </section>
      <section className="grid gap-6 md:grid-cols-3">
        <div className="card">
          <h3 className="font-semibold">Multi-car tracking</h3>
          <p className="mt-2 text-sm text-slate-600">Keep expenses, receipts, and reminders per vehicle.</p>
        </div>
        <div className="card">
          <h3 className="font-semibold">Receipt uploads</h3>
          <p className="mt-2 text-sm text-slate-600">Capture JPG/PNG/WEBP receipts with vendor & shop info.</p>
        </div>
        <div className="card">
          <h3 className="font-semibold">Reports & reminders</h3>
          <p className="mt-2 text-sm text-slate-600">View monthly totals and keep tabs on upcoming renewals.</p>
        </div>
      </section>
    </div>
  );
}
