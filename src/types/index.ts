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
  priceVND: number;
  tags: string[];
  badge?: string;
  badgeColor?: string;
  gradient: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface WalletAccount {
  id: string;
  address: string;
  network: string;
}

export const PRODUCTS: Product[] = [
  {
    id: 'cloud-storage',
    name: 'Cloud Storage Pro',
    category: 'Storage',
    description: '1TB secure cloud storage with AES-256 encryption, real-time sync, and unlimited version history.',
    priceVND: 299000,
    tags: ['1TB Storage', 'End-to-end encrypted', 'Multi-device sync'],
    badge: 'Popular',
    badgeColor: 'bg-teal-500',
    gradient: 'from-teal-50 to-emerald-50',
  },
  {
    id: 'api-gateway',
    name: 'API Gateway Enterprise',
    category: 'Infrastructure',
    description: 'High-performance API management platform with rate limiting, analytics dashboard, and global CDN.',
    priceVND: 890000,
    tags: ['10M requests/month', 'Global CDN', 'Real-time analytics'],
    badge: 'Enterprise',
    badgeColor: 'bg-indigo-500',
    gradient: 'from-indigo-50 to-purple-50',
  },
  {
    id: 'data-analytics',
    name: 'Data Analytics Suite',
    category: 'Analytics',
    description: 'Comprehensive business intelligence platform with AI-powered insights, custom dashboards, and reporting.',
    priceVND: 590000,
    tags: ['Unlimited dashboards', 'AI insights', 'CSV/PDF export'],
    gradient: 'from-amber-50 to-orange-50',
  },
  {
    id: 'security-shield',
    name: 'Security Shield Plus',
    category: 'Security',
    description: 'Enterprise-grade cybersecurity solution with real-time threat detection, DDoS protection, and compliance.',
    priceVND: 750000,
    tags: ['DDoS Protection', 'Threat intelligence', 'GDPR compliant'],
    gradient: 'from-red-50 to-rose-50',
  },
  {
    id: 'dev-workspace',
    name: 'Developer Workspace',
    category: 'Development',
    description: 'All-in-one cloud development environment with CI/CD pipelines, container orchestration, and team tools.',
    priceVND: 450000,
    tags: ['CI/CD pipelines', 'Container support', 'Git integration'],
    badge: 'New',
    badgeColor: 'bg-green-500',
    gradient: 'from-green-50 to-lime-50',
  },
  {
    id: 'comm-hub',
    name: 'Communication Hub',
    category: 'Communication',
    description: 'Unified communications platform integrating email, SMS, push notifications, and webhook management at scale.',
    priceVND: 320000,
    tags: ['Email & SMS API', 'Push notifications', 'Webhooks'],
    gradient: 'from-blue-50 to-cyan-50',
  },
];

export const CATEGORIES = ['All', 'Storage', 'Infrastructure', 'Analytics', 'Security', 'Development', 'Communication'];

export const EXCHANGE_RATE = 2480;
export const NETWORK_FEE = 5000;
export const TAX_RATE = 10;

export const WALLET_ACCOUNTS: WalletAccount[] = [
  { id: '1', address: '0.0.123456789', network: 'Hedera Mainnet' },
  { id: '2', address: '0.0.987654321', network: 'Hedera Mainnet' },
];
