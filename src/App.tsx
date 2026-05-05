import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AdProvider } from "./context/AdContext";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import About from "./pages/About";

export default function App() {
  return (
    <AuthProvider>
      <AdProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </BrowserRouter>
      </AdProvider>
    </AuthProvider>
  );
}
