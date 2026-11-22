export function toByteArray(data: Uint8Array | number[] | string): number[] {
  if (data instanceof Uint8Array) {
    return Array.from(data);
  }
  if (Array.isArray(data)) {
    return data;
  }
  if (typeof data === 'string') {
    const base64Clean = data.includes(',') ? data.split(',')[1] : data;
    try {
      const binary = atob(base64Clean);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return Array.from(bytes);
    } catch {
      return Array.from(new TextEncoder().encode(data));
    }
  }
  return [];
}
