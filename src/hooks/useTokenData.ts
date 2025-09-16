import React from 'react';
import { useContractReads, useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import ERC20ABI from '@/contracts/abis/ERC20.json';

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  formattedBalance: string;
}

export function useTokenData(tokenAddresses: string[]) {
  const { address: userAddress } = useAccount();

  const { data, isLoading, isError } = useContractReads({
    contracts: tokenAddresses.flatMap((tokenAddress) => [
      {
        address: tokenAddress as `0x${string}`,
        abi: ERC20ABI,
        functionName: 'name',
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: ERC20ABI,
        functionName: 'symbol',
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: ERC20ABI,
        functionName: 'decimals',
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: ERC20ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      },
    ]),
    enabled: tokenAddresses.length > 0 && !!userAddress,
    watch: true,
  });

  const tokens = React.useMemo(() => {
    if (!data || isLoading || isError) {
      // Fallback to config data while loading or on error
      const configTokens = require('@/config/contracts.json').tokens;
      
      return tokenAddresses.map((address) => {
        // Find token by address in the new format
        const tokenEntry = Object.entries(configTokens).find(([_, tokenAddress]) => tokenAddress === address);
        
        if (tokenEntry) {
          const [symbol, tokenAddress] = tokenEntry;
          // Simulate some balance for connected users for demo
          const simulatedBalance = userAddress ? Math.random() * 1000 : 0;
          
          // Map symbol to token info
          const tokenInfo = {
            'mUSDC': { name: 'Mock USDC', decimals: 6 },
            'mUSDT': { name: 'Mock USDT', decimals: 6 },
            'mWETH': { name: 'Mock WETH', decimals: 18 },
            'mWBTC': { name: 'Mock WBTC', decimals: 8 },
          }[symbol] || { name: 'Unknown Token', decimals: 18 };
          
          return {
            address,
            name: tokenInfo.name,
            symbol: symbol,
            decimals: tokenInfo.decimals,
            balance: (simulatedBalance * Math.pow(10, tokenInfo.decimals)).toString(),
            formattedBalance: simulatedBalance.toFixed(6),
          };
        }
        
        return {
          address,
          name: 'Loading...',
          symbol: 'LOADING',
          decimals: 18,
          balance: '0',
          formattedBalance: '0.000000',
        };
      });
    }

    const tokens: TokenInfo[] = [];
    
    for (let i = 0; i < tokenAddresses.length; i++) {
      const baseIndex = i * 4;
      const nameResult = data[baseIndex];
      const symbolResult = data[baseIndex + 1];
      const decimalsResult = data[baseIndex + 2];
      const balanceResult = data[baseIndex + 3];

      const decimals = Number(decimalsResult.result || 18);
      const balance = balanceResult.result as bigint || BigInt(0);
      const formattedBalance = formatUnits(balance, decimals);

      tokens.push({
        address: tokenAddresses[i],
        name: (nameResult.result as string) || 'Unknown Token',
        symbol: (symbolResult.result as string) || 'UNKNOWN',
        decimals,
        balance: balance.toString(),
        formattedBalance: parseFloat(formattedBalance).toFixed(6),
      });
    }

    return tokens;
  }, [data, tokenAddresses, isLoading, isError, userAddress]);

  return {
    tokens,
    isLoading,
    isError,
  };
}

export function useTokenBalance(tokenAddress: string) {
  const { address: userAddress } = useAccount();

  const { data, isLoading } = useContractReads({
    contracts: [
      {
        address: tokenAddress as `0x${string}`,
        abi: ERC20ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: ERC20ABI,
        functionName: 'decimals',
      },
    ],
    enabled: !!tokenAddress && !!userAddress,
    watch: true,
  });

  const balance = React.useMemo(() => {
    if (!data || isLoading) return { raw: '0', formatted: '0.00' };

    const balanceResult = data[0].result as bigint || BigInt(0);
    const decimalsResult = data[1].result as number || 18;
    const formatted = formatUnits(balanceResult, decimalsResult);

    return {
      raw: balanceResult.toString(),
      formatted: parseFloat(formatted).toFixed(6),
    };
  }, [data, isLoading]);

  return {
    balance,
    isLoading,
  };
}