import React, { useState } from "react";
import AuthTokenBar from "./components/AuthTokenBar.jsx";
import BookingPay from "./pages/BookingPay.jsx";
import PaymentMethods from "./pages/PaymentMethods.jsx";
import ConnectStripe from "./pages/ConnectStripe.jsx";

const App = () => {
  const [activePage, setActivePage] = useState("payments");

  const navButtonClass = (isActive) =>
    isActive
      ? "bg-sky-600 text-white"
      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight">RidePack Payments Test</h1>
          <nav className="flex flex-wrap gap-2" aria-label="Payments navigation">
            <button
              type="button"
              onClick={() => setActivePage("payments")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  setActivePage("payments");
                }
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${navButtonClass(
                activePage === "payments"
              )}`}
              aria-label="Go to payment methods page"
              aria-current={activePage === "payments" ? "page" : undefined}
            >
              Payment Methods
            </button>
            <button
              type="button"
              onClick={() => setActivePage("booking")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  setActivePage("booking");
                }
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${navButtonClass(
                activePage === "booking"
              )}`}
              aria-label="Go to booking payment test page"
              aria-current={activePage === "booking" ? "page" : undefined}
            >
              Pay booking
            </button>
            <button
              type="button"
              onClick={() => setActivePage("connect")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  setActivePage("connect");
                }
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${navButtonClass(
                activePage === "connect"
              )}`}
              aria-label="Go to Stripe connect page"
              aria-current={activePage === "connect" ? "page" : undefined}
            >
              Connect Stripe
            </button>
          </nav>
        </header>

        <AuthTokenBar />

        <main>
          {activePage === "payments" ? <PaymentMethods /> : null}
          {activePage === "booking" ? <BookingPay /> : null}
          {activePage === "connect" ? <ConnectStripe /> : null}
        </main>
      </div>
    </div>
  );
};

export default App;
