import type { VerificationStatus } from "@/modules/verification/verification.constants";

export interface StartVerificationResult {
  verificationUrl: string;
}

export interface VerificationState {
  status: VerificationStatus;
}

export interface VeriffSessionResponse {
  status: string;
  verification?: {
    id?: string;
    url?: string;
    status?: string;
  };
}

export interface VeriffDecisionPayload {
  verification?: {
    id?: string;
    status?: string;
  };
  id?: string;
  status?: string;
}

