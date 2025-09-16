const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Flash Liquidity Layer", function () {
  let registry, flashModule, router;
  let mockToken0, mockToken1, mockPool;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken0 = await MockERC20.deploy("Mock USDC", "mUSDC", 6, ethers.parseUnits("1000000", 6));
    mockToken1 = await MockERC20.deploy("Mock USDT", "mUSDT", 6, ethers.parseUnits("1000000", 6));

    // Deploy mock pool
    const MockLiquidityPool = await ethers.getContractFactory("MockLiquidityPool");
    mockPool = await MockLiquidityPool.deploy(await mockToken0.getAddress(), await mockToken1.getAddress());

    // Add liquidity to mock pool
    await mockToken0.approve(await mockPool.getAddress(), ethers.parseUnits("100000", 6));
    await mockToken1.approve(await mockPool.getAddress(), ethers.parseUnits("100000", 6));
    await mockPool.addLiquidity(ethers.parseUnits("100000", 6), ethers.parseUnits("100000", 6));

    // Deploy main contracts
    const LiquidityPoolRegistry = await ethers.getContractFactory("LiquidityPoolRegistry");
    registry = await LiquidityPoolRegistry.deploy();
    await registry.initialize(owner.address, 100); // 1% protocol fee

    const FlashBorrowModule = await ethers.getContractFactory("FlashBorrowModule");
    flashModule = await FlashBorrowModule.deploy();
    await flashModule.initialize(await registry.getAddress(), 50); // 0.5% flash loan fee

    const LiquidityRouter = await ethers.getContractFactory("LiquidityRouter");
    router = await LiquidityRouter.deploy();
    await router.initialize(await registry.getAddress(), await flashModule.getAddress(), 25); // 0.25% router fee
  });

  describe("LiquidityPoolRegistry", function () {
    it("Should register a pool successfully", async function () {
      await registry.registerPool(await mockPool.getAddress(), 300); // 3% fee

      const poolInfo = await registry.getPoolInfo(await mockPool.getAddress());
      expect(poolInfo.isActive).to.be.true;
      expect(poolInfo.fee).to.equal(300);
      expect(poolInfo.token0).to.equal(await mockToken0.getAddress());
      expect(poolInfo.token1).to.equal(await mockToken1.getAddress());
    });

    it("Should authorize router for pool", async function () {
      await registry.registerPool(await mockPool.getAddress(), 300);
      await registry.authorizeRouter(await router.getAddress(), await mockPool.getAddress());

      const isAuthorized = await registry.authorizedRouters(
        await router.getAddress(),
        await mockPool.getAddress()
      );
      expect(isAuthorized).to.be.true;
    });

    it("Should get pool by token pair", async function () {
      await registry.registerPool(await mockPool.getAddress(), 300);

      const poolAddress = await registry.getPoolByTokens(
        await mockToken0.getAddress(),
        await mockToken1.getAddress()
      );
      expect(poolAddress).to.equal(await mockPool.getAddress());
    });

    it("Should prevent duplicate pool registration", async function () {
      await registry.registerPool(await mockPool.getAddress(), 300);

      await expect(
        registry.registerPool(await mockPool.getAddress(), 300)
      ).to.be.revertedWith("Pool already registered");
    });
  });

  describe("FlashBorrowModule", function () {
    beforeEach(async function () {
      // Add supported token and deposit liquidity
      await flashModule.addSupportedToken(await mockToken0.getAddress());
      await mockToken0.approve(await flashModule.getAddress(), ethers.parseUnits("50000", 6));
      await flashModule.depositLiquidity(await mockToken0.getAddress(), ethers.parseUnits("50000", 6));
    });

    it("Should add supported token", async function () {
      const isSupported = await flashModule.supportedTokens(await mockToken0.getAddress());
      expect(isSupported).to.be.true;
    });

    it("Should deposit liquidity", async function () {
      const balance = await flashModule.getTokenBalance(await mockToken0.getAddress());
      expect(balance).to.equal(ethers.parseUnits("50000", 6));
    });

    it("Should calculate flash loan fee correctly", async function () {
      const loanAmount = ethers.parseUnits("1000", 6);
      const fee = await flashModule.flashFee(await mockToken0.getAddress(), loanAmount);
      const expectedFee = loanAmount * BigInt(50) / BigInt(10000); // 0.5%
      expect(fee).to.equal(expectedFee);
    });

    it("Should return max flash loan amount", async function () {
      const maxLoan = await flashModule.maxFlashLoan(await mockToken0.getAddress());
      expect(maxLoan).to.equal(ethers.parseUnits("50000", 6));
    });

    it("Should reject flash loan for unsupported token", async function () {
      await expect(
        flashModule.maxFlashLoan(await mockToken1.getAddress())
      ).to.not.be.reverted;
      
      const maxLoan = await flashModule.maxFlashLoan(await mockToken1.getAddress());
      expect(maxLoan).to.equal(0);
    });
  });

  describe("LiquidityRouter", function () {
    beforeEach(async function () {
      // Register pool and authorize router
      await registry.registerPool(await mockPool.getAddress(), 300);
      await registry.authorizeRouter(await router.getAddress(), await mockPool.getAddress());
    });

    it("Should get amount out for swap", async function () {
      const amountIn = ethers.parseUnits("1000", 6);
      const [amountOut, poolAddress] = await router.getAmountOut(
        amountIn,
        await mockToken0.getAddress(),
        await mockToken1.getAddress()
      );

      expect(amountOut).to.be.gt(0);
      expect(poolAddress).to.equal(await mockPool.getAddress());
    });

    it("Should find best route", async function () {
      const amountIn = ethers.parseUnits("1000", 6);
      const route = await router.getBestRoute(
        await mockToken0.getAddress(),
        await mockToken1.getAddress(),
        amountIn
      );

      expect(route.pool).to.equal(await mockPool.getAddress());
      expect(route.amountOut).to.be.gt(0);
    });

    it("Should revert for non-existent pool", async function () {
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const nonExistentToken = await MockERC20.deploy("Test", "TEST", 18, ethers.parseEther("1000"));

      await expect(
        router.getAmountOut(
          ethers.parseUnits("1000", 6),
          await mockToken0.getAddress(),
          await nonExistentToken.getAddress()
        )
      ).to.be.revertedWith("Pool not found");
    });
  });

  describe("Integration Tests", function () {
    beforeEach(async function () {
      // Setup complete system
      await registry.registerPool(await mockPool.getAddress(), 300);
      await registry.authorizeRouter(await router.getAddress(), await mockPool.getAddress());
      
      await flashModule.addSupportedToken(await mockToken0.getAddress());
      await flashModule.addSupportedToken(await mockToken1.getAddress());
      
      // Deposit flash loan liquidity
      await mockToken0.approve(await flashModule.getAddress(), ethers.parseUnits("50000", 6));
      await flashModule.depositLiquidity(await mockToken0.getAddress(), ethers.parseUnits("50000", 6));
    });

    it("Should handle complete swap flow", async function () {
      // Transfer tokens to user
      await mockToken0.transfer(user1.address, ethers.parseUnits("1000", 6));
      
      // User approves router
      await mockToken0.connect(user1).approve(await router.getAddress(), ethers.parseUnits("1000", 6));

      // Get initial balances
      const initialBalance0 = await mockToken0.balanceOf(user1.address);
      const initialBalance1 = await mockToken1.balanceOf(user1.address);

      // Execute swap
      const swapParams = {
        tokenIn: await mockToken0.getAddress(),
        tokenOut: await mockToken1.getAddress(),
        amountIn: ethers.parseUnits("1000", 6),
        amountOutMin: 0,
        to: user1.address,
        deadline: Math.floor(Date.now() / 1000) + 3600
      };

      await router.connect(user1).swapExactTokensForTokens(swapParams);

      // Check balances changed
      const finalBalance0 = await mockToken0.balanceOf(user1.address);
      const finalBalance1 = await mockToken1.balanceOf(user1.address);

      expect(finalBalance0).to.be.lt(initialBalance0);
      expect(finalBalance1).to.be.gt(initialBalance1);
    });

    it("Should track swap statistics", async function () {
      const initialStats = await router.getRouterStats();
      
      // Transfer and approve tokens
      await mockToken0.transfer(user1.address, ethers.parseUnits("1000", 6));
      await mockToken0.connect(user1).approve(await router.getAddress(), ethers.parseUnits("1000", 6));

      // Execute swap
      const swapParams = {
        tokenIn: await mockToken0.getAddress(),
        tokenOut: await mockToken1.getAddress(),
        amountIn: ethers.parseUnits("1000", 6),
        amountOutMin: 0,
        to: user1.address,
        deadline: Math.floor(Date.now() / 1000) + 3600
      };

      await router.connect(user1).swapExactTokensForTokens(swapParams);

      const finalStats = await router.getRouterStats();
      expect(finalStats[0]).to.equal(initialStats[0] + BigInt(1)); // totalSwaps
      expect(finalStats[1]).to.be.gt(initialStats[1]); // totalVolume
    });
  });
});