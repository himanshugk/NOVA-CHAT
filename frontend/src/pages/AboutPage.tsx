
const AboutPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-500 font-sans w-full">
      <main className="flex-1 flex flex-col pt-16 px-6 max-w-5xl mx-auto w-full pb-24">
        
        {/* Why this platform */}
        <section className="mb-20 animate-fade-in">
          <div className="text-blue-600 dark:text-blue-500 font-black tracking-widest uppercase mb-4 text-xs">Mission Statement</div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-gray-900 dark:text-white leading-none mb-8">
            WHY THIS <br/> <span className="text-blue-600 dark:text-blue-500">PLATFORM?</span>
          </h1>
          <div className="prose dark:prose-invert max-w-3xl">
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
              We built NOVA because modern communication demands instant, frictionless connectivity paired with absolute security. 
              NOVA scales dynamically, allowing users to enter as anonymous guests or formalize their identity with permanent accounts.
            </p>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed font-medium mt-4">
              It is not just a chatroom; it is a universal relay designed for gamers, creators, and teams who need a high-performance, dark-mode native hub that never gets in their way.
            </p>
          </div>
        </section>

        {/* Demographic Tags Explanation */}
        <section className="w-full">
          <div className="text-blue-600 dark:text-blue-500 font-black tracking-widest uppercase mb-4 text-xs">System Architecture</div>
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900 dark:text-white mb-8">
            DEFAULT DEMOGRAPHIC TAGS
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-medium max-w-3xl mb-12">
            Upon formal registration, the NOVA backend automatically evaluates your physical age and assigns a strict Demographic Tag to your profile to help appropriately calibrate interactions and spaces across the community. These are the default configurations:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Child Tag */}
            <div className="flex flex-col p-8 rounded-2xl bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 shadow-sm transition-all hover:border-green-500 dark:hover:border-green-500 group">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-green-600 dark:text-green-400 font-black">C</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-wider">CHILD</h3>
              <div className="text-xs font-bold font-mono text-gray-500 mb-4 bg-gray-100 dark:bg-black py-1 px-3 w-fit rounded">AGE 5 - 12</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                The preliminary gateway tag. Reserved for young pilots requiring highly moderated safety constraints.
              </p>
            </div>

            {/* Teen Tag */}
            <div className="flex flex-col p-8 rounded-2xl bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 shadow-sm transition-all hover:border-blue-500 dark:hover:border-blue-500 group">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-blue-600 dark:text-blue-400 font-black">T</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-wider">TEEN</h3>
              <div className="text-xs font-bold font-mono text-gray-500 mb-4 bg-gray-100 dark:bg-black py-1 px-3 w-fit rounded">AGE 13 - 19</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Standard demographic tag for adolescents. Enables expanded networking while preserving baseline visibility filters.
              </p>
            </div>

            {/* Adult Tag */}
            <div className="flex flex-col p-8 rounded-2xl bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 shadow-sm transition-all hover:border-red-500 dark:hover:border-red-500 group">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-red-600 dark:text-red-400 font-black">A</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-wider">ADULT</h3>
              <div className="text-xs font-bold font-mono text-gray-500 mb-4 bg-gray-100 dark:bg-black py-1 px-3 w-fit rounded">AGE 20+</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                The unrestricted tag. Indicates the pilot has reached maturity, granting full access to all platform domains perfectly.
              </p>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
};

export default AboutPage;
