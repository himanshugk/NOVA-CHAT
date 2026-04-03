import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-500 font-sans w-full">
      <main className="flex-1 flex flex-col">
        {/* Custom Hero Section */}
        <section className="relative w-full h-[90vh] flex flex-col justify-center items-center overflow-hidden">
          {/* Background visuals */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-gray-50 dark:from-blue-900/10 dark:to-[#0a0a0a]" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-[100px] animate-pulse delay-1000" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-500 mb-6">
              Welcome to the Next Generation
            </p>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-gray-900 dark:text-white leading-[0.9] mb-8">
              ENTER <br className="hidden md:block"/>
              <span className="text-blue-600 dark:text-blue-500 drop-shadow-sm">THE NOVA CHAT</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 font-medium max-w-2xl mb-12">
              A scalable, real-time networking standard built for modern gamers.
              Configure your pilot identity and instantly link into the universal relay.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Link 
                to="/chat" 
                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-sm hover:scale-105 hover:bg-blue-700 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] dark:shadow-[0_0_30px_rgba(59,130,246,0.3)]"
              >
                Launch Chat
              </Link>
              <Link 
                to="/about" 
                className="px-8 py-4 bg-white dark:bg-[#111] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-all"
              >
                Discover More
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="w-full py-24 bg-white dark:bg-[#111] border-t border-gray-100 dark:border-gray-900 transition-colors duration-500 z-10 relative">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: "Instant Connection",
                desc: "No friction. Enter as a guest or formally register to lock your callsign."
              },
              {
                title: "Dynamic Identities",
                desc: "Configure your demographic tags natively. Scalable profile framework."
              },
              {
                title: "Secure Architecture",
                desc: "Real-time expiring sessions and robust OTP-driven password recoveries."
              }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-start p-8 rounded-2xl bg-gray-50 dark:bg-black border border-gray-100 dark:border-gray-800 transition-colors">
                <div className="text-blue-600 dark:text-blue-500 mb-4 font-black">/0{i + 1}</div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3 uppercase tracking-wider">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
