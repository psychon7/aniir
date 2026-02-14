export async function memoryLookupStep(memoryLookup, fingerprint) {
  if (typeof memoryLookup !== "function") return null;
  return memoryLookup(fingerprint);
}
