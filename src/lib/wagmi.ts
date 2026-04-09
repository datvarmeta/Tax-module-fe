import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { createAppKit } from '@reown/appkit/react';
import { hedera, type AppKitNetwork } from '@reown/appkit/networks';

const projectId = (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string) || '';

if (!projectId) {
  console.warn('[Reown] VITE_WALLETCONNECT_PROJECT_ID is not set. Wallet connect will not work.');
}

const networks = [hedera] as [AppKitNetwork, ...AppKitNetwork[]];

export const wagmiAdapter = new WagmiAdapter({ networks, projectId });

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'Basal Pay',
    description: 'Sponsor Package Checkout powered by Basal Pay',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://basalpay.com',
    icons: [],
  },
  features: { analytics: false, email: false, socials: false },
  themeMode: 'light',
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
