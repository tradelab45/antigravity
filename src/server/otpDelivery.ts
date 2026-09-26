/**
 * Getting a verification code to the person.
 *
 * The app has no mail provider of its own and adding one would mean baking in
 * a vendor. Instead the code is handed to whatever the operator configures:
 *
 *   OTP_WEBHOOK_URL   an endpoint that receives { email, code, expiresAt } and
 *                     sends the mail — a provider's API, a serverless function,
 *                     a workflow tool, whatever is already in place.
 *   OTP_WEBHOOK_TOKEN sent as `Authorization: Bearer …` when set.
 *
 * With nothing configured the flow is not quietly skipped: it fails closed and
 * says what is missing. The one exception is OTP_DEV_ECHO, which returns the
 * code to the browser so the flow can be exercised locally. It is refused
 * outright when NODE_ENV is production, because a code echoed to the caller is
 * no second factor at all.
 */

export type DeliveryMode = 'webhook' | 'dev-echo' | 'none';

export interface DeliveryOutcome {
  delivered: boolean;
  mode: DeliveryMode;
  /** Only ever set by dev-echo, never in production. */
  devCode?: string;
  message?: string;
}

export function deliveryMode(): DeliveryMode {
  if ((process.env.OTP_WEBHOOK_URL || '').trim()) return 'webhook';
  if (
    (process.env.OTP_DEV_ECHO || '').trim().toLowerCase() === 'true' &&
    process.env.NODE_ENV !== 'production'
  ) {
    return 'dev-echo';
  }
  return 'none';
}

/** True when the operator has asked for a code on every sign-in. */
export function otpRequired(): boolean {
  return (process.env.REQUIRE_LOGIN_OTP || '').trim().toLowerCase() === 'true';
}

export async function deliverCode(
  email: string,
  code: string,
  expiresAt: number,
): Promise<DeliveryOutcome> {
  const mode = deliveryMode();

  if (mode === 'dev-echo') {
    return {
      delivered: true,
      mode,
      devCode: code,
      message: 'Development mode: the code is shown on screen instead of being emailed.',
    };
  }

  if (mode === 'webhook') {
    const url = (process.env.OTP_WEBHOOK_URL || '').trim();
    const token = (process.env.OTP_WEBHOOK_TOKEN || '').trim();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email, code, expiresAt }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return { delivered: false, mode, message: 'The verification email could not be sent.' };
      }
      return { delivered: true, mode };
    } catch {
      return { delivered: false, mode, message: 'The verification email could not be sent.' };
    }
  }

  return {
    delivered: false,
    mode: 'none',
    message:
      'Verification codes are switched on but no delivery is configured. Set OTP_WEBHOOK_URL.',
  };
}
