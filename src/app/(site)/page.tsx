import { AboutTeaser, Connect, FeaturedRelease, Hero, ListeningRoom, Marquee, Platforms } from '@/components/site/HomeSections';
import { getFeaturedRelease, getSiteSettings } from '@/server/content/repository';

export default async function HomePage() {
  const [release, settings] = await Promise.all([getFeaturedRelease(), getSiteSettings()]);
  return (
    <main id="main">
      <Hero />
      <Marquee />
      <FeaturedRelease release={release} />
      <ListeningRoom release={release} />
      <Platforms release={release} />
      <AboutTeaser />
      <Connect socials={settings.socials} />
    </main>
  );
}
