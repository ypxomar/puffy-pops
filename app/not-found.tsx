import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import NotFoundTitle from "./soft-serve/NotFoundTitle";

const helpfulLinks = [
  ["/menu", "See the menu"],
  ["/locations", "Find a branch"],
  ["/track-order", "Track an order"],
  ["/story", "Our story"],
] as const;

/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages -- The 404 page uses the same plain storefront links and CMS artwork as every other page. */
export default function NotFound() {
  return (
    <main className="notfound-home">
      <NotFoundTitle />
      <SiteHeader />
      <section className="notfound-hero" aria-labelledby="notfound-title">
        <div className="notfound-copy">
          <p className="cinema-kicker">Error 404 · nothing melting here</p>
          <h1 id="notfound-title">This page<br /><em>slipped off</em><br />the cone.</h1>
          <p>We looked in the freezer, behind the counter and under the napkins. Whatever you were after isn&apos;t here any more — but the good stuff is one tap away.</p>
          <div className="cinema-actions notfound-actions">
            <a href="/" className="cinema-button primary">Back to the swirl <span>&#8599;</span></a>
            <a href="/menu" className="cinema-button secondary">Build your box <span>&rarr;</span></a>
          </div>
          <nav className="notfound-links" aria-label="Helpful pages">
            {helpfulLinks.map(([href, label]) => <a href={href} key={href}>{label}<span> &#8599;</span></a>)}
            <a href="tel:+201002018510">Call +20 100 201 8510<span> &#8599;</span></a>
          </nav>
        </div>
        <figure className="notfound-media">
          <img src="/api/media?slot=home-favorite-1" alt="A Puffy Pops box waiting to be opened" />
          <figcaption><span>Still here</span><strong>Pick. Pin.<br />Pop.</strong></figcaption>
          <i aria-hidden="true">404</i>
        </figure>
      </section>
      <SiteFooter />
    </main>
  );
}
