export type SendEmailInput = {
  to: string | readonly string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  /** Overrides default From when set (must be allowed by your SMTP provider). */
  from?: string;
};

export type SendEmailResult = {
  messageId: string;
};
