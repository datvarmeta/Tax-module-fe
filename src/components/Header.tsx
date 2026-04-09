import { Check, ShoppingCart, User, Sparkles } from 'lucide-react';
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
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/65 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <img
            src="/IM_Da_Nang_Vietnam_logo.png"
            alt="IM Da Nang Vietnam"
            className="h-10 w-auto object-contain"
          />
        </div>

        {/* Step Indicator */}
        <nav className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-white shadow-sm">
          {NAV_STEPS.map((step, i) => {
            const done = i < current;
            const active = i === current;

            return (
              <div key={step.key} className="flex items-center gap-2">
                {i > 0 && <div className={`w-10 h-px ${done ? 'bg-teal-400' : 'bg-gray-300'}`} />}
                <div className="flex items-center gap-1.5">
                  {done ? (
                    <>
                      <Check size={16} className="text-teal-500" />
                      <span className="text-xs text-teal-600 font-medium">{step.label}</span>
                    </>
                  ) : active ? (
                    <span className="flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
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
            <ShoppingCart size={20} className="text-gray-600" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {cartItemCount}
              </span>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
            <Sparkles size={13} />
            <span className="text-[11px] font-semibold">Premium</span>
          </div>
          <div className="w-8 h-8 rounded-full border border-gray-200 bg-white/80 flex items-center justify-center">
            <User size={16} className="text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
