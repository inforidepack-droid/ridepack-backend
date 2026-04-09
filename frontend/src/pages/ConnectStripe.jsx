import React, { useEffect, useState } from "react";
import api from "../api/api.js";

const ConnectStripe = () => {
  const [status, setStatus] = useState({
    chargesEnabled: false,
    payoutsEnabled: false,
    last4: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const isConnected = status.chargesEnabled && status.payoutsEnabled;

  const fetchStatus = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await api.get("/stripe/status");
      const data = response?.data?.data || response?.data || {};

      setStatus({
        chargesEnabled: Boolean(data.chargesEnabled),
        payoutsEnabled: Boolean(data.payoutsEnabled),
        last4: data.last4 ?? null,
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Unable to load Stripe account status. Check your rider token and backend.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnectClick = async () => {
    if (isConnecting) {
      return;
    }

    setIsConnecting(true);
    setErrorMessage("");

    try {
      const response = await api.post("/stripe/connect", {});
      const url = response?.data?.data?.url || response?.data?.url;

      if (!url) {
        setErrorMessage("Unable to create Stripe onboarding link.");
        setIsConnecting(false);
        return;
      }

      window.location.href = url;
    } catch (error) {
      const alreadyConnected =
        error?.response?.data?.message &&
        error.response.data.message.includes("already fully connected");

      if (alreadyConnected) {
        setErrorMessage("Stripe account is already connected for this rider.");
        fetchStatus();
      } else if (error?.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Unexpected error while creating onboarding link.");
      }
      setIsConnecting(false);
    }
  };

  const handleDisconnectClick = async () => {
    setErrorMessage("");

    try {
      await api.delete("/stripe/disconnect");
      fetchStatus();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Unable to disconnect Stripe account. Try again.";
      setErrorMessage(message);
    }
  };

  const handleOpenDashboard = () => {
    window.open("https://dashboard.stripe.com", "_blank", "noopener,noreferrer");
  };

  return (
    <section aria-label="Stripe connect for riders">
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-2">Rider Stripe Connect</h2>
        <p className="text-sm text-slate-600 mb-3">
          Connect a rider&apos;s Stripe Express account to receive payouts. Use a JWT
          token for a user with the <code className="font-mono text-xs">rider</code>{" "}
          role in local storage under{" "}
          <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">
            ridepack_token
          </code>
          .
        </p>

        {errorMessage ? (
          <p className="mb-3 text-sm text-red-600" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-slate-600">Checking Stripe connection...</p>
        ) : isConnected ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-green-700">Stripe Connected</p>
            <p className="text-sm text-slate-700">
              Charges and payouts are enabled for this rider.
            </p>
            {status.last4 ? (
              <p className="text-xs text-slate-600">
                Default payout destination ending in <strong>{status.last4}</strong>
              </p>
            ) : null}
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={handleOpenDashboard}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    handleOpenDashboard();
                  }
                }}
                className="px-3 py-1.5 rounded-md text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                aria-label="Open Stripe dashboard in a new tab"
              >
                Go to Stripe dashboard
              </button>
              <button
                type="button"
                onClick={handleDisconnectClick}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    handleDisconnectClick();
                  }
                }}
                className="px-3 py-1.5 rounded-md text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                aria-label="Disconnect Stripe account"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Connect your Stripe account to receive payouts.
            </p>
            <button
              type="button"
              onClick={handleConnectClick}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  handleConnectClick();
                }
              }}
              disabled={isConnecting}
              className="px-3 py-1.5 rounded-md text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              aria-label="Connect Stripe account now"
            >
              {isConnecting ? "Connecting..." : "Connect Now"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ConnectStripe;

