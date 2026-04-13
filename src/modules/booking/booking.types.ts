export interface IParcel {
  weight: number;
  length: number;
  width: number;
  height: number;
  description?: string;
}

export interface IContactDetails {
  name: string;
  phone: string;
  /** Optional; use with national `phone` for SMS (+1 or +91). If `phone` is E.164, may be omitted. */
  countryCode?: string;
}
