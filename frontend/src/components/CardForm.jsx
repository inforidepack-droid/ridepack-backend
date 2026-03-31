import React, { useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import api, { getApiErrorMessage } from "../api/api.js";

const cardElementClasses =
  "px-3 py-2 border border-slate-300 rounded-md bg-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500";

const CardForm = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const setupIntentResponse = await api.post("/payments/setup-intent");
      const clientSecret =
        setupIntentResponse?.data?.data?.clientSecret ||
        setupIntentResponse?.data?.clientSecret;

      if (!clientSecret) {
        setErrorMessage("Unable to create a setup intent. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        setErrorMessage("Card input is not ready. Please refresh and try again.");
        setIsSubmitting(false);
        return;
      }

      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        setErrorMessage(result.error.message || "Stripe error while saving card.");
        setIsSubmitting(false);
        return;
      }

      const paymentMethodId = result.setupIntent.payment_method;

      if (!paymentMethodId) {
        setErrorMessage("Missing payment method from Stripe response.");
        setIsSubmitting(false);
        return;
      }

      await api.post("/payments/methods", { paymentMethodId });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const msg = getApiErrorMessage(error);
      const duplicateMessage = msg.includes("already");

      if (duplicateMessage) {
        setErrorMessage("This card is already saved for this account.");
      } else {
        setErrorMessage(
          msg || "Unexpected error while saving card. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-4 bg-white border border-slate-200 rounded-lg p-4 shadow-sm"
    >
      <div>
        <label
          htmlFor="card-element"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Card details
        </label>
        <div id="card-element" className={cardElementClasses}>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#0f172a",
                  "::placeholder": {
                    color: "#9ca3af",
                  },
                },
                invalid: {
                  color: "#b91c1c",
                },
              },
            }}
          />
        </div>
      </div>

      {errorMessage ? (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleCancel}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              handleCancel();
            }
          }}
          className="px-3 py-1.5 rounded-md text-sm font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          aria-label="Cancel adding card"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !stripe}
          className="px-4 py-1.5 rounded-md text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          aria-label="Save card"
        >
          {isSubmitting ? "Saving..." : "Save Card"}
        </button>
      </div>
    </form>
  );
};

export default CardForm;

