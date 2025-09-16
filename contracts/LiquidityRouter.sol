// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./LiquidityPoolRegistry.sol";
import "./FlashBorrowModule.sol";
import "./interfaces/ILiquidityPool.sol";

contract LiquidityRouter is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20 for IERC20;

    LiquidityPoolRegistry public registry;
    FlashBorrowModule public flashModule;
    
    uint256 public routerFee; // Fee in basis points
    uint256 public totalSwaps;
    uint256 public totalVolume;
    
    mapping(address => uint256) public userSwapCounts;
    mapping(address => uint256) public userVolumes;

    struct SwapParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOutMin;
        address to;
        uint256 deadline;
    }

    struct RouteInfo {
        address pool;
        address tokenIn;
        address tokenOut;
        uint256 amountOut;
        uint256 fee;
    }

    event Swap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address pool,
        uint256 fee
    );

    event MultiHopSwap(
        address indexed user,
        address[] tokens,
        uint256[] amounts,
        address[] pools,
        uint256 totalFee
    );

    event RouterFeeUpdated(uint256 oldFee, uint256 newFee);

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "Router: EXPIRED");
        _;
    }

    function initialize(
        address _registry,
        address _flashModule,
        uint256 _routerFee
    ) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        
        registry = LiquidityPoolRegistry(_registry);
        flashModule = FlashBorrowModule(_flashModule);
        routerFee = _routerFee;
    }

    function swapExactTokensForTokens(
        SwapParams calldata params
    ) external nonReentrant ensure(params.deadline) returns (uint256 amountOut) {
        require(params.amountIn > 0, "Invalid input amount");
        require(params.to != address(0), "Invalid recipient");

        address pool = registry.getPoolByTokens(params.tokenIn, params.tokenOut);
        require(pool != address(0), "Pool not found");
        
        LiquidityPoolRegistry.PoolInfo memory poolInfo = registry.getPoolInfo(pool);
        require(poolInfo.isActive, "Pool not active");

        // Transfer tokens from user
        IERC20(params.tokenIn).safeTransferFrom(msg.sender, address(this), params.amountIn);

        // Get expected output
        amountOut = ILiquidityPool(pool).getAmountOut(params.amountIn, params.tokenIn);
        require(amountOut >= params.amountOutMin, "Insufficient output amount");

        // Calculate fees
        uint256 poolFee = (amountOut * poolInfo.fee) / 10000;
        uint256 routerFeeAmount = (amountOut * routerFee) / 10000;
        uint256 finalAmountOut = amountOut - poolFee - routerFeeAmount;

        // Execute swap
        IERC20(params.tokenIn).safeTransfer(pool, params.amountIn);
        
        uint256 amount0Out = params.tokenOut == ILiquidityPool(pool).token0() ? finalAmountOut : 0;
        uint256 amount1Out = params.tokenOut == ILiquidityPool(pool).token1() ? finalAmountOut : 0;
        
        ILiquidityPool(pool).swap(amount0Out, amount1Out, params.to, "");

        // Record swap in registry
        registry.recordSwap(pool, params.amountIn, poolFee + routerFeeAmount);

        // Update stats
        totalSwaps++;
        totalVolume += params.amountIn;
        userSwapCounts[msg.sender]++;
        userVolumes[msg.sender] += params.amountIn;

        emit Swap(
            msg.sender,
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            finalAmountOut,
            pool,
            poolFee + routerFeeAmount
        );

        return finalAmountOut;
    }

    function getAmountOut(
        uint256 amountIn,
        address tokenIn,
        address tokenOut
    ) external view returns (uint256 amountOut, address pool) {
        pool = registry.getPoolByTokens(tokenIn, tokenOut);
        require(pool != address(0), "Pool not found");
        
        LiquidityPoolRegistry.PoolInfo memory poolInfo = registry.getPoolInfo(pool);
        require(poolInfo.isActive, "Pool not active");

        uint256 rawAmountOut = ILiquidityPool(pool).getAmountOut(amountIn, tokenIn);
        uint256 poolFee = (rawAmountOut * poolInfo.fee) / 10000;
        uint256 routerFeeAmount = (rawAmountOut * routerFee) / 10000;
        
        amountOut = rawAmountOut - poolFee - routerFeeAmount;
    }

    function getBestRoute(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (RouteInfo memory bestRoute) {
        address[] memory activePools = registry.getActivePools();
        uint256 bestAmountOut = 0;
        
        for (uint256 i = 0; i < activePools.length; i++) {
            address pool = activePools[i];
            LiquidityPoolRegistry.PoolInfo memory poolInfo = registry.getPoolInfo(pool);
            
            // Check if pool contains both tokens
            if ((poolInfo.token0 == tokenIn && poolInfo.token1 == tokenOut) ||
                (poolInfo.token0 == tokenOut && poolInfo.token1 == tokenIn)) {
                
                try ILiquidityPool(pool).getAmountOut(amountIn, tokenIn) returns (uint256 rawAmountOut) {
                    uint256 poolFee = (rawAmountOut * poolInfo.fee) / 10000;
                    uint256 routerFeeAmount = (rawAmountOut * routerFee) / 10000;
                    uint256 finalAmountOut = rawAmountOut - poolFee - routerFeeAmount;
                    
                    if (finalAmountOut > bestAmountOut) {
                        bestAmountOut = finalAmountOut;
                        bestRoute = RouteInfo({
                            pool: pool,
                            tokenIn: tokenIn,
                            tokenOut: tokenOut,
                            amountOut: finalAmountOut,
                            fee: poolFee + routerFeeAmount
                        });
                    }
                } catch {
                    // Skip this pool if getAmountOut fails
                    continue;
                }
            }
        }
        
        require(bestRoute.pool != address(0), "No route found");
    }

    function multiHopSwap(
        address[] calldata tokens,
        uint256 amountIn,
        uint256 amountOutMin,
        address to,
        uint256 deadline
    ) external nonReentrant ensure(deadline) returns (uint256 finalAmountOut) {
        require(tokens.length >= 2, "Invalid path");
        require(amountIn > 0, "Invalid input amount");
        require(to != address(0), "Invalid recipient");

        address[] memory pools = new address[](tokens.length - 1);
        uint256[] memory amounts = new uint256[](tokens.length);
        amounts[0] = amountIn;
        
        uint256 totalFee = 0;

        // Transfer initial tokens from user
        IERC20(tokens[0]).safeTransferFrom(msg.sender, address(this), amountIn);

        // Execute swaps along the path
        for (uint256 i = 0; i < tokens.length - 1; i++) {
            address pool = registry.getPoolByTokens(tokens[i], tokens[i + 1]);
            require(pool != address(0), "Pool not found in path");
            
            pools[i] = pool;
            LiquidityPoolRegistry.PoolInfo memory poolInfo = registry.getPoolInfo(pool);
            require(poolInfo.isActive, "Pool not active in path");

            uint256 rawAmountOut = ILiquidityPool(pool).getAmountOut(amounts[i], tokens[i]);
            uint256 poolFee = (rawAmountOut * poolInfo.fee) / 10000;
            uint256 routerFeeAmount = (rawAmountOut * routerFee) / 10000;
            amounts[i + 1] = rawAmountOut - poolFee - routerFeeAmount;
            totalFee += poolFee + routerFeeAmount;

            // Execute swap
            IERC20(tokens[i]).safeTransfer(pool, amounts[i]);
            
            uint256 amount0Out = tokens[i + 1] == ILiquidityPool(pool).token0() ? amounts[i + 1] : 0;
            uint256 amount1Out = tokens[i + 1] == ILiquidityPool(pool).token1() ? amounts[i + 1] : 0;
            
            address recipient = i == tokens.length - 2 ? to : address(this);
            ILiquidityPool(pool).swap(amount0Out, amount1Out, recipient, "");

            // Record swap
            registry.recordSwap(pool, amounts[i], poolFee + routerFeeAmount);
        }

        finalAmountOut = amounts[amounts.length - 1];
        require(finalAmountOut >= amountOutMin, "Insufficient output amount");

        // Update stats
        totalSwaps++;
        totalVolume += amountIn;
        userSwapCounts[msg.sender]++;
        userVolumes[msg.sender] += amountIn;

        emit MultiHopSwap(msg.sender, tokens, amounts, pools, totalFee);
    }

    function updateRouterFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee too high"); // Max 10%
        uint256 oldFee = routerFee;
        routerFee = _newFee;
        emit RouterFeeUpdated(oldFee, _newFee);
    }

    function getRouterStats() external view returns (uint256, uint256) {
        return (totalSwaps, totalVolume);
    }

    function getUserStats(address user) external view returns (uint256, uint256) {
        return (userSwapCounts[user], userVolumes[user]);
    }

    // Emergency function to recover stuck tokens
    function emergencyWithdraw(address token, address recipient) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance > 0) {
            IERC20(token).safeTransfer(recipient, balance);
        }
    }
}