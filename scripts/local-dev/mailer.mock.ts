// Never instantiate a real SMTP socket from the development sandbox.
export class WorkerMailer {
  static async connect() { throw new Error("LOCAL ONLY: SMTP is disabled"); }
  static async send() { throw new Error("LOCAL ONLY: SMTP is disabled"); }
}
