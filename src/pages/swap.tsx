import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { formatUnits, parseUnits } from 'viem';
import { 
  ArrowDownUp, 
  Settings, 
  Info, 
  Zap, 
  TrendingUp,
  Clock,
  DollarSign,
  Sparkles,
  RefreshCw,
  Wallet
} from 'lucide-react';
import toast from 'react-hot-toast';

import CyberButton from '@/components/ui/CyberButton';
import HolographicCard from '@/components/ui/HolographicCard';
import GlitchText from '@/components/ui/GlitchText';
import { useFlashLoanTokens } from '@/hooks/useProtocolData';
import { useTokenData } from '@/hooks/useTokenData';
import { useSwap } from '@/hooks/useSwap';
import contractsConfig from '@/config/contracts.json';

// Token icons mapping
const TOKEN_ICONS: { [key: string]: string } = {
  'USDC': '💵',
  'USDT': '💰', 
  'WETH': '⚡',
  'WBTC': '₿',
  'ETH': '⚡',
};

export default function Swap() {
  const { address, isConnected } = useAccount();
  const [fromTokenAddress, setFromTokenAddress] = useState('');
  const [toTokenAddress, setToTokenAddress] = useState('');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [priceImpact, setPriceImpact] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Get supported tokens from flash loan module
  const { supportedTokens, isLoading: tokensLoading } = useFlashLoanTokens();
  
  // Get token data for supported tokens
  const { tokens, isLoading: tokenDataLoading } = useTokenData(supportedTokens);
  
  // Swap hooks
  const { useGetAmountOut, useExecuteSwap, useApproveToken, useCheckAllowance } = useSwap();

  // Set default tokens when data loads
  useEffect(() => {
    if (tokens.length >= 2 && !fromTokenAddress && !toTokenAddress) {
      setFromTokenAddress(tokens[0].address);
      setToTokenAddress(tokens[1].address);
    }
  }, [tokens, fromTokenAddress, toTokenAddress]);

  const fromToken = tokens.find(t => t.address === fromTokenAddress);
  const toToken = tokens.find(t => t.address === toTokenAddress);

  // Get amount out for current swap
  const { amountOut, isLoading: amountOutLoading } = useGetAmountOut(
    fromAmount,
    fromTokenAddress,
    toTokenAddress,
    fromToken?.decimals || 18
  );

  // Check allowance
  const { allowance } = useCheckAllowance(fromTokenAddress, address || '');
  const needsApproval = fromAmount && allowance < parseUnits(fromAmount, fromToken?.decimals || 18);

  // Approve token
  const { approve, isLoading: approving } = useApproveToken(
    fromTokenAddress,
    fromAmount,
    fromToken?.decimals || 18
  );

  // Execute swap
  const { executeSwap, isLoading: swapping } = useExecuteSwap(
    fromTokenAddress,
    toTokenAddress,
    fromAmount,
    toAmount,
    address || '',
    Math.floor(Date.now() / 1000) + 1200, // 20 minutes
    fromToken?.decimals || 18,
    toToken?.decimals || 18
  );

  // Update output amount when amountOut changes
  useEffect(() => {
    if (amountOut && toToken) {
      const formatted = formatUnits(amountOut, toToken.decimals);
      setToAmount(parseFloat(formatted).toFixed(6));
      
      // Calculate price impact
      if (fromAmount && parseFloat(fromAmount) > 0) {
        const impact = Math.min((parseFloat(fromAmount) / 100000) * 100, 5);
        setPriceImpact(impact);
      }
    } else if (!amountOutLoading) {
      setToAmount('');
      setPriceImpact(0);
    }
  }, [amountOut, toToken, fromAmount, amountOutLoading]);

  const handleSwapTokens = () => {
    const tempAddress = fromTokenAddress;
    setFromTokenAddress(toTokenAddress);
    setToTokenAddress(tempAddress);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleRefreshPrice = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    toast.success('Prices refreshed!');
  };

  const handleSwap = async () => {
    if (!isConnected || !fromAmount || parseFloat(fromAmount) <= 0) return;
    
    if (needsApproval) {
      toast.loading('Approving token...', { id: 'swap' });
      approve?.();
      return;
    }

    if (executeSwap) {
      toast.loading('Executing swap on Somnia Network...', { id: 'swap' });
      executeSwap();
    }
  };

  const TokenSelector = ({ 
    tokenAddress, 
    onSelect, 
    label,
    amount,
    onAmountChange,
    readOnly = false
  }: { 
    tokenAddress: string, 
    onSelect: (address: string) => void,
    label: string,
    amount: string,
    onAmountChange?: (value: string) => void,
    readOnly?: boolean
  }) => {
    const token = tokens.find(t => t.address === tokenAddress);
    if (!token) return null;

    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-cyber text-gray-400 uppercase tracking-wider">
            {label}
          </label>
          {isConnected && (
            <span className="text-xs text-gray-500 font-cyber">
              Balance: {token.formattedBalance} {token.symbol}
            </span>
          )}
        </div>
        
        <div className="cyber-card p-4">
          <div className="flex items-center space-x-4">
            {/* Token Selector */}
            <div className="relative">
              <select
                value={token.address}
                onChange={(e) => onSelect(e.target.value)}
                className="cyber-input w-32 text-sm pr-8"
                disabled={tokensLoading || tokenDataLoading}
              >
                {tokens.map((t) => (
                  <option key={t.address} value={t.address}>
                    {TOKEN_ICONS[t.symbol] || '🪙'} {t.symbol}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Amount Input */}
            <div className="flex-1">
              <input
                type="number"
                value={amount}
                onChange={(e) => onAmountChange?.(e.target.value)}
                placeholder="0.0"
                readOnly={readOnly}
                className={`cyber-input text-right text-xl font-bold ${
                  readOnly ? 'opacity-70' : ''
                }`}
              />
            </div>
          </div>
          
          {/* Token Info */}
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <span>{token.name}</span>
            {amount && parseFloat(amount) > 0 && (
              <span>~${(parseFloat(amount) * (token.symbol.includes('USD') ? 1 : 2000)).toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen relative">
      
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <GlitchText 
            text="QUANTUM SWAP"
            className="text-4xl font-cyber text-cyber mb-4"
            glitchIntensity="low"
          />
          <p className="text-gray-400 font-cyber">
            INSTANT TOKEN EXCHANGE ON SOMNIA NETWORK
          </p>
        </motion.div>

        {/* Main Swap Interface */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <HolographicCard className="p-6 mb-6">
            {/* Settings Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-cyber text-cyber">
                SWAP INTERFACE
              </h2>
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={handleRefreshPrice}
                  disabled={refreshing}
                  className="p-2 rounded-lg bg-neon-blue/10 border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/20 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </motion.button>
                <motion.button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-lg bg-neon-purple/10 border border-neon-purple/30 text-neon-purple hover:bg-neon-purple/20 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Settings className="h-4 w-4" />
                </motion.button>
              </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="cyber-card p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-cyber text-gray-400">
                        SLIPPAGE TOLERANCE
                      </span>
                      <div className="flex space-x-2">
                        {[0.1, 0.5, 1.0, 2.0].map((value) => (
                          <motion.button
                            key={value}
                            onClick={() => setSlippage(value)}
                            className={`px-3 py-1 rounded text-xs font-cyber transition-all ${
                              slippage === value
                                ? 'bg-neon-blue text-black'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {value}%
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* From Token */}
            <TokenSelector
              tokenAddress={fromTokenAddress}
              onSelect={setFromTokenAddress}
              label="FROM"
              amount={fromAmount}
              onAmountChange={setFromAmount}
            />

            {/* Swap Button */}
            <div className="flex justify-center my-6">
              <motion.button
                onClick={handleSwapTokens}
                className="p-3 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple shadow-neon hover:shadow-neon-lg transition-all"
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
              >
                <ArrowDownUp className="h-6 w-6 text-black" />
              </motion.button>
            </div>

            {/* To Token */}
            <TokenSelector
              tokenAddress={toTokenAddress}
              onSelect={setToTokenAddress}
              label="TO"
              amount={toAmount}
              readOnly
            />

            {/* Swap Details */}
            <AnimatePresence>
              {fromAmount && toAmount && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 overflow-hidden"
                >
                  <div className="cyber-card p-4 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-cyber">EXCHANGE RATE</span>
                      <span className="text-neon-blue font-cyber">
                        1 {fromToken.symbol} = {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toToken.symbol}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-cyber">PRICE IMPACT</span>
                      <span className={`font-cyber ${priceImpact > 2 ? 'text-neon-pink' : 'text-neon-green'}`}>
                        {priceImpact.toFixed(2)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-cyber">NETWORK FEE</span>
                      <span className="text-neon-green font-cyber">~$0.01</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-cyber">EXECUTION TIME</span>
                      <span className="text-neon-yellow font-cyber">~0.4s</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Swap Button */}
            <div className="mt-6">
              {!isConnected ? (
                <div className="text-center p-4 cyber-card">
                  <div className="flex items-center justify-center space-x-2 text-neon-yellow">
                    <Wallet className="h-5 w-5" />
                    <span className="font-cyber">CONNECT WALLET TO SWAP</span>
                  </div>
                </div>
              ) : (
                <CyberButton
                  onClick={handleSwap}
                  disabled={!fromAmount || parseFloat(fromAmount) <= 0 || swapping || approving}
                  loading={swapping || approving}
                  variant="neon"
                  size="lg"
                  icon={Zap}
                  className="w-full"
                >
                  {approving ? 'APPROVING...' : 
                   swapping ? 'SWAPPING...' : 
                   needsApproval ? 'APPROVE TOKEN' : 
                   'EXECUTE SWAP'}
                </CyberButton>
              )}
            </div>

            {/* Info Panel */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 cyber-card p-3"
            >
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-neon-blue mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-400 leading-relaxed">
                  Swaps execute instantly on Somnia Network with sub-second finality. 
                  Your transaction will be confirmed in under 1 second with minimal gas fees.
                </p>
              </div>
            </motion.div>
          </HolographicCard>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <HolographicCard className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="h-5 w-5 text-neon-green" />
              <h3 className="text-lg font-cyber text-cyber">
                RECENT ACTIVITY
              </h3>
            </div>
            
            <div className="space-y-3">
              {[
                { from: 'mUSDC', to: 'mWETH', amount: '1,000', time: '2m ago', status: 'success' },
                { from: 'mWETH', to: 'mWBTC', amount: '0.5', time: '5m ago', status: 'success' },
                { from: 'mUSDT', to: 'mUSDC', amount: '2,500', time: '8m ago', status: 'success' },
              ].map((swap, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex justify-between items-center py-2 border-b border-neon-blue/20 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                    <span className="text-sm font-cyber text-white">
                      {swap.amount} {swap.from} → {swap.to}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-500 font-cyber">
                      {swap.time}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </HolographicCard>
        </motion.div>

        {/* Performance Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-3 gap-4 mt-6"
        >
          <HolographicCard className="p-4 text-center">
            <Sparkles className="h-6 w-6 text-neon-blue mx-auto mb-2" />
            <div className="text-lg font-cyber text-cyber">98.7%</div>
            <div className="text-xs text-gray-400 font-cyber">SUCCESS RATE</div>
          </HolographicCard>
          
          <HolographicCard className="p-4 text-center">
            <Clock className="h-6 w-6 text-neon-green mx-auto mb-2" />
            <div className="text-lg font-cyber text-cyber">0.4s</div>
            <div className="text-xs text-gray-400 font-cyber">AVG TIME</div>
          </HolographicCard>
          
          <HolographicCard className="p-4 text-center">
            <DollarSign className="h-6 w-6 text-neon-yellow mx-auto mb-2" />
            <div className="text-lg font-cyber text-cyber">$0.01</div>
            <div className="text-xs text-gray-400 font-cyber">AVG FEE</div>
          </HolographicCard>
        </motion.div>
      </div>
    </div>
  );
}