import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AdProvider } from "./context/AdContext";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import About from "./pages/About";
import { App as CapApp } from "@capacitor/app";
import UpdateManager from "./components/UpdateManager";

function DeepLinkHandler({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for deep links (e.g. app opening from URL)
    const listener = CapApp.addListener('appUrlOpen', async (event) => {
      const slug = event.url.split('.com').pop();
      if (slug) {
        navigate(slug);
      }
    });

    return () => {
      listener.then(unlisten => unlisten.remove());
    };
  }, [navigate]);

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <AdProvider>
        <BrowserRouter>
          <DeepLinkHandler>
            <UpdateManager />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </DeepLinkHandler>
        </BrowserRouter>
      </AdProvider>
    </AuthProvider>
  );
}
