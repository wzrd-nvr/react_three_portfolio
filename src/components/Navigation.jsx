import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Link, useNavigate } from 'react-router-dom';
import GlobeScene from './Globe';

const hintClass =
  'bg-surface/80 text-white px-[18px] py-3 rounded-lg border border-gold/50 backdrop-blur-[10px] text-[0.9rem] shadow-[0_5px_15px_rgba(0,0,0,0.4)] transition-all duration-500 ease-[ease]';
const hintVisibility = (show) =>
  show ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2.5 pointer-events-none';

const dropdownItemClass = 'block px-[15px] py-3 text-white transition-all duration-200 ease-[ease]';
const hoverClasses = {
  gold: 'hover:bg-gold/20 hover:text-gold',
  emerald: 'hover:bg-emerald/20 hover:text-emerald',
  coral: 'hover:bg-coral/20 hover:text-coral',
  github: 'hover:bg-github/20 hover:text-github',
  linkedin: 'hover:bg-linkedin/20 hover:text-linkedin',
};

// Main Navigation component
const Navigation = () => {
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [departing, setDeparting] = useState(false);
  const navigate = useNavigate();

  // Show help tooltip for 8 seconds when the component first loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHelpTooltip(true);
    }, 1500);

    const hideTimer = setTimeout(() => {
      setShowHelpTooltip(false);
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);
  
  return (
    <div className="fixed top-0 left-0 w-full h-screen z-10 bg-night">
      <div className="absolute w-full text-center z-5 top-[6%] max-md:top-[12%] pointer-events-none">
        <h1 className="text-[3.5rem] max-md:text-[2.25rem] font-bold mb-4 bg-linear-45/srgb from-gold to-cream bg-clip-text text-transparent text-shadow-[0_0_10px_rgba(0,0,0,0.5)] animate-float">
          Angel Nivar
        </h1>
      </div>
      
      {/* Help button to toggle tooltip */}
      <button
        className="absolute top-[30px] left-[30px] size-10 rounded-full bg-surface/80 border border-gold/50 text-gold flex justify-center items-center font-sans text-[20px] leading-[normal] cursor-pointer z-20 transition-all duration-300 ease-[ease] hover:bg-gold/30 hover:scale-110"
        onClick={() => setShowHelpTooltip(!showHelpTooltip)}
      >
        ?
      </button>
      
      {/* Help tooltips in a container */}
      <div className="absolute top-[84px] left-[30px] z-15 flex flex-col gap-2 max-w-[280px]">
        <div className={`${hintClass} ${hintVisibility(showHelpTooltip)}`}>
          <svg className="inline mr-2 align-middle" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#d4af37" viewBox="0 0 16 16">
            <path d="M6.5 1.75a.75.75 0 0 0-1.5 0V8a.75.75 0 0 0 1.5 0V1.75zm3.5 0a.75.75 0 0 0-1.5 0V8a.75.75 0 0 0 1.5 0V1.75zm3.5 0a.75.75 0 0 0-1.5 0V8a.75.75 0 0 0 1.5 0V1.75zM13.25 9a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5h10.5zM2.75 12a.75.75 0 0 0 0 1.5h10.5a.75.75 0 0 0 0-1.5H2.75z"/>
          </svg>
          <span className="text-gold font-bold">Drag</span> to spin the globe
          <p className="mt-[5px] text-[0.8rem] opacity-80">It stays where you leave it</p>
        </div>
        
        {/* Click hint for navigation points */}
        <div className={`${hintClass} ${hintVisibility(showHelpTooltip)} mt-[2px] text-center`}>
          Click a flag to visit that section
        </div>
      </div>
      
      {/* Simple dropdown navigation */}
      <div className="absolute top-[30px] right-[30px] z-20">
        <button
          className="bg-surface/80 text-gold px-[15px] py-2.5 rounded-[5px] border border-gold/50 backdrop-blur-[10px] cursor-pointer flex items-center gap-[5px] font-sans text-[13.333px] leading-[normal] transition-all duration-300 ease-[ease] hover:bg-gold/30"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          Menu
          <svg
            className={`transition-transform duration-300 ease-[ease] ${dropdownOpen ? 'rotate-180' : 'rotate-0'}`}
            xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"
          >
            <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
          </svg>
        </button>
        <div
          className={`absolute top-[45px] right-0 bg-surface/95 rounded-[5px] border border-gold/50 backdrop-blur-[10px] w-[150px] shadow-[0_5px_15px_rgba(0,0,0,0.3)] overflow-hidden transition-all duration-300 ease-[ease] z-25 ${
            dropdownOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2.5 pointer-events-none'
          }`}
        >
          <Link to="/about" className={`${dropdownItemClass} ${hoverClasses.gold}`}>About</Link>
          <Link to="/projects" className={`${dropdownItemClass} ${hoverClasses.gold}`}>Projects</Link>
          <Link to="/goals" className={`${dropdownItemClass} ${hoverClasses.emerald}`}>Goals</Link>
          <Link to="/resume" className={`${dropdownItemClass} ${hoverClasses.emerald}`}>Resume</Link>
          <Link to="/contact" className={`${dropdownItemClass} ${hoverClasses.coral}`}>Contact</Link>
          <a href="https://github.com/Lactoseandtolerance" target="_blank" rel="noopener noreferrer" className={`${dropdownItemClass} ${hoverClasses.github}`}>GitHub</a>
          <a href="https://www.linkedin.com/in/angel-nivar-a00740275/" target="_blank" rel="noopener noreferrer" className={`${dropdownItemClass} ${hoverClasses.linkedin}`}>LinkedIn</a>
        </div>
      </div>
      
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <GlobeScene onNavigate={navigate} onDeparture={() => setDeparting(true)} />
        </Suspense>
      </Canvas>

      <div
        className={`absolute inset-0 z-30 bg-night pointer-events-none transition-opacity duration-700 delay-300 ease-in ${
          departing ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      <div className="absolute w-full text-center z-5 bottom-[7%] px-4 pointer-events-none">
        <p className="text-[1.2rem] max-md:text-[1rem] font-light tracking-[2px] text-[#e0e0e0] text-shadow-[0_0_15px_rgba(0,0,0,0.8)] opacity-90 max-w-[800px] mx-auto animate-[fade-in-up_2s_ease-out,pulse-soft_4s_ease-in-out_infinite]">
          Exploring the infinite possibilities of technology
        </p>
      </div>
    </div>
  );
};

export default Navigation;