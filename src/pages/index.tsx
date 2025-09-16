import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  TrendingUp, 
  Zap, 
  DollarSign, 
  Users, 
  ArrowRight,
  Activity,
  BarChart3,
  Wallet,
  Shield,
  Clock,
  Target,
  Sparkles,
  Rocket,
  Globe,
  Cpu
} from 'lucide-react';
import Link from 'next/link';

import CyberButton from '@/components/ui/CyberButton';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import GlitchText from '@/components/ui/GlitchText';
import HolographicCard from '@/components/ui/HolographicCard';
import { useProtocolData } from '@/hooks/useProtocolData';

export default function Dashboard() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const { 
    totalPools, 
    totalSwaps, 
    totalVolume, 
    totalFlashLoans, 
    totalFlashLoanVolume,
    isLoading: protocolLoading 
  } = useProtocolData();

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = [
    {
      label: 'Total Volume',
      value: protocolLoading ? 0 : parseFloat(totalVolume),
      prefix: '$',
      suffix: '',
      change: '+12.5%',
      icon: DollarSign,
      color: 'text-neon-green',
      glowColor: '#00ff88',
    },
    {
      label: 'Total Swaps',
      value: protocolLoading ? 0 : totalSwaps,
      prefix: '',
      suffix: '',
      change: '+8.2%',
      icon: TrendingUp,
      color: 'text-neon-blue',
      glowColor: '#00d4ff',
    },
    {
      label: 'Flash Loans',
      value: protocolLoading ? 0 : totalFlashLoans,
      prefix: '',
      suffix: '',
      change: '+24.1%',
      icon: Zap,
      color: 'text-neon-purple',
      glowColor: '#b347d9',
    },
    {
      label: 'Active Pools',
      value: protocolLoading ? 0 : totalPools,
      prefix: '',
      suffix: '',
      change: '+15.7%',
      icon: Activity,
      color: 'text-neon-yellow',
      glowColor: '#ffff00',
    },
  ];

  const quickActions = [
    {
      title: 'Swap Tokens',
      description: 'Trade tokens instantly with best rates across all pools',
      href: '/swap',
      icon: TrendingUp,
      gradient: 'from-neon-blue to-neon-purple',
      delay: 0.1,
    },
    {
      title: 'Flash Loan',
      description: 'Borrow liquidity within a single transaction block',
      href: '/flash-loan',
      icon: Zap,
      gradient: 'from-neon-purple to-neon-pink',
      delay: 0.2,
    },
    {
      title: 'View Pools',
      description: 'Explore available liquidity pools and earn fees',
      href: '/pools',
      icon: Activity,
      gradient: 'from-neon-green to-neon-blue',
      delay: 0.3,
    },
    {
      title: 'Analytics',
      description: 'View detailed protocol metrics and insights',
      href: '/analytics',
      icon: BarChart3,
      gradient: 'from-neon-yellow to-neon-green',
      delay: 0.4,
    },
  ];

  const features = [
    {
      icon: Clock,
      title: 'Sub-second Finality',
      description: 'Leverage Somnia\'s ultra-fast consensus for instant transactions',
      color: '#00d4ff',
    },
    {
      icon: Target,
      title: 'Best Price Routing',
      description: 'Automatically find optimal rates across all liquidity pools',
      color: '#b347d9',
    },
    {
      icon: Zap,
      title: 'Flash Loans',
      description: 'Access instant liquidity for arbitrage and complex strategies',
      color: '#ff006e',
    },
    {
      icon: Shield,
      title: 'Security First',
      description: 'Audited smart contracts with comprehensive safety measures',
      color: '#00ff88',
    },
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-center"
          >
            {/* Main Title */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.2 }}
              className="mb-8"
            >
              <GlitchText 
                text="FLASH LIQUIDITY LAYER"
                className="text-6xl md:text-8xl font-cyber font-black hero-title mb-4"
                glitchIntensity="medium"
                glitchDelay={4000}
              />
              <motion.div
                className="h-1 bg-gradient-to-r from-transparent via-neon-blue to-transparent mx-auto"
                initial={{ width: 0 }}
                animate={{ width: '60%' }}
                transition={{ duration: 1.5, delay: 0.8 }}
              />
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="text-xl md:text-3xl mb-12 text-gray-300 max-w-4xl mx-auto leading-relaxed"
            >
              The future of{' '}
              <span className="text-neon bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent font-bold">
                on-chain liquidity aggregation
              </span>{' '}
              powered by Somnia's{' '}
              <span className="text-neon-green font-bold">1M+ TPS</span>{' '}
              and{' '}
              <span className="text-neon-yellow font-bold">sub-second finality</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
            >
              {!isConnected ? (
                <motion.div 
                  className="flex items-center justify-center space-x-3 px-8 py-4 glass-card"
                  animate={{ 
                    boxShadow: [
                      '0 0 20px rgba(255,255,0,0.3)',
                      '0 0 40px rgba(255,255,0,0.5)',
                      '0 0 20px rgba(255,255,0,0.3)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Wallet className="h-6 w-6 text-neon-yellow" />
                  <span className="font-cyber text-neon-yellow">CONNECT WALLET TO BEGIN</span>
                </motion.div>
              ) : (
                <>
                  <Link href="/swap">
                    <CyberButton variant="neon" size="lg" icon={Rocket}>
                      LAUNCH TRADING
                    </CyberButton>
                  </Link>
                  <Link href="/flash-loan">
                    <CyberButton variant="hologram" size="lg" icon={Zap}>
                      TRY FLASH LOANS
                    </CyberButton>
                  </Link>
                </>
              )}
            </motion.div>

            {/* Network Stats */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 1.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            >
              <div className="text-center">
                <div className="text-3xl font-cyber text-neon-blue mb-2">~0.4s</div>
                <div className="text-sm text-gray-400 font-cyber">BLOCK TIME</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-cyber text-neon-green mb-2">1M+</div>
                <div className="text-sm text-gray-400 font-cyber">TPS CAPACITY</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-cyber text-neon-purple mb-2">$0.01</div>
                <div className="text-sm text-gray-400 font-cyber">AVG GAS FEE</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-cyber text-neon-yellow mb-2">98.7%</div>
                <div className="text-sm text-gray-400 font-cyber">SUCCESS RATE</div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <motion.div
          className="absolute top-20 left-10 w-20 h-20 border border-neon-blue/30 rounded-lg"
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity }
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-16 h-16 border border-neon-purple/30 rounded-full"
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </section>

      {/* Stats Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-cyber text-cyber mb-4">
              PROTOCOL METRICS
            </h2>
            <div className="h-0.5 bg-gradient-to-r from-transparent via-neon-blue to-transparent w-32 mx-auto" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <HolographicCard className="p-6 text-center" glowColor={stat.glowColor}>
                  <motion.div
                    className="mb-4"
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity }
                    }}
                  >
                    <stat.icon className={`h-12 w-12 mx-auto ${stat.color}`} />
                  </motion.div>
                  <div className="mb-2">
                    <AnimatedCounter
                      value={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                      className="text-3xl font-cyber text-cyber"
                      glowColor={stat.glowColor}
                    />
                  </div>
                  <div className="text-sm text-gray-400 font-cyber mb-2 uppercase tracking-wider">
                    {stat.label}
                  </div>
                  <div className={`text-sm font-bold ${stat.color}`}>
                    {stat.change}
                  </div>
                </HolographicCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-cyber text-cyber mb-4">
              QUICK ACCESS
            </h2>
            <div className="h-0.5 bg-gradient-to-r from-transparent via-neon-purple to-transparent w-32 mx-auto" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {quickActions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: action.delay }}
                viewport={{ once: true }}
              >
                <Link href={action.href}>
                  <HolographicCard className="p-6 h-full cursor-pointer group">
                    <div className={`inline-flex p-4 rounded-lg bg-gradient-to-br ${action.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className="h-8 w-8 text-black" />
                    </div>
                    <h3 className="text-xl font-cyber text-white mb-3 group-hover:text-neon-blue transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-gray-400 mb-6 leading-relaxed">
                      {action.description}
                    </p>
                    <div className="flex items-center text-neon-blue group-hover:text-neon-purple transition-colors">
                      <span className="text-sm font-cyber uppercase tracking-wider">Initialize</span>
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </HolographicCard>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Features */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-cyber text-cyber mb-8">
                WHY CHOOSE FLL?
              </h2>
              <div className="space-y-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start space-x-4 group"
                  >
                    <motion.div 
                      className="flex-shrink-0 p-3 rounded-lg border border-neon-blue/30 bg-neon-blue/10 group-hover:bg-neon-blue/20 transition-colors"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <feature.icon className="h-6 w-6 text-neon-blue" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-cyber text-white mb-2 group-hover:text-neon-blue transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right side - Network Status */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
            >
              <HolographicCard className="p-8">
                <div className="flex items-center mb-6">
                  <Globe className="h-8 w-8 text-neon-green mr-3" />
                  <h3 className="text-2xl font-cyber text-cyber">
                    NETWORK STATUS
                  </h3>
                </div>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-cyber">NETWORK</span>
                    <div className="flex items-center space-x-2">
                      <motion.div 
                        className="w-3 h-3 bg-neon-green rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <span className="text-neon-green font-cyber">SOMNIA TESTNET</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-cyber">BLOCK TIME</span>
                    <span className="text-neon-blue font-cyber">~0.4s</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-cyber">TPS CAPACITY</span>
                    <span className="text-neon-purple font-cyber">1M+</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-cyber">GAS PRICE</span>
                    <span className="text-neon-yellow font-cyber">1 GWEI</span>
                  </div>

                  <div className="pt-4 border-t border-neon-blue/20">
                    <div className="flex items-center justify-center space-x-2 text-neon-green">
                      <Cpu className="h-5 w-5" />
                      <span className="font-cyber text-sm">OPTIMAL PERFORMANCE</span>
                    </div>
                  </div>
                </div>
              </HolographicCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-cyber text-cyber mb-8">
              READY TO EXPERIENCE THE FUTURE?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Join the revolution of instant liquidity and sub-second trading on Somnia Network
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/swap">
                <CyberButton variant="neon" size="xl" icon={Sparkles}>
                  START TRADING NOW
                </CyberButton>
              </Link>
              <Link href="/analytics">
                <CyberButton variant="hologram" size="xl" icon={BarChart3}>
                  VIEW ANALYTICS
                </CyberButton>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}