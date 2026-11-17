import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const dropdownItemClass = 'block px-[15px] py-3 text-white transition-all duration-200 ease-[ease]';
const hoverClasses = {
  gold: 'hover:bg-gold/20 hover:text-gold',
  emerald: 'hover:bg-emerald/20 hover:text-emerald',
  coral: 'hover:bg-coral/20 hover:text-coral',
  github: 'hover:bg-github/20 hover:text-github',
  linkedin: 'hover:bg-linkedin/20 hover:text-linkedin',
};

const barClass =
  'block w-[25px] h-[3px] bg-gold rounded-[2px] transition-all duration-300 ease-[ease] group-hover:bg-gold-bright group-hover:shadow-[0_0_8px_rgba(212,175,55,0.4)]';

const SimpleNav = () => {
  const location = useLocation();
  const path = location.pathname;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  return (
    <nav className="fixed top-[30px] right-[30px] z-100">
      <button
        className="group bg-transparent border-none cursor-pointer flex flex-col gap-[5px] p-0 transition-all duration-300 ease-[ease]"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <span className={`${barClass} ${dropdownOpen ? 'transform-[rotate(45deg)_translate(6px,6px)]' : ''}`}></span>
        <span className={`${barClass} ${dropdownOpen ? 'opacity-0' : ''}`}></span>
        <span className={`${barClass} ${dropdownOpen ? 'transform-[rotate(-45deg)_translate(6px,-6px)]' : ''}`}></span>
      </button>
      
      <div
        className={`absolute top-[45px] right-0 bg-surface/95 rounded-[5px] border border-gold/50 backdrop-blur-[10px] w-[150px] shadow-[0_5px_15px_rgba(0,0,0,0.3)] overflow-hidden transition-all duration-300 ease-[ease] z-25 ${
          dropdownOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2.5 pointer-events-none'
        }`}
      >
        <Link to="/" className={`${dropdownItemClass} ${hoverClasses.gold}`}>Home</Link>
        <Link to="/about" className={`${dropdownItemClass} ${hoverClasses.gold}`}>About</Link>
        <Link to="/projects" className={`${dropdownItemClass} ${hoverClasses.gold}`}>Projects</Link>
        <Link to="/goals" className={`${dropdownItemClass} ${hoverClasses.emerald}`}>Goals</Link>
        <Link to="/resume" className={`${dropdownItemClass} ${hoverClasses.emerald}`}>Resume</Link>
        <Link to="/contact" className={`${dropdownItemClass} ${hoverClasses.coral}`}>Contact</Link>
        <a 
          href="https://github.com/Lactoseandtolerance" 
          target="_blank" 
          rel="noopener noreferrer" 
          className={`${dropdownItemClass} ${hoverClasses.github}`}
        >
          GitHub
        </a>
        <a 
          href="https://www.linkedin.com/in/angel-nivar-a00740275/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className={`${dropdownItemClass} ${hoverClasses.linkedin}`}
        >
          LinkedIn
        </a>
      </div>
    </nav>
  );
};

export default SimpleNav;
