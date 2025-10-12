import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  FullResult,
  TestResult,
} from "@playwright/test/reporter";
import { ensureConfig, logConfigErrors, processResults } from "./utils";
import type { MailReporterOptions } from "./types";

class MailReporter implements Reporter {
  private suite: Suite | undefined;
  private options: MailReporterOptions;

  constructor(options: MailReporterOptions) {
    const defaultOptions: MailReporterOptions = {
      from: undefined,
      to: undefined,
      subject: "Playwright Test Results",
      linkToResults: undefined,
      mailOnSuccess: true,
      showError: false,
      quiet: false,
      debug: false,
    };

    this.options = { ...defaultOptions, ...ensureConfig(options) };

    // Set default options
    if (typeof this.options.mailOnSuccess === "undefined") {
      this.options.mailOnSuccess = true;
    }

    console.log(`Using the Mail Reporter`);

    if (this.options.configErrors?.length) {
      logConfigErrors(this.options.configErrors);
    }

    if (process.env.NODE_ENV === "development" || this.options.debug) {
      console.log(`Using debug mode`);

      // Do not return the API key
      const maskedOptions = {
        ...this.options,
        sendGridApiKey: this.options.sendGridApiKey ? "**********" : undefined,
      };
      console.log(`Options: ${JSON.stringify(maskedOptions, null, 2)}`);
    }
  }

  onBegin(_: FullConfig, suite: Suite) {
    this.suite = suite;
  }

  onStdOut(
    chunk: string | Buffer,
    _: void | TestCase,
    __: void | TestResult
  ): void {
    if (this.options.quiet) {
      return;
    }

    const text = chunk.toString("utf-8");
    process.stdout.write(text);
  }

  onStdErr(chunk: string | Buffer, _: TestCase, __: TestResult) {
    if (this.options.quiet) {
      return;
    }

    const text = chunk.toString("utf-8");
    process.stderr.write(text);
  }

  async onEnd(_: FullResult) {
    await processResults(this.suite, this.options);
  }
}

export default MailReporter;
