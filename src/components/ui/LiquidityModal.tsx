import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { formatUnits, parseUnits } from 'viem';
import { 
  X, 
  Plus, 
  Minus, 
  ArrowRight, 
  Info,
  AlertTriangle,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

import CyberButton from './CyberButton';
import HolographicCard from './HolographicCard';
import { useLiquidity } from '@/hooks/useLiquidity';
import { useTokenData } from '@/hooks/useTokenData';
import contractsConfig from '@/config/contracts.json';

interface LiquidityModalProps {
  isOpen: boolean;
  onClose: () => void;
  pool: {
    address: string;
    token0Symbol: string;
    token1Symbol: string;
    token0: string;
    token1: string;
    fee: number;
    tvl: string;
    apr: string;
  };
  mode: 'add' | 'remove';
}

const TOKEN_ICONS: { [key: string]: string } = {
  'mUSDC': '💵',
  'mUSDT': '💰', 
  'mWETH': '⚡',
  'mWBTC': '₿',
};

export default function LiquidityModal({ isOpen, onClose, pool, mode }: LiquidityModalProps) {
  const { address, isConnected } = useAccount();
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const [lpAmount, setLpAmount] = useState('');
  const [step, setStep] = useState<'input' | 'approve' | 'execute'>('input');

  // Get token data (only if pool exists)
  const { tokens } = useTokenData(pool ? [pool.token0, pool.token1] : []);
  const token0Data = tokens.find(t => pool && t.address === pool.token0);
  const token1Data = tokens.find(t => pool && t.address === pool.token1);

  // Liquidity hooks
  const {
    useAddLiquidity,
    useRemoveLiquidity,
    useApproveForLiquidity,
    useCheckLiquidityAllowance,
    usePoolReserves,
    useLPTokenBalance,
    useMintMockTokens,
  } = useLiquidity();

  // Get pool reserves for ratio calculation (only if pool exists)
  const { reserves } = usePoolReserves(pool?.address || '');
  const [reserve0, reserve1] = reserves;

  // Get user's LP token balance (only if pool exists)
  const { balance: lpBalance, formattedBalance: formattedLpBalance } = useLPTokenBalance(pool?.address || '', address || '');

  // Add liquidity hook (only if pool exists)
  const { addLiquidity, isLoading: addingLiquidity } = useAddLiquidity(
    pool?.address || '',
    pool?.token0 || '',
    pool?.token1 || '',
    amount0,
    amount1,
    token0Data?.decimals || 18,
    token1Data?.decimals || 18
  );

  // Remove liquidity hook (only if pool exists)
  const { removeLiquidity, isLoading: removingLiquidity } = useRemoveLiquidity(
    pool?.address || '',
    lpAmount
  );

  // Approval hooks (only if pool exists)
  const { approve: approve0, isLoading: approving0 } = useApproveForLiquidity(
    pool?.token0 || '',
    pool?.address || '',
    amount0,
    token0Data?.decimals || 18
  );

  const { approve: approve1, isLoading: approving1 } = useApproveForLiquidity(
    pool?.token1 || '',
    pool?.address || '',
    amount1,
    token1Data?.decimals || 18
  );

  // Check allowances (only if pool exists)
  const { allowance: allowance0 } = useCheckLiquidityAllowance(pool?.token0 || '', address || '', pool?.address || '');
  const { allowance: allowance1 } = useCheckLiquidityAllowance(pool?.token1 || '', address || '', pool?.address || '');

  // Calculate if approvals are needed
  const needsApproval0 = amount0 && token0Data && allowance0 < parseUnits(amount0, token0Data.decimals);
  const needsApproval1 = amount1 && token1Data && allowance1 < parseUnits(amount1, token1Data.decimals);

  // Mint tokens hooks (only if pool exists)
  const { mintTokens: mintToken0, isLoading: minting0 } = useMintMockTokens(
    pool?.token0 || '',
    '10000',
    token0Data?.decimals || 18,
    address
  );
  const { mintTokens: mintToken1, isLoading: minting1 } = useMintMockTokens(
    pool?.token1 || '',
    '10000',
    token1Data?.decimals || 18,
    address
  );

  // Auto-calculate proportional amounts for adding liquidity
  useEffect(() => {
    if (mode === 'add' && amount0 && reserve0 > 0 && reserve1 > 0 && token0Data && token1Data) {
      const ratio = Number(reserve1) / Number(reserve0);
      const calculatedAmount1 = (parseFloat(amount0) * ratio).toFixed(6);
      setAmount1(calculatedAmount1);
    }
  }, [amount0, reserve0, reserve1, mode, token0Data, token1Data]);

  useEffect(() => {
    if (mode === 'add' && amount1 && reserve0 > 0 && reserve1 > 0 && token0Data && token1Data) {
      const ratio = Number(reserve0) / Number(reserve1);
      const calculatedAmount0 = (parseFloat(amount1) * ratio).toFixed(6);
      setAmount0(calculatedAmount0);
    }
  }, [amount1, reserve0, reserve1, mode, token0Data, token1Data]);

  const handleExecute = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (mode === 'add') {
      if (needsApproval0 || needsApproval1) {
        setStep('approve');
        return;
      }
      addLiquidity?.();
    } else {
      removeLiquidity?.();
    }
  };

  const handleApprove = async () => {
    if (needsApproval0) {
      approve0?.();
    }
    if (needsApproval1) {
      approve1?.();
    }
  };

  const resetModal = () => {
    setAmount0('');
    setAmount1('');
    setLpAmount('');
    setStep('input');
  };

  useEffect(() => {
    if (!isOpen) {
      resetModal();
    }
  }, [isOpen]);

  if (!isOpen || !pool) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <HolographicCard className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-cyber text-cyber">
                {mode === 'add' ? 'ADD LIQUIDITY' : 'REMOVE LIQUIDITY'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Pool Info */}
            <div className="cyber-card p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{TOKEN_ICONS[pool?.token0Symbol] || '🪙'}</span>
                  <span className="text-2xl">{TOKEN_ICONS[pool?.token1Symbol] || '🪙'}</span>
                  <span className="font-cyber text-white">
                    {pool?.token0Symbol || 'TOKEN0'}/{pool?.token1Symbol || 'TOKEN1'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400 font-cyber">APR</div>
                  <div className="text-neon-green font-cyber">{pool?.apr || '0'}%</div>
                </div>
              </div>
            </div>

            {mode === 'add' ? (
              <>
                {/* Token 0 Input */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-cyber text-gray-400 uppercase">
                      {pool?.token0Symbol || 'TOKEN0'} Amount
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 font-cyber">
                        Balance: {token0Data?.formattedBalance || '0.00'}
                      </span>
                      <button
                        onClick={() => mintToken0?.()}
                        disabled={minting0}
                        className="text-xs px-2 py-1 bg-neon-green/20 border border-neon-green/30 text-neon-green rounded hover:bg-neon-green/30 transition-colors font-cyber"
                      >
                        {minting0 ? 'MINTING...' : 'GET TOKENS'}
                      </button>
                    </div>
                  </div>
                  <div className="cyber-card p-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{TOKEN_ICONS[pool?.token0Symbol] || '🪙'}</span>
                      <input
                        type="number"
                        value={amount0}
                        onChange={(e) => setAmount0(e.target.value)}
                        placeholder="0.0"
                        className="cyber-input flex-1 text-lg font-bold"
                      />
                      <button
                        onClick={() => setAmount0(token0Data?.formattedBalance || '0')}
                        className="px-2 py-1 text-xs font-cyber bg-neon-blue/20 border border-neon-blue/30 text-neon-blue rounded hover:bg-neon-blue/30 transition-colors"
                      >
                        MAX
                      </button>
                      <button
                        onClick={() => mintToken0?.()}
                        disabled={minting0}
                        className="px-2 py-1 text-xs font-cyber bg-neon-green/20 border border-neon-green/30 text-neon-green rounded hover:bg-neon-green/30 transition-colors disabled:opacity-50"
                      >
                        {minting0 ? '...' : 'GET'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Plus Icon */}
                <div className="flex justify-center mb-4">
                  <div className="p-2 bg-neon-blue/20 border border-neon-blue/30 rounded-full">
                    <Plus className="h-4 w-4 text-neon-blue" />
                  </div>
                </div>

                {/* Token 1 Input */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-cyber text-gray-400 uppercase">
                      {pool?.token1Symbol || 'TOKEN1'} Amount
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 font-cyber">
                        Balance: {token1Data?.formattedBalance || '0.00'}
                      </span>
                      <button
                        onClick={() => mintToken1?.()}
                        disabled={minting1}
                        className="text-xs px-2 py-1 bg-neon-green/20 border border-neon-green/30 text-neon-green rounded hover:bg-neon-green/30 transition-colors font-cyber"
                      >
                        {minting1 ? 'MINTING...' : 'GET TOKENS'}
                      </button>
                    </div>
                  </div>
                  <div className="cyber-card p-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{TOKEN_ICONS[pool?.token1Symbol] || '🪙'}</span>
                      <input
                        type="number"
                        value={amount1}
                        onChange={(e) => setAmount1(e.target.value)}
                        placeholder="0.0"
                        className="cyber-input flex-1 text-lg font-bold"
                      />
                      <button
                        onClick={() => setAmount1(token1Data?.formattedBalance || '0')}
                        className="px-2 py-1 text-xs font-cyber bg-neon-blue/20 border border-neon-blue/30 text-neon-blue rounded hover:bg-neon-blue/30 transition-colors"
                      >
                        MAX
                      </button>
                      <button
                        onClick={() => mintToken1?.()}
                        disabled={minting1}
                        className="px-2 py-1 text-xs font-cyber bg-neon-green/20 border border-neon-green/30 text-neon-green rounded hover:bg-neon-green/30 transition-colors disabled:opacity-50"
                      >
                        {minting1 ? '...' : 'GET'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* LP Token Input for Remove */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-cyber text-gray-400 uppercase">
                      LP Tokens to Remove
                    </label>
                    <span className="text-xs text-gray-500 font-cyber">
                      Balance: {formattedLpBalance}
                    </span>
                  </div>
                  <div className="cyber-card p-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">🏊</span>
                      <input
                        type="number"
                        value={lpAmount}
                        onChange={(e) => setLpAmount(e.target.value)}
                        placeholder="0.0"
                        className="cyber-input flex-1 text-lg font-bold"
                      />
                      <button
                        onClick={() => setLpAmount(formattedLpBalance)}
                        className="px-2 py-1 text-xs font-cyber bg-neon-blue/20 border border-neon-blue/30 text-neon-blue rounded hover:bg-neon-blue/30 transition-colors"
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Transaction Details */}
            {((mode === 'add' && amount0 && amount1) || (mode === 'remove' && lpAmount)) && (
              <div className="cyber-card p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-cyber">Pool Share</span>
                  <span className="text-neon-blue font-cyber">~0.1%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-cyber">Fee Tier</span>
                  <span className="text-neon-purple font-cyber">{((pool?.fee || 0) / 10000).toFixed(2)}%</span>
                </div>
                {mode === 'add' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-cyber">Est. LP Tokens</span>
                    <span className="text-neon-green font-cyber">~{(parseFloat(amount0 || '0') * 0.1).toFixed(4)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Button */}
            <div className="space-y-3">
              {!isConnected ? (
                <div className="text-center p-4 cyber-card">
                  <div className="flex items-center justify-center space-x-2 text-neon-yellow">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-cyber">CONNECT WALLET</span>
                  </div>
                </div>
              ) : step === 'approve' ? (
                <CyberButton
                  onClick={handleApprove}
                  disabled={approving0 || approving1}
                  loading={approving0 || approving1}
                  variant="neon"
                  size="lg"
                  className="w-full"
                >
                  {approving0 || approving1 ? 'APPROVING...' : 'APPROVE TOKENS'}
                </CyberButton>
              ) : (
                <CyberButton
                  onClick={handleExecute}
                  disabled={
                    (mode === 'add' && (!amount0 || !amount1 || parseFloat(amount0) <= 0 || parseFloat(amount1) <= 0)) ||
                    (mode === 'remove' && (!lpAmount || parseFloat(lpAmount) <= 0)) ||
                    addingLiquidity || removingLiquidity
                  }
                  loading={addingLiquidity || removingLiquidity}
                  variant="neon"
                  size="lg"
                  icon={mode === 'add' ? Plus : Minus}
                  className="w-full"
                >
                  {addingLiquidity || removingLiquidity 
                    ? (mode === 'add' ? 'ADDING...' : 'REMOVING...') 
                    : (mode === 'add' ? 'ADD LIQUIDITY' : 'REMOVE LIQUIDITY')
                  }
                </CyberButton>
              )}
            </div>

            {/* Info */}
            <div className="mt-4 cyber-card p-3 border-neon-blue/30">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-neon-blue mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-400 leading-relaxed">
                  {mode === 'add' 
                    ? 'Adding liquidity will mint LP tokens representing your share of the pool. You will earn fees proportional to your share.'
                    : 'Removing liquidity will burn your LP tokens and return the underlying tokens plus any earned fees.'
                  }
                </p>
              </div>
            </div>
          </HolographicCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}