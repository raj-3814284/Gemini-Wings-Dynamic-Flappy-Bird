
import React, { useEffect, useState } from 'react';

const LoadingScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) {
          clearInterval(timer);
          return 100;
        }
        const diff = Math.random() * 20;
        return Math.min(oldProgress + diff, 100);
      });
    }, 250);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-between bg-[#4fc3f7] overflow-hidden p-8 font-sans">
      {/* Decorative Sky Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#4fc3f7] via-[#81d4fa] to-[#e1f5fe]"></div>
      
      {/* Cityscape Silhouette */}
      <div className="absolute bottom-[20%] w-full h-32 flex items-end justify-center opacity-40 pointer-events-none">
        <div className="flex items-end gap-1">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="bg-[#29b6f6] w-6 rounded-t-sm" 
              style={{ height: `${20 + Math.random() * 60}px` }}
            ></div>
          ))}
        </div>
      </div>

      {/* Clouds */}
      <div className="absolute top-[10%] left-[10%] animate-pulse opacity-80">
        <i className="fa-solid fa-cloud text-white text-7xl"></i>
      </div>
      <div className="absolute top-[25%] right-[10%] animate-pulse opacity-60">
        <i className="fa-solid fa-cloud text-white text-5xl"></i>
      </div>

      {/* Main Logo Content */}
      <div className="relative mt-20 flex flex-col items-center">
        <div className="relative">
          <h1 className="text-7xl font-black text-white italic uppercase leading-none tracking-tighter drop-shadow-[0_6px_0_rgba(46,125,50,1)] text-center">
            GEMINI<br/><span className="text-[#f7d302]">WINGS</span>
          </h1>
          {/* Animated Bird Figure */}
          <div className="absolute -right-16 top-1/2 -translate-y-1/2 text-7xl animate-bounce">
            🐤
          </div>
        </div>
      </div>

      {/* Bottom Visual Elements */}
      <div className="w-full max-w-sm flex flex-col items-center mb-32 z-10">
        {/* Stylized Loading Bar Container */}
        <div className="w-full h-12 bg-[#1b5e20] border-[5px] border-[#1b5e20] rounded-3xl p-1 relative overflow-hidden shadow-[0_8px_0_rgba(0,0,0,0.2)]">
          {/* Glossy Fill */}
          <div 
            className="h-full bg-gradient-to-b from-[#b2ff59] via-[#76ff03] to-[#33691e] rounded-2xl transition-all duration-300 relative"
            style={{ width: `${progress}%` }}
          >
            {/* Top Gloss highlight */}
            <div className="absolute top-1 left-2 right-2 h-[40%] bg-white/40 rounded-full"></div>
          </div>
        </div>
        
        <h2 className="mt-6 text-4xl font-black text-white italic uppercase tracking-[0.2em] drop-shadow-[0_4px_0_rgba(46,125,50,1)] text-center">
          LOADING...
        </h2>
      </div>

      {/* Lush Green Ground Decoration */}
      <div className="absolute bottom-0 w-full h-[22%] bg-[#76ff03] border-t-[8px] border-[#1b5e20] flex items-end justify-center overflow-hidden">
        <div className="flex gap-[-10px] items-end translate-y-4">
           {[...Array(12)].map((_, i) => (
             <div 
               key={i} 
               className="w-20 h-20 bg-[#64dd17] rounded-full shrink-0 shadow-inner"
             ></div>
           ))}
        </div>
        {/* Subtle grass highlights */}
        <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;
