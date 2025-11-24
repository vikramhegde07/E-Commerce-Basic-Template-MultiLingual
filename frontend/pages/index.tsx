// pages/index.tsx
import AboutSection from '@/components/Home/AboutSection';
import GlobalPresence from '@/components/Home/GlobalPresence';
import HomeHeroCarousel from '@/components/Home/HomeHeroCarousel';
import IndustriesServed from '@/components/Home/IndustriesServed';
import ProductRange from '@/components/Home/ProductRange';
import QualityAndRnD from '@/components/Home/QualityAndRnD';

export default function Home() {
  return (
    <>
      <HomeHeroCarousel
        urls={[
          '/banners/ame.png',
          '/banners/slide2.jpg',
          '/banners/slide3.jpg',
        ]}
      />
      <AboutSection mediaSrc="/about-teaser.jpg" />
      <ProductRange />
      <GlobalPresence />
      <IndustriesServed />
      <QualityAndRnD />
    </>
  );
}
