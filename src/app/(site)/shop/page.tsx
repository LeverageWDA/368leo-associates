import type { Metadata } from 'next';
import Link from 'next/link';
import { ReleaseSleeve } from '@/components/music/ReleaseSleeve';
import { RELEASE_TYPE_LABEL, isSafeExternalUrl } from '@/lib/catalog';
import { getReleases, getSiteSettings } from '@/server/content/repository';

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Music and merchandise from Leo & Associates.',
  alternates: { canonical: '/shop' },
};

/*
 * Storefront. Products are sold on the label's external Shopify store; this
 * page lists verified product links only. Direct checkout (Stripe) is not shown
 * until the product and fulfilment model is confirmed and approved.
 */
export default async function ShopPage() {
  const [releases, settings] = await Promise.all([getReleases(), getSiteSettings()]);
  const forSale = releases
    .map(r => ({ release: r, link: r.links.find(l => l.platform === 'shopify' && isSafeExternalUrl(l.url)) }))
    .filter((x): x is { release: typeof x.release; link: NonNullable<typeof x.link> } => !!x.link);
  const store = settings.shopifyStoreUrl && isSafeExternalUrl(settings.shopifyStoreUrl) ? settings.shopifyStoreUrl : null;

  return (
    <main id="main" className="pg pg-shop">
      <header className="shop-head">
        <h1 className="shop-word">SH<em>o</em>P</h1>
        <p className="shop-intro">Music and merchandise from the label. Purchases are completed securely on the label&apos;s store — you&apos;ll be told before you leave this site.</p>
      </header>

      <div className="shop-lanes">
        <section className="shop-lane" aria-labelledby="lane-music">
          <div className="shop-lane-head">
            <h2 id="lane-music">Music</h2>
            <span>{forSale.length ? `${forSale.length} available` : 'Opening soon'}</span>
          </div>
          {forSale.length === 0 ? (
            <p className="shop-empty">Releases will be available to buy here once their store listings are verified.</p>
          ) : (
            <ul className="shop-items">
              {forSale.map(({ release, link }) => (
                <li key={release.slug} className="shop-item">
                  <Link href={`/music/${release.slug}`} className="shop-item-art" tabIndex={-1} aria-hidden="true">
                    <ReleaseSleeve release={release} size="sm" />
                  </Link>
                  <div className="shop-item-body">
                    <Link href={`/music/${release.slug}`} className="shop-item-title">{release.title}</Link>
                    <span className="shop-item-meta">{release.artist.name} · {RELEASE_TYPE_LABEL[release.type]}</span>
                  </div>
                  <a className="shop-item-buy" href={link.url} target="_blank" rel="noopener noreferrer" data-analytics="shopify_link_clicked">
                    Buy on Shopify <span aria-hidden="true">↗</span>
                    <span className="sr-only"> (opens the Shopify store in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="shop-lane shop-lane-merch" aria-labelledby="lane-merch">
          <div className="shop-lane-head">
            <h2 id="lane-merch">Merchandise</h2>
            <span>Opening soon</span>
          </div>
          <p className="shop-empty">Label merchandise will be listed here when it is ready. Nothing is for sale yet.</p>
        </section>
      </div>

      <section className="shop-foot">
        {store ? (
          <a className="buy-link" href={store} target="_blank" rel="noopener noreferrer" data-analytics="shopify_link_clicked">
            <span>Visit the full store on Shopify</span>
            <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <p className="muted-note muted-light">The store link will appear here once confirmed.</p>
        )}
        <p className="shop-fineprint">Payment details are entered on the store&apos;s checkout, never on this website.</p>
      </section>
    </main>
  );
}
