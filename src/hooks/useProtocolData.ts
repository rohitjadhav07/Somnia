import React from 'react';
import { useContractReads } from 'wagmi';
import { formatEther, formatUnits } from 'viem';
import contractsConfig from '@/config/contracts.json';
import LiquidityPoolRegistryABI from '@/contracts/abis/LiquidityPoolRegistry.json';
import LiquidityRouterABI from '@/contracts/abis/LiquidityRouter.json';
import FlashBorrowModuleABI from '@/contracts/abis/FlashBorrowModule.json';

export function useProtocolData() {
  const { data, isError, isLoading, refetch } = useContractReads({
    contracts: [
      // Registry data
      {
        address: contractsConfig.contracts.LiquidityPoolRegistry.address as `0x${string}`,
        abi: LiquidityPoolRegistryABI as any,
        functionName: 'getTotalPools',
      },
      {
        address: contractsConfig.contracts.LiquidityPoolRegistry.address as `0x${string}`,
        abi: LiquidityPoolRegistryABI as any,
        functionName: 'totalProtocolFees',
      },
      {
        address: contractsConfig.contracts.LiquidityPoolRegistry.address as `0x${string}`,
        abi: LiquidityPoolRegistryABI as any,
        functionName: 'getActivePools',
      },
      // Router data
      {
        address: contractsConfig.contracts.LiquidityRouter.address as `0x${string}`,
        abi: LiquidityRouterABI as any,
        functionName: 'getRouterStats',
      },
      // Flash loan data
      {
        address: contractsConfig.contracts.FlashBorrowModule.address as `0x${string}`,
        abi: FlashBorrowModuleABI as any,
        functionName: 'getFlashLoanStats',
      },
    ],
    watch: true,
    cacheTime: 10_000, // 10 seconds
    enabled: contractsConfig.contracts.LiquidityPoolRegistry.address !== "0x0000000000000000000000000000000000000000",
  });

  const protocolData = React.useMemo(() => {
    if (!data || isError || isLoading) {
      // Fallback data while loading or if contracts not deployed
      return {
        totalPools: 0,
        totalProtocolFees: '0',
        activePools: [],
        totalSwaps: 0,
        totalVolume: '0',
        totalFlashLoans: 0,
        totalFlashLoanVolume: '0',
        isLoading: true,
      };
    }

    const [
      totalPoolsResult,
      totalProtocolFeesResult,
      activePoolsResult,
      routerStatsResult,
      flashLoanStatsResult,
    ] = data;

    const routerStats = routerStatsResult.result as [bigint, bigint] | undefined;
    const flashLoanStats = flashLoanStatsResult.result as [bigint, bigint] | undefined;

    return {
      totalPools: Number(totalPoolsResult.result || 0),
      totalProtocolFees: formatEther((totalProtocolFeesResult.result as any) || BigInt(0)),
      activePools: (activePoolsResult.result as string[]) || [],
      totalSwaps: Number(routerStats?.[0] || 0),
      totalVolume: formatEther((routerStats?.[1] as any) || BigInt(0)),
      totalFlashLoans: Number(flashLoanStats?.[0] || 0),
      totalFlashLoanVolume: formatEther((flashLoanStats?.[1] as any) || BigInt(0)),
      isLoading: false,
    };
  }, [data, isError, isLoading]);

  return {
    ...protocolData,
    isLoading: isLoading || protocolData.isLoading,
    isError,
    refetch,
  };
}

// Hook to get pool information
export function usePoolsData() {
  const { activePools } = useProtocolData();
  
  const { data: poolsData, isLoading } = useContractReads({
    contracts: activePools.map((poolAddress) => ({
      address: contractsConfig.contracts.LiquidityPoolRegistry.address as `0x${string}`,
      abi: LiquidityPoolRegistryABI as any,
      functionName: 'getPoolInfo',
      args: [poolAddress],
    })),
    enabled: activePools.length > 0 && contractsConfig.contracts.LiquidityPoolRegistry.address !== "0x0000000000000000000000000000000000000000",
    watch: true,
  });

  const pools = React.useMemo(() => {
    if (!poolsData || isLoading || activePools.length === 0) {
      // Fallback pools if no real data available
      const tokens = contractsConfig.tokens as any;
      return [
        {
          address: '0x1111111111111111111111111111111111111111',
          token0: tokens.USDC.address,
          token0Symbol: 'USDC',
          token1: tokens.WETH.address,
          token1Symbol: 'WETH',
          fee: 3000,
          isActive: true,
          totalVolume: '0',
          totalFees: '0',
          registeredAt: Date.now(),
          tvl: '0',
          apr: '0',
        },
      ];
    }

    return poolsData.map((result, index) => {
      const poolInfo = result.result as any;
      if (!poolInfo) return null;

      // Get token symbols from config
      const tokens = contractsConfig.tokens as any;
      const token0Symbol = Object.values(tokens).find((t: any) => t.address === poolInfo.token0)?.symbol || 'UNKNOWN';
      const token1Symbol = Object.values(tokens).find((t: any) => t.address === poolInfo.token1)?.symbol || 'UNKNOWN';

      return {
        address: activePools[index],
        token0: poolInfo.token0,
        token0Symbol,
        token1: poolInfo.token1,
        token1Symbol,
        fee: Number(poolInfo.fee),
        isActive: poolInfo.isActive,
        totalVolume: formatEther((poolInfo.totalVolume as any) || BigInt(0)),
        totalFees: formatEther((poolInfo.totalFees as any) || BigInt(0)),
        registeredAt: Number(poolInfo.registeredAt),
        tvl: formatEther(poolInfo.totalVolume), // Approximate TVL
        apr: '0', // Calculate based on fees and TVL
      };
    }).filter(Boolean);
  }, [poolsData, activePools, isLoading]);

  return {
    pools,
    isLoading,
  };
}

// Hook to get supported flash loan tokens
export function useFlashLoanTokens() {
  const { data, isLoading, isError } = useContractReads({
    contracts: [
      {
        address: contractsConfig.contracts.FlashBorrowModule.address as `0x${string}`,
        abi: FlashBorrowModuleABI as any,
        functionName: 'getSupportedTokens',
      },
    ],
    watch: true,
    enabled: contractsConfig.contracts.FlashBorrowModule.address !== "0x0000000000000000000000000000000000000000",
  });

  const supportedTokens = React.useMemo(() => {
    if (!data || isLoading || isError) {
      // Fallback to config tokens if contract not deployed yet
      return Object.values(contractsConfig.tokens);
    }
    return (data[0].result as string[]) || [];
  }, [data, isLoading, isError]);

  return {
    supportedTokens,
    isLoading,
  };
}