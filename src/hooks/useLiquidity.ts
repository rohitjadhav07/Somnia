import React from 'react';
import { useContractWrite, usePrepareContractWrite, useContractRead } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { toast } from 'react-hot-toast';
import MockLiquidityPoolABI from '@/contracts/abis/MockLiquidityPool.json';
import MockERC20ABI from '@/contracts/abis/MockERC20.json';
import contractsConfig from '@/config/contracts.json';

export function useLiquidity() {
  // Add liquidity to a pool
  const useAddLiquidity = (
    poolAddress: string,
    token0Address: string,
    token1Address: string,
    amount0: string,
    amount1: string,
    decimals0: number,
    decimals1: number
  ) => {
    const { config } = usePrepareContractWrite({
      address: poolAddress as `0x${string}`,
      abi: MockLiquidityPoolABI,
      functionName: 'addLiquidity',
      args: [
        amount0 ? parseUnits(amount0, decimals0) : BigInt(0),
        amount1 ? parseUnits(amount1, decimals1) : BigInt(0),
      ],
      enabled: !!poolAddress && !!amount0 && !!amount1 && parseFloat(amount0) > 0 && parseFloat(amount1) > 0,
    });

    const { write, isLoading, isSuccess, isError, error } = useContractWrite({
      ...config,
      onSuccess: (data) => {
        toast.success('Liquidity added successfully!', {
          duration: 5000,
        });
      },
      onError: (error) => {
        toast.error(`Failed to add liquidity: ${error.message}`, {
          duration: 5000,
        });
      },
    });

    return {
      addLiquidity: write,
      isLoading,
      isSuccess,
      isError,
      error,
    };
  };

  // Remove liquidity from a pool
  const useRemoveLiquidity = (
    poolAddress: string,
    liquidityAmount: string
  ) => {
    const { config } = usePrepareContractWrite({
      address: poolAddress as `0x${string}`,
      abi: MockLiquidityPoolABI,
      functionName: 'removeLiquidity',
      args: [
        liquidityAmount ? parseUnits(liquidityAmount, 18) : BigInt(0), // LP tokens are 18 decimals
      ],
      enabled: !!poolAddress && !!liquidityAmount && parseFloat(liquidityAmount) > 0,
    });

    const { write, isLoading, isSuccess, isError, error } = useContractWrite({
      ...config,
      onSuccess: (data) => {
        toast.success('Liquidity removed successfully!', {
          duration: 5000,
        });
      },
      onError: (error) => {
        toast.error(`Failed to remove liquidity: ${error.message}`, {
          duration: 5000,
        });
      },
    });

    return {
      removeLiquidity: write,
      isLoading,
      isSuccess,
      isError,
      error,
    };
  };

  // Approve tokens for liquidity operations
  const useApproveForLiquidity = (
    tokenAddress: string,
    poolAddress: string,
    amount: string,
    decimals: number
  ) => {
    const { config } = usePrepareContractWrite({
      address: tokenAddress as `0x${string}`,
      abi: MockERC20ABI,
      functionName: 'approve',
      args: [
        poolAddress,
        amount ? parseUnits(amount, decimals) : BigInt(0),
      ],
      enabled: !!tokenAddress && !!poolAddress && !!amount && parseFloat(amount) > 0,
    });

    const { write, isLoading, isSuccess } = useContractWrite({
      ...config,
      onSuccess: () => {
        toast.success('Token approved for liquidity operations!');
      },
      onError: (error) => {
        toast.error(`Approval failed: ${error.message}`);
      },
    });

    return {
      approve: write,
      isLoading,
      isSuccess,
    };
  };

  // Check token allowance for pool
  const useCheckLiquidityAllowance = (
    tokenAddress: string,
    owner: string,
    poolAddress: string
  ) => {
    const { data: allowance, isLoading } = useContractRead({
      address: tokenAddress as `0x${string}`,
      abi: MockERC20ABI,
      functionName: 'allowance',
      args: [owner, poolAddress],
      enabled: !!tokenAddress && !!owner && !!poolAddress,
      watch: true,
    });

    return {
      allowance: allowance as bigint || BigInt(0),
      isLoading,
    };
  };

  // Get pool reserves
  const usePoolReserves = (poolAddress: string) => {
    const { data, isLoading } = useContractRead({
      address: poolAddress as `0x${string}`,
      abi: MockLiquidityPoolABI,
      functionName: 'getReserves',
      enabled: !!poolAddress,
      watch: true,
    });

    return {
      reserves: data as [bigint, bigint] || [BigInt(0), BigInt(0)],
      isLoading,
    };
  };

  // Get user's LP token balance
  const useLPTokenBalance = (poolAddress: string, userAddress: string) => {
    // For simplicity, we'll simulate LP token balance
    // In a real implementation, the pool would be an ERC20 token itself
    const balance = React.useMemo(() => {
      if (!userAddress) return BigInt(0);
      // Simulate some LP tokens for demo
      return parseUnits((Math.random() * 100).toFixed(6), 18);
    }, [userAddress]);

    return {
      balance,
      formattedBalance: formatUnits(balance, 18),
      isLoading: false,
    };
  };

  // Mint mock tokens for testing
  const useMintMockTokens = (tokenAddress: string, amount: string, decimals: number, userAddress?: string) => {
    const { config } = usePrepareContractWrite({
      address: tokenAddress as `0x${string}`,
      abi: MockERC20ABI,
      functionName: 'mint',
      args: [
        userAddress || '0x0000000000000000000000000000000000000000',
        amount ? parseUnits(amount, decimals) : BigInt(0),
      ],
      enabled: !!tokenAddress && !!amount && !!userAddress && parseFloat(amount) > 0 && tokenAddress !== '',
    });

    const { write, isLoading, isSuccess } = useContractWrite({
      ...config,
      onSuccess: () => {
        toast.success(`Minted ${amount} mock tokens for testing!`);
      },
      onError: (error) => {
        toast.error(`Minting failed: ${error.message}`);
      },
    });

    return {
      mintTokens: write,
      isLoading,
      isSuccess,
    };
  };

  return {
    useAddLiquidity,
    useRemoveLiquidity,
    useApproveForLiquidity,
    useCheckLiquidityAllowance,
    usePoolReserves,
    useLPTokenBalance,
    useMintMockTokens,
  };
}