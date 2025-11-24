import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    // `dir`/`lang` will be corrected by the client on hydration via LanguageProvider
    return (
      <Html lang="en" dir="ltr" suppressHydrationWarning>
        <Head />
        <body className="min-h-screen bg-[var(--color-bg,#fff)] text-[var(--color-fg,#0f172a)]">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
