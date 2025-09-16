import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { Zap, AlertTriangle, Code, Info, TrendingUp } from 'lucide-react';

const TOKENS = [
  { symbol: 'mUSDC', name: 'Mock USDC', decimals: 6, maxLoan: '50,000' },
  { symbol: 'mUSDT', name: 'Mock USDT', decimals: 6, maxLoan: '50,000' },
  { symbol: 'mWETH', name: 'Mock WETH', decimals: 18, maxLoan: '25' },
  { symbol: 'mWBTC', name: 'Mock WBTC', decimals: 8, maxLoan: '2' },
];

export default function FlashLoan() {
  const { address, isConnected } = useAccount();
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [loanAmount, setLoanAmount] = useState('');
  const [calldata, setCalldata] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFlashLoan = async () => {
    if (!isConnected || !loanAmount || parseFloat(loanAmount) <= 0) return;
    
    setIsLoading(true);
    try {
      // Mock flash loan execution
      await new Promise(resolve => setTimeout(resolve, 3000));
      alert('Flash loan executed successfully!');
      setLoanAmount('');
      setCalldata('');
    } catch (error) {
      console.error('Flash loan failed:', error);
      alert('Flash loan failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFee = (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) return '0';
    return (parseFloat(amount) * 0.005).toFixed(6); // 0.5% fee
  };

  const exampleStrategies = [
    {
      title: 'Arbitrage Trading',
      description: 'Exploit price differences between pools',
      code: `// 1. Flash loan USDC
// 2. Buy ETH on Pool A (lower price)
// 3. Sell ETH on Pool B (higher price)
// 4. Repay loan + fee
// 5. Keep profit`,
    },
    {
      title: 'Liquidation',
      description: 'Liquidate undercollateralized positions',
      code: `// 1. Flash loan collateral token
// 2. Liquidate position
// 3. Sell seized collateral
// 4. Repay loan + fee
// 5. Keep liquidation bonus`,
    },
    {
      title: 'Collateral Swap',
      description: 'Change collateral without closing position',
      code: `// 1. Flash loan new collateral
// 2. Deposit as collateral
// 3. Withdraw old collateral
// 4. Swap old for new collateral
// 5. Repay loan + fee`,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Flash Loans
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Borrow liquidity instantly within a single transaction
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Flash Loan Form */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Zap className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Request Flash Loan
                </h2>
              </div>

              {/* Token Selection */}
              <div className="mb-6">
                <label className="label">Select Token</label>
                <select
                  value={selectedToken.symbol}
                  onChange={(e) => {
                    const token = TOKENS.find(t => t.symbol === e.target.value);
                    if (token) setSelectedToken(token);
                  }}
                  className="input"
                >
                  {TOKENS.map((token) => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.symbol} - {token.name} (Max: {token.maxLoan})
                    </option>
                  ))}
                </select>
              </div>

              {/* Loan Amount */}
              <div className="mb-6">
                <label className="label">Loan Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder="0.0"
                    className="input pr-20"
                    max={selectedToken.maxLoan.replace(',', '')}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedToken.symbol}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Available: {selectedToken.maxLoan} {selectedToken.symbol}
                  </span>
                  <button
                    onClick={() => setLoanAmount(selectedToken.maxLoan.replace(',', ''))}
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Loan Details */}
              {loanAmount && parseFloat(loanAmount) > 0 && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Loan Amount</span>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {loanAmount} {selectedToken.symbol}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Flash Fee (0.5%)</span>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {calculateFee(loanAmount)} {selectedToken.symbol}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Total Repayment</span>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {(parseFloat(loanAmount) + parseFloat(calculateFee(loanAmount))).toFixed(6)} {selectedToken.symbol}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Gas Fee</span>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ~$0.02
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Options */}
              <div className="mb-6">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center space-x-2 text-primary-600 dark:text-primary-400 hover:underline"
                >
                  <Code className="h-4 w-4" />
                  <span>Advanced Options</span>
                </button>

                {showAdvanced && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <label className="label">Custom Calldata (Optional)</label>
                    <textarea
                      value={calldata}
                      onChange={(e) => setCalldata(e.target.value)}
                      placeholder="0x... (Leave empty for simple flash loan)"
                      className="input h-24 resize-none font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Custom calldata for complex flash loan strategies. Leave empty for testing.
                    </p>
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                      Important Notice
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Flash loans must be repaid within the same transaction. Ensure your contract 
                      logic can repay the loan + fee, or the entire transaction will revert.
                    </p>
                  </div>
                </div>
              </div>

              {/* Execute Button */}
              {!isConnected ? (
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    Please connect your wallet to request a flash loan
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleFlashLoan}
                  disabled={!loanAmount || parseFloat(loanAmount) <= 0 || isLoading}
                  className="btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Executing Flash Loan...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>Execute Flash Loan</span>
                    </div>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Flash Loan Stats */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Flash Loan Stats
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Loans</span>
                    <span className="font-semibold text-gray-900 dark:text-white">1,847</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Volume</span>
                    <span className="font-semibold text-gray-900 dark:text-white">$12.4M</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Success Rate</span>
                    <span className="font-semibold text-green-600">98.7%</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Fee</span>
                    <span className="font-semibold text-gray-900 dark:text-white">0.5%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                How Flash Loans Work
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    1
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Request loan amount from the pool
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    2
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Execute your custom logic (arbitrage, liquidation, etc.)
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    3
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Repay the loan + fee within the same transaction
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    ✓
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Keep any remaining profit
                  </p>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="card p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Pro Tip
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Flash loans on Somnia Network execute in under 1 second thanks to 
                sub-second finality. Perfect for time-sensitive arbitrage opportunities.
              </p>
            </div>
          </div>
        </div>

        {/* Example Strategies */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Example Strategies
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {exampleStrategies.map((strategy, index) => (
              <div key={index} className="card p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {strategy.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {strategy.description}
                </p>
                <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-x-auto">
                  <code className="text-gray-800 dark:text-gray-200">
                    {strategy.code}
                  </code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}