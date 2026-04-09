import React, { useState } from "react";
import PaymentMethods from "./pages/PaymentMethods.jsx";
import ConnectStripe from "./pages/ConnectStripe.jsx";

const App = () => {
  const [activePage, setActivePage] = useState("payments");

  const handleSelectPayments = () => {
    setActivePage("payments");
  };

  const handleSelectConnect = () => {
    setActivePage("connect");
  };

  const isPayments = activePage === "payments";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">RidePack Payments Test</h1>
          <nav className="flex gap-2" aria-label="Payments navigation">
            <button
              type="button"
              onClick={handleSelectPayments}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  handleSelectPayments();
                }
              }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                isPayments
                  ? "bg-sky-600 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
              aria-label="Go to payment methods page"
            >
              Payment Methods
            </button>
            <button
              type="button"
              onClick={handleSelectConnect}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  handleSelectConnect();
                }
              }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                !isPayments
                  ? "bg-sky-600 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
              aria-label="Go to Stripe connect page"
            >
              Connect Stripe
            </button>
          </nav>
        </header>

        <main>
          {isPayments ? <PaymentMethods /> : <ConnectStripe />}
        </main>
      </div>
    </div>
  );
};

export default App;

