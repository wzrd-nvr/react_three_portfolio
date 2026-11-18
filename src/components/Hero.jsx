import React from 'react';

const subtitleClass = 'text-[1.8rem] max-md:text-[1.4rem] text-silver mb-8 max-w-[800px]';

const Hero = () => {
  return (
    <section
      id="hero"
      className="h-screen flex flex-col justify-center items-center text-center relative overflow-hidden pt-[60px]"
    >
      <div className="z-2 relative max-w-[800px] p-[30px] bg-black/60 rounded-[10px] backdrop-blur-[8px] shadow-[0_10px_25px_rgba(0,0,0,0.5)] border border-gold/30">
        <h1 className="text-[4.5rem] max-md:text-[3rem] text-gold mb-4 font-bold text-shadow-[0_0_10px_rgba(0,0,0,0.5)]">
          Angel Nivar
        </h1>
        <p className={subtitleClass}>Exploring the infinite possibilities of technology.</p>
        <p className={subtitleClass}>Welcome to my portfolio</p>
      </div>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-[1rem] after:content-[''] after:block after:size-5 after:border-r-2 after:border-b-2 after:border-white after:transform-[rotate(45deg)] after:mx-auto after:my-2.5 after:animate-scroll-down">
        Scroll to learn more
      </div>
    </section>
  );
};

export default Hero;
