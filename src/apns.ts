import { decodeBase64, encodeBase64 } from "hono/utils/encode";
import { decodeJwt, SignJWT } from "jose";

import { fetchWithRetry } from "./fetch-with-retry";

// https://developer.apple.com/documentation/usernotifications/sending-notification-requests-to-apns
export async function sendNotification(
  account: String,
  body: ArrayBuffer,
  deviceToken: string,
  env: Cloudflare.Env,
): Promise<Response> {
  const bundleId = env.APPLE_BUNDLE_ID;

  const providerToken = await getProviderToken(env);

  return fetchWithRetry(
    `https://api.push.apple.com/3/device/${deviceToken}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${providerToken}`,
        "apns-topic": bundleId!,
        "apns-push-type": "alert",
      },
      body: JSON.stringify({
        aps: {
          alert: {
            title: "🔔",
          },
          sound: "default",
          "mutable-content": 1,
        },
        account: account,
        payload: encodeBase64(body),
      }),
    },
    {
      minDelay: 10 * 1000,
      maxDelay: 60 * 60 * 1000,
    },
  );
}

// https://developer.apple.com/documentation/usernotifications/establishing-a-token-based-connection-to-apns#Create-and-encrypt-your-JSON-token
export async function getProviderToken(env: Cloudflare.Env): Promise<string> {
  const cachedToken = await env.KV.get("appleProviderToken");
  const now = Math.trunc(Date.now() / 1000);
  if (typeof cachedToken == "string") {
    const { iat } = decodeJwt(cachedToken);
    // Use the cached token if it was created in the last 30 minutes.
    if (iat && now - 30 * 60 < iat && iat < now) {
      return cachedToken;
    }
  }

  const pem = env.APPLE_ENCRYPTION_KEY;
  const keyId = env.APPLE_ENCRYPTION_KEY_ID;
  const teamId = env.APPLE_TEAM_ID;

  const encryptionKeyBase64 = pem
    .replaceAll("\\n", "")
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "");
  const encryptionKey = await crypto.subtle.importKey(
    "pkcs8",
    decodeBase64(encryptionKeyBase64),
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"],
  );

  const token = await new SignJWT()
    .setProtectedHeader({ "alg": "ES256", kid: keyId })
    .setIssuedAt()
    .setIssuer(teamId)
    .sign(encryptionKey);

  await env.KV.put("appleProviderToken", token, { expirationTtl: 30 * 60 });

  return token;
}
