import type express from "express";

export type AsyncHandler = (req: express.Request, res: express.Response) => Promise<unknown>;

const DEFAULT_FAILURE_MESSAGE = "Something went wrong. Please try again.";

/**
 * Registers an async Express handler so that a failure inside it cannot end the
 * process.
 *
 * Express 4 does not catch errors thrown from async handlers. An escaped
 * rejection goes unhandled, and Node's default response to that is to terminate
 * the process, taking every user's session with it. This happened for real:
 * one unauthenticated POST to /api/gemini/analyze-stock with a partial stock
 * object killed the server, because the throw came from inside the handler's
 * own catch block. Every route here ends with `catch (err) { … err.message … }`,
 * which throws again if something rejects with null, so a try/catch in the
 * handler is not enough by itself.
 *
 * On failure: the error is logged on the server with the method and path (no
 * query string, so query values stay out of the logs), and the client gets a
 * generic 500 carrying no internal details. The body sets both `message` and
 * `error`, because this server uses both envelopes and clients read one or the
 * other. If the response has already begun, the error is handed to Express
 * instead, since a second response cannot be written.
 */
export const asyncRoute = (
  handler: AsyncHandler,
  failureMessage: string = DEFAULT_FAILURE_MESSAGE,
): express.RequestHandler => (req, res, next) => {
  Promise.resolve()
    .then(() => handler(req, res))
    .catch((err) => {
      console.error(`[route] ${req.method} ${req.path} failed:`, err);
      if (res.headersSent) return next(err);
      res.status(500).json({ success: false, message: failureMessage, error: failureMessage });
    });
};
