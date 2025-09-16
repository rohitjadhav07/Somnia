import { ethers } from "hardhat";
import { formatUnits, parseUnits } from "viem";
import contractsConfig from "../src/config/contracts.json";

interface ArbitrageOpportunity {
  tokenAddress: string;
  tokenSymbol: string;
  poolA: string;
  poolB: string;
  priceA: bigint;
  priceB: bigint;
  profitPotential: bigint;
  optimalAmount: bigint;
}

class FlashLoanArbitrageBot {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private registry: ethers.Contract;
  private router: ethers.Contract;
  private flashModule: ethers.Contract;
  private pools: Map<string, ethers.Contract> = new Map();
  private tokens: Map<string, { contract: ethers.Contract; decimals: number; symbol: string }> = new Map();

  constructor() {
    this.provider = ethers.provider;
    this.signer = ethers.provider.getSigner();
  }

  async initialize() {
    console.log("🤖 Initializing Flash Loan Arbitrage Bot...");

    // Load contract instances
    const registryABI = require("../src/contracts/abis/LiquidityPoolRegistry.json");
    const routerABI = require("../src/contracts/abis/LiquidityRouter.json");
    const flashModuleABI = require("../src/contracts/abis/FlashBorrowModule.json");
    const poolABI = require("../src/contracts/abis/MockLiquidityPool.json");
    const tokenABI = require("../src/contracts/abis/MockERC20.json");

    this.registry = new ethers.Contract(
      contractsConfig.contracts.LiquidityPoolRegistry.address,
      registryABI,
      this.signer
    );

    this.router = new ethers.Contract(
      contractsConfig.contracts.LiquidityRouter.address,
      routerABI,
      this.signer
    );

    this.flashModule = new ethers.Contract(
      contractsConfig.contracts.FlashBorrowModule.address,
      flashModuleABI,
      this.signer
    );

    // Load tokens
    for (const [symbol, tokenData] of Object.entries(contractsConfig.tokens)) {
      const tokenContract = new ethers.Contract(
        (tokenData as any).address,
        tokenABI,
        this.signer
      );
      
      const decimals = await tokenContract.decimals();
      this.tokens.set((tokenData as any).address, {
        contract: tokenContract,
        decimals: Number(decimals),
        symbol: (tokenData as any).symbol
      });
    }

    // Load pools
    for (const [pairName, poolAddress] of Object.entries(contractsConfig.pools)) {
      const poolContract = new ethers.Contract(
        poolAddress as string,
        poolABI,
        this.signer
      );
      this.pools.set(poolAddress as string, poolContract);
    }

    console.log(`✅ Loaded ${this.tokens.size} tokens and ${this.pools.size} pools`);
  }

  async scanForArbitrageOpportunities(): Promise<ArbitrageOpportunity[]> {
    console.log("🔍 Scanning for arbitrage opportunities...");
    
    const opportunities: ArbitrageOpportunity[] = [];
    const poolAddresses = Array.from(this.pools.keys());

    // Compare prices across all pool pairs
    for (let i = 0; i < poolAddresses.length; i++) {
      for (let j = i + 1; j < poolAddresses.length; j++) {
        const poolA = this.pools.get(poolAddresses[i])!;
        const poolB = this.pools.get(poolAddresses[j])!;

        try {
          // Get pool tokens
          const [token0A, token1A] = await Promise.all([
            poolA.token0(),
            poolA.token1()
          ]);
          
          const [token0B, token1B] = await Promise.all([
            poolB.token0(),
            poolB.token1()
          ]);

          // Find common tokens
          const commonTokens = [token0A, token1A].filter(token => 
            [token0B, token1B].includes(token)
          );

          for (const tokenAddress of commonTokens) {
            const opportunity = await this.calculateArbitrage(
              tokenAddress,
              poolAddresses[i],
              poolAddresses[j]
            );

            if (opportunity && opportunity.profitPotential > 0n) {
              opportunities.push(opportunity);
            }
          }
        } catch (error) {
          console.log(`⚠️ Error checking pools ${i}-${j}:`, error.message);
        }
      }
    }

    return opportunities.sort((a, b) => 
      Number(b.profitPotential - a.profitPotential)
    );
  }

