import React from 'react';
import { useContractWrite, usePrepareContractWrite, useContractRead } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { toast } from 'react-hot-toast';
import FlashBorrowModuleABI from '@/contracts/abis/FlashBorrowModule.json';
import contractsConfig from '@/config/contracts.json';

export function useFlashLoan() {
  const flashModuleAddress = contractsConfig.contracts.FlashBorrowModule.address as `0x${string}`;

  // Get max flash loan amount for a token
  const useMaxFlashLoan = (tokenAddress: string) => {
    const { data, isLoading } = useContractRead({
      address: flashModuleAddress,
      abi: FlashBorrowModuleABI,
      functionName: 'maxFlashLoan',
      args: [tokenAddress],
      enabled: !!tokenAddress && flashModuleAddress !== "0x0000000000000000000000000000000000000000",
      watch: true,
    });

    return {
      maxAmount: data as bigint || BigInt(0),
      isLoading,
    };
  };

  // Get flash loan fee for amount
  const useFlashFee = (tokenAddress: string, amount: string, decimals: number) => {
    const { data, isLoading } = useContractRead({
      address: flashModuleAddress,
      abi: FlashBorrowModuleABI,
      functionName: 'flashFee',
      args: [tokenAddress, amount ? parseUnits(amount, decimals) : BigInt(0)],
      enabled: !!tokenAddress && !!amount && parseFloat(amount) > 0 && flashModuleAddress !== "0x0000000000000000000000000000000000000000",
      watch: true,
    });

    return {
      fee: data as bigint || BigInt(0),
      formattedFee: data ? formatUnits(data as bigint, decimals) : '0',
      isLoading,
    };
  };

  // Execute flash loan
  const useExecuteFlashLoan = (
    tokenAddress: string,
    amount: string,
    decimals: number,
    calldata: string
  ) => {
    const { config } = usePrepareContractWrite({
      address: flashModuleAddress,
      abi: FlashBorrowModuleABI,
      functionName: 'flashLoan',
      args: [
        tokenAddress,
        amount ? parseUnits(amount, decimals) : BigInt(0),
        calldata || '0x',
      ],
      enabled: !!tokenAddress && !!amount && parseFloat(amount) > 0 && flashModuleAddress !== "0x0000000000000000000000000000000000000000",
    });

    const { write, isLoading, isSuccess, isError, error } = useContractWrite({
      ...config,
      onSuccess: (data) => {
        toast.success('Flash loan executed successfully!', {
          duration: 5000,
        });
      },
      onError: (error) => {
        toast.error(`Flash loan failed: ${error.message}`, {
          duration: 5000,
        });
      },
    });

    return {
      executeFlashLoan: write,
      isLoading,
      isSuccess,
      isError,
      error,
    };
  };

  // Get token balance in flash module
  const useFlashModuleBalance = (tokenAddress: string) => {
    const { data, isLoading } = useContractRead({
      address: flashModuleAddress,
      abi: FlashBorrowModuleABI,
      functionName: 'getTokenBalance',
      args: [tokenAddress],
      enabled: !!tokenAddress && flashModuleAddress !== "0x0000000000000000000000000000000000000000",
      watch: true,
    });

    return {
      balance: data as bigint || BigInt(0),
      isLoading,
    };
  };

  return {
    useMaxFlashLoan,
    useFlashFee,
    useExecuteFlashLoan,
    useFlashModuleBalance,
  };
}

// Flash loan arbitrage example
export function useFlashLoanArbitrage() {
  const { useExecuteFlashLoan } = useFlashLoan();

  const executeArbitrage = React.useCallback(async (
    tokenAddress: string,
    amount: string,
    decimals: number,
    poolA: string,
    poolB: string
  ) => {
    // Create calldata for arbitrage
    const arbitrageData = {
      poolA,
      poolB,
      tokenIn: tokenAddress,
      amountIn: parseUnits(amount, decimals),
    };

    // Encode the arbitrage data
    const calldata = '0x'; // In real implementation, encode the arbitrage logic

    return useExecuteFlashLoan(tokenAddress, amount, decimals, calldata);
  }, [useExecuteFlashLoan]);

  return {
    executeArbitrage,
  };
}