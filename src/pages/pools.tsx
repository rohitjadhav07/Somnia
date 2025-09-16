import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown, Activity, DollarSign, Minus } from 'lucide-react';
import { usePoolsData, useProtocolData } from '@/hooks/useProtocolData';
import { useTokenData } from '@/hooks/useTokenData';
import HolographicCard from '@/components/ui/HolographicCard';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import LiquidityModal from '@/components/ui/LiquidityModal';
import GlitchText from '@/components/ui/GlitchText';

export default function Pools() {
  const { isConnected } = useAccount();
  const [sortBy, setSortBy] = useState<'totalVolume' | 'totalFees' | 'fee'>('totalVolume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [liquidityModal, setLiquidityModal] = useState<{
    isOpen: boolean;
    pool: any;
    mode: 'add' | 'remove';
  }>({
    isOpen: false,
    pool: null,
    mode: 'add',
  });
  
  const { pools, isLoading: poolsLoading } = usePoolsData();
  const { totalPools, totalVolume, isLoading: protocolLoading } = useProtocolData();

  const sortedPools = [...pools].sort((a, b) => {
    let aValue, bValue;
    switch(sortBy) {
      case 'totalVolume':
        aValue = parseFloat(a.totalVolume);
        bValue = parseFloat(b.totalVolume);
        break;
      case 'totalFees':
        aValue = parseFloat(a.totalFees);
        bValue = parseFloat(b.totalFees);
        break;
      case 'fee':
        aValue = a.fee;
        bValue = b.fee;
        break;
      default:
        aValue = parseFloat(a.totalVolume);
        bValue = parseFloat(b.totalVolume);
    }
    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
  });

  const handleSort = (field: 'totalVolume' | 'totalFees' | 'fee') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const formatNumber = (num: number, prefix = '') => {
    if (num >= 1000000) {
      return `${prefix}${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${prefix}${(num / 1000).toFixed(1)}K`;
    }
    return `${prefix}${num.toFixed(0)}`;
  };

  const openLiquidityModal = (pool: any, mode: 'add' | 'remove') => {
    if (!pool || !pool.address) {
      console.error('Invalid pool data:', pool);
      return;
    }
    
    setLiquidityModal({
      isOpen: true,
      pool,
      mode,
    });
  };

  const closeLiquidityModal = () => {
    setLiquidityModal({
      isOpen: false,
      pool: null,
      mode: 'add',
    });
  };

  return (
    <div className="min-h-screen relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <GlitchText 
              text="LIQUIDITY POOLS"
              className="text-4xl font-cyber text-cyber mb-4"
              glitchIntensity="low"
            />
            <p className="text-gray-400 font-cyber">
              PROVIDE LIQUIDITY AND EARN FEES ON SOMNIA NETWORK
            </p>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <HolographicCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-cyber text-gray-400 uppercase">Total TVL</p>
                <p className="text-2xl font-cyber text-cyber">
                  ${pools.reduce((sum, pool) => sum + parseFloat(pool.tvl), 0).toLocaleString()}
                </p>
                <p className="text-sm text-neon-green">+12.5%</p>
              </div>
              <DollarSign className="h-8 w-8 text-neon-green" />
            </div>
          </HolographicCard>
          <HolographicCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-cyber text-gray-400 uppercase">24h Volume</p>
                <p className="text-2xl font-cyber text-cyber">
                  ${parseFloat(totalVolume).toLocaleString()}
                </p>
                <p className="text-sm text-neon-blue">+8.2%</p>
              </div>
              <Activity className="h-8 w-8 text-neon-blue" />
            </div>
          </HolographicCard>
          <HolographicCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-cyber text-gray-400 uppercase">Active Pools</p>
                <p className="text-2xl font-cyber text-cyber">{totalPools}</p>
                <p className="text-sm text-neon-purple">+0%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-neon-purple" />
            </div>
          </HolographicCard>
          <HolographicCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-cyber text-gray-400 uppercase">Avg APR</p>
                <p className="text-2xl font-cyber text-cyber">
                  {pools.length > 0 ? 
                    (pools.reduce((sum, pool) => sum + parseFloat(pool.apr), 0) / pools.length).toFixed(1) : 
                    '0.0'
                  }%
                </p>
                <p className="text-sm text-neon-yellow">+2.1%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-neon-yellow" />
            </div>
          </HolographicCard>
        </div>

        {/* Pools Table */}
        <HolographicCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-cyber text-gray-400 uppercase tracking-wider">
                    Pool
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-cyber text-gray-400 uppercase tracking-wider cursor-pointer hover:text-neon-blue"
                    onClick={() => handleSort('totalVolume')}
                  >
                    TVL {sortBy === 'totalVolume' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-cyber text-gray-400 uppercase tracking-wider cursor-pointer hover:text-neon-blue"
                    onClick={() => handleSort('totalFees')}
                  >
                    Total Fees {sortBy === 'totalFees' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-cyber text-gray-400 uppercase tracking-wider cursor-pointer hover:text-neon-blue"
                    onClick={() => handleSort('fee')}
                  >
                    Fee Rate {sortBy === 'fee' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-cyber text-gray-400 uppercase tracking-wider">
                    APR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-cyber text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neon-blue/20">
                {sortedPools.map((pool, index) => (
                  <tr key={pool.address} className="hover:bg-neon-blue/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {pool.token0Symbol.slice(0, 2)}
                          </div>
                          <div className="w-8 h-8 bg-gradient-to-r from-neon-green to-neon-yellow rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {pool.token1Symbol.slice(0, 2)}
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-cyber text-white">
                            {pool.token0Symbol}/{pool.token1Symbol}
                          </div>
                          <div className="text-sm text-gray-400 font-cyber">
                            {(pool.fee / 10000).toFixed(2)}% fee
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-cyber text-neon-green">
                        ${parseFloat(pool.tvl).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-cyber text-neon-blue">
                        ${parseFloat(pool.totalFees).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-cyber text-neon-purple">
                        {(pool.fee / 10000).toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-cyber text-neon-yellow">
                        {pool.apr}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <motion.button
                          onClick={() => openLiquidityModal(pool, 'add')}
                          disabled={poolsLoading}
                          className="text-neon-blue hover:text-neon-blue/80 font-cyber transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          whileHover={{ scale: poolsLoading ? 1 : 1.05 }}
                          whileTap={{ scale: poolsLoading ? 1 : 0.95 }}
                        >
                          Add Liquidity
                        </motion.button>
                        <motion.button
                          onClick={() => openLiquidityModal(pool, 'remove')}
                          disabled={poolsLoading}
                          className="text-gray-400 hover:text-gray-300 font-cyber transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          whileHover={{ scale: poolsLoading ? 1 : 1.05 }}
                          whileTap={{ scale: poolsLoading ? 1 : 0.95 }}
                        >
                          Remove
                        </motion.button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </HolographicCard>

        {/* Pool Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              How to Provide Liquidity
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  1
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose a pool and click "Add" to provide liquidity
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  2
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Deposit equal values of both tokens in the pool
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  3
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Receive LP tokens representing your share of the pool
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  ✓
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Earn fees from trades proportional to your share
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Risks & Considerations
            </h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>
                  <strong className="text-gray-900 dark:text-white">Impermanent Loss:</strong> 
                  Your tokens' value may change relative to holding them separately
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>
                  <strong className="text-gray-900 dark:text-white">Smart Contract Risk:</strong> 
                  Contracts are audited but risks remain
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>
                  <strong className="text-gray-900 dark:text-white">Fee Earnings:</strong> 
                  Earn 0.25-3% of all trades in your pool
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Liquidity Modal */}
        <LiquidityModal
          isOpen={liquidityModal.isOpen}
          onClose={closeLiquidityModal}
          pool={liquidityModal.pool}
          mode={liquidityModal.mode}
        />
      </div>
    </div>
  );
}