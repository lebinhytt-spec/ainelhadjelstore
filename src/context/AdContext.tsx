import React, { createContext, useContext } from "react";

interface AdContextType {
  withAd: (action: () => void) => void;
}

const AdContext = createContext<AdContextType>({
  withAd: (action) => action(),
});

export function AdProvider({ children }: { children: React.ReactNode }) {
  const withAd = (action: () => void) => {
      action();
  };

  return (
    <AdContext.Provider value={{ withAd }}>
      {children}
    </AdContext.Provider>
  );
}

export const useAd = () => useContext(AdContext);

