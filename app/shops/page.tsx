import { redirect } from "next/navigation";
import { prisma } from "../../lib/db";
import { requireUser } from "../../lib/require-user";
import { shopSchema } from "../../lib/validators";

export default async function ShopsPage({ searchParams }: { searchParams: { error?: string } }) {
  const user = await requireUser();
  const shops = await prisma.shop.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } });

  return (
    <div className="grid gap-8">
      <section className="card">
        <h2 className="text-xl font-semibold">Add shop</h2>
        {searchParams.error && (
          <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {searchParams.error}
          </p>
        )}
        <form className="mt-6 grid gap-4 md:grid-cols-2" action={createShopAction}>
          <div className="md:col-span-2">
            <label htmlFor="name">Name *</label>
            <input id="name" name="name" required />
          </div>
          <div>
            <label htmlFor="categoryTags">Category tags</label>
            <input id="categoryTags" name="categoryTags" placeholder="Service, Tyre" />
          </div>
          <div>
            <label htmlFor="address">Address</label>
            <input id="address" name="address" />
          </div>
          <div>
            <label htmlFor="googleMapsUrl">Google Maps URL</label>
            <input id="googleMapsUrl" name="googleMapsUrl" />
          </div>
          <div>
            <label htmlFor="lat">Latitude</label>
            <input id="lat" name="lat" type="number" step="0.000001" />
          </div>
          <div>
            <label htmlFor="lng">Longitude</label>
            <input id="lng" name="lng" type="number" step="0.000001" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" rows={3} />
          </div>
          <div className="md:col-span-2">
            <button type="submit">Save shop</button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2 className="text-xl font-semibold">Your shops</h2>
        <div className="mt-4 grid gap-3">
          {shops.length === 0 && <p className="text-sm text-slate-500">No shops yet.</p>}
          {shops.map((shop) => (
            <div key={shop.id} className="rounded-lg border border-slate-200 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{shop.name}</p>
                  <p className="text-sm text-slate-500">{shop.categoryTags ?? ""}</p>
                </div>
                <form action={deleteShopAction}>
                  <input type="hidden" name="shopId" value={shop.id} />
                  <button type="submit" className="bg-rose-600 hover:bg-rose-500">Delete</button>
                </form>
              </div>
              {shop.googleMapsUrl && (
                <a className="text-sm text-slate-600 underline" href={shop.googleMapsUrl} target="_blank" rel="noreferrer">
                  Open in Maps
                </a>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

async function createShopAction(formData: FormData) {
  "use server";
  const user = await requireUser();
  const payload = Object.fromEntries(formData.entries());
  const parsed = shopSchema.safeParse(payload);
  if (!parsed.success) {
    redirect(`/shops?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Invalid input")}`);
  }

  const data = parsed.data;
  await prisma.shop.create({
    data: {
      userId: user.id,
      name: data.name,
      categoryTags: data.categoryTags || null,
      address: data.address || null,
      googleMapsUrl: data.googleMapsUrl || null,
      lat: data.lat ? Number(data.lat) : null,
      lng: data.lng ? Number(data.lng) : null,
      notes: data.notes || null
    }
  });
  redirect("/shops");
}

async function deleteShopAction(formData: FormData) {
  "use server";
  const user = await requireUser();
  const shopId = String(formData.get("shopId"));
  await prisma.shop.deleteMany({ where: { id: shopId, userId: user.id } });
  redirect("/shops");
}
