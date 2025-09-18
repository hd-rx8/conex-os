import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type GradientTheme = 'conexhub' | 'alt1' | 'alt2';

interface GradientThemeContextType {
  currentGradientTheme: GradientTheme;
  setGradientTheme: (theme: GradientTheme) => void;
}

const GradientThemeContext = createContext<GradientThemeContextType | undefined>(undefined);

const gradientMap: Record<GradientTheme, string> = {
  conexhub: 'linear-gradient(135deg, #1e40af 0%, #0d9488 50%, #059669 100%)', // Original
  alt1: 'linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #1a2a3a 100%)', // Dark/Metallic inspired by Comet
  alt2: 'linear-gradient(135deg, #ff79c6 0%, #bd93f9 50%, #8be9fd 100%)', // Dracula-inspired: Pink -> Purple -> Cyan
};

// Map for button gradients (can be the same or slightly different)
const buttonGradientMap: Record<GradientTheme, string> = {
  conexhub: 'linear-gradient(135deg, #3b82f6 0%, #14b8a6 50%, #10b981 100%)', // Original primary button gradient
  alt1: 'linear-gradient(135deg, #4a69bd 0%, #6a89cc 50%, #8bb0e0 100%)', // Lighter blue for dark theme buttons
  alt2: 'linear-gradient(135deg, #bd93f9 0%, #ff79c6 100%)', // Dracula-inspired: Purple -> Pink
};

// New map for PDF header gradient - using the same as text gradient for consistency
const pdfHeaderGradientMap: Record<GradientTheme, string> = {
  conexhub: 'linear-gradient(135deg, #1e40af 0%, #0d9488 50%, #059669 100%)',
  alt1: 'linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #1a2a3a 100%)',
  alt2: 'linear-gradient(135deg, #ff79c6 0%, #bd93f9 50%, #8be9fd 100%)', // Dracula-inspired: Pink -> Purple -> Cyan
};


export const GradientThemeProvider = ({ children }: { children: ReactNode }) => {
  const [currentGradientTheme, setCurrentGradientTheme] = useState<GradientTheme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('gradient-theme') as GradientTheme) || 'conexhub';
    }
    return 'conexhub';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gradient-theme', currentGradientTheme);
      document.documentElement.style.setProperty('--gradient-text-background', gradientMap[currentGradientTheme]);
      document.documentElement.style.setProperty('--gradient-button-background', buttonGradientMap[currentGradientTheme]);
      document.documentElement.style.setProperty('--gradient-pdf-header-background', pdfHeaderGradientMap[currentGradientTheme]); // Set new PDF header gradient
    }
  }, [currentGradientTheme]);

  return (
    <GradientThemeContext.Provider value={{ currentGradientTheme, setGradientTheme: setCurrentGradientTheme }}>
      {children}
    </GradientThemeContext.Provider>
  );
};

export const useGradientTheme = () => {
  const context = useContext(GradientThemeContext);
  if (context === undefined) {
    throw new Error('useGradientTheme must be used within a GradientThemeProvider');
  }
  return { ...context, gradientMap, buttonGradientMap, pdfHeaderGradientMap }; // Export maps for use in QuoteResult
};