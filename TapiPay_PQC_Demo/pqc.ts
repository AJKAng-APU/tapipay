export function pqcGenerateKeyPair() {
  return {
    privateKey: 'SIMULATED_PRIVATE_KEY_123456789',
    publicKey: 'SIMULATED_PUBLIC_KEY_ABCDEF12345'
  };
}

export function pqcSign(message: string, privateKey: string): string {
  return Buffer.from(`SIGN(${message})::${privateKey}`).toString('base64');
}

export function pqcVerify(signed: string, publicKey: string): boolean {
  try {
    const decoded = Buffer.from(signed, 'base64').toString();
    return decoded.includes(publicKey);
  } catch {
    return false;
  }
}
