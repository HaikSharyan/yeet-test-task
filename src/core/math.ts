export function modulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

export function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

export function easeOutQuad(progress: number): number {
  return 1 - Math.pow(1 - progress, 2);
}
