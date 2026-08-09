/** Deterministic stand-in for expo-crypto under jest — no native module. */
let counter = 0;

export function randomUUID(): string {
  counter += 1;
  return `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`;
}
