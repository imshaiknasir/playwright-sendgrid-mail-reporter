import { basename } from "path";
import { Suite, TestCase } from "@playwright/test/reporter";
import type { MailReporterOptions } from "../types";
import {
  getHtmlTable,
  getSummaryDetails,
  getTestHeading,
  getTestsPerFile,
  getTestOutcome,
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

  const allTests = suite.allTests();
  const categorizedTests: Record<
    "passed" | "failed" | "skipped" | "timedOut",
    TestCase[]
  > = {
    passed: [],
    failed: [],
    skipped: [],
    timedOut: [],
  };

  for (const test of allTests) {
    const result = test.results[test.results.length - 1];
    const outcome = getTestOutcome(test, result);

    if (outcome === "passed") {
      categorizedTests.passed.push(test);
    } else if (outcome === "skipped") {
      categorizedTests.skipped.push(test);
    } else if (outcome === "timedOut") {
      categorizedTests.timedOut.push(test);
      categorizedTests.failed.push(test);
    } else {
      categorizedTests.failed.push(test);
    }
  }

  const failedCount = categorizedTests.failed.length;
  const timedOutCount = categorizedTests.timedOut.length;
  const passedCount = categorizedTests.passed.length;
  const skippedCount = categorizedTests.skipped.length;
  const totalTestsCount = allTests.length;

  const statusOverview = `<table role="presentation" border="0" width="100%" style="${styles.table.root}">
<thead style="${styles.table.thead}">
  <tr>
    <th style="${styles.table.th} width:50%">Summary</th>
    <th style="${styles.table.th} width:50%">Count</th>
  </tr>
</thead>
<tbody style="${styles.table.tbody}">
  <tr>
    <td style="${styles.table.td}">Total tests</td>
    <td style="${styles.table.td}">${totalTestsCount}</td>
  </tr>
  <tr>
    <td style="${styles.table.td}">✅ Passed</td>
    <td style="${styles.table.td}">${passedCount}</td>
  </tr>
  <tr>
    <td style="${styles.table.td}">❌ Failed</td>
    <td style="${styles.table.td}">${failedCount}</td>
  </tr>
  <tr>
    <td style="${styles.table.td}">⏱️ Timed out (subset of failed)</td>
    <td style="${styles.table.td}">${timedOutCount}</td>
  </tr>
  <tr>
    <td style="${styles.table.td}">⏭️ Skipped</td>
    <td style="${styles.table.td}">${skippedCount}</td>
  </tr>
</tbody>
</table>`;

  const statusSections: string[] = [];
  const statusGroups: Array<{
    key: keyof typeof categorizedTests;
    label: string;
    icon: string;
    tests: TestCase[];
  }> = [
    {
      key: "failed",
      label: "Failed",
      icon: "❌",
      tests: categorizedTests.failed,
    },
    {
      key: "skipped",
      label: "Skipped",
      icon: "⏭️",
      tests: categorizedTests.skipped,
    },
    {
      key: "passed",
      label: "Passed",
      icon: "✅",
      tests: categorizedTests.passed,
    },
  ];

  for (const group of statusGroups) {
    if (!group.tests.length) {
      continue;
    }

    const tableMarkup = await getHtmlTable(group.tests, !!options.showError);
    const headingNote =
      group.key === "failed" && timedOutCount > 0
        ? ` (includes ${timedOutCount} timed out)`
        : "";
    statusSections.push(
      `<h3 style="${styles.heading3}">${group.icon} ${group.label} (${group.tests.length})${headingNote}</h3>`
    );
    statusSections.push(tableMarkup);
  }

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
${statusOverview}

${summary}

${statusSections.join("")}

<h2 style="${styles.heading2}">Test results</h2>
${testMarkup.join("")}

${
  options.linkToResults
    ? `<br/><hr/><br/><a style="${styles.anchor}" href="${options.linkToResults}">View results</a>`
    : ""
}
  `;

  const baseHtmlDocument = (body: string) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${dynamicSubject}</title>
  </head>
  <body style="margin:0;padding:20px;font-family:Arial,sans-serif;background-color:#ffffff;color:#1c1e21;">
    ${body}
  </body>
</html>`;

  const attachments = options.attachHtmlReport
    ? [
        {
          content: Buffer.from(baseHtmlDocument(htmlContent)).toString("base64"),
          filename: `playwright-results-${new Date()
            .toISOString()
            .replace(/[:.]/g, "-")}.html`,
          type: "text/html",
          disposition: "attachment",
        },
      ]
    : undefined;

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
    attachments,
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
