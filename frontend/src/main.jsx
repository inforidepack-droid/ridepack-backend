import React from "react";
import ReactDOM from "react-dom/client";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import App from "./App.jsx";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const Main = () => {
  if (!stripePromise) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white shadow rounded-lg p-6 max-w-md w-full text-center">
          <h1 className="text-xl font-semibold mb-2 text-slate-900">
            Stripe Publishable Key Missing
          </h1>
          <p className="text-sm text-slate-600">
            Set <code className="font-mono">VITE_STRIPE_PUBLISHABLE_KEY</code> in
            your frontend <code className="font-mono">.env</code> to test card
            setup.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <App />
    </Elements>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);

