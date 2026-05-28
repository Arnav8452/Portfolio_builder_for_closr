import { encryptToken, decryptToken } from "./apps/worker/src/lib/encryption.js";

const original = "EAAGm0PX4ZC...fake...token";
const encrypted = encryptToken(original);
const decrypted = decryptToken(encrypted);

console.log("Original:  ", original);
console.log("Encrypted: ", encrypted);
console.log("Decrypted: ", decrypted);
console.log("Success:   ", original === decrypted);

// Test backward compatibility (unencrypted token)
const unencrypted = "EAAGm0PX4ZC...fake...token";
const decryptedUnencrypted = decryptToken(unencrypted);
console.log("Unencrypted Success:", unencrypted === decryptedUnencrypted);
