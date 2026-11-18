import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Navigation from './components/Navigation';
import SimpleNav from './components/SimpleNav';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Goals from './components/Goals';
import Resume from './components/Resume';
import Contact from './components/Contact';
import Footer from './components/Footer';
import StarBackground from './components/StarBackground'; 

const Trading = lazy(() => import('./components/Trading'));

function App() {
  const [showNavigation, setShowNavigation] = useState(true);
  
  useEffect(() => {
    // Disable scrolling on the home page to keep the globe navigation static
    const handleRouteChange = () => {
      const path = window.location.pathname;
      if (path === '/') {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
    };
    
    // Initial check
    handleRouteChange();
    
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      document.body.style.overflow = 'auto'; 
    };
  }, []);
  
  return (
    <Router>
      {/* Star Background */}
      <StarBackground />
      
      {/*3D nav*/}
      <Routes>
        <Route path="/" element={<Navigation />} />
      </Routes>
      
      {/*simple nav*/}
      <Routes>
        <Route path="/about" element={<SimpleNav />} />
        <Route path="/projects" element={<SimpleNav />} />
        <Route path="/goals" element={<SimpleNav />} />
        <Route path="/resume" element={<SimpleNav />} />
        <Route path="/contact" element={<SimpleNav />} />
        <Route path="/trading" element={<SimpleNav />} />
      </Routes>
      
      <div className="relative z-1">
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/about" element={<About />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/contact" element={<Contact />} />
          <Route
            path="/trading"
            element={
              <Suspense fallback={null}>
                <Trading />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;