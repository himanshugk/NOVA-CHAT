/**
 * NOVA-CHAT E2EE Cryptography Engine
 * Uses Native Web Crypto API
 */

export const generateRSAKeyPair = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true, // extractable
        ["encrypt", "decrypt"]
    );
    return keyPair;
};

export const exportPublicKey = async (publicKey: CryptoKey) => {
    const exported = await window.crypto.subtle.exportKey("spki", publicKey);
    const exportedAsString = String.fromCharCode.apply(null, Array.from(new Uint8Array(exported)));
    const exportedAsBase64 = window.btoa(exportedAsString);
    return `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`;
};

export const exportPrivateKey = async (privateKey: CryptoKey) => {
    const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);
    const exportedAsString = String.fromCharCode.apply(null, Array.from(new Uint8Array(exported)));
    const exportedAsBase64 = window.btoa(exportedAsString);
    return `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64}\n-----END PRIVATE KEY-----`;
};

export const importPublicKey = async (pem: string) => {
    const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length).trim();
    const binaryDerString = window.atob(pemContents);
    const binaryDer = new ArrayBuffer(binaryDerString.length);
    const byteView = new Uint8Array(binaryDer);
    for (let i = 0; i < binaryDerString.length; i++) {
        byteView[i] = binaryDerString.charCodeAt(i);
    }

    return await window.crypto.subtle.importKey(
        "spki",
        binaryDer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256"
        },
        true,
        ["encrypt"]
    );
};

export const importPrivateKey = async (pem: string) => {
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length).trim();
    const binaryDerString = window.atob(pemContents);
    const binaryDer = new ArrayBuffer(binaryDerString.length);
    const byteView = new Uint8Array(binaryDer);
    for (let i = 0; i < binaryDerString.length; i++) {
        byteView[i] = binaryDerString.charCodeAt(i);
    }

    return await window.crypto.subtle.importKey(
        "pkcs8",
        binaryDer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256"
        },
        true,
        ["decrypt"]
    );
};

export const encryptAESKeyWithRSA = async (aesKeyBuffer: ArrayBuffer, rsaPublicKey: CryptoKey) => {
    const encryptedKey = await window.crypto.subtle.encrypt(
        {
            name: "RSA-OAEP"
        },
        rsaPublicKey,
        aesKeyBuffer
    );
    return window.btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(encryptedKey))));
};

export const decryptAESKeyWithRSA = async (encryptedBase64: string, rsaPrivateKey: CryptoKey) => {
    const binaryStr = window.atob(encryptedBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: "RSA-OAEP"
        },
        rsaPrivateKey,
        bytes
    );
    return decrypted;
};
