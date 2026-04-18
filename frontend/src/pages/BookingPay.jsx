import React, { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { useStripe } from "@stripe/react-stripe-js";
import api, { getApiErrorMessage } from "../api/api.js";
import { stripePromise } from "../stripeClient.js";

const BookingPayInner = () => {
  const stripe = useStripe();
  const [bookingId, setBookingId] = useState("");
  const [methods, setMethods] = useState([]);
  const [selectedPm, setSelectedPm] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);

  useEffect(() => {
    const loadMethods = async () => {
      setIsLoadingMethods(true);
      setStatusMessage("");
      try {
        const response = await api.get("/payments/methods");
        const list = response?.data?.data?.paymentMethods || [];
        setMethods(list);
        if (list[0]?.stripePaymentMethodId) {
          setSelectedPm(list[0].stripePaymentMethodId);
        }
      } catch (error) {
        setStatusMessage(getApiErrorMessage(error));
      } finally {
        setIsLoadingMethods(false);
      }
    };
    loadMethods();
  }, []);

  const handlePayBooking = async () => {
    if (!stripe) {
      setStatusMessage("Stripe.js is not ready. Check VITE_STRIPE_PUBLISHABLE_KEY.");
      return;
    }
    const trimmedId = bookingId.trim();
    if (!trimmedId || !selectedPm) {
      setStatusMessage("Enter a booking id and select a saved card.");
      return;
    }

    setIsLoading(true);
    setStatusMessage("");

    try {
      const intentResponse = await api.post(
        `/bookings/${trimmedId}/payment-intent`,
        { paymentMethodId: selectedPm }
      );
      const clientSecret = intentResponse?.data?.data?.clientSecret;
      if (!clientSecret) {
        setStatusMessage("Server did not return a client secret.");
        return;
      }

      const confirmResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: selectedPm,
      });

      if (confirmResult.error) {
        setStatusMessage(
          confirmResult.error.message || "Stripe could not confirm the payment."
        );
        return;
      }

      const pi = confirmResult.paymentIntent;
      if (!pi || pi.status !== "succeeded") {
        setStatusMessage(
          `Payment not succeeded (status: ${pi?.status || "unknown"}).`
        );
        return;
      }

      await api.post(`/bookings/${trimmedId}/pay`, {
        paymentIntentId: pi.id,
      });

      setStatusMessage("Success: booking is paid and confirmed in the database.");
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section aria-label="Pay for a booking">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Test booking payment</h2>
        <p className="mb-4 text-sm text-slate-600">
          Requires a booking in <code className="text-xs">pending_payment</code>, a JWT in the bar
          above, and at least one saved card. Flow: create PaymentIntent → confirm card → verify on
          server.
        </p>

        {statusMessage ? (
          <p className="mb-3 text-sm text-slate-800" role="status">
            {statusMessage}
          </p>
        ) : null}

        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700" htmlFor="booking-id-input">
            Booking id (MongoDB)
            <input
              id="booking-id-input"
              type="text"
              value={bookingId}
              onChange={(event) => setBookingId(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              placeholder="67abc..."
              autoComplete="off"
              aria-required="true"
            />
          </label>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="pm-select">
              Saved card (payment method)
            </label>
            {isLoadingMethods ? (
              <p className="mt-1 text-sm text-slate-500">Loading cards…</p>
            ) : methods.length === 0 ? (
              <p className="mt-1 text-sm text-amber-700">
                No saved cards. Use Payment Methods tab to add a card first.
              </p>
            ) : (
              <select
                id="pm-select"
                value={selectedPm}
                onChange={(event) => setSelectedPm(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                aria-label="Select saved payment method"
              >
                {methods.map((m) => (
                  <option key={m._id} value={m.stripePaymentMethodId}>
                    {(m.brand || "Card").toUpperCase()} ···· {m.last4}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            type="button"
            onClick={handlePayBooking}
            disabled={isLoading || !stripe || methods.length === 0}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            aria-label="Pay for this booking with Stripe"
          >
            {isLoading ? "Processing…" : "Create PI, confirm, and pay booking"}
          </button>
        </div>
      </div>
    </section>
  );
};

const BookingPay = () => {
  if (!stripePromise) {
    return (
      <section aria-label="Pay for a booking">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Set <code className="font-mono">VITE_STRIPE_PUBLISHABLE_KEY</code> in the frontend{" "}
          <code className="font-mono">.env</code> to test booking payment with Stripe.
        </div>
      </section>
    );
  }
  return (
    <Elements stripe={stripePromise}>
      <BookingPayInner />
    </Elements>
  );
};

export default BookingPay;
