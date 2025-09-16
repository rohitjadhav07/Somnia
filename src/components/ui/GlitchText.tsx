import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface GlitchTextProps {
  text: string;
  className?: string;
  glitchIntensity?: 'low' | 'medium' | 'high';
  autoGlitch?: boolean;
  glitchDelay?: number;
}

const GlitchText: React.FC<GlitchTextProps> = ({
  text,
  className = '',
  glitchIntensity = 'medium',
  autoGlitch = true,
  glitchDelay = 3000,
}) => {
  const [isGlitching, setIsGlitching] = useState(false);
  const [glitchedText, setGlitchedText] = useState(text);

  const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?~`';
  
  const intensitySettings = {
    low: { duration: 0.1, frequency: 0.3 },
    medium: { duration: 0.2, frequency: 0.5 },
    high: { duration: 0.3, frequency: 0.7 },
  };

  const createGlitchedText = () => {
    const { frequency } = intensitySettings[glitchIntensity];
    return text
      .split('')
      .map((char) => {
        if (Math.random() < frequency && char !== ' ') {
          return glitchChars[Math.floor(Math.random() * glitchChars.length)];
        }
        return char;
      })
      .join('');
  };

  const triggerGlitch = () => {
    setIsGlitching(true);
    const { duration } = intensitySettings[glitchIntensity];
    
    // Create multiple glitch frames
    const glitchFrames = 5;
    let frame = 0;
    
    const glitchInterval = setInterval(() => {
      setGlitchedText(createGlitchedText());
      frame++;
      
      if (frame >= glitchFrames) {
        clearInterval(glitchInterval);
        setGlitchedText(text);
        setIsGlitching(false);
      }
    }, (duration * 1000) / glitchFrames);
  };

  useEffect(() => {
    if (autoGlitch) {
      const interval = setInterval(triggerGlitch, glitchDelay);
      return () => clearInterval(interval);
    }
  }, [autoGlitch, glitchDelay]);

  return (
    <motion.span
      className={`relative inline-block font-cyber ${className}`}
      onHoverStart={() => !isGlitching && triggerGlitch()}
      animate={isGlitching ? {
        x: [0, -2, 2, -1, 1, 0],
        textShadow: [
          '0 0 0 transparent',
          '2px 0 0 #ff006e, -2px 0 0 #00d4ff',
          '-2px 0 0 #ff006e, 2px 0 0 #00d4ff',
          '0 0 0 transparent',
        ],
      } : {}}
      transition={{ duration: 0.3 }}
    >
      {/* Main text */}
      <span className="relative z-10">
        {glitchedText}
      </span>
      
      {/* Glitch layers */}
      {isGlitching && (
        <>
          <motion.span
            className="absolute top-0 left-0 text-neon-pink opacity-70"
            animate={{ x: [0, 2, -1, 1, 0] }}
            transition={{ duration: 0.1, repeat: Infinity }}
          >
            {createGlitchedText()}
          </motion.span>
          <motion.span
            className="absolute top-0 left-0 text-neon-blue opacity-70"
            animate={{ x: [0, -2, 1, -1, 0] }}
            transition={{ duration: 0.1, repeat: Infinity, delay: 0.05 }}
          >
            {createGlitchedText()}
          </motion.span>
        </>
      )}
    </motion.span>
  );
};

export default GlitchText;