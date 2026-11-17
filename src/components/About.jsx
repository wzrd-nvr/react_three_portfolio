import React, { useEffect, useRef, useState } from 'react';

const paragraphClass = 'text-[1.2rem] leading-[1.8] mb-6 text-ink';

const shineClass =
  "before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-linear-to-r/srgb before:from-transparent before:to-transparent before:transition-[left] before:ease-[ease] hover:before:left-full";

const itemBoxClass =
  "relative h-(--box-height) max-md:h-(--box-height-mobile) overflow-hidden rounded-[10px] shadow-[0_10px_25px_rgba(0,0,0,0.4)] animate-[item-float_var(--float-duration)_ease-in-out_infinite] [animation-delay:var(--float-delay)] cursor-pointer after:content-[''] after:absolute after:inset-0 after:bg-linear-to-b/srgb after:from-transparent after:from-70% after:to-black/70 after:z-1";

const itemBoxStyle = (item) => ({
  '--box-height': item.height,
  '--box-height-mobile': item.mobileHeight,
  '--float-min': `${item.minFloat}px`,
  '--float-max': `${item.maxFloat}px`,
  '--float-duration': item.animationDuration,
  '--float-delay': item.animationDelay,
});

// Individual image component with state-based transitions
const SlidingImages = ({ images, boxIndex, imageType }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  useEffect(() => {
    // Calculate a different delay for each box
    const baseDelay = 4000; // Longer base delay (4 seconds)
    const randomOffset = Math.floor(Math.random() * 2000); // Random offset between 0-2000ms
    const delay = baseDelay + (boxIndex * 800) + randomOffset; // 4-8.2s with randomization
    
    // Set up the interval for changing images
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % images.length);
    }, delay);
    
    // Clean up the interval
    return () => clearInterval(interval);
  }, [boxIndex, images.length]);
  
  return (
    <>
      {images.map((image, imageIndex) => (
        <div
          key={imageIndex}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1200ms] ease-[ease-in-out] ${imageIndex === activeIndex ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundImage: `url(/images/${image})` }}
        />
      ))}
    </>
  );
};

