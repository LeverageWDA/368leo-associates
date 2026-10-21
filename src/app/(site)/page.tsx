import { About, Connect, FeaturedRelease, Hero, ListeningRoom, Marquee, Platforms } from '@/components/site/HomeSections';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Marquee />
      <FeaturedRelease />
      <ListeningRoom />
      <Platforms />
      <About />
      <Connect />
    </main>
  );
}
