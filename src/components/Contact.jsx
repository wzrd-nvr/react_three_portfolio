import React, { useState, useEffect } from 'react';
import { useContactFormStore } from '../stores/contactFormStore';

const fieldClass =
  'rounded-[5px] border-none bg-[rgba(61,61,61,0.8)] p-4 text-[1rem] text-[#f0f0f0] transition-all duration-300 ease-[ease] placeholder:text-[#757575] focus:shadow-[0_0_0_2px_var(--color-gold)] focus:outline-none';

const secondaryButtonClass =
  'cursor-pointer rounded-[5px] border border-ink bg-transparent px-6 py-4 text-[1rem] text-ink transition-all duration-300 ease-[ease] hover:bg-line';

const compactSecondaryButtonClass =
  'cursor-pointer rounded-[5px] border border-ink bg-transparent px-2 py-1 text-[0.8rem] text-ink transition-all duration-300 ease-[ease] hover:bg-line';

const formGroupClass = 'flex flex-col gap-2';

const labelClass = 'text-[1.1rem] font-bold text-ink';

const Contact = () => {
  const { 
    formData, 
    updateField, 
    submitForm, 
    resetForm, 
    isDirty,
    isSubmitting,
    submitSuccess,
    submitError,
    lastSaved,
    saveForm
  } = useContactFormStore();
  
  // Format the lastSaved date for display
  const formatDate = (dateString) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formattedLastSaved = lastSaved ? formatDate(lastSaved) : null;
  
  // Auto-save every 30 seconds if form is dirty
  useEffect(() => {
    let interval;
    if (isDirty) {
      interval = setInterval(() => {
        saveForm();
      }, 30000);
    }
    
    return () => clearInterval(interval);
  }, [isDirty, saveForm]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateField(name, value);
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    submitForm();
  };
  
  return (
    <section
      id="contact"
      className="relative flex min-h-screen flex-col items-center justify-center bg-surface-deep px-5 py-20"
    >
      <div className="relative z-[1] max-h-[80vh] w-full max-w-[800px] overflow-y-auto rounded-[15px] bg-surface/80 p-12 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-[10px] max-md:p-8">
        <h2 className="mb-6 text-center text-[3rem] font-bold text-gold max-md:text-[2.5rem]">Contact Me</h2>
        
        <p className="mb-8 text-center text-[1.2rem] leading-[1.6] text-ink max-md:text-[1rem]">
          I'd love to hear from you! Fill out the form below or email me directly at{' '}
          <a href="mailto:anivar.fw@gmail.com" className="text-gold no-underline hover:underline">anivar.fw@gmail.com</a>.
        </p>
        
        {formData.name && isDirty && (
          <div className="mb-6 rounded-[5px] border border-[rgba(13,110,253,0.2)] bg-[rgba(13,110,253,0.1)] p-3 text-[0.9rem] text-[#a0c0ff]">
            <strong className="text-gold">Your form data is being saved locally.</strong> If you leave this page and come back later, your draft will still be here.
          </div>
        )}
        
        {formattedLastSaved && (
          <div className="mb-4 flex items-center justify-between rounded-[5px] bg-[rgba(128,128,128,0.2)] p-2 text-center text-[0.9rem] text-ink">
            <span>Last saved: {formattedLastSaved}</span>
            <button 
              type="button" 
              onClick={resetForm}
              className={compactSecondaryButtonClass}
            >
              Clear Saved Data
            </button>
          </div>
        )}
        
        {submitSuccess && (
          <div className="mb-6 translate-y-0 rounded-[5px] bg-[rgba(40,167,69,0.9)] p-4 text-center font-bold text-white opacity-100 transition-all duration-500 ease-[ease] starting:-translate-y-2.5 starting:opacity-0">
            Thanks for reaching out! I'll get back to you soon.
          </div>
        )}
        
        {submitError && (
          <div className="mb-6 rounded-[5px] bg-[rgba(220,53,69,0.9)] p-4 text-center font-bold text-white">
            {submitError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className={formGroupClass}>
            <label htmlFor="name" className={labelClass}>Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your Name"
              required
              className={fieldClass}
            />
          </div>
          
          <div className={formGroupClass}>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Your Email"
              required
              className={fieldClass}
            />
          </div>
          
          <div className={formGroupClass}>
            <label htmlFor="message" className={labelClass}>Message</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="What's on your mind?"
              required
              className={`${fieldClass} min-h-[150px] resize-y`}
            />
          </div>
          
          <div className="flex flex-wrap gap-4 max-md:flex-col">
            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer rounded-[5px] border-none bg-gold px-8 py-4 text-[1.1rem] font-bold text-space transition-all duration-300 ease-[ease] hover:-translate-y-[3px] hover:bg-gold-deep active:translate-y-px disabled:translate-none disabled:cursor-not-allowed disabled:bg-[#7d6b2e]"
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
            
            {isDirty && (
              <button type="button" onClick={saveForm} className={secondaryButtonClass}>
                Save Draft
              </button>
            )}
            
            {isDirty && (
              <button type="button" onClick={resetForm} className={secondaryButtonClass}>
                Clear Form
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
};

export default Contact;
