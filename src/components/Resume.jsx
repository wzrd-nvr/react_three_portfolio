import React, { useState } from 'react';

const Resume = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  
  // Path to your resume PDF
  const resumePath = import.meta.env.BASE_URL + "Angel_Nivar_Resume_Sep 2025.pdf";
  
  const handleLoadError = () => {
    setIsLoading(false);
    setHasError(true);
    console.error("Failed to load the PDF");
  };
  
  const toggleDebug = () => {
    setDebugMode(!debugMode);
  };
  
  return (
    <section id="resume" className="relative min-h-screen bg-surface-deep px-5 py-20">
      <div className="relative z-[1] mx-auto flex max-w-[1200px] flex-col items-center">
        <h2 className="mb-8 text-center text-[3rem] font-bold text-gold max-md:text-[2.5rem]">My Resume</h2>
        
        <div className="mb-12 max-w-[800px] text-center">
          <p className="text-[1.2rem] leading-[1.8] text-ink">
            Below you'll find my professional resume highlighting my skills, 
            experience, and qualifications. Feel free to download a copy for your records.
          </p>
        </div>
        
        <div className="relative mx-auto h-[700px] w-full max-w-[900px] overflow-hidden rounded-[10px] bg-surface shadow-[0_10px_30px_rgba(0,0,0,0.3)] max-md:h-[500px]">
          {isLoading && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[1.2rem] text-ink">
              Loading resume...
            </div>
          )}
          {hasError && (
            <div className="absolute top-1/2 left-1/2 max-w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-[10px] bg-black/70 p-8 text-center text-[1.2rem] text-[#ff5252]">
              <p>Unable to load the resume PDF.</p>
              <p>Please ensure the PDF file is in the public folder.</p>
              <p>Click the download button below to view the resume.</p>
            </div>
          )}
          <iframe 
            className="h-full w-full border-none bg-white"
            src={resumePath}
            onLoad={() => setIsLoading(false)}
            onError={handleLoadError}
            title="Angel Nivar Resume"
            type="application/pdf"
          />
        </div>
        
        <a 
          href={resumePath} 
          download="Angel_Nivar_Resume.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block rounded-[5px] bg-gold px-8 py-4 font-bold text-space no-underline transition-all duration-300 ease-[ease] hover:-translate-y-[3px] hover:bg-gold-deep active:translate-y-px"
        >
          Download Resume
        </a>
        
        <div className="mt-2.5 text-center">
          <button 
            onClick={toggleDebug} 
            className="cursor-pointer border-none bg-transparent text-[0.8rem] text-[#777] underline"
          >
            {debugMode ? 'Hide Debug Info' : 'Show Debug Info'}
          </button>
        </div>
        
        <div
          className={`mt-8 mb-4 rounded-[5px] border border-[#555] bg-black/70 p-4 text-left text-[0.9rem] text-ink ${
            debugMode ? 'block' : 'hidden'
          }`}
        >
          <p>Resume Path: {resumePath}</p>
          <p>Loading State: {isLoading ? 'Loading' : 'Not Loading'}</p>
          <p>Error State: {hasError ? 'Error' : 'No Error'}</p>
          <p>Notes on PDF display:</p>
          <ul className="mt-2.5 list-disc pl-5">
            <li>PDF must be in the public folder named "resume.pdf"</li>
            <li>Check your browser console for additional errors</li>
            <li>Some browsers have restrictions on iframe PDF embedding</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Resume;
