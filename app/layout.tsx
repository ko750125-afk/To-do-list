import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "할일 - Premium Todo List",
  description: "시니어 감성의 모던하고 세련된 할 일 관리 대시보드 및 모바일 기기 실시간 동기화 서비스",
  manifest: "/manifest.json",
  metadataBase: new URL("https://todo-premium.vercel.app"),
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "-flYc7eFAYr8wMg0uS1ERJe5TzFg5ezHTfaoPvP5fUQ",
  },
  openGraph: {
    title: "할일 - Premium Todo List",
    description: "시니어 감성의 모던하고 세련된 할 일 관리 대시보드 및 모바일 기기 실시간 동기화 서비스",
    url: "https://todo-premium.vercel.app",
    siteName: "할일",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "할일 - Premium Todo List",
    description: "시니어 감성의 모던하고 세련된 할 일 관리 대시보드 및 모바일 기기 실시간 동기화 서비스",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "할일",
  },
};

export const viewport: Viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "할일 - Premium Todo List",
  "description": "시니어 감성의 모던하고 세련된 할 일 관리 대시보드 및 모바일 기기 실시간 동기화 서비스",
  "url": "https://todo-premium.vercel.app",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "All",
  "browserRequirements": "Requires JavaScript. Requires HTML5.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "KRW"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        {/* AddToAny Share Buttons */}
        <footer className="a2a-footer">
          <div className="a2a_kit a2a_kit_size_32 a2a_default_style">
            <a className="a2a_dd" href="https://www.addtoany.com/share"></a>
            <a className="a2a_button_telegram"></a>
            <a className="a2a_button_kakao"></a>
            <a className="a2a_button_threads"></a>
            <a className="a2a_button_line"></a>
          </div>
          <Script
            src="https://static.addtoany.com/menu/page.js"
            strategy="lazyOnload"
          />
        </footer>
      </body>
    </html>
  );
}
