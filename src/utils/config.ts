import dotenv from "dotenv";
import type { MailReporterOptions } from "../types";

type EnvKeys = {
  SENDGRID_API_KEY?: string;
  SENDGRID_FROM_EMAIL?: string;
  SENDGRID_TO_EMAILS?: string;
  SENDGRID_REPLY_TO?: string;
  SENDGRID_SUBJECT?: string;
  SENDGRID_MAIL_ON_SUCCESS?: string;
  SENDGRID_SHOW_ERROR?: string;
  SENDGRID_LINK_TO_RESULTS?: string;
  SENDGRID_QUIET?: string;
  SENDGRID_DEBUG?: string;
  SENDGRID_ATTACH_HTML?: string;
};

const requiredKeys: Array<keyof EnvKeys> = [
  "SENDGRID_API_KEY",
  "SENDGRID_FROM_EMAIL",
  "SENDGRID_TO_EMAILS",
];

const envKeyToOptionKey: Partial<Record<keyof EnvKeys, keyof MailReporterOptions>> = {
  SENDGRID_API_KEY: "sendGridApiKey",
  SENDGRID_FROM_EMAIL: "from",
  SENDGRID_TO_EMAILS: "to",
  SENDGRID_REPLY_TO: "replyTo",
  SENDGRID_SUBJECT: "subject",
  SENDGRID_MAIL_ON_SUCCESS: "mailOnSuccess",
  SENDGRID_SHOW_ERROR: "showError",
  SENDGRID_LINK_TO_RESULTS: "linkToResults",
  SENDGRID_QUIET: "quiet",
  SENDGRID_DEBUG: "debug",
  SENDGRID_ATTACH_HTML: "attachHtmlReport",
};

let loaded = false;

const toBoolean = (value: string | undefined): boolean | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }

  return undefined;
};

export const ensureConfig = (
  overrideOptions: Partial<MailReporterOptions>
): Partial<MailReporterOptions> => {
  if (!loaded) {
    dotenv.config();
    loaded = true;
  }

  const env = process.env as EnvKeys;

  const envOptions: Partial<MailReporterOptions> = {
    sendGridApiKey: env.SENDGRID_API_KEY,
    from: env.SENDGRID_FROM_EMAIL,
    to: env.SENDGRID_TO_EMAILS,
    replyTo: env.SENDGRID_REPLY_TO,
    subject: env.SENDGRID_SUBJECT,
    mailOnSuccess: toBoolean(env.SENDGRID_MAIL_ON_SUCCESS),
    showError: toBoolean(env.SENDGRID_SHOW_ERROR),
    linkToResults: env.SENDGRID_LINK_TO_RESULTS,
    quiet: toBoolean(env.SENDGRID_QUIET),
    debug: toBoolean(env.SENDGRID_DEBUG),
    attachHtmlReport: toBoolean(env.SENDGRID_ATTACH_HTML),
  };

  if (!envOptions.subject) {
    delete envOptions.subject;
  }

  const configErrors: string[] = [];

  const missingKeys = requiredKeys.filter((key) => {
    const optionKey = envKeyToOptionKey[key];
    if (optionKey && overrideOptions[optionKey]) {
      return false;
    }

    const envValue = env[key];
    return !envValue || envValue.trim() === "";
  });

  if (missingKeys.length > 0) {
    configErrors.push(
      `Missing required environment variables: ${missingKeys.join(", ")}`
    );
  }

  const options = {
    ...envOptions,
    ...overrideOptions,
    configErrors: configErrors.length > 0 ? configErrors : undefined,
  };

  return options;
};

export const logConfigErrors = (errors: string[]) => {
  if (!errors.length) {
    return;
  }

  for (const error of errors) {
    console.error(error);
  }
};


