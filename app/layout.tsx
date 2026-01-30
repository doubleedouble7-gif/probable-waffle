import "../styles/globals.css";
import Link from "next/link";
import { getSessionUser, destroySession } from "../lib/session";

export const metadata = {
  title: "Car Spend MY",
  description: "Track car spending and reminders in Malaysia"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-bold">Car Spend MY</Link>
            <nav className="flex items-center gap-4 text-sm">
              {user ? (
                <>
                  <Link href="/dashboard">Dashboard</Link>
                  <Link href="/cars">Cars</Link>
                  <Link href="/expenses/new">Add Expense</Link>
                  <Link href="/shops">Shops</Link>
                  <Link href="/reports">Reports</Link>
                  <Link href="/reminders">Reminders</Link>
                  <form
                    action={async () => {
                      "use server";
                      await destroySession();
                    }}
                  >
                    <button type="submit">Logout</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login">Login</Link>
                  <Link href="/register">Register</Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
