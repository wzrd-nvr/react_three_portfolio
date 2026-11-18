import React from 'react';

const createStarField = (size, count, color, duration) => {
  let shadows = '';
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * 2000);
    const y = Math.floor(Math.random() * 2000);
    shadows += `${x}px ${y}px ${color}, `;
  }
  shadows = shadows.slice(0, -2);
  
  const layerStyle = { width: size, height: size, boxShadow: shadows };
  
  // The offset copy 2000px below makes the -2000px drift loop seamlessly.
  return (
    <div style={{ ...layerStyle, animation: `star-drift ${duration}s linear infinite` }}>
      <div className="absolute top-[2000px]" style={layerStyle} />
    </div>
  );
};

const AdvancedStarBackground = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full z-0 bg-linear-to-b/srgb from-space to-space-deep overflow-hidden">
      {/* Small white stars */}
      {createStarField(1, 500, '#FFF', 150)}
      
      {/* Medium white stars */}
      {createStarField(2, 200, '#FFF', 200)}
      
      {/* Gold stars to match the theme */}
      {createStarField(1, 100, '#d4af37', 175)}
      {createStarField(2, 50, '#d4af37', 225)}
      
      {/* Blue stars to add variety */}
      {createStarField(1, 100, '#4169E1', 180)}
      {createStarField(2, 50, '#87CEEB', 210)}
    </div>
  );
};

export default AdvancedStarBackground;
