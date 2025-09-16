const { run } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Verifying contracts on Somnia Network...");

  // Load deployment info
  const deploymentPath = path.join(__dirname, "../deployments/somnia.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("Deployment file not found. Run 'npm run deploy' first.");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contracts = deployment.contracts;

  try {
    // Verify LiquidityPoolRegistry
    console.log("\n📋 Verifying LiquidityPoolRegistry...");
    await run("verify:verify", {
      address: contracts.LiquidityPoolRegistry,
      constructorArguments: [],
    });
    console.log("✅ LiquidityPoolRegistry verified");

    // Verify FlashBorrowModule
    console.log("\n⚡ Verifying FlashBorrowModule...");
    await run("verify:verify", {
      address: contracts.FlashBorrowModule,
      constructorArguments: [],
    });
    console.log("✅ FlashBorrowModule verified");

    // Verify LiquidityRouter
    console.log("\n🔄 Verifying LiquidityRouter...");
    await run("verify:verify", {
      address: contracts.LiquidityRouter,
      constructorArguments: [],
    });
    console.log("✅ LiquidityRouter verified");

    // Verify mock tokens if they exist
    if (deployment.seedData && deployment.seedData.tokens) {
      console.log("\n🪙 Verifying mock tokens...");
      const tokens = deployment.seedData.tokens;
      
      const tokenConfigs = [
        { name: "Mock USDC", symbol: "mUSDC", decimals: 6, supply: "1000000000000" },
        { name: "Mock USDT", symbol: "mUSDT", decimals: 6, supply: "1000000000000" },
        { name: "Mock WETH", symbol: "mWETH", decimals: 18, supply: "10000000000000000000000" },
        { name: "Mock WBTC", symbol: "mWBTC", decimals: 8, supply: "10000000000" },
      ];

      for (const [symbol, address] of Object.entries(tokens)) {
        const config = tokenConfigs.find(t => t.symbol === symbol);
        if (config) {
          try {
            await run("verify:verify", {
              address: address,
              constructorArguments: [
                config.name,
                config.symbol,
                config.decimals,
                config.supply
              ],
            });
            console.log(`✅ ${symbol} verified`);
          } catch (error) {
            console.log(`⚠️  ${symbol} verification failed:`, error.message);
          }
        }
      }
    }

    console.log("\n🎉 Contract verification completed!");
    console.log("🔗 View contracts on Somnia Explorer:");
    console.log(`   Registry: https://somnia-testnet.blockscout.com/address/${contracts.LiquidityPoolRegistry}`);
    console.log(`   Flash Module: https://somnia-testnet.blockscout.com/address/${contracts.FlashBorrowModule}`);
    console.log(`   Router: https://somnia-testnet.blockscout.com/address/${contracts.LiquidityRouter}`);

  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification script failed:", error);
    process.exit(1);
  });