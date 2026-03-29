import crypto from "crypto";

//32-byte key
const SECRET_KEY = crypto
  .createHash("sha256")
  .update(process.env.SECRET_KEY || "default_secret")
  .digest()
  .slice(0, 32);


const IV = Buffer.alloc(16, 0);

// ENCRYPT FUNCTION
export const encryptMessage = (text) => {
  try {
    if (!text) return "";

    const cipher = crypto.createCipheriv("aes-256-cbc", SECRET_KEY, IV);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    return encrypted;
  } catch (error) {
    console.log("Encryption error:", error.message);
    return text; 
  }
};

//  DECRYPT FUNCTION
export const decryptMessage = (text) => {
  try {
    if (!text) return "";

    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      SECRET_KEY,
      IV
    );

    let decrypted = decipher.update(text, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    // silent fail
    return text; 
  }
};