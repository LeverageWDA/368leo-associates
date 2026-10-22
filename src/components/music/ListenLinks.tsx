import { PLATFORM_LABEL, isSafeExternalUrl, type PlatformLink } from '@/lib/catalog';

/**
 * Verified streaming destinations. Every link says where it goes and opens in
 * a new tab; Shopify is excluded here (see PurchaseOptions).
 */
export function ListenLinks({ links, tone = 'dark' }: { links: PlatformLink[]; tone?: 'dark' | 'light' }) {
  const listen = links.filter(l => l.platform !== 'shopify' && isSafeExternalUrl(l.url));
  if (listen.length === 0) return <p className={`muted-note muted-${tone}`}>Streaming links will appear here once verified.</p>;
  return (
    <ul className={`out-links out-${tone}`}>
      {listen.map(l => (
        <li key={l.url}>
          <a href={l.url} target="_blank" rel="noopener noreferrer" data-platform={l.platform} data-analytics="streaming_link_clicked">
            <span>{l.label ?? PLATFORM_LABEL[l.platform]}</span>
            <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens {PLATFORM_LABEL[l.platform]} in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * Where to buy. Shopify is an external store: the visitor is told they are
 * leaving the site. Direct (Stripe) purchase is not offered until the product
 * and fulfilment model is confirmed.
 */
export function PurchaseOptions({ links, tone = 'dark' }: { links: PlatformLink[]; tone?: 'dark' | 'light' }) {
  const shopify = links.find(l => l.platform === 'shopify' && isSafeExternalUrl(l.url));
  if (!shopify) return <p className={`muted-note muted-${tone}`}>Purchase options will be listed here once confirmed.</p>;
  return (
    <div className={`buy buy-${tone}`}>
      <a className="buy-link" href={shopify.url} target="_blank" rel="noopener noreferrer" data-analytics="shopify_link_clicked">
        <span>Buy on Shopify</span>
        <span aria-hidden="true">↗</span>
      </a>
      <p className="buy-note">You&apos;ll leave Leo &amp; Associates and complete your purchase on the label&apos;s Shopify store.</p>
    </div>
  );
}
