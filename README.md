# Mail Reporter for Playwright

[![npm version](https://badge.fury.io/js/playwright-mail-reporter.svg)](https://badge.fury.io/js/playwright-mail-reporter)
[![Downloads](https://img.shields.io/npm/dt/playwright-mail-reporter)](https://www.npmjs.com/package/playwright-mail-reporter)
![License](https://img.shields.io/github/license/imshaiknasir/playwright-sendgrid-mail-reporter)

This reporter allows you to send an email with the test results after the test run is finished.

## Prerequisites

To use this reporter, you need a SendGrid account with an API key that has permission to send mail. Make sure you have the following ready:

- SendGrid API key
- Verified sender email address (either a Single Sender or Domain Authenticated sender)
- One or more recipient email addresses (comma separated)

## Installation

Install from npm:

```bash
npm install playwright-mail-reporter
```

## Usage

You can configure the reporter by adding it to the `playwright.config.js` file:

```javascript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  reporter: [
    [
      "playwright-mail-reporter",
      {
        from: process.env.SENDGRID_FROM_EMAIL,
        to: process.env.SENDGRID_TO_EMAILS,
        subject: "<subject>",
        mailOnSuccess: true,
        linkToResults: "<optional link>",
        showError: false,
        quiet: false,
        debug: false,
      },
    ],
  ],
});
```

### Environment variables

Create a `.env` file in the root of your project (next to `playwright.config.ts`) with the following keys:

```bash
SENDGRID_API_KEY=SG.xxxxxx
SENDGRID_FROM_EMAIL=reports@example.com
SENDGRID_TO_EMAILS=qa@example.com,dev@example.com
SENDGRID_REPLY_TO=support@example.com # optional
SENDGRID_SUBJECT=Playwright Test Results # optional
SENDGRID_LINK_TO_RESULTS=https://ci.example.com/run/123 # optional
SENDGRID_MAIL_ON_SUCCESS=true # defaults to true
SENDGRID_SHOW_ERROR=false # defaults to false
SENDGRID_QUIET=false # defaults to false
SENDGRID_DEBUG=false # defaults to false, logs config in dev mode
SENDGRID_ATTACH_HTML=false # defaults to false, attaches the full HTML report
```

> More information on how to use reporters can be found in the [Playwright documentation](https://playwright.dev/docs/test-reporters).

## Configuration

The reporter supports the following configuration options:

| Option          | Description                                                           | Required | Default                   |
| --------------- | --------------------------------------------------------------------- | -------- | ------------------------- |
| `sendGridApiKey`| SendGrid API key used for authentication                              | `true`   | `undefined`               |
| `from`          | The email address from which the email will be sent                   | `true`   | `undefined`               |
| `to`            | The email addresses to which the email will be sent (comma separated) | `true`   | `undefined`               |
| `subject`       | The subject of the email                                              | `false`  | `Playwright Test Results` |
| `linkToResults` | Link to the test results                                              | `false`  | `undefined`               |
| `mailOnSuccess` | Send the email on success                                             | `false`  | `true`                    |
| `showError`     | Show the error details in the email                                   | `false`  | `false`                   |
| `quiet`         | Do not show any output in the console                                 | `false`  | `false`                   |
| `debug`         | Log additional debug info (options, safe)                             | `false`  | `false`                   |
| `replyTo`       | Reply-to email address                                                | `false`  | `undefined`               |
| `attachHtmlReport` | Attach a standalone HTML copy of the report to the email          | `false`  | `false`                   |

<br />

[![Visitors](https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fgithub.com%2Fimshaiknasir%2Fplaywright-sendgrid-mail-reporter&countColor=%23263759)](https://visitorbadge.io/status?path=https%3A%2F%2Fgithub.com%2Fimshaiknasir%2Fplaywright-sendgrid-mail-reporter)
