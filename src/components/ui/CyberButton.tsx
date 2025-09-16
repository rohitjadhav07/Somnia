import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface CyberButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'neon' | 'hologram';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const CyberButton: React.FC<CyberButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled = false,
  loading = false,
  className = '',
}) => {
  const variants = {
    primary: 'btn-cyber',
    secondary: 'btn-hologram',
    neon: 'btn-neon',
    hologram: 'btn-hologram',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variants[variant]} 
        ${sizes[size]} 
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
        relative overflow-hidden group
      `}
    >
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-neon-blue/20 to-neon-purple/20"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6 }}
      />
      
      {/* Content */}
      <div className="relative flex items-center justify-center space-x-2">
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neon-blue" />
        ) : (
          <>
            {Icon && <Icon className="h-5 w-5" />}
            <span>{children}</span>
          </>
        )}
      </div>
      
      {/* Glitch effect */}
      <motion.div
        className="absolute inset-0 bg-neon-blue/10"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2 }}
      />
    </motion.button>
  );
};

export default CyberButton;