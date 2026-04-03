export type Step = 'select' | 'checkout' | 'payment' | 'success' | 'invoice';

export type PaymentSubStep = 'connect' | 'accounts' | 'confirm' | 'processing';

export type InvoiceGenStatus = 'idle' | 'generating' | 'completed';

export type CustomerType = 'personal' | 'business';

export interface PersonalForm {
  fullName: string;
  dob: string;
  phone: string;
  email: string;
}

export interface BusinessForm {
  taxCode: string;
  companyName: string;
  companyEmail: string;
  representativeId: string;
  companyAddress: string;
  businessLicense: File | null;
  authorizationDoc: File | null;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  minUSDC: number;
  maxUSDC: number;
  tags: string[];
  badge?: string;
  badgeColor?: string;
  gradient: string;
}

export interface CartItem {
  product: Product;
  selectedUSDC: number;
}

export interface WalletAccount {
  id: string;
  address: string;
  network: string;
}

export const PRODUCTS: Product[] = [
  {
    id: 'community-sponsor',
    name: 'Community Sponsor',
    category: 'Community',
    description: 'Best for early-stage startups that want to support the program and be featured on the supporter wall.',
    minUSDC: 10000,
    maxUSDC: 20000,
    tags: ['Supporter wall', '1 event pass', 'Social mention'],
    badge: 'Starter',
    badgeColor: 'bg-teal-500',
    gradient: 'from-teal-50 to-emerald-50',
  },
  {
    id: 'silver-sponsor',
    name: 'Silver Sponsor',
    category: 'Event',
    description: 'Includes a mini booth, logo placement on the event backdrop, and access to the official media kit.',
    minUSDC: 20000,
    maxUSDC: 30000,
    tags: ['Booth mini', 'Logo backdrop', 'Media kit access'],
    badge: 'Popular',
    badgeColor: 'bg-indigo-500',
    gradient: 'from-indigo-50 to-purple-50',
  },
  {
    id: 'gold-sponsor',
    name: 'Gold Sponsor',
    category: 'Event',
    description: 'A premium package for brands looking to connect with high-quality leads in the networking zone.',
    minUSDC: 30000,
    maxUSDC: 40000,
    tags: ['Booth premium', 'Lead retrieval', '3 event passes'],
    gradient: 'from-amber-50 to-orange-50',
  },
  {
    id: 'innovation-sponsor',
    name: 'Innovation Sponsor',
    category: 'Technology',
    description: 'Designed for blockchain and AI brands sponsoring the innovation showcase and live demo area.',
    minUSDC: 40000,
    maxUSDC: 50000,
    tags: ['Demo zone branding', 'Speaking slot', 'Press mention'],
    gradient: 'from-red-50 to-rose-50',
  },
  {
    id: 'title-sponsor',
    name: 'Title Sponsor',
    category: 'Branding',
    description: 'Top-tier package with event naming rights, priority logo placement, and branded content opportunities.',
    minUSDC: 50000,
    maxUSDC: 60000,
    tags: ['Naming rights', 'Main stage branding', '6 VIP passes'],
    badge: 'Elite',
    badgeColor: 'bg-green-500',
    gradient: 'from-green-50 to-lime-50',
  },
  {
    id: 'media-sponsor',
    name: 'Media Partner Sponsor',
    category: 'Media',
    description: 'Built for media partners with press channels, podcast networks, or creator-led distribution.',
    minUSDC: 60000,
    maxUSDC: 70000,
    tags: ['Media co-branding', 'Interview slot', 'Content rights'],
    gradient: 'from-blue-50 to-cyan-50',
  },
];

export const CATEGORIES = ['All', 'Community', 'Event', 'Technology', 'Branding', 'Media'];

export const EXCHANGE_RATE = 2480;
export const USDC_VND_RATE = 26000;
export const NETWORK_FEE = 5000;
export const TAX_RATE = 10;

export const WALLET_ACCOUNTS: WalletAccount[] = [
  { id: '1', address: '0.0.123456789', network: 'Hedera Mainnet' },
  { id: '2', address: '0.0.987654321', network: 'Hedera Mainnet' },
];
