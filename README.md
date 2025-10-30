# Playwright SendGrid Mail Reporter

[![npm version](https://badge.fury.io/js/playwright-sendgrid-mail-reporter.svg)](https://badge.fury.io/js/playwright-sendgrid-mail-reporter)
[![Downloads](https://img.shields.io/npm/dt/playwright-sendgrid-mail-reporter)](https://www.npmjs.com/package/playwright-sendgrid-mail-reporter)
![License](https://img.shields.io/github/license/imshaiknasir/playwright-sendgrid-mail-reporter)

Send richly formatted Playwright test summaries directly from your CI/CD pipeline using the SendGrid API. This package is a maintained fork of [`estruyf/playwright-mail-reporter`](https://github.com/estruyf/playwright-mail-reporter) by Elio Struyf, adapted to use SendGrid instead of Nodemailer/SMTP. Thank you, Elio, for the original work and inspiration.

Published on npm: [`playwright-sendgrid-mail-reporter`](https://www.npmjs.com/package/playwright-sendgrid-mail-reporter).

---

## Why This Fork?

- **SendGrid-first workflow:** Built around SendGrid’s mail send API and environment variables instead of SMTP credentials.
- **Quick migration path:** Drop-in replacement for teams switching from the original reporter—only change the dependency, reporter name, and add a SendGrid API key.
- **Fresh improvements:** Optional HTML report attachment, simplified configuration validation, and active development focused on SendGrid users.

If you are still using the Nodemailer version, check out the original repo linked above.

---

## Quick Start (5 minutes)

1. **Install** ([npm package](https://www.npmjs.com/package/playwright-sendgrid-mail-reporter))

   ```bash
   npm install playwright-sendgrid-mail-reporter
   # or
   yarn add playwright-sendgrid-mail-reporter
   # or
   pnpm add playwright-sendgrid-mail-reporter
   ```

2. **Add environment variables** (create `.env` next to `playwright.config.ts`)

   ```bash
   SENDGRID_API_KEY=SG.xxxxxx
   SENDGRID_FROM_EMAIL=reports@example.com
   SENDGRID_TO_EMAILS=qa@example.com,dev@example.com
   ```

3. **Register the reporter** (`playwright.config.ts`)

   ```ts
   import { defineConfig } from "@playwright/test";

   export default defineConfig({
     reporter: [
       ["playwright-sendgrid-mail-reporter"]
     ],
   });
   ```

4. **Run your tests**

   ```bash
   npx playwright test
   ```

That’s it! The reporter reads configuration from environment variables, formats the test results, and emails them when the run completes.

---

## Installation

```bash
npm install playwright-sendgrid-mail-reporter
# or
yarn add playwright-sendgrid-mail-reporter
# or
pnpm add playwright-sendgrid-mail-reporter
```

---

## Configuration

### Environment Variables

Create a `.env` file (or set CI secrets) with the keys you need:

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

The reporter automatically loads `.env` via [`dotenv`](https://www.npmjs.com/package/dotenv). In CI, configure these values using your platform’s secret manager.

### Inline Options (without `.env`)

Prefer to pass options programmatically? Provide them directly in the reporter configuration.

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  reporter: [
    [
      "playwright-sendgrid-mail-reporter",
      {
        sendGridApiKey: process.env.SENDGRID_API_KEY,
        from: "reports@example.com",
        to: "qa@example.com,dev@example.com",
        subject: "Playwright Test Results",
        linkToResults: `https://ci.example.com/run/${process.env.CI_RUN_ID}`,
        mailOnSuccess: true,
        debug: process.env.NODE_ENV === "development",
      },
    ],
  ],
});
```

### Supported Options

| Option               | Description                                                           | Required | Default                   |
| -------------------- | --------------------------------------------------------------------- | -------- | ------------------------- |
| `sendGridApiKey`     | SendGrid API key used for authentication                              | `true`   | `undefined`               |
| `from`               | Email address used as the sender                                      | `true`   | `undefined`               |
| `to`                 | Comma separated recipient addresses                                   | `true`   | `undefined`               |
| `subject`            | Subject line for the email                                            | `false`  | `Playwright Test Results` |
| `linkToResults`      | URL pointing to the CI pipeline or hosted Playwright report           | `false`  | `undefined`               |
| `mailOnSuccess`      | Send an email even when all tests pass                                | `false`  | `true`                    |
| `showError`          | Include error details when failures occur                             | `false`  | `false`                   |
| `quiet`              | Suppress console logging by the reporter                              | `false`  | `false`                   |
| `debug`              | Log sanitized configuration for troubleshooting                       | `false`  | `false`                   |
| `replyTo`            | Reply-to header for the email                                         | `false`  | `undefined`               |
| `attachHtmlReport`   | Attach a standalone Playwright HTML report to the email               | `false`  | `false`                   |

> **Tip:** When `attachHtmlReport` is `true`, ensure your Playwright run produces a HTML report (e.g., `npx playwright test --reporter=html`). The reporter picks up the generated report automatically.

---

## CI/CD Examples

### GitHub Actions

```yaml
name: Playwright

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - run: npx playwright test
        env:
          SENDGRID_API_KEY: ${{ secrets.SENDGRID_API_KEY }}
          SENDGRID_FROM_EMAIL: reports@example.com
          SENDGRID_TO_EMAILS: qa@example.com,dev@example.com
          SENDGRID_LINK_TO_RESULTS: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

Use your CI system’s secret store (e.g., GitHub Secrets, Azure Key Vault) to keep API keys out of source control.

---

## Migrating from `playwright-mail-reporter`

This fork intentionally mirrors the original API with minimal changes. To migrate:

1. **Swap the dependency**

   ```bash
   npm uninstall playwright-mail-reporter
   npm install playwright-sendgrid-mail-reporter
   ```

2. **Update your Playwright config**

   ```diff
   - ["playwright-mail-reporter", { ... }]
   + ["playwright-sendgrid-mail-reporter", { ... }]
   ```

3. **Replace SMTP credentials with a SendGrid API key**

   | Original (SMTP)            | New (SendGrid)                      |
   | -------------------------- | ----------------------------------- |
   | `MAIL_HOST`, `MAIL_PORT`   | _Not required_                      |
   | `MAIL_USERNAME`, `MAIL_PASSWORD` | `SENDGRID_API_KEY`                |
   | `MAIL_FROM`                | `SENDGRID_FROM_EMAIL`               |
   | `MAIL_TO`                  | `SENDGRID_TO_EMAILS`                |
   | `MAIL_SUBJECT`             | `SENDGRID_SUBJECT` (optional)       |

4. **Keep your existing options** – values such as `mailOnSuccess`, `linkToResults`, and `showError` still work. Optional `replyTo` and `attachHtmlReport` are now supported via SendGrid.

> Need to run both versions side-by-side? Install them under different names and configure separate reporters in Playwright.

---

## Troubleshooting

- **Missing required environment variables**  
  Ensure `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, and `SENDGRID_TO_EMAILS` are set either in `.env` or inline options.

- **SendGrid rejects the email**  
  Verify the API key has “Mail Send” permissions and the sender email/domain is verified in SendGrid.

- **Email sent but not delivered**  
  Check spam folders, ensure recipients allow the sender, and that the sending domain is authenticated.

- **Reporter stays silent locally**  
  Set `SENDGRID_DEBUG=true` or pass `debug: true` inline to print sanitized configuration details.

- **No HTML attachment arrives**  
  Make sure `attachHtmlReport` is `true` and your Playwright run actually produces a HTML report (`npx playwright show-report` should work locally).

---

## FAQ

- **Can I disable emails when all tests pass?**  
  Yes. Set `mailOnSuccess` to `false`.

- **How do I include run metadata or links?**  
  Use `linkToResults` to add a URL to your CI job, dashboards, or hosted report.

- **Can I send to multiple recipients or CC/BCC?**  
  Provide a comma-separated list in `SENDGRID_TO_EMAILS` (or `to` option). CC/BCC are not currently exposed—feel free to open a discussion if you need them.

- **Does this reporter work with Playwright HTML reports?**  
  Yes. Set Playwright’s reporter to include `html` and enable `attachHtmlReport`.

---

## Contributing

Issues and pull requests are welcome! To work locally:

```bash
git clone https://github.com/imshaiknasir/playwright-sendgrid-mail-reporter.git
cd playwright-sendgrid-mail-reporter
npm install
npm run build
npx playwright test
```

When you open a PR, please describe the change, include test notes, and confirm the reporter works end-to-end with SendGrid.

---

## License & Credits

- Licensed under [MIT](LICENSE).  
- Original author: [Elio Struyf](https://github.com/estruyf), creator of [`playwright-mail-reporter`](https://github.com/estruyf/playwright-mail-reporter).  
- Fork maintained by [imshaiknasir](https://github.com/imshaiknasir) and contributors, focused on SendGrid-based delivery.

<br />

[![Visitors](https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fgithub.com%2Fimshaiknasir%2Fplaywright-sendgrid-mail-reporter&countColor=%23263759)](https://visitorbadge.io/status?path=https%3A%2F%2Fgithub.com%2Fimshaiknasir%2Fplaywright-sendgrid-mail-reporter)
