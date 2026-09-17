import { ensureCatalog, getPromotions, savePromotions } from "../../../server/catalog-store";
import { verifyCmsSession } from "../../../server/cms-session";

type SaleBody = { storePercent?: unknown; clearProductSales?: unknown };

export async function GET(request: Request) {
  if (!await verifyCmsSession(request)) return Response.json({ error: "Developer login required." }, { status: 401 });
  const db = await ensureCatalog();
  return Response.json(await getPromotions(db), { headers: { "cache-control": "no-store" } });
}

export async function PATCH(request: Request) {
  if (!await verifyCmsSession(request)) return Response.json({ error: "Developer login required." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as SaleBody;
  const db = await ensureCatalog();
  const current = await getPromotions(db);
  const storePercent = Math.max(0, Math.min(90, Math.round(Number(body.storePercent) || 0)));
  const saved = await savePromotions({
    ...current,
    storePercent,
    productPercents: body.clearProductSales === true ? {} : current.productPercents,
  });
  return Response.json({ ok: true, promotions: saved });
}
