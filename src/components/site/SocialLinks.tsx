import { SOCIAL_LABEL, isSafeExternalUrl, type SocialLink } from '@/lib/catalog';

/**
 * Verified social accounts. Renders nothing (or `empty`) when the label has
 * not supplied any — handles are never guessed.
 */
export function SocialLinks({
  links,
  className = 'social-links',
  empty = null,
  showHandles = false,
}: {
  links: SocialLink[];
  className?: string;
  empty?: React.ReactNode;
  showHandles?: boolean;
}) {
  const safe = links.filter(l => isSafeExternalUrl(l.url));
  if (safe.length === 0) return <>{empty}</>;
  return (
    <ul className={className}>
      {safe.map(l => (
        <li key={l.url}>
          <a href={l.url} target="_blank" rel="noopener noreferrer me">
            {SOCIAL_LABEL[l.network]}
            {showHandles && l.handle && <span> {l.handle}</span>}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
