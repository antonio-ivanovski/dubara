export function shuffle<T>(input: readonly T[]): T[] {
  const arr = input.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i] as T;
    arr[i] = arr[j] as T;
    arr[j] = tmp;
  }
  return arr;
}

export function pickRandom<T>(input: readonly T[]): T {
  if (input.length === 0) {
    throw new Error('pickRandom: empty input');
  }
  const idx = Math.floor(Math.random() * input.length);
  return input[idx] as T;
}