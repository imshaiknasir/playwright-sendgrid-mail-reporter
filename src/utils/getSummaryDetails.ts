import { Suite } from "@playwright/test/reporter";
import { getTotalStatus } from ".";

export const getSummaryDetails = (suite: Suite): string => {
  const totalStatus = getTotalStatus(suite.suites);
  const totalFailed = totalStatus.failed + totalStatus.timedOut;

  const headerText = [`<li>Total tests: ${suite.allTests().length}</li>`];

  if (totalStatus.passed > 0) {
    headerText.push(`<li>Passed: ${totalStatus.passed}</li>`);
  }

  if (totalFailed > 0) {
    headerText.push(`<li>Failed: ${totalFailed}</li>`);
  }

  if (totalStatus.skipped > 0) {
    headerText.push(`<li>Skipped: ${totalStatus.skipped}</li>`);
  }

  if (totalStatus.timedOut > 0) {
    headerText.push(`<li>Timed out: ${totalStatus.timedOut}</li>`);
  }

  return `<ul>${headerText.join("")}</ul>`;
};
