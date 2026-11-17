import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Sphere, Stars, Html } from '@react-three/drei';
import { useNavigate, Link } from 'react-router-dom';
import * as THREE from 'three';

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

// Earth with continents and navigation points
const Earth = ({ setHoveredSection }) => {
  const globeRef = useRef();
  const navigate = useNavigate();
  
  // Load Earth textures
  const [earthMap, earthBump, earthSpec, earthNormal, cloudMap] = useLoader(THREE.TextureLoader, [
    '/earth_daymap.jpg',    // Color texture
    '/earth_normal_map.jpg', // Normal map for terrain
    '/earth_specular_map.jpg', // Specular highlights
    '/earth_bump.jpg',       // Bump map for terrain
    '/earth_clouds.png'      // Cloud layer
  ]);
  
  // Auto rotation - clockwise direction (east to west)
  useFrame((state, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.001; // Positive value for clockwise rotation
    }
  });
  
  // Function to convert latitude/longitude to 3D coordinates on a sphere
  const latLongToVector3 = (lat, lon, radius) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    
    return [x, y, z];
  };
  
  // Navigation points positioned at specific cities with precise coordinates
  // Atlanta: 33.7490° N, 84.3880° W
  // Nairobi: 1.2921° S, 36.8219° E
  // Sydney: 33.8688° S, 151.2093° E
  // London: 51.5074° N, 0.1278° W
  // Tokyo: 35.6762° N, 139.6503° E
  // Rio de Janeiro: 22.9068° S, 43.1729° W (GitHub)
  // Singapore: 1.3521° N, 103.8198° E (LinkedIn)
  const navigationPoints = [
    { 
      section: 'about', 
      label: 'About', 
      position: latLongToVector3(33.7490, -84.3880, 1.5),  // Atlanta
      rotation: [0, 0, 0],
      color: "#d4af37",
      type: 'internal'
    },
    { 
      section: 'projects', 
      label: 'Projects', 
      position: latLongToVector3(-1.2921, 36.8219, 1.5),  // Nairobi
      rotation: [0, 0, 0],
      color: "#d4af37",
      type: 'internal'
    },
    { 
      section: 'goals', 
      label: 'Goals', 
      position: latLongToVector3(-33.8688, 151.2093, 1.5),  // Sydney
      rotation: [0, 0, 0],
      color: "#00e676",
      type: 'internal'
    },
    { 
      section: 'resume', 
      label: 'Resume', 
      position: latLongToVector3(51.5074, -0.1278, 1.5),  // London
      rotation: [0, 0, 0],
      color: "#00e676",
      type: 'internal'
    },
    { 
      section: 'contact', 
      label: 'Contact', 
      position: latLongToVector3(35.6762, 139.6503, 1.5),  // Tokyo
      rotation: [0, 0, 0],
      color: "#ff6b6b",  // Soft red color
      type: 'internal'
    },
    { 
      section: 'github', 
      label: 'GitHub', 
      position: latLongToVector3(-22.9068, -43.1729, 1.5),  // Rio de Janeiro
      rotation: [0, 0, 0],
      color: "#2464eb", // GitHub blue
      url: "https://github.com/Lactoseandtolerance",
      type: 'external'
    },
    { 
      section: 'linkedin', 
      label: 'LinkedIn', 
      position: latLongToVector3(1.3521, 103.8198, 1.5),  // Singapore
      rotation: [0, 0, 0],
      color: "#0077b5", // LinkedIn blue
      url: "https://www.linkedin.com/in/angel-nivar-a00740275/",
      type: 'external'
    }
  ];
  
  // Create a custom star field with colorful stars
  useEffect(() => {
    // Function to create a randomized star with a specific color
    const createColoredStar = (color, size, scene) => {
      const starGeometry = new THREE.SphereGeometry(Math.random() * size, 8, 8);
      const starMaterial = new THREE.MeshBasicMaterial({ color: color });
      const star = new THREE.Mesh(starGeometry, starMaterial);
      
      // Random position
      star.position.x = Math.random() * 2000 - 1000;
      star.position.y = Math.random() * 2000 - 1000;
      star.position.z = Math.random() * 2000 - 1000;
      
      scene.add(star);
      return star;
    };
    
    // Add custom stars effect
    const addCustomStars = () => {
      const scene = globeRef.current?.parent;
      if (!scene) return;
      
      // Create stars with various colors
      const stars = [];
      
      // Create blue stars
      for (let i = 0; i < 50; i++) {
        stars.push(createColoredStar(0x4169E1, 0.2, scene)); // Royal Blue
      }
      
      // Create purple stars
      for (let i = 0; i < 30; i++) {
        stars.push(createColoredStar(0x9370DB, 0.25, scene)); // Medium Purple
      }
      
      // Create red stars
      for (let i = 0; i < 20; i++) {
        stars.push(createColoredStar(0xFF6347, 0.15, scene)); // Tomato
      }
      
      // Create gold stars
      for (let i = 0; i < 40; i++) {
        stars.push(createColoredStar(0xFFD700, 0.18, scene)); // Gold
      }
      
      // Create cyan stars
      for (let i = 0; i < 25; i++) {
        stars.push(createColoredStar(0x00FFFF, 0.22, scene)); // Cyan
      }
      
      // Animate the stars with pulsing effect
      const clock = new THREE.Clock();
      const animate = () => {
        const time = clock.getElapsedTime();
        
        stars.forEach((star, i) => {
          // Pulse size
          const scale = 0.8 + Math.sin(time * 0.5 + i) * 0.3;
          star.scale.set(scale, scale, scale);
          
          // Subtle position shift
          star.position.y += Math.sin(time * 0.2 + i * 0.01) * 0.02;
        });
        
        requestAnimationFrame(animate);
      };
      
      animate();
    };
    
    // Delay adding custom stars to ensure the scene is ready
    const timeout = setTimeout(() => {
      addCustomStars();
    }, 500);
    
    return () => clearTimeout(timeout);
  }, []);

  // Handle external link navigation
  const handleNavigation = (point) => {
    if (point.type === 'external' && point.url) {
      window.open(point.url, '_blank');
    } else {
      navigate(`/${point.section}`);
    }
  };
  
  return (
    <>
      {/* Star field background - bright and static */}
      <Stars 
        radius={100} 
        depth={70}
        count={10000}
        factor={10}
        saturation={2.5}
        fade={false} /* Turned off fade effect */
        speed={0} /* Turned off animation */
      />
      
      {/* Custom cosmic dust effect - replacing the Cloud component that was causing errors */}
      {/* Creating a custom particle system to simulate cosmic dust */}
      <mesh position={[-30, -10, -50]}>
        <sphereGeometry args={[15, 32, 32]} />
        <meshBasicMaterial 
          color="#ffaa44" 
          transparent={true} 
          opacity={0.07} 
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Earth sphere with realistic textures */}
      <group ref={globeRef}>
        {/* Main Earth sphere - brighter with more glow */}
        <Sphere args={[1.5, 64, 64]}>
          <meshPhongMaterial
            map={earthMap}
            bumpMap={earthBump}
            bumpScale={0.08} /* Increased from 0.05 for more pronounced terrain */
            specularMap={earthSpec}
            normalMap={earthNormal}
            normalScale={new THREE.Vector2(3, 3)} /* Increased from 2,2 */
            shininess={25} /* Increased from 15 for more shine */
            specular={new THREE.Color(0x666666)} /* Brighter specular highlights */
            emissive={new THREE.Color(0x223366)} /* Bluer emissive color */
            emissiveIntensity={0.4} /* Increased from 0.2 */
          />
        </Sphere>
        
        {/* Cloud layer */}
        <Sphere args={[1.53, 64, 64]}>  {/* Adjusted for new Earth size */}
          <meshPhongMaterial
            map={cloudMap}
            transparent={true}
            opacity={0.4}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </Sphere>
        
        {/* Navigation points fixed to the globe's surface */}
        {navigationPoints.map((point, index) => (
          <group key={index} position={point.position} rotation={point.rotation}>
            {/* Clickable point */}
            <mesh
              onPointerOver={() => setHoveredSection(point.section)}
              onPointerOut={() => setHoveredSection(null)}
              onClick={() => handleNavigation(point)}
            >
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial
                color={point.color}
                emissive={point.color}
                emissiveIntensity={0.5}
              />
            </mesh>
            
            {/* Label - extra large text for maximum visibility */}
            <Html
              position={[0, 0.3, 0]}
              center
              distanceFactor={1.5}
              style={{
                color: point.color, /* Match the sphere color */
                fontWeight: 'bold',
                fontSize: '42px', /* Dramatically increased from 32px to 42px */
                userSelect: 'none',
                textShadow: '0 0 20px rgba(0,0,0,1), 0 0 30px rgba(0,0,0,0.9), 0 0 5px rgba(255,215,0,0.5)', /* Added gold glow */
                fontFamily: "'Roboto Mono', monospace",
                letterSpacing: '1px'
              }}
            >
              {point.label}
            </Html>
          </group>
        ))}
      </group>
      
      {/* Lighting for the Earth - much brighter */}
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[5, 3, 5]}
        intensity={2}
        castShadow
        color={new THREE.Color(0xffffff)}
      />
      <pointLight position={[-10, 0, -10]} intensity={1} color={new THREE.Color(0x3366ff)} />
      
      {/* Additional light sources for dramatic effect */}
      <pointLight position={[8, -8, 5]} intensity={0.6} color={new THREE.Color(0xff9900)} />
      <spotLight position={[-5, 5, -5]} intensity={0.8} angle={0.5} color={new THREE.Color(0xccddff)} />
    </>
  );
};

