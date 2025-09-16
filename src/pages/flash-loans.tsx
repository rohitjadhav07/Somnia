import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { formatUnits, parseUnits } from 'viem';
import { 
  Zap, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  Info,
  Sparkles,
  Target,
  ArrowRight,
  Calculator
} from 'lucide-react';
import toast from 'react-hot-toast';

import CyberButton from '@/components/ui/CyberButton';
import HolographicCard from '@/components/ui/HolographicCard';
import GlitchText from '@/components/ui/GlitchText';
import { useFlashLoanTokens } from '@/hooks/useProtocolData';
import { useTokenData } from '@/hooks/useTokenData';
import { useFlashLoan } from '@/hooks/useFlashLoan';
import contractsConfig from '@/config/contracts.json';

// Token icons mapping
const TOKEN_ICONS: { [key: string]: string } = {
  'USDC': '💵',
  'USDT': '💰', 
  'WETH': '⚡',
  'WBTC': '₿',
  'ETH': '⚡',
};

export default function FlashLoans() {
  const { address, isConnected } = useAccount();
  const [selectedToken, setSelectedToken] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [strategy, setStrategy] = useState<'arbitrage' | 'liquidation' | 'custom'>('arbitrage');
  const [customCalldata, setCustomCalldata] = useState('');

  // Get supported tokens from flash loan module
  const { supportedTokens, isLoading: tokensLoading } = useFlashLoanTokens();
  
  // Get token data for supported tokens
  const { tokens, isLoading: tokenDataLoading } = useTokenData(supportedTokens);
  
  // Flash loan hooks
  const { useMaxFlashLoan, useFlashFee, useExecuteFlashLoan, useFlashModuleBalance } = useFlashLoan();

  // Set default token when data loads
  useEffect(() => {
    if (tokens.length > 0 && !selectedToken) {
      setSelectedToken(tokens[0].address);
    }
  }, [tokens, selectedToken]);

  const selectedTokenData = tokens.find(t => t.address === selectedToken);

  // Get max flash loan amount
  const { maxAmount, isLoading: maxAmountLoading } = useMaxFlashLoan(selectedToken);
  
  // Get flash loan fee
  const { fee, formattedFee, isLoading: feeLoading } = useFlashFee(
    selectedToken, 
    loanAmount, 
    selectedTokenData?.decimals || 18
  );

  // Get flash module balance
  const { balance: moduleBalance, isLoading: balanceLoading } = useFlashModuleBalance(selectedToken);

  // Execute flash loan
  const { executeFlashLoan, isLoading: executing } = useExecuteFlashLoan(
    selectedToken,
    loanAmount,
    selectedTokenData?.decimals || 18,
    customCalldata
  );

  const handleExecuteFlashLoan = async () => {
    if (!isConnected || !loanAmount || parseFloat(loanAmount) <= 0) {
      toast.error('Please connect wallet and enter valid amount');
      return;
    }

    if (!selectedTokenData) {
      toast.error('Please select a token');
      return;
    }

    const loanAmountBigInt = parseUnits(loanAmount, selectedTokenData.decimals);
    if (loanAmountBigInt > maxAmount) {
      toast.error('Amount exceeds maximum flash loan limit');
      return;
    }

    // Generate calldata based on strategy
    let calldata = customCalldata;
    if (strategy === 'arbitrage') {
      // Simple arbitrage example - in real implementation, this would be more complex
      calldata = '0x'; // Placeholder for arbitrage logic
      toast.info('Arbitrage strategy selected - implement your arbitrage logic!');
    } else if (strategy === 'liquidation') {
      calldata = '0x'; // Placeholder for liquidation logic
      toast.info('Liquidation strategy selected - implement your liquidation logic!');
    }

    executeFlashLoan?.();
  };

  const maxFormattedAmount = selectedTokenData ? 
    formatUnits(maxAmount, selectedTokenData.decimals) : '0';

  const moduleFormattedBalance = selectedTokenData ? 
    formatUnits(moduleBalance, selectedTokenData.decimals) : '0';

  return (
    <div className="min-h-screen relative">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <GlitchText 
            text="FLASH LOANS"
            className="text-4xl font-cyber text-cyber mb-4"
            glitchIntensity="low"
          />
          <p className="text-gray-400 font-cyber">
            INSTANT UNCOLLATERALIZED LOANS ON SOMNIA NETWORK
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Flash Loan Interface */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <HolographicCard className="p-6 mb-6">
                <h2 className="text-xl font-cyber text-cyber mb-6">
                  FLASH LOAN INTERFACE
                </h2>

                {/* Token Selection */}
                <div className="space-y-4 mb-6">
                  <label className="text-sm font-cyber text-gray-400 uppercase tracking-wider">
                    Select Token
                  </label>
                  <div className="cyber-card p-4">
                    <select
                      value={selectedToken}
                      onChange={(e) => setSelectedToken(e.target.value)}
                      className="cyber-input w-full"
                      disabled={tokensLoading || tokenDataLoading}
                    >
                      <option value="">Select Token</option>
                      {tokens.map((token) => (
                        <option key={token.address} value={token.address}>
                          {TOKEN_ICONS[token.symbol] || '🪙'} {token.symbol} - {token.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-cyber text-gray-400 uppercase tracking-wider">
                      Loan Amount
                    </label>
                    <span className="text-xs text-gray-500 font-cyber">
                      Max: {parseFloat(maxFormattedAmount).toFixed(6)} {selectedTokenData?.symbol}
                    </span>
                  </div>
                  <div className="cyber-card p-4">
                    <div className="flex items-center space-x-4">
                      <input
                        type="number"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(e.target.value)}
                        placeholder="0.0"
                        className="cyber-input flex-1 text-xl font-bold"
                      />
                      <button
                        onClick={() => setLoanAmount(maxFormattedAmount)}
                        className="px-3 py-1 text-xs font-cyber bg-neon-blue/20 border border-neon-blue/30 text-neon-blue rounded hover:bg-neon-blue/30 transition-colors"
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                </div>

                {/* Strategy Selection */}
                <div className="space-y-4 mb-6">
                  <label className="text-sm font-cyber text-gray-400 uppercase tracking-wider">
                    Strategy
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'arbitrage', label: 'Arbitrage', icon: TrendingUp },
                      { id: 'liquidation', label: 'Liquidation', icon: Target },
                      { id: 'custom', label: 'Custom', icon: Calculator },
                    ].map((strat) => (
                      <motion.button
                        key={strat.id}
                        onClick={() => setStrategy(strat.id as any)}
                        className={`p-3 rounded font-cyber text-sm transition-all ${
                          strategy === strat.id
                            ? 'bg-neon-blue text-black'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <strat.icon className="h-4 w-4 mx-auto mb-1" />
                        {strat.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Custom Calldata */}
                {strategy === 'custom' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 mb-6"
                  >
                    <label className="text-sm font-cyber text-gray-400 uppercase tracking-wider">
                      Custom Calldata
                    </label>
                    <textarea
                      value={customCalldata}
                      onChange={(e) => setCustomCalldata(e.target.value)}
                      placeholder="0x..."
                      className="cyber-input w-full h-24 resize-none"
                    />
                  </motion.div>
                )}

                {/* Loan Details */}
                <AnimatePresence>
                  {loanAmount && selectedTokenData && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 overflow-hidden"
                    >
                      <div className="cyber-card p-4 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-cyber">LOAN AMOUNT</span>
                          <span className="text-neon-blue font-cyber">
                            {parseFloat(loanAmount).toLocaleString()} {selectedTokenData.symbol}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-cyber">FLASH LOAN FEE</span>
                          <span className="text-neon-yellow font-cyber">
                            {parseFloat(formattedFee).toFixed(6)} {selectedTokenData.symbol}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-cyber">TOTAL REPAYMENT</span>
                          <span className="text-neon-pink font-cyber">
                            {(parseFloat(loanAmount) + parseFloat(formattedFee)).toFixed(6)} {selectedTokenData.symbol}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-cyber">EXECUTION TIME</span>
                          <span className="text-neon-green font-cyber">Single Transaction</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Execute Button */}
                <div className="mb-4">
                  {!isConnected ? (
                    <div className="text-center p-4 cyber-card">
                      <div className="flex items-center justify-center space-x-2 text-neon-yellow">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-cyber">CONNECT WALLET TO EXECUTE FLASH LOAN</span>
                      </div>
                    </div>
                  ) : (
                    <CyberButton
                      onClick={handleExecuteFlashLoan}
                      disabled={!loanAmount || parseFloat(loanAmount) <= 0 || executing}
                      loading={executing}
                      variant="neon"
                      size="lg"
                      icon={Zap}
                      className="w-full"
                    >
                      {executing ? 'EXECUTING...' : 'EXECUTE FLASH LOAN'}
                    </CyberButton>
                  )}
                </div>

                {/* Warning */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="cyber-card p-3 border-neon-pink/30"
                >
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-neon-pink mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Flash loans must be repaid within the same transaction. Ensure your strategy 
                      generates enough profit to cover the loan amount plus fees, or the transaction will revert.
                    </p>
                  </div>
                </motion.div>
              </HolographicCard>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Flash Loan Stats */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <HolographicCard className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles className="h-5 w-5 text-neon-blue" />
                  <h3 className="text-lg font-cyber text-cyber">
                    FLASH STATS
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-cyber text-neon-green">
                      {parseFloat(moduleFormattedBalance).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400 font-cyber">
                      {selectedTokenData?.symbol} AVAILABLE
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-cyber text-neon-blue">
                      0.5%
                    </div>
                    <div className="text-xs text-gray-400 font-cyber">
                      FLASH LOAN FEE
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-cyber text-neon-purple">
                      ~0.4s
                    </div>
                    <div className="text-xs text-gray-400 font-cyber">
                      EXECUTION TIME
                    </div>
                  </div>
                </div>
              </HolographicCard>
            </motion.div>

            {/* How It Works */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <HolographicCard className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Info className="h-5 w-5 text-neon-yellow" />
                  <h3 className="text-lg font-cyber text-cyber">
                    HOW IT WORKS
                  </h3>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-neon-blue text-black rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      1
                    </div>
                    <p className="text-gray-400">
                      Borrow tokens instantly without collateral
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-neon-purple text-black rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      2
                    </div>
                    <p className="text-gray-400">
                      Execute your arbitrage or liquidation strategy
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-neon-green text-black rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      3
                    </div>
                    <p className="text-gray-400">
                      Repay loan + fee in the same transaction
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-neon-yellow text-black rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      ✓
                    </div>
                    <p className="text-gray-400">
                      Keep the profit or transaction reverts
                    </p>
                  </div>
                </div>
              </HolographicCard>
            </motion.div>

            {/* Strategies */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <HolographicCard className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Target className="h-5 w-5 text-neon-pink" />
                  <h3 className="text-lg font-cyber text-cyber">
                    STRATEGIES
                  </h3>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-neon-blue/10 border border-neon-blue/30 rounded">
                    <div className="font-cyber text-neon-blue mb-1">ARBITRAGE</div>
                    <p className="text-gray-400 text-xs">
                      Exploit price differences between DEXs
                    </p>
                  </div>
                  <div className="p-3 bg-neon-purple/10 border border-neon-purple/30 rounded">
                    <div className="font-cyber text-neon-purple mb-1">LIQUIDATION</div>
                    <p className="text-gray-400 text-xs">
                      Liquidate undercollateralized positions
                    </p>
                  </div>
                  <div className="p-3 bg-neon-green/10 border border-neon-green/30 rounded">
                    <div className="font-cyber text-neon-green mb-1">CUSTOM</div>
                    <p className="text-gray-400 text-xs">
                      Implement your own strategy logic
                    </p>
                  </div>
                </div>
              </HolographicCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}