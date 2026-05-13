import React, { useEffect, useRef } from 'react';

interface AdmobBannerProps {
  appId: string;
  adUnitId: string;
  className?: string;
}

const AdmobBanner: React.FC<AdmobBannerProps> = ({ appId, adUnitId, className = "" }) => {
  const adBlockRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!appId || !adUnitId) return;

    // Inject the script if not present
    const SCRIPT_ID = "adsbygoogle-script";
    let scriptExists = document.getElementById(SCRIPT_ID);
    if (!scriptExists) {
        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${appId}`;
        script.async = true;
        script.crossOrigin = "anonymous";
        document.head.appendChild(script);
    }
    
    // Safety check: is the element still in the DOM?
    const checkAndPush = () => {
      try {
        if (adBlockRef.current && document.body.contains(adBlockRef.current)) {
          if (!adBlockRef.current.hasAttribute('data-adsbygoogle-status')) {
            const ads = (window as any).adsbygoogle || [];
            ads.push({});
          }
        }
      } catch (e: any) {
        const msg = e?.message || "";
        if (msg.includes("already have ads") || msg.includes("no_div")) {
          // Expected race conditions or secondary initialization attempts
        } else {
          console.warn("AdSense push issue:", e);
        }
      }
    };

    // Stagger initialization to avoid "no_div" and "already have ads" errors 
    // when multiple banners mount simultaneously or when DOM is shifting
    const timer = setTimeout(checkAndPush, 400);
    
    return () => clearTimeout(timer);
  }, [appId, adUnitId]);

  return (
    <div className={`w-full overflow-hidden flex justify-center my-4 min-h-[100px] bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', minHeight: '90px' }}
        data-ad-client={appId}
        data-ad-slot={adUnitId}
        data-ad-format="auto"
        data-full-width-responsive="true"
        ref={adBlockRef as any}
      />
    </div>
  );
};

export default AdmobBanner;
