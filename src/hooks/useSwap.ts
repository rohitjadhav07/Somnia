import React from 'react';
import { useContractWrite, usePrepareContractWrite, useContractRead } from 'wagmi';
import { parseUnits } from 'viem';
import { toast } from 'react-hot-toast';
import LiquidityRouterABI from '@/contracts/abis/LiquidityRouter.json';
import ERC20ABI from '@/contracts/abis/ERC20.json';
import contractsConfig from '@/config/contracts.json';

export function useSwap() {
  const routerAddress = contractsConfig.contracts.LiquidityRouter.address as `0x${string}`;

  // Get amount out for a swap
  const useGetAmountOut = (
    amountIn: string,
    tokenIn: string,
    tokenOut: string,
    decimalsIn: number
  ) => {
    const { data, isLoading } = useContractRead({
      address: routerAddress,
      abi: LiquidityRouterABI,
      functionName: 'getAmountOut',
      args: [
        amountIn ? parseUnits(amountIn, decimalsIn) : BigInt(0),
        tokenIn,
        tokenOut,
      ],
      enabled: !!amountIn && !!tokenIn && !!tokenOut && parseFloat(amountIn) > 0 && routerAddress !== "0x0000000000000000000000000000000000000000",
      watch: true,
    });

    const result = React.useMemo(() => {
      if (!data || isLoading) {
        // Fallback calculation if contract not available
        if (!amountIn || parseFloat(amountIn) <= 0) return { amountOut: BigInt(0), pool: '' };
        
        const rate = 0.98; // 2% slippage simulation
        const outputAmount = parseFloat(amountIn) * rate;
        
        return {
          amountOut: parseUnits(outputAmount.toString(), decimalsIn),
          pool: '0x1111111111111111111111111111111111111111',
        };
      }

      return {
        amountOut: data[0] as bigint || BigInt(0),
        pool: data[1] as string || '',
      };
    }, [data, isLoading, amountIn, decimalsIn]);

    return {
      ...result,
      isLoading,
    };
  };

  // Prepare and execute swap
  const useExecuteSwap = (
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    amountOutMin: string,
    to: string,
    deadline: number,
    decimalsIn: number,
    decimalsOut: number
  ) => {
    const { config } = usePrepareContractWrite({
      address: routerAddress,
      abi: LiquidityRouterABI,
      functionName: 'swapExactTokensForTokens',
      args: [
        {
          tokenIn,
          tokenOut,
          amountIn: amountIn ? parseUnits(amountIn, decimalsIn) : BigInt(0),
          amountOutMin: amountOutMin ? parseUnits(amountOutMin, decimalsOut) : BigInt(0),
          to,
          deadline: BigInt(deadline),
        },
      ],
      enabled: !!tokenIn && !!tokenOut && !!amountIn && !!to && parseFloat(amountIn) > 0 && routerAddress !== "0x0000000000000000000000000000000000000000",
    });

    const { write, isLoading, isSuccess, isError, error } = useContractWrite({
      ...config,
      onSuccess: (data) => {
        toast.success('Swap executed successfully on Somnia Network!', {
          duration: 5000,
        });
      },
      onError: (error) => {
        toast.error(`Swap failed: ${error.message}`, {
          duration: 5000,
        });
      },
    });

    // Fallback for when contracts aren't deployed
    const [simulatedLoading, setSimulatedLoading] = React.useState(false);
    const [simulatedSuccess, setSimulatedSuccess] = React.useState(false);

    const executeSwapFallback = React.useCallback(async () => {
      if (!tokenIn || !tokenOut || !amountIn || parseFloat(amountIn) <= 0) return;
      
      setSimulatedLoading(true);
      
      // Simulate transaction time
      setTimeout(() => {
        setSimulatedLoading(false);
        setSimulatedSuccess(true);
        toast.success('Swap simulated successfully! (Deploy contracts for real swaps)', {
          duration: 5000,
        });
      }, 2000);
    }, [tokenIn, tokenOut, amountIn]);

    return {
      executeSwap: write || executeSwapFallback,
      isLoading: isLoading || simulatedLoading,
      isSuccess: isSuccess || simulatedSuccess,
      isError,
      error,
    };
  };

  // Approve token for router
  const useApproveToken = (tokenAddress: string, amount: string, decimals: number) => {
    const { config } = usePrepareContractWrite({
      address: tokenAddress as `0x${string}`,
      abi: ERC20ABI,
      functionName: 'approve',
      args: [
        routerAddress,
        amount ? parseUnits(amount, decimals) : BigInt(0),
      ],
      enabled: !!tokenAddress && !!amount && parseFloat(amount) > 0,
    });

    const { write, isLoading, isSuccess } = useContractWrite({
      ...config,
      onSuccess: () => {
        toast.success('Token approved successfully!');
      },
      onError: (error) => {
        toast.error(`Approval failed: ${error.message}`);
      },
    });

    // Fallback for when contracts aren't deployed
    const [simulatedLoading, setSimulatedLoading] = React.useState(false);
    const [simulatedSuccess, setSimulatedSuccess] = React.useState(false);

    const approveFallback = React.useCallback(async () => {
      if (!tokenAddress || !amount || parseFloat(amount) <= 0) return;
      
      setSimulatedLoading(true);
      
      setTimeout(() => {
        setSimulatedLoading(false);
        setSimulatedSuccess(true);
        toast.success('Token approval simulated! (Deploy contracts for real approvals)');
      }, 1500);
    }, [tokenAddress, amount]);

    return {
      approve: write || approveFallback,
      isLoading: isLoading || simulatedLoading,
      isSuccess: isSuccess || simulatedSuccess,
    };
  };

  // Check allowance
  const useCheckAllowance = (tokenAddress: string, owner: string) => {
    const { data: allowance, isLoading } = useContractRead({
      address: tokenAddress as `0x${string}`,
      abi: ERC20ABI,
      functionName: 'allowance',
      args: [owner, routerAddress],
      enabled: !!tokenAddress && !!owner,
      watch: true,
    });

    return {
      allowance: allowance as bigint || BigInt(0),
      isLoading,
    };
  };

  return {
    useGetAmountOut,
    useExecuteSwap,
    useApproveToken,
    useCheckAllowance,
  };
}