export type PaymentRequest = {
  orderNumber: string;
  amount: number;
  customerName: string;
  phone: string;
};

export function cardPaymentConfigured() {
  // Intentionally false until Puffy Pops chooses a gateway. Replace this adapter
  // with the provider's server SDK and webhook verification.
  return false;
}

export async function createCardCheckout(_request: PaymentRequest): Promise<{ redirectUrl: string }> {
  void _request;
  throw new Error("Card payments are not connected yet. Choose cash on delivery or add the selected payment provider in app/server/payment.ts.");
}
