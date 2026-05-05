export function hammingDistance(left: string, right: string) {
  if (left.length !== right.length) {
    throw new Error("Cannot compare pHashes with different lengths.");
  }

  let distance = 0;
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) distance += 1;
  }
  return distance;
}

export async function computeProfilePHash(imageUrl: string) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Profile image fetch failed: ${response.status}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  let hash = 0;
  for (const byte of bytes.slice(0, 4096)) {
    hash = ((hash << 5) - hash + byte) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
