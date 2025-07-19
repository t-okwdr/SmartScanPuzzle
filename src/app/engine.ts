// engine.ts

export class LPBFSimulation {
  private size: number;
  private grid: number[][] = [];

  constructor(size: number) {
    this.size = size;
  }

  async init(): Promise<void> {
    const res = await fetch("https://smart-scan-fast-api.vercel.app/api/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ size: this.size }),
    });
    if (!res.ok) {
  throw new Error("Failed to init simulation");
}
    const data = await res.json();
    this.grid = data.grid;
  }

  public getCurrentIslandMap(): number[][] {
    return this.grid;
  }

public async makeMove(index: number): Promise<{ success: boolean; message: string }> {
  const res = await fetch("https://smart-scan-fast-api.vercel.app/api/move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index }),
  });

  if (!res.ok) {
    throw new Error("Failed to make move");
  }

  const data = await res.json();

  // Pull updated map from backend
  const statusRes = await fetch("https://smart-scan-fast-api.vercel.app/api/status");
  const status = await statusRes.json();
  this.grid = status.temperatureMap;

  return {
    success: data.success ?? true,
    message: data.message ?? "Move made",
  };
}


  public isGameComplete(): boolean {
    // TODO: optionally pull this from backend later
    return false;
  }

  public async getFinalAccuracy(): Promise<number> {
    const res = await fetch("https://smart-scan-fast-api.vercel.app/api/accuracy");
    const data = await res.json();
    return data.accuracy;
  }
}