const About = () => {
  // States
  const [activeImage, setActiveImage] = useState(null);
  
  // Refs for parallax
  const fashionBoxesRef = useRef([]);
  const decorBoxesRef = useRef([]);
  
  // Skills list with grouping by category
  const skills = [
    { name: 'Python', category: 'Programming' },
    { name: 'JavaScript', category: 'Programming' },
    { name: 'HTML', category: 'Web' },
    { name: 'CSS', category: 'Web' },
    { name: 'SQL', category: 'Data' },
    { name: 'React', category: 'Web' },
    { name: 'Three.js', category: 'Graphics' },
    { name: 'Data Visualization', category: 'Data' },
    { name: 'Machine Learning', category: 'AI' },
    { name: 'Database Design', category: 'Data' },
    { name: 'RESTful APIs', category: 'Web' },
    { name: 'Pandas', category: 'Data' },
    { name: 'Scikit-learn', category: 'AI' },
    { name: 'Firebase', category: 'Backend' },
    { name: 'OpenCV', category: 'AI' },
    { name: 'OOP', category: 'Programming' },
    { name: 'Data Structures', category: 'Programming' },
    { name: 'Content-Based Filtering', category: 'AI' },
    { name: 'Collaborative Filtering', category: 'AI' },
    { name: 'Plotly', category: 'Data' },
    { name: 'Tkinter', category: 'UI' }
  ];

  // Color coded skills based on category
  const getCategoryColor = (category) => {
    const colors = {
      'Programming': '#3f51b5', // Indigo
      'Web': '#2196f3',         // Blue
      'Data': '#009688',        // Teal
      'AI': '#9c27b0',          // Purple
      'Graphics': '#ff9800',    // Orange
      'Backend': '#f44336',     // Red
      'UI': '#4caf50'           // Green
    };
    
    return colors[category] || '#d4af37'; // Gold default
  };
  
  // Enhanced parallax scrolling effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      // Apply parallax to fashion boxes
      fashionBoxesRef.current.forEach((box, index) => {
        if (!box) return;
        
        const rect = box.getBoundingClientRect();
        
        // Only apply effect when box is in viewport
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          // Different speeds based on box position
          const speed = 0.15 + (index * 0.03);
          const yPos = (scrollY - box.offsetTop) * speed;
          
          // Apply the transform with a subtle movement
          box.style.transform = `translateY(${yPos}px)`;
          
          // Add depth perception by scaling slightly
          const scale = 1 + (yPos * 0.0005);
          box.style.transform += ` scale(${scale})`;
        }
      });
      
      // Apply parallax to decor boxes
      decorBoxesRef.current.forEach((box, index) => {
        if (!box) return;
        
        const rect = box.getBoundingClientRect();
        
        // Only apply effect when box is in viewport
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          // Different speeds based on box position (reverse direction from fashion)
          const speed = 0.12 + (index * 0.02);
          const yPos = (scrollY - box.offsetTop) * speed * -1; // Reverse direction
          
          // Apply the transform with a subtle movement
          box.style.transform = `translateY(${yPos}px)`;
          
          // Add depth perception by scaling slightly
          const scale = 1 + (Math.abs(yPos) * 0.0003);
          box.style.transform += ` scale(${scale})`;
        }
      });
    };
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Close enlarged image when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeImage !== null && e.target.classList.contains('overlay')) {
        setActiveImage(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeImage]);
  
  // Fashion images data with randomized properties
  const fashionImages = [
    {
      images: ['Fashion1.jpg', 'Fashion2.jpg', 'Fashion3.jpg', 'Fashion4.jpg'],
      height: '320px',
      mobileHeight: '240px',
      minFloat: -8,
      maxFloat: 2,
      animationDuration: '9s',
      animationDelay: '0s'
    },
    {
      images: ['Fashion3.jpg', 'Fashion4.jpg', 'Fashion5.jpg', 'Fashion6.jpg'],
      height: '380px',
      mobileHeight: '260px',
      minFloat: -2,
      maxFloat: 12,
      animationDuration: '11s',
      animationDelay: '0.3s'
    },
    {
      images: ['Fashion5.jpg', 'Fashion6.jpg', 'Fashion7.jpg', 'Fashion1.jpg'],
      height: '340px',
      mobileHeight: '230px',
      minFloat: -15,
      maxFloat: -5,
      animationDuration: '8.5s',
      animationDelay: '0.7s'
    },
    {
      images: ['Fashion7.jpg', 'Fashion3.jpg', 'Fashion1.jpg', 'Fashion2.jpg'],
      height: '300px',
      mobileHeight: '220px',
      minFloat: -4,
      maxFloat: 6,
      animationDuration: '10s',
      animationDelay: '1.1s'
    }
  ];
  
  // Decor images data with randomized properties (different from fashion)
  const decorImages = [
    {
      images: ['cool1.jpg', 'cool5.jpg', 'cool3.jpg', 'cool8.jpg'],
      height: '370px',
      mobileHeight: '250px',
      minFloat: -6,
      maxFloat: 4,
      animationDuration: '10.5s',
      animationDelay: '0.2s'
    },
    {
      images: ['cool2.jpg', 'cool6.jpg', 'cool4.jpg', 'cool7.jpg'],
      height: '330px',
      mobileHeight: '230px',
      minFloat: -3,
      maxFloat: 9,
      animationDuration: '9.5s',
      animationDelay: '0.5s'
    },
    {
      images: ['cool3.jpg', 'cool7.jpg', 'cool1.jpg', 'cool5.jpg'],
      height: '350px',
      mobileHeight: '240px',
      minFloat: -10,
      maxFloat: -3,
      animationDuration: '11.5s',
      animationDelay: '0.8s'
    },
    {
      images: ['cool4.jpg', 'cool8.jpg', 'cool2.jpg', 'cool6.jpg'],
      height: '310px',
      mobileHeight: '220px',
      minFloat: -5,
      maxFloat: 8,
      animationDuration: '8.5s',
      animationDelay: '1.3s'
    }
  ];
  
  // Toggle image enlarge on click
  const toggleImageView = (index, type) => {
    if (activeImage && activeImage.index === index && activeImage.type === type) {
      setActiveImage(null);
    } else {
      setActiveImage({ index, type });
    }
  };
  
  return (
    <section
      id="about"
      className="h-screen overflow-y-auto overflow-x-hidden relative bg-surface-deep [scrollbar-width:thin] [scrollbar-color:var(--color-line)_var(--color-surface-deep)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-surface-deep [&::-webkit-scrollbar-thumb]:bg-line [&::-webkit-scrollbar-thumb]:rounded-md"
    >
      <div className="max-w-[1200px] mx-auto relative z-1 px-5">
        <h2 className="text-[3rem] font-bold text-gold mb-8 text-center pt-20 max-md:text-[2.5rem]">About Me</h2>
        
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <div>
            <p className={paragraphClass}>
              I'm a passionate developer with skills in a variety of technologies.
              I enjoy getting lost in learning and applying my skills to the fullest
              extent I can!
            </p>
            <p className={paragraphClass}>
              My journey in technology began with a curiosity about how things work,
              which quickly evolved into a passion for creating and innovating. I've
              developed expertise in various programming languages and technologies,
              always striving to expand my knowledge and skills.
            </p>
            <p className={paragraphClass}>
              When I'm not coding, I enjoy exploring modern fashion trends and finding
              creative ways to express myself. I believe that creativity and technical
              skill go hand in hand, and I bring both to every project I work on.
            </p>
          </div>
          
          <div className="bg-panel/70 rounded-[10px] p-8 border border-line relative min-h-[300px]">
            <h3 className="text-[1.8rem] font-bold text-gold mb-6">My Skills</h3>
            <div className="grid grid-cols-3 gap-[15px] max-md:grid-cols-2">
              {skills.map((skill, index) => (
                <div 
                  key={index}
                  className={`bg-surface text-white border border-gold rounded-[10px] p-3 flex items-center justify-center text-center text-[0.9rem] transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] origin-center cursor-pointer h-[45px] relative overflow-hidden hover:scale-110 hover:bg-gold hover:text-space hover:z-10 hover:shadow-[0_5px_15px_rgba(212,175,55,0.3)] ${shineClass} before:via-gold/20 before:duration-500`}
                  style={{
                    borderColor: getCategoryColor(skill.category),
                    animationDelay: `${index * 0.05}s`,
                    boxShadow: `0 0 10px ${getCategoryColor(skill.category)}30`
                  }}
                >
                  {skill.name}
                </div>
              ))}
            </div>
          </div>
          
          <div
            className={`bg-linear-135/srgb from-panel/90 to-surface/80 border-2 border-gold rounded-xl p-10 mt-8 relative overflow-hidden transition-all duration-300 ease-[ease] hover:-translate-y-[5px] hover:shadow-[0_10px_30px_rgba(212,175,55,0.25)] ${shineClass} before:via-gold/10 before:duration-600`}
          >
            <h3 className="text-[1.6rem] font-bold text-gold mb-[0.8rem] flex items-center gap-2.5">
              <span>🎓</span>
              Education
            </h3>
            <p className="text-[1.1rem] text-gold-bright my-2 font-semibold">Georgia State University</p>
            <p className="text-base text-ink my-[0.3rem]">Bachelor of Science in Data Science</p>
            <p className="text-[0.95rem] text-muted mt-4 italic">Graduated: Fall 2025</p>
          </div>
        </div>
        
        <div className="my-20 h-px bg-linear-to-r/srgb from-transparent via-line to-transparent" />
        
        <div className="text-center mb-8">
          <p className="text-[1.2rem] text-silver max-w-[800px] mx-auto">
            I'm particularly drawn to urban streetwear and minimalist aesthetics, finding inspiration in the fusion of comfort and bold expression.
          </p>
        </div>
        
        <div className="fashion-grid grid grid-cols-2 auto-rows-[minmax(250px,auto)] gap-6 my-12 md:grid-cols-4">
          {fashionImages.map((item, boxIndex) => (
            <div 
              key={boxIndex} 
              className={`fashion-box ${itemBoxClass}`}
              ref={el => { if (el) fashionBoxesRef.current[boxIndex] = el; }}
              onClick={() => toggleImageView(boxIndex, 'fashion')}
              style={itemBoxStyle(item)}
            >
              <SlidingImages 
                images={item.images} 
                boxIndex={boxIndex} 
                imageType="fashion" 
              />
            </div>
          ))}
        </div>
        
        <div className="my-20 h-px bg-linear-to-r/srgb from-transparent via-line to-transparent" />
        
        <div className="text-center mb-8">
          <p className="text-[1.2rem] text-silver max-w-[800px] mx-auto">
            Beyond fashion, I enjoy discovering unique home decor pieces and functional appliances that blend artistry with practicality. These items represent the aesthetic style I'm drawn to.
          </p>
        </div>
        
        <div className="decor-grid grid grid-cols-2 auto-rows-[minmax(250px,auto)] gap-6 my-12 md:grid-cols-4">
          {decorImages.map((item, boxIndex) => (
            <div 
              key={boxIndex} 
              className={`decor-box ${itemBoxClass}`}
              ref={el => { if (el) decorBoxesRef.current[boxIndex] = el; }}
              onClick={() => toggleImageView(boxIndex, 'decor')}
              style={itemBoxStyle(item)}
            >
              <SlidingImages 
                images={item.images} 
                boxIndex={boxIndex} 
                imageType="decor" 
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Overlay for enlarged images */}
      <div 
        className={`overlay fixed inset-0 bg-black/80 z-15 cursor-pointer ${activeImage !== null ? 'block' : 'hidden'}`}
        onClick={() => setActiveImage(null)}
      >
        {activeImage && (
          <div className="absolute top-1/2 left-1/2 -translate-1/2 w-4/5 max-w-[800px] max-h-[80vh] bg-panel rounded-[10px] overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)]">
            <div className="w-full h-0 pb-[75%] relative">
              <img 
                src={`/images/${activeImage.type === 'fashion' 
                  ? fashionImages[activeImage.index].images[0] 
                  : decorImages[activeImage.index].images[0]}`} 
                alt="Enlarged view"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default About;