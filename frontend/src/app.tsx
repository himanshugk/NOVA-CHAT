import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import AboutPage from "./pages/AboutPage";
import Chat from "./pages/Chat";
import Auth from "./pages/Auth";
import ProfilePage from "./pages/Profile";
import { Navigation } from "./components/layout/Navigation";

const App = () => {
  return (
    <div className="relative min-h-[100dvh] w-screen overflow-x-hidden flex flex-col font-sans">
      <Navigation />
      <div className="flex-1 mt-16 w-full relative">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
