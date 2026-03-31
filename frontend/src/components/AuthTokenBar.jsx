import React, { useEffect, useState } from "react";
import { getAuthToken, setAuthToken } from "../api/api.js";

const AuthTokenBar = () => {
  const [tokenInput, setTokenInput] = useState("");
  const [hasToken, setHasToken] = useState(false);

  const syncFromStorage = () => {
    const t = getAuthToken();
    setHasToken(Boolean(t));
  };

  useEffect(() => {
    syncFromStorage();
  }, []);

  const handleSave = () => {
    const trimmed = tokenInput.trim();
    if (!trimmed) {
      return;
    }
    setAuthToken(trimmed);
    setTokenInput("");
    syncFromStorage();
  };

  const handleClear = () => {
    setAuthToken(null);
    syncFromStorage();
  };

  return (
    <div
      className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-slate-800"
      role="region"
      aria-label="JWT authentication"
    >
      <h2 className="mb-2 text-sm font-semibold text-amber-900">
        Backend authentication (JWT)
      </h2>
      <p className="mb-3 text-xs text-amber-900/90">
        Payment and Stripe routes require{" "}
        <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">
          Authorization: Bearer &lt;token&gt;
        </code>
        . Paste an access token from login (OTP/Google), then save.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex-1 text-xs font-medium text-amber-900" htmlFor="jwt-input">
          Access token
          <textarea
            id="jwt-input"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            rows={2}
            placeholder="eyJhbGciOiJIUzI1NiIs..."
            className="mt-1 w-full rounded border border-amber-300 bg-white px-2 py-1.5 font-mono text-xs text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-amber-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label="Save JWT to local storage"
          >
            Save token
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-md border border-amber-400 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label="Clear saved JWT"
          >
            Clear
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-amber-900/80">
        Status:{" "}
        <strong>{hasToken ? "Token saved (requests will send Bearer auth)" : "No token — expect 401/403"}</strong>
      </p>
    </div>
  );
};

export default AuthTokenBar;
