import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export const Navigation = () => {
  const { user } = useAuth();
  const location = useLocation();

  const links = [
    { label: "Home", path: "/" },
    { label: "About", path: "/about" },
    { label: "Chat", path: "/chat" },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors duration-500 font-sans">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-2xl font-black tracking-widest text-gray-900 dark:text-white uppercase flex items-center gap-2">
            NOVA <span className="text-blue-600 dark:text-blue-500">CHAT</span>
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-6">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-xs font-black uppercase tracking-widest transition-colors duration-300 ${
                  location.pathname === link.path
                    ? "text-blue-600 dark:text-blue-500 scale-105"
                    : "text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          <div className="hidden md:block w-[1px] h-6 bg-gray-300 dark:bg-gray-800 mx-2"></div>
          
          {user ? (
            <Link
              to="/profile"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white dark:bg-white/10 dark:text-white dark:hover:bg-white dark:hover:text-black transition-all text-xs font-black uppercase tracking-wider"
            >
              Profile
            </Link>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-all text-xs font-black uppercase tracking-wider shadow-md dark:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            >
              Log In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
