import crypto from "crypto";

console.log("==================================================================");
console.log("  Savelo IdP - Production Key & Secret Generator");
console.log("==================================================================\n");

// 1. Generate AUTH_PEPPER_SECRET (HMAC pepper for OTP hashing)
const pepper = crypto.randomBytes(32).toString("hex");

// 2. Generate RSA-2048 Keypair (RS256 PKCS#8 & SPKI)
const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

const b64PrivateKey = Buffer.from(privateKey).toString("base64");
const b64PublicKey = Buffer.from(publicKey).toString("base64");

console.log("1. AUTH_PEPPER_SECRET (32-byte CSPRNG hex):");
console.log("------------------------------------------------------------------");
console.log(pepper);
console.log("------------------------------------------------------------------\n");

console.log("2. RECOMMENDED FOR VERCEL (Base64 Single-Line format):");
console.log("   (Prevents multi-line newline corruption in Vercel UI)\n");
console.log("JWT_PRIVATE_KEY:");
console.log(b64PrivateKey);
console.log("\nJWT_PUBLIC_KEY:");
console.log(b64PublicKey);
console.log("------------------------------------------------------------------\n");

console.log("3. ALTERNATIVE: RAW PEM FORMAT (For local .env or files):");
console.log("\n--- Raw Private Key (PKCS#8) ---");
console.log(privateKey);
console.log("--- Raw Public Key (SPKI) ---");
console.log(publicKey);
console.log("==================================================================");
console.log("Copy and paste these values into Vercel Project Settings -> Environment Variables");
console.log("==================================================================");
