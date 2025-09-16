import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import dynamic from 'next/dynamic';

const CountUp = dynamic(() => import('react-countup'), { 
  ssr: false,
  loading: () => <span>0</span>
});

interface AnimatedCounterProps {
  value: number | string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  glowColor?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 2,
  className = '',
  glowColor = '#00d4ff',
}) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });
  const [hasAnimated, setHasAnimated] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (inView && !hasAnimated && mounted) {
      controls.start({
        scale: [1, 1.1, 1],
        textShadow: [
          `0 0 10px ${glowColor}`,
          `0 0 20px ${glowColor}, 0 0 30px ${glowColor}`,
          `0 0 10px ${glowColor}`,
        ],
        transition: { duration: 0.6 },
      });
      setHasAnimated(true);
    }
  }, [inView, controls, hasAnimated, glowColor, mounted]);

  if (!mounted) {
    return (
      <div className={`font-cyber font-bold ${className}`}>
        {prefix}{typeof value === 'string' ? value : value.toLocaleString()}{suffix}
      </div>
    );
  }

  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) || 0 : value;

  return (
    <motion.div
      ref={ref}
      animate={controls}
      className={`font-cyber font-bold ${className}`}
    >
      {inView ? (
        <CountUp
          start={0}
          end={numericValue}
          duration={duration}
          decimals={decimals}
          prefix={prefix}
          suffix={suffix}
          preserveValue
        />
      ) : (
        <span>{prefix}{typeof value === 'string' ? value : value.toLocaleString()}{suffix}</span>
      )}
    </motion.div>
  );
};

export default AnimatedCounter;