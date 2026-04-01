// components/analytics/GoogleAnalytics.tsx
'use client';
import Script from 'next/script';

export default function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_title: document.title,
            page_location: window.location.href,
            anonymize_ip: true,
          });

          // Custom events
          window.trackKurwa = function(source) {
            gtag('event', 'kurwa_click', {
              event_category: 'engagement',
              event_label: source || 'button',
            });
          };
          window.trackDonate = function(amount) {
            gtag('event', 'begin_checkout', {
              currency: 'PLN',
              value: amount,
            });
          };
          window.trackLuckyShot = function(tier) {
            gtag('event', 'lucky_shot_win', {
              event_category: 'monetization',
              event_label: 'tier_' + tier,
            });
          };
        `}
      </Script>
    </>
  );
}
