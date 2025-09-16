# 🚀 Flash Liquidity Layer - Vercel Deployment Guide

## Quick Deploy to Vercel

### 1. Manual Deployment Steps

#### Prerequisites
- Vercel account
- GitHub repository
- WalletConnect Project ID (optional for demo)

#### Environment Variables (Set in Vercel Dashboard)
**Required for full functionality:**

```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
NEXT_PUBLIC_SOMNIA_RPC_URL=https://dream-rpc.somnia.network
NEXT_PUBLIC_CHAIN_ID=50312
```

**For demo/testing (use these values):**
```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=demo-project-id
NEXT_PUBLIC_SOMNIA_RPC_URL=https://dream-rpc.somnia.network
NEXT_PUBLIC_CHAIN_ID=50312
```

#### Deployment Steps
1. **Connect Repository**
   ```bash
   # Push to GitHub
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables
   - Deploy!

3. **Configure Domain (Optional)**
   - Add custom domain in Vercel dashboard
   - Update DNS settings
   - Enable HTTPS

### 3. Environment Variables Setup

#### Get WalletConnect Project ID
1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Create new project
3. Copy Project ID
4. Add to Vercel environment variables

#### Vercel Environment Variables
```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_SOMNIA_RPC_URL=https://dream-rpc.somnia.network
NEXT_PUBLIC_CHAIN_ID=50312
NEXT_PUBLIC_ENABLE_TESTNETS=true
```

### 4. Build Configuration

The project includes:
- ✅ Optimized Next.js config
- ✅ Webpack fallbacks for Web3
- ✅ SSR-safe components
- ✅ Production environment setup
- ✅ Vercel-specific optimizations

### 5. Post-Deployment Checklist

- [ ] Verify wallet connection works
- [ ] Test token swaps
- [ ] Check flash loan functionality
- [ ] Validate analytics page
- [ ] Test liquidity management
- [ ] Confirm mobile responsiveness

### 6. Troubleshooting

#### Common Issues:
1. **Build Fails**: Check environment variables
2. **Wallet Won't Connect**: Verify WalletConnect Project ID
3. **Charts Not Loading**: SSR issue - already fixed with dynamic imports
4. **Contract Calls Fail**: Check RPC URL and network settings

#### Debug Commands:
```bash
# Local build test
npm run build

# Check for TypeScript errors
npm run lint

# Test production build locally
npm run start
```

### 7. Performance Optimizations

The deployment includes:
- ✅ Code splitting
- ✅ Image optimization
- ✅ Bundle size optimization
- ✅ Caching strategies
- ✅ CDN distribution

### 8. Security Features

- ✅ Content Security Policy headers
- ✅ XSS protection
- ✅ HTTPS enforcement
- ✅ Secure environment variables

## 🎉 Your Flash Liquidity Layer is now live!

After deployment, your dApp will be available at:
`https://your-project-name.vercel.app`

### Demo URLs:
- **Homepage**: `/` - Protocol dashboard
- **Swap**: `/swap` - Token swapping interface  
- **Flash Loans**: `/flash-loans` - Flash loan execution
- **Pools**: `/pools` - Liquidity management
- **Analytics**: `/analytics` - Protocol metrics

---

**Built with ❤️ for Somnia Network Hackathon**