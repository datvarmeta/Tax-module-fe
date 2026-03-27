import { Check, ShoppingCart, User } from 'lucide-react';
import type { Step } from '../types';

const NAV_STEPS = [
  { key: 'select', label: 'Select' },
  { key: 'checkout', label: 'Checkout' },
  { key: 'payment', label: 'Payment' },
] as const;

function stepOrder(step: Step): number {
  if (step === 'select') return 0;
  if (step === 'checkout') return 1;
  if (step === 'payment') return 2;
  return 3;
}

interface Props {
  currentStep: Step;
  cartItemCount: number;
}

export function Header({ currentStep, cartItemCount }: Props) {
  const current = stepOrder(currentStep);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-teal-500 rounded-full flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M12 12h.01" />
              <path d="M17 12h.01" />
              <path d="M7 12h.01" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-lg">BasalPay</span>
        </div>

        {/* Step Indicator */}
        <nav className="flex items-center gap-1">
          {NAV_STEPS.map((step, i) => {
            const done = i < current;
            const active = i === current;

            return (
              <div key={step.key} className="flex items-center gap-1">
                {i > 0 && <div className={`w-12 h-px ${done ? 'bg-teal-400' : 'bg-gray-300'}`} />}
                <div className="flex items-center gap-1.5">
                  {done ? (
                    <>
                      <Check size={16} className="text-teal-500" />
                      <span className="text-xs text-teal-600 font-medium">{step.label}</span>
                    </>
                  ) : active ? (
                    <span className="flex items-center gap-1.5 bg-teal-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      {step.label}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 font-medium">{step.label}</span>
                  )}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingCart size={20} className="text-gray-500" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-teal-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </div>
          <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center">
            <User size={16} className="text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
