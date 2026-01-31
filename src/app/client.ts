import { createThirdwebClient } from "thirdweb";

/**
 * Smart Thirdweb Client Initialization
 * - Uses clientId on the browser (NEXT_PUBLIC_TEMPLATE_CLIENT_ID)
 * - Uses secretKey on the server (TW_SECRET_KEY)
 * - NEVER exposes secretKey to the client side
 */

const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID;
const secretKey = process.env.TW_SECRET_KEY;

// Determine if we're running on the server
const isServer = typeof window === "undefined";

if (isServer) {
  // Server-side: prefer secretKey, fall back to clientId
  if (!secretKey && !clientId) {
    throw new Error(
      "Server: Missing TW_SECRET_KEY or NEXT_PUBLIC_TEMPLATE_CLIENT_ID",
    );
  }
} else {
  // Client-side: must have clientId
  if (!clientId) {
    throw new Error("Client: Missing NEXT_PUBLIC_TEMPLATE_CLIENT_ID");
  }
}

export const client = createThirdwebClient(
  isServer && secretKey ? { secretKey } : { clientId: clientId as string },
);
