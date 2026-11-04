import { generateKeyPair, exportJWK, importPKCS8, importSPKI, type JWK } from "jose";

type SigningKey = CryptoKey | Uint8Array;

let cachedPrivateKey: SigningKey | null = null;
let cachedPublicKey: SigningKey | null = null;
let cachedPublicJwk: JWK | null = null;

const KEY_ID = process.env.JWT_KEY_ID || "savelo-idp-key-1";

/**
 * Initializes and retrieves the RSA 2048 keypair.
 * Reads from environment variables if present, or auto-generates in memory for dev.
 */
export async function getSigningKeys(): Promise<{
  privateKey: SigningKey;
  publicKey: SigningKey;
  kid: string;
}> {
  if (cachedPrivateKey && cachedPublicKey) {
    return {
      privateKey: cachedPrivateKey,
      publicKey: cachedPublicKey,
      kid: KEY_ID,
    };
  }

  const envPrivateKey = process.env.JWT_PRIVATE_KEY;
  const envPublicKey = process.env.JWT_PUBLIC_KEY;

  if (envPrivateKey && envPublicKey) {
    const privPem = envPrivateKey.includes("-----BEGIN")
      ? envPrivateKey
      : Buffer.from(envPrivateKey, "base64").toString("utf-8");
    const pubPem = envPublicKey.includes("-----BEGIN")
      ? envPublicKey
      : Buffer.from(envPublicKey, "base64").toString("utf-8");

    cachedPrivateKey = await importPKCS8(privPem, "RS256");
    cachedPublicKey = await importSPKI(pubPem, "RS256");
  } else {
    // Generate RSA key pair in-memory (useful for local development and tests)
    const { privateKey, publicKey } = await generateKeyPair("RS256", {
      modulusLength: 2048,
      extractable: true,
    });
    cachedPrivateKey = privateKey;
    cachedPublicKey = publicKey;
  }

  return {
    privateKey: cachedPrivateKey,
    publicKey: cachedPublicKey,
    kid: KEY_ID,
  };
}

/**
 * Returns the public JWKS object for /.well-known/jwks.json
 */
export async function getPublicJwks(): Promise<{ keys: JWK[] }> {
  if (cachedPublicJwk) {
    return { keys: [cachedPublicJwk] };
  }

  const { publicKey, kid } = await getSigningKeys();
  const jwk = await exportJWK(publicKey);
  jwk.kid = kid;
  jwk.alg = "RS256";
  jwk.use = "sig";

  cachedPublicJwk = jwk;
  return { keys: [jwk] };
}