  async calculateArbitrage(
    tokenAddress: string,
    poolAAddress: string,
    poolBAddress: string
  ): Promise<ArbitrageOpportunity | null> {
    try {
      const poolA = this.pools.get(poolAAddress)!;
      const poolB = this.pools.get(poolBAddress)!;
      const tokenData = this.tokens.get(tokenAddress)!;

      // Test amount for price calculation (1000 tokens)
      const testAmount = parseUnits("1000", tokenData.decimals);

      // Get prices from both pools
      const priceA = await poolA.getAmountOut(testAmount, tokenAddress);
      const priceB = await poolB.getAmountOut(testAmount, tokenAddress);

      // Calculate price difference
      const priceDiff = priceA > priceB ? priceA - priceB : priceB - priceA;
      const profitThreshold = testAmount / 100n; // 1% minimum profit

      if (priceDiff > profitThreshold) {
        // Calculate optimal arbitrage amount
        const optimalAmount = await this.calculateOptimalAmount(
          tokenAddress,
          poolAAddress,
          poolBAddress
        );

        return {
          tokenAddress,
          tokenSymbol: tokenData.symbol,
          poolA: poolAAddress,
          poolB: poolBAddress,
          priceA,
          priceB,
          profitPotential: priceDiff,
          optimalAmount
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async calculateOptimalAmount(
    tokenAddress: string,
    poolAAddress: string,
    poolBAddress: string
  ): Promise<bigint> {
    // Simplified optimal amount calculation
    // In production, this would use more sophisticated algorithms
    const tokenData = this.tokens.get(tokenAddress)!;
    const maxFlashLoan = await this.flashModule.maxFlashLoan(tokenAddress);
    
    // Use 10% of max flash loan as optimal amount
    return maxFlashLoan / 10n;
  }

  async executeArbitrage(opportunity: ArbitrageOpportunity): Promise<boolean> {
    console.log(`⚡ Executing arbitrage for ${opportunity.tokenSymbol}...`);
    console.log(`💰 Potential profit: ${formatUnits(opportunity.profitPotential, this.tokens.get(opportunity.tokenAddress)!.decimals)}`);

    try {
      // Create arbitrage calldata
      const arbitrageData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "address", "uint256"],
        [
          opportunity.poolA,
          opportunity.poolB,
          opportunity.tokenAddress,
          opportunity.optimalAmount
        ]
      );

      // Execute flash loan
      const tx = await this.flashModule.flashLoan(
        opportunity.tokenAddress,
        opportunity.optimalAmount,
        arbitrageData
      );

      console.log(`📝 Transaction hash: ${tx.hash}`);
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log(`✅ Arbitrage executed successfully!`);
        console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
        return true;
      } else {
        console.log(`❌ Transaction failed`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Arbitrage execution failed:`, error.message);
      return false;
    }
  }

  async monitorAndExecute() {
    console.log("🚀 Starting arbitrage monitoring...");
    
    while (true) {
      try {
        const opportunities = await this.scanForArbitrageOpportunities();
        
        if (opportunities.length > 0) {
          console.log(`🎯 Found ${opportunities.length} arbitrage opportunities:`);
          
          for (const opportunity of opportunities.slice(0, 3)) { // Execute top 3
            console.log(`- ${opportunity.tokenSymbol}: ${formatUnits(opportunity.profitPotential, this.tokens.get(opportunity.tokenAddress)!.decimals)} profit`);
            
            // Execute if profit is significant
            const tokenData = this.tokens.get(opportunity.tokenAddress)!;
            const profitInTokens = Number(formatUnits(opportunity.profitPotential, tokenData.decimals));
            
            if (profitInTokens > 10) { // Minimum 10 tokens profit
              await this.executeArbitrage(opportunity);
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between executions
            }
          }
        } else {
          console.log("😴 No profitable opportunities found");
        }

        // Wait 10 seconds before next scan
        await new Promise(resolve => setTimeout(resolve, 10000));
        
      } catch (error) {
        console.log("❌ Error in monitoring loop:", error.message);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s on error
      }
    }
  }

  async getStats() {
    console.log("\n📊 Bot Statistics:");
    console.log("==================");
    
    const signerAddress = await this.signer.getAddress();
    console.log(`🤖 Bot Address: ${signerAddress}`);
    
    const balance = await this.provider.getBalance(signerAddress);
    console.log(`💰 ETH Balance: ${formatUnits(balance, 18)} ETH`);
    
    // Get token balances
    for (const [address, tokenData] of this.tokens) {
      const balance = await tokenData.contract.balanceOf(signerAddress);
      const formattedBalance = formatUnits(balance, tokenData.decimals);
      console.log(`💵 ${tokenData.symbol} Balance: ${formattedBalance}`);
    }
    
    // Get flash loan stats
    const [totalLoans, totalVolume] = await this.flashModule.getFlashLoanStats();
    console.log(`⚡ Total Flash Loans: ${totalLoans.toString()}`);
    console.log(`📈 Total Volume: ${formatUnits(totalVolume, 18)} ETH`);
  }
}

// Main execution
async function main() {
  const bot = new FlashLoanArbitrageBot();
  
  try {
    await bot.initialize();
    await bot.getStats();
    
    // Scan once for demo
    console.log("\n🔍 Demo: Scanning for opportunities...");
    const opportunities = await bot.scanForArbitrageOpportunities();
    
    if (opportunities.length > 0) {
      console.log(`\n🎯 Found ${opportunities.length} opportunities:`);
      opportunities.forEach((opp, i) => {
        const tokenData = bot.tokens.get(opp.tokenAddress)!;
        const profit = formatUnits(opp.profitPotential, tokenData.decimals);
        console.log(`${i + 1}. ${opp.tokenSymbol}: ${profit} profit potential`);
      });
      
      // Execute the most profitable one
      if (opportunities[0]) {
        console.log(`\n⚡ Executing most profitable opportunity...`);
        await bot.executeArbitrage(opportunities[0]);
      }
    } else {
      console.log("😴 No arbitrage opportunities found at this time");
    }
    
    // Uncomment to run continuous monitoring
    // await bot.monitorAndExecute();
    
  } catch (error) {
    console.error("❌ Bot error:", error);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ Arbitrage bot demo completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Fatal error:", error);
      process.exit(1);
    });
}

export { FlashLoanArbitrageBot };