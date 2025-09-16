import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Menu, 
  X, 
  Activity, 
  BarChart3, 
  Layers, 
  ArrowRightLeft,
  Home,
  Sparkles
} from 'lucide-react';
import GlitchText from './ui/GlitchText';
import ClientOnly from './ui/ClientOnly';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/swap', label: 'Swap', icon: ArrowRightLeft },
    { href: '/flash-loans', label: 'Flash Loans', icon: Zap },
    { href: '/pools', label: 'Pools', icon: Layers },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const isActive = (path: string) => router.pathname === path;

  return (
    <>
      {/* Backdrop blur overlay when mobile menu is open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-300
          ${scrolled 
            ? 'bg-black/80 backdrop-blur-xl border-b border-neon-blue/20 shadow-neon' 
            : 'bg-transparent'
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <motion.div 
                className="relative p-3 bg-gradient-to-br from-neon-blue to-neon-purple rounded-lg shadow-neon"
                whileHover={{ scale: 1.1, rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <Zap className="h-6 w-6 text-black" />
                <motion.div
                  className="absolute inset-0 bg-neon-blue/20 rounded-lg"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5] 
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <div>
                <div className="flex flex-col">
                  <h1 className="text-sm md:text-base font-bold app-name-stable leading-tight">
                    FLASH LIQUIDITY
                  </h1>
                  <span className="text-xs md:text-sm font-bold app-name-stable leading-tight -mt-0.5">
                    LAYER
                  </span>
                </div>
                <p className="text-xs text-neon-blue/70 font-cyber tracking-wider">
                  SOMNIA NETWORK
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={item.href}>
                      <motion.div
                        className={`
                          relative px-4 py-2 rounded-lg font-cyber text-sm uppercase tracking-wider
                          transition-all duration-300 group cursor-pointer
                          ${isActive(item.href) 
                            ? 'text-neon-blue bg-neon-blue/10 shadow-neon' 
                            : 'text-gray-300 hover:text-neon-blue hover:bg-neon-blue/5'
                          }
                        `}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </div>
                        
                        {/* Active indicator */}
                        {isActive(item.href) && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-neon-blue/10 rounded-lg border border-neon-blue/30"
                            initial={false}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        
                        {/* Hover effect */}
                        <motion.div
                          className="absolute inset-0 bg-neon-blue/5 rounded-lg opacity-0 group-hover:opacity-100"
                          transition={{ duration: 0.2 }}
                        />
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Network Status */}
              <motion.div 
                className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-lg"
                animate={{ 
                  boxShadow: [
                    '0 0 10px rgba(0,255,136,0.3)',
                    '0 0 20px rgba(0,255,136,0.5)',
                    '0 0 10px rgba(0,255,136,0.3)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div 
                  className="w-2 h-2 bg-green-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-xs font-cyber text-green-400">SOMNIA LIVE</span>
              </motion.div>

              {/* Connect Wallet with custom styling */}
              <ClientOnly fallback={
                <div className="px-4 py-2 bg-neon-blue/10 border border-neon-blue/30 rounded font-cyber text-sm text-neon-blue">
                  CONNECT WALLET
                </div>
              }>
                <div className="cyber-wallet-button">
                  <ConnectButton />
                </div>
              </ClientOnly>

              {/* Mobile menu button */}
              <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 rounded-lg bg-neon-blue/10 border border-neon-blue/30 text-neon-blue"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <AnimatePresence mode="wait">
                  {isOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="h-6 w-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="h-6 w-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-black/90 backdrop-blur-xl border-t border-neon-blue/20"
            >
              <div className="px-4 py-6 space-y-2">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link href={item.href} onClick={() => setIsOpen(false)}>
                        <motion.div
                          className={`
                            flex items-center space-x-3 px-4 py-3 rounded-lg font-cyber
                            transition-all duration-300
                            ${isActive(item.href) 
                              ? 'text-neon-blue bg-neon-blue/10 border border-neon-blue/30' 
                              : 'text-gray-300 hover:text-neon-blue hover:bg-neon-blue/5'
                            }
                          `}
                          whileHover={{ x: 10 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="uppercase tracking-wider">{item.label}</span>
                          {isActive(item.href) && (
                            <motion.div
                              className="ml-auto w-2 h-2 bg-neon-blue rounded-full"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                          )}
                        </motion.div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className="h-20" />

      <style jsx global>{`
        /* RainbowKit wallet button styling */
        [data-rk] button {
          background: linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(179,71,217,0.15) 100%) !important;
          border: 1px solid rgba(0,212,255,0.4) !important;
          color: #ffffff !important;
          font-family: 'Orbitron', monospace !important;
          text-transform: uppercase !important;
          letter-spacing: 1px !important;
          transition: all 0.3s ease !important;
          clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px)) !important;
          backdrop-filter: blur(10px) !important;
          font-weight: 600 !important;
        }
        
        [data-rk] button:hover {
          background: linear-gradient(135deg, rgba(0,212,255,0.25) 0%, rgba(179,71,217,0.25) 100%) !important;
          box-shadow: 0 0 20px rgba(0,212,255,0.4) !important;
          transform: translateY(-2px) !important;
          border-color: rgba(0,212,255,0.6) !important;
        }

        /* Fix wallet address visibility */
        [data-rk] button div,
        [data-rk] button span {
          color: #ffffff !important;
          background: transparent !important;
        }

        /* Wallet dropdown styling */
        [data-rk] [role="dialog"] {
          background: rgba(0,0,0,0.95) !important;
          border: 1px solid rgba(0,212,255,0.3) !important;
          backdrop-filter: blur(20px) !important;
          backdrop-filter: blur(20px) !important;
        }

        [data-rk] [role="dialog"] * {
          color: #ffffff !important;
          font-family: 'Orbitron', monospace !important;
        }

        /* Account modal styling */
        [data-rk] [data-testid="rk-account-button"] {
          background: linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(179,71,217,0.15) 100%) !important;
          border: 1px solid rgba(0,212,255,0.4) !important;
          color: #ffffff !important;
        }
      `}</style>
    </>
  );
}