export type RandomSource = () => number;

interface WeightedItem {
  weight: number;
}

export function pickWeighted<T extends WeightedItem>(
  items: readonly T[],
  random: RandomSource = Math.random,
): T {
  if (items.length === 0) {
    throw new Error("Cannot select from an empty collection");
  }

  const totalWeight = items.reduce((total, item) => total + item.weight, 0);

  if (totalWeight <= 0) {
    throw new Error("Total weight must be greater than zero");
  }

  let value = random() * totalWeight;

  for (const item of items) {
    value -= item.weight;

    if (value < 0) {
      return item;
    }
  }

  return items[items.length - 1];
}
