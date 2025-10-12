import { basename } from "path";
import { Suite } from "@playwright/test/reporter";
import type { MailReporterOptions } from "../types";
import {
  getHtmlTable,
  getSummaryDetails,
  getTestHeading,
  getTestsPerFile,
  getTotalStatus,
} from ".";
import { styles } from "../constants";
import sgMail, { MailDataRequired } from "@sendgrid/mail";

export const processResults = async (
  suite: Suite | undefined,
  options: MailReporterOptions
) => {
  if (!suite) {
    return;
  }

  const configErrors = options.configErrors;

  if (!options.sendGridApiKey) {
    console.error("Missing SendGrid API key");
    return;
  }

  if (!options.from) {
    console.error("Missing from email address");
    return;
  }

  if (!options.to) {
    console.error("Missing to email address");
    return;
  }

  if (configErrors?.length) {
    console.error(configErrors.join("; "));
    return;
  }

  sgMail.setApiKey(options.sendGridApiKey);

  const totalStatus = getTotalStatus(suite.suites);
  const summary = getSummaryDetails(suite);

  const testMarkup = [];
  for (const crntSuite of suite.suites) {
    const project = crntSuite.project();
    const tests = getTestsPerFile(crntSuite);

    for (const filePath of Object.keys(tests)) {
      const fileName = basename(filePath);

      const content = await getHtmlTable(tests[filePath], !!options.showError);

      if (content) {
        testMarkup.push(
          `<h3 style="${styles.heading3}">${getTestHeading(
            fileName,
            process.platform,
            project
          )}</h3>`
        );
        testMarkup.push(content);
      }
    }
  }

  const totalFailed = totalStatus.failed + totalStatus.timedOut;
  const hasFailed = totalFailed > 0;

  if (!options.mailOnSuccess && !hasFailed) {
    console.log("Not sending email on success");
    return;
  }

  const toFields = options.to
    .split(",")
    .map((to) => to.trim())
    .filter(Boolean);

  const dynamicSubject = `${options.subject} - ${hasFailed ? "Failed" : "Success"}`;

  const htmlContent = `<h2 style="${styles.heading2}">Summary</h2>
${summary}

<h2 style="${styles.heading2}">Test results</h2>
${testMarkup.join("")}

${
  options.linkToResults
    ? `<br/><hr/><br/><a style="${styles.anchor}" href="${options.linkToResults}">View results</a>`
    : ""
}
  `;

  const msg: MailDataRequired = {
    personalizations: [
      {
        to: toFields.map((email) => ({ email })),
      },
    ],
    from: { email: options.from },
    replyTo: options.replyTo ? { email: options.replyTo } : undefined,
    subject: dynamicSubject,
    html: htmlContent,
  };

  try {
    await sgMail.send(msg);
    console.log("SendGrid: message sent successfully");
  } catch (error) {
    const errorMessage =
      (error as { response?: { body?: unknown }; message?: string }).message ||
      "SendGrid: failed to send message";
    console.error(errorMessage);
    if ((error as { response?: { body?: unknown } }).response?.body) {
      console.error(JSON.stringify((error as { response: { body: unknown } }).response.body));
    }
  }
};
