import { prisma } from "../../lib/db";
import { requireUser } from "../../lib/require-user";
import { carSchema } from "../../lib/validators";
import { redirect } from "next/navigation";

export default async function CarsPage({ searchParams }: { searchParams: { error?: string } }) {
  const user = await requireUser();
  const cars = await prisma.car.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });

  return (
    <div className="grid gap-8">
      <section className="card">
        <h2 className="text-xl font-semibold">Add car</h2>
        {searchParams.error && (
          <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {searchParams.error}
          </p>
        )}
        <form className="mt-6 grid gap-4 md:grid-cols-2" action={createCarAction}>
          <div className="md:col-span-2">
            <label htmlFor="nickname">Nickname *</label>
            <input id="nickname" name="nickname" required />
          </div>
          <div>
            <label htmlFor="plateNumber">Plate Number</label>
            <input id="plateNumber" name="plateNumber" />
          </div>
          <div>
            <label htmlFor="make">Make</label>
            <input id="make" name="make" />
          </div>
          <div>
            <label htmlFor="model">Model</label>
            <input id="model" name="model" />
          </div>
          <div>
            <label htmlFor="year">Year</label>
            <input id="year" name="year" type="number" />
          </div>
          <div className="md:col-span-2">
            <button type="submit">Save car</button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2 className="text-xl font-semibold">Your cars</h2>
        <div className="mt-4 grid gap-3">
          {cars.length === 0 && <p className="text-sm text-slate-500">No cars added yet.</p>}
          {cars.map((car) => (
            <div key={car.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{car.nickname}</p>
                <p className="text-sm text-slate-500">
                  {car.plateNumber ?? ""} {car.make ? `• ${car.make}` : ""} {car.model ? `• ${car.model}` : ""} {car.year ? `• ${car.year}` : ""}
                </p>
              </div>
              <form action={deleteCarAction}>
                <input type="hidden" name="carId" value={car.id} />
                <button type="submit" className="bg-rose-600 hover:bg-rose-500">Delete</button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

async function createCarAction(formData: FormData) {
  "use server";
  const user = await requireUser();
  const payload = Object.fromEntries(formData.entries());
  const parsed = carSchema.safeParse(payload);
  if (!parsed.success) {
    redirect(`/cars?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Invalid input")}`);
  }

  const { nickname, plateNumber, make, model, year } = parsed.data;
  await prisma.car.create({
    data: {
      userId: user.id,
      nickname,
      plateNumber: plateNumber || null,
      make: make || null,
      model: model || null,
      year: year ? Number(year) : null
    }
  });
  redirect("/cars");
}

async function deleteCarAction(formData: FormData) {
  "use server";
  const user = await requireUser();
  const carId = String(formData.get("carId"));
  await prisma.car.deleteMany({ where: { id: carId, userId: user.id } });
  redirect("/cars");
}
