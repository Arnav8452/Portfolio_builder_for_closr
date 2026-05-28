import crypto from "crypto";

// Use a shared secret or dedicated encryption secret.
// Hash it to guarantee it is exactly 32 bytes (256 bits) for AES-256.
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || process.env.GATEWAY_SECRET || "fallback_dev_secret_key_1234567890";
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a colon-separated string: iv:authTag:ciphertext
 */
export function encryptToken(text: string): string {
  if (!text) return text;
  
  const iv = crypto.randomBytes(12); // GCM standard IV size
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a previously encrypted token string.
 * Expects the format: iv:authTag:ciphertext
 */
export function decryptToken(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(":")) {
    // Return as-is if it doesn't look like our encrypted format (backward compatibility)
    return encryptedText;
  }
  
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) return encryptedText;
    
    const [ivHex, authTagHex, cipherTextHex] = parts;
    const iv = Buffer.from(ivHex!, "hex");
    const authTag = Buffer.from(authTagHex!, "hex");
    const key = getEncryptionKey();
    
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(cipherTextHex!, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Token decryption failed:", error);
    return encryptedText;
  }
}
