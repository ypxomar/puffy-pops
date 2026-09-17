import ReceiptClient from "./ReceiptClient";

export default async function ReceiptPage({ params, searchParams }: { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ token?: string; pos?: string }> }) {
  const [{ orderNumber }, query] = await Promise.all([params, searchParams]);
  return <ReceiptClient orderNumber={orderNumber} token={query.token ?? ""} pos={query.pos === "1"} />;
}
