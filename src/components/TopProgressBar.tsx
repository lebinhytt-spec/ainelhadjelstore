import React, { useEffect, useState } from 'react';

export default function TopProgressBar({ isLoading }: { isLoading: boolean }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setVisible(true);
      setProgress(10);
      timer = setInterval(() => {
        setProgress(p => {
            if (p >= 90) return p;
            return p + Math.random() * 10;
        });
      }, 300);
    } else {
      setProgress(100);
      timer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 400);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent">
      <div 
        className="h-full bg-accent transition-all duration-300 ease-out shadow-[0_0_10px_rgba(255,102,0,0.8)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
