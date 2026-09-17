/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages */

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  return <main className="success-page"><div className="success-card"><img src="/puffy-pops-logo.png" alt="Puffy Pops" /><span className="success-mark">✓</span><p className="eyebrow">Order received</p><h1>Your joy is <em>on its way.</em></h1><p>The branch dashboard received order <strong>{order ?? "your order"}</strong>. Keep your phone nearby in case the team needs to confirm anything.</p><a href="/">Back to the menu</a></div></main>;
}
