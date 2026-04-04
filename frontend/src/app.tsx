import { Routes, Route, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import AboutPage from "./pages/AboutPage";
import Chat from "./pages/Chat";
import Auth from "./pages/Auth";
import ProfilePage from "./pages/Profile";
import Widget from "./pages/Widget";
import { Navigation } from "./components/layout/Navigation";

const App = () => {
  const location = useLocation();
  const isWidget = location.pathname === "/widget";

  return (
    <div className="relative min-h-[100dvh] w-screen overflow-x-hidden flex flex-col font-sans bg-transparent">
      {!isWidget && <Navigation />}
      <div className={`flex-1 w-full relative ${!isWidget ? "mt-16" : ""}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/widget" element={<Widget />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
