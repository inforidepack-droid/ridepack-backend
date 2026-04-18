import React, { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import api, { getApiErrorMessage } from "../api/api.js";
import CardForm from "../components/CardForm.jsx";
import { stripePromise } from "../stripeClient.js";

const PaymentMethods = () => {
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchCards = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await api.get("/payments/methods");
      const paymentMethods =
        response?.data?.data?.paymentMethods || response?.data?.paymentMethods || [];
      setCards(paymentMethods);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error) ||
          "Unable to load payment methods. Check your token and backend."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleAddCardClick = () => {
    setIsAddingCard(true);
  };

  const handleCardSaved = () => {
    setIsAddingCard(false);
    fetchCards();
  };

  const handleCancelAddCard = () => {
    setIsAddingCard(false);
  };

  const handleRemoveCard = async (cardId) => {
    if (!cardId) {
      return;
    }

    setErrorMessage("");

    try {
      await api.delete(`/payments/methods/${cardId}`);
      setCards((previousCards) =>
        previousCards.filter((card) => card._id !== cardId)
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error) ||
          "Unable to remove card. It may be used for an active booking."
      );
    }
  };

  return (
    <section aria-label="Payment methods">
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Payment Methods</h2>
            <p className="text-sm text-slate-600">
              Manage saved cards for senders. Use a valid JWT token in local storage
              under{" "}
              <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">
                ridepack_token
              </code>
              . Adding a card requires{" "}
              <code className="font-mono text-xs">VITE_STRIPE_PUBLISHABLE_KEY</code>.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddCardClick}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                handleAddCardClick();
              }
            }}
            disabled={!stripePromise}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Add a new card"
          >
            Add Card
          </button>
        </div>

        {errorMessage ? (
          <p className="mb-3 text-sm text-red-600" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-slate-600">Loading saved cards...</p>
        ) : cards.length === 0 ? (
          <p className="text-sm text-slate-600">No saved cards yet.</p>
        ) : (
          <ul className="space-y-2">
            {cards.map((card) => (
              <li
                key={card._id}
                className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {card.brand ? card.brand.toUpperCase() : "Card"}
                  </p>
                  <p className="text-xs text-slate-600">
                    **** **** **** {card.last4}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCard(card._id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      handleRemoveCard(card._id);
                    }
                  }}
                  className="px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  aria-label="Remove this card"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isAddingCard && stripePromise ? (
        <Elements stripe={stripePromise}>
          <CardForm onSuccess={handleCardSaved} onCancel={handleCancelAddCard} />
        </Elements>
      ) : null}
      {isAddingCard && !stripePromise ? (
        <p className="mt-3 text-sm text-amber-800" role="status">
          Set <code className="font-mono">VITE_STRIPE_PUBLISHABLE_KEY</code> in the frontend{" "}
          <code className="font-mono">.env</code> to add cards.
        </p>
      ) : null}
    </section>
  );
};

export default PaymentMethods;