// Main Navigation component
const Navigation = () => {
  const [hoveredSection, setHoveredSection] = useState(null);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const controlsRef = useRef();
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
    <div className="fixed top-0 left-0 w-full h-screen z-10 bg-space">
      <div className="absolute w-full text-center z-5 top-[10%]">
        <h1 className="text-[5rem] max-md:text-[3.5rem] font-bold mb-4 bg-linear-45/srgb from-gold to-cream bg-clip-text text-transparent text-shadow-[0_0_10px_rgba(0,0,0,0.5)] animate-float">
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
      <div className="absolute top-[30px] left-[30px] z-15 flex flex-col gap-2 max-w-[280px]">
        <div className={`${hintClass} ${hintVisibility(showHelpTooltip)}`}>
          <svg className="inline mr-2 align-middle" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#d4af37" viewBox="0 0 16 16">
            <path d="M6.5 1.75a.75.75 0 0 0-1.5 0V8a.75.75 0 0 0 1.5 0V1.75zm3.5 0a.75.75 0 0 0-1.5 0V8a.75.75 0 0 0 1.5 0V1.75zm3.5 0a.75.75 0 0 0-1.5 0V8a.75.75 0 0 0 1.5 0V1.75zM13.25 9a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5h10.5zM2.75 12a.75.75 0 0 0 0 1.5h10.5a.75.75 0 0 0 0-1.5H2.75z"/>
          </svg>
          <span className="text-gold font-bold">Click and drag</span> to rotate the globe for navigation
          <p className="mt-[5px] text-[0.8rem] opacity-80">Use the mouse wheel to zoom in/out</p>
        </div>
        
        {/* Click hint for navigation points */}
        <div className={`${hintClass} ${hintVisibility(showHelpTooltip)} mt-[2px] text-center`}>
          Click on the colored spheres to navigate to different sections
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
      
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <Earth setHoveredSection={setHoveredSection} />
        <OrbitControls
          ref={controlsRef}
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.3}
          autoRotate={true}
          autoRotateSpeed={0.5} // Positive value for clockwise rotation
          enableDamping={true}
          dampingFactor={0.05}
        />
      </Canvas>
      
      <div className="absolute w-full text-center z-5 bottom-[15%]">
        <p className="text-[1.8rem] max-md:text-[1.4rem] font-light tracking-[2px] text-[#e0e0e0] text-shadow-[0_0_15px_rgba(0,0,0,0.8)] opacity-90 max-w-[800px] mx-auto animate-[fade-in-up_2s_ease-out,pulse-soft_4s_ease-in-out_infinite]">
          Exploring the infinite possibilities of technology
        </p>
      </div>
    </div>
  );
};

export default Navigation;