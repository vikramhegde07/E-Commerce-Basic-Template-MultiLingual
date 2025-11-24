import type { AppProps } from 'next/app';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import Navbar from '@/components/Common/Navbar';
import Footer from '@/components/Common/Footer';
import '@/styles/globals.css';
import { useEffect } from 'react';

// bridge for the inline select in Navbar to call setLocale without importing the component here
function LocaleBridge() {
  const { setLocale } = useLanguage();
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setLocale(detail as any);
    };
    document.addEventListener('app:set-locale', handler as EventListener);
    // expose method too
    (window as any).__setLocale = setLocale;
    return () => {
      document.removeEventListener('app:set-locale', handler as EventListener);
      delete (window as any).__setLocale;
    };
  }, [setLocale]);
  return null;
}

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <LanguageProvider>
      <LocaleBridge />
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Component {...pageProps} />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}
