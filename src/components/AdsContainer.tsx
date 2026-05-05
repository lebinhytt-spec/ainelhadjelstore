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
    
    containerRef.current.innerHTML = "";
    
    const iframe = document.createElement('iframe');
    iframeRef.current = iframe;
    iframe.style.width = "100%";
    iframe.style.minHeight = "100px"; 
    iframe.style.border = "none";
    iframe.style.overflow = "hidden";
    iframe.scrolling = "no";
    
    containerRef.current.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
          <!DOCTYPE html><html><head><style>
          body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; overflow: hidden; }
          </style></head><body>${code}
          <script>
            function sendHeight() {
                const h = document.body.scrollHeight || document.documentElement.scrollHeight;
                window.parent.postMessage({ type: 'resize-ad', height: h }, '*');
            }
            window.onload = function() {
              sendHeight();
              if (window.ResizeObserver) {
                const ro = new ResizeObserver(() => sendHeight());
                ro.observe(document.body);
              }
            };
          </script>
          </body></html>
      `);
      doc.close();
    }
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
