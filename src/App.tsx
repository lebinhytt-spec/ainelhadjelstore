import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AdProvider } from "./context/AdContext";
import { ThemeProvider } from "./context/ThemeContext";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import About from "./pages/About";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import { App as CapApp } from "@capacitor/app";
import UpdateManager from "./components/UpdateManager";
import InAppNotification from "./components/InAppNotification";
import { useAuth } from "./context/AuthContext";

function RootRedirect() {
  const { user, loading } = useAuth();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) return null;

  if (user) return <Home />;

  // User is not logged in
  if (isMobile) {
    return <Auth />; // Force login on mobile
  } else {
    return <Landing />; // Show landing page on web
  }
}

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
    <ThemeProvider>
      <AuthProvider>
        <AdProvider>
          <BrowserRouter>
            <DeepLinkHandler>
              <UpdateManager />
              <InAppNotification />
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/about" element={<About />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/chat/:chatUserId" element={<Chat />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </DeepLinkHandler>
          </BrowserRouter>
        </AdProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
