import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-8 text-center relative z-1 bg-[#080808]/50">
      <div className="max-w-[1200px] mx-auto px-4">
        <p className="text-[1rem] text-muted">
          &copy; {currentYear} Angel Nivar. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
