# 🚀 VERCEL DEPLOYMENT - STEP BY STEP

## 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

## 2. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. **IMPORTANT**: Add these environment variables:

### Environment Variables (Copy & Paste):
```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=demo-project-id
NEXT_PUBLIC_SOMNIA_RPC_URL=https://dream-rpc.somnia.network
NEXT_PUBLIC_CHAIN_ID=50312
```

## 3. Deploy!
Click "Deploy" and wait for build to complete.

## 4. Test Your Live App
Your app will be available at: `https://your-project-name.vercel.app`

### Test These Features:
- ✅ Homepage loads
- ✅ Wallet connection works
- ✅ Swap page functions
- ✅ Flash loans page works
- ✅ Pools page with liquidity buttons
- ✅ Analytics page displays

## 5. Get Real WalletConnect Project ID (Optional)
1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Create new project
3. Copy Project ID
4. Update in Vercel environment variables

---

**Your Flash Liquidity Layer will be live and fully functional! 🎉**