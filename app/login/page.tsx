import { redirect } from "next/navigation";
import { findUserByEmail, verifyPassword } from "../../lib/auth";
import { createSession } from "../../lib/session";
import { loginSchema } from "../../lib/validators";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="card max-w-lg">
      <h2 className="text-xl font-semibold">Login</h2>
      {searchParams.error && (
        <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {searchParams.error}
        </p>
      )}
      <form className="mt-6 grid gap-4" action={loginAction}>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

async function loginAction(formData: FormData) {
  "use server";
  const payload = Object.fromEntries(formData.entries());
  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    redirect(`/login?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Invalid input")}`);
  }

  const { email, password } = parsed.data;
  const user = await findUserByEmail(email);
  if (!user) {
    redirect("/login?error=Invalid%20credentials");
  }
  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    redirect("/login?error=Invalid%20credentials");
  }
  await createSession(user.id);
  redirect("/dashboard");
}
