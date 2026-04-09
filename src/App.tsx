import { AnimatePresence } from 'framer-motion';
import { useSimulation } from './hooks/useSimulation';
import { Header } from './components/Header';
import { SelectStep } from './components/SelectStep';
import { CheckoutStep } from './components/CheckoutStep';
import { PaymentStep } from './components/PaymentStep';
import { SuccessStep } from './components/SuccessStep';
import { InvoiceView } from './components/InvoiceView';

function App() {
  const sim = useSimulation();

  const buyerName = sim.customerType === 'business'
    ? sim.businessFormRef.current.companyName
    : sim.personalFormRef.current.fullName;

  return (
    <div className="min-h-screen app-shell">
      <Header
        currentStep={sim.currentStep}
        cartItemCount={sim.cartItemCount}
      />

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {sim.currentStep === 'select' && (
            <SelectStep
              key="select"
              cart={sim.cart}
              onUpsertCartItem={sim.upsertCartItem}
              onRemoveFromCart={sim.removeFromCart}
              onProceedToCheckout={sim.handleProceedToCheckout}
              cartSubtotal={sim.cartSubtotal}
              cartItemCount={sim.cartItemCount}
            />
          )}

          {sim.currentStep === 'checkout' && sim.cart.length > 0 && (
            <CheckoutStep
              key="checkout"
              cart={sim.cart}
              cartSubtotal={sim.cartSubtotal}
              cartTaxAmount={sim.cartTaxAmount}
              cartTotalWithTax={sim.cartTotalWithTax}
              onRemoveFromCart={sim.removeFromCart}
              initialPersonal={sim.personalFormRef.current}
              initialBusiness={sim.businessFormRef.current}
              initialType={sim.customerType}
              onCheckout={sim.handleCheckout}
              onBackToSelect={sim.handleBackToSelect}
              error={sim.error}
            />
          )}

          {sim.currentStep === 'payment' && sim.cart.length > 0 && (
            <PaymentStep
              key="payment"
              cart={sim.cart}
              cartTotalWithTax={sim.cartTotalWithTax}
              subStep={sim.paymentSubStep}
              connectedWallet={sim.connectedWallet}
              isConnecting={sim.isConnecting}
              processingSteps={sim.processingSteps}
              onConnect={sim.handleConnect}
              onDisconnect={sim.handleDisconnectWallet}
              onInitiatePayment={sim.handleInitiatePayment}
              onCancelSigning={sim.handleCancelSigning}
              onBackToCheckout={sim.handleBackToCheckout}
              error={sim.error}
            />
          )}

          {sim.currentStep === 'success' && (
            <SuccessStep
              key="success"
              cart={sim.cart}
              cartTotalWithTax={sim.cartTotalWithTax}
              txHash={sim.txHash}
              invoiceGenStatus={sim.invoiceGenStatus}
              invoiceData={sim.invoiceData}
              buyerName={buyerName}
              onViewInvoice={sim.handleViewInvoice}
              onReset={sim.handleReset}
            />
          )}

          {sim.currentStep === 'invoice' && (
            <InvoiceView
              key="invoice"
              cart={sim.cart}
              cartSubtotal={sim.cartSubtotal}
              cartTaxAmount={sim.cartTaxAmount}
              cartTotalWithTax={sim.cartTotalWithTax}
              customerType={sim.customerType}
              personal={sim.personalFormRef.current}
              business={sim.businessFormRef.current}
              invoiceId={sim.invoiceId}
              invoiceData={sim.invoiceData}
              onReset={sim.handleReset}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
