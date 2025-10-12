export interface MailReporterOptions {
  // SendGrid configuration
  sendGridApiKey?: string;
  replyTo?: string;

  // Mail options
  from: string | undefined;
  to: string | undefined;
  subject: string;
  mailOnSuccess?: boolean;
  linkToResults?: string;
  showError?: boolean;
  quiet?: boolean;
  debug?: boolean;
  attachHtmlReport?: boolean;

  // Internal diagnostics
  configErrors?: string[];
}

