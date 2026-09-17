export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    service: "puffy-control-api",
    protocol: 5,
    compatibleProtocols: [4, 5],
    loginMethods: ["management-code", "cashier-credentials", "developer-code"],
  }, {
    headers: {
      "cache-control": "no-store",
    },
  });
}
