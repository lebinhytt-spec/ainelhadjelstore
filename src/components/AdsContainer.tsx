import React, { useEffect, useRef } from "react";

interface AdsContainerProps {
  code: string;
  className?: string;
}

const AdsContainer: React.FC<AdsContainerProps> = ({ code, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Some ads rely on `document.write` or specific script loading, so use an iframe.
    const iframe = document.createElement('iframe');
    iframeRef.current = iframe;
    iframe.style.width = "100%";
    iframe.style.minHeight = "60px"; 
    iframe.style.border = "none";
    iframe.style.overflow = "hidden";
    iframe.scrolling = "no";
    
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(iframe);
    
    // Add small delay to let browser append iframe before writing doc
    setTimeout(() => {
        const doc = iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(`
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
              <meta charset="UTF-8">
              <style>
                body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; overflow: hidden; min-height: 50px; }
                * { max-width: 100%; }
              </style>
            </head>
            <body>
              <div id="ad-content">${code}</div>
              <script>
                function sendHeight() {
                  const h = document.getElementById('ad-content').offsetHeight;
                  if (h > 0) {
                      window.parent.postMessage({ type: 'resize-ad', height: h }, '*');
                  }
                }
                
                window.onload = sendHeight;
                setTimeout(sendHeight, 1000);
                setTimeout(sendHeight, 3000);
                
                // Watch for inner mutations (like document.write or async ad load)
                if (window.MutationObserver) {
                    new MutationObserver(sendHeight).observe(document.body, { childList: true, subtree: true, attributes: true });
                }
              </script>
            </body>
            </html>
          `);
          doc.close();
        }
    }, 10);
  }, [code]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
        if (e.data?.type === 'resize-ad' && iframeRef.current?.contentWindow === e.source) {
            iframeRef.current.style.height = `${e.data.height}px`;
        }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return <div ref={containerRef} className={`w-full mx-auto my-4 overflow-hidden flex justify-center ${className}`} />;
}

export default AdsContainer;
