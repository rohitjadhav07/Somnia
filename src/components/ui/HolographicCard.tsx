import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface HolographicCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glowColor?: string;
}

const HolographicCard: React.FC<HolographicCardProps> = ({
  children,
  className = '',
  intensity = 1,
  glowColor = '#00d4ff',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [15 * intensity, -15 * intensity]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-15 * intensity, 15 * intensity]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateY: rotateY,
        rotateX: rotateX,
        transformStyle: 'preserve-3d',
      }}
      className={`
        relative cyber-card transition-all duration-300
        ${isHovered ? 'shadow-neon-lg' : 'shadow-neon'}
        ${className}
      `}
    >
      {/* Holographic overlay */}
      <motion.div
        className="absolute inset-0 opacity-0 pointer-events-none"
        animate={{
          opacity: isHovered ? 0.3 : 0,
          background: [
            `linear-gradient(45deg, ${glowColor}20, transparent, ${glowColor}20)`,
            `linear-gradient(135deg, transparent, ${glowColor}20, transparent)`,
            `linear-gradient(225deg, ${glowColor}20, transparent, ${glowColor}20)`,
            `linear-gradient(315deg, transparent, ${glowColor}20, transparent)`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 opacity-0 pointer-events-none"
        animate={{
          opacity: isHovered ? 1 : 0,
          background: `linear-gradient(45deg, transparent 30%, ${glowColor}40 50%, transparent 70%)`,
          x: isHovered ? ['0%', '100%'] : '0%',
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />

      {/* Content */}
      <div
        style={{
          transform: 'translateZ(50px)',
        }}
        className="relative z-10"
      >
        {children}
      </div>

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-lg opacity-0 pointer-events-none"
        animate={{
          opacity: isHovered ? 0.5 : 0,
          boxShadow: `0 0 50px ${glowColor}80`,
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

export default HolographicCard;