import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

export function keypairFromSecretKey(secretKey: string): Ed25519Keypair {
  try {
    return Ed25519Keypair.fromSecretKey(secretKey);
  } catch (error) {
    const legacyPrefix = "suiprivkey1";
    if (!secretKey.startsWith(legacyPrefix)) throw error;

    const decoded = Buffer.from(secretKey.slice(legacyPrefix.length), "base64");
    if (decoded.length !== 33 || decoded[0] !== 0) throw error;
    return Ed25519Keypair.fromSecretKey(decoded.subarray(1));
  }
}
