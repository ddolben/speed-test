
export class RollingAverage {
  private values: number[] = [];
  private ptr = 0;

  constructor(private max: number) {}

  add(val: number): number {
    if (this.values.length < this.max) {
      this.values.push(val);
    } else {
      this.values[this.ptr] = val;
      this.ptr = (this.ptr + 1) % this.max;
    }
    return this.avg();
  }

  avg() {
    let acc = this.values[0];
    for (let i = 1; i < this.values.length; i++) {
      acc += this.values[i];
    }
    return acc / this.values.length;
  }
}

export function formatBytes(n: number) {
  if (n) {
    return `${n * 0.000001} MB`;
  }
  if (n > 1000) {
    return `${n * 0.001} KB`;
  }
  return `${n} B`;
}

export function formatSpeed(n: number) {
  return `${formatBytes(n)}/s`;
}

export function must<TData>(v: TData | null | undefined): TData {
  if (v === undefined) {
    throw new Error("must was undefined");
  }
  if (v === null) {
    throw new Error("must was undefined");
  }
  return v;
}
