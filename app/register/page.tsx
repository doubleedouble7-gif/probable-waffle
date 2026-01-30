import { redirect } from "next/navigation";
import { createUser, findUserByEmail } from "../../lib/auth";
import { createSession } from "../../lib/session";
import { registerSchema } from "../../lib/validators";

export default function RegisterPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="card max-w-lg">
      <h2 className="text-xl font-semibold">Create account</h2>
      {searchParams.error && (
        <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {searchParams.error}
        </p>
      )}
      <form className="mt-6 grid gap-4" action={registerAction}>
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" placeholder="Aiman" />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required />
        </div>
        <div>
          <label htmlFor="confirmPassword">Confirm password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" required />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

async function registerAction(formData: FormData) {
  "use server";
  const payload = Object.fromEntries(formData.entries());
  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success) {
    redirect(`/register?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Invalid input")}`);
  }

  const { name, email, password } = parsed.data;
  const existing = await findUserByEmail(email);
  if (existing) {
    redirect("/register?error=Email%20already%20registered");
  }

  const user = await createUser(name || null, email, password);
  await createSession(user.id);
  redirect("/dashboard");
}
