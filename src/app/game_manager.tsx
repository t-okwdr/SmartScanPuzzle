"use client";

import React, { useState, useRef } from "react";
import { LPBFSimulation } from "./engine";

interface GridTileProps {
  row: number;
  col: number;
  distance: number;
  temperature: number;
  duration: number;
  onClick: (row: number, col: number) => void;
}

const GridTile: React.FC<GridTileProps> = ({
  row,
  col,
  distance,
  temperature,
  duration,
  onClick,
}) => {
  const color = temperatureToColor(temperature);

  return (
    <button
      className={`
        aspect-square rounded-sm shadow-sm shadow-blue hover:shadow-none
        hover:scale-[0.975] transition-colors transition-normal ease-in-out
        ${distance >= 0 ? "" : "bg-transparent hover:bg-gray-200"}
      `}
      style={
        distance >= 0
          ? {
              backgroundColor: color,
              transitionDelay: `${(distance * duration) / 3}ms`,
              transitionDuration: `${duration}ms`,
            }
          : {}
      }
      onClick={() => onClick(row, col)}
    >
      <span className="text-white">{Math.round(temperature)}</span>
    </button>
  );
};

const App: React.FC = () => {
  const [grid, setGrid] = useState<number[][]>([]);
  const [size, setSize] = useState("");
  const [hidden, setHidden] = useState(true);
  const [lastClicked, setLastClicked] = useState<[number, number] | null>(null);

  const simulationRef = useRef<LPBFSimulation | null>(null);
  const MAX_ANIM_TIME = 1000;

  const parseBoardSize = (): number => {
    const parsed = parseInt(size);
    return isNaN(parsed) ? 5 : parsed;
  };

const startGame = async () => {
  const gameSize = parseBoardSize();
  if (gameSize < 3 || gameSize > 10) {
    alert("Please enter a size between 3 and 10.");
    return;
  }

  const sim = new LPBFSimulation(gameSize);
  await sim.init(); // ✅ wait for grid from backend
  simulationRef.current = sim;
  setGrid(sim.getCurrentIslandMap());
  setHidden(false);
  setLastClicked(null);
};

  const resetGrid = () => {
    const sim = new LPBFSimulation(parseBoardSize());
    simulationRef.current = sim;
    setGrid(sim.getCurrentIslandMap());
    setLastClicked(null);
  };

  const handleTileClick = async (row: number, col: number) => {
    const sim = simulationRef.current;
    if (!sim) return;

    const index = row * grid.length + col + 1;
    const result = await sim.makeMove(index);

    if (result.success) {
      setGrid(sim.getCurrentIslandMap());
      setLastClicked([row, col]);
      console.log(result.message);
    } else {
      console.warn(result.message);
    }

    if (sim.isGameComplete()) {
      const acc = await sim.getFinalAccuracy();
      console.log(`Game complete! Final accuracy: ${acc.toFixed(2)}%`);
    }
  };

  const calculateDistance = (row: number, col: number): number => {
    if (!lastClicked) return -1;
    const [lastRow, lastCol] = lastClicked;
    const dx = lastRow - row;
    const dy = lastCol - col;
    return Math.round(Math.sqrt(dx * dx + dy * dy));
  };

  const boardSize = parseBoardSize();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-crust">
      <div className="min-w-[30vw] flex flex-col gap-12 rounded-lg p-6">
        {hidden ? (
          <>
            <div className="flex flex-row gap-4 h-auto justify-center">
              <label className="font-bold text-white size-16 w-auto">
                Board Size:
              </label>
              <input
                name="Size"
                className="border-2 border-white text-gray-300 h-6 pl-2"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                type="number"
              />
            </div>
            <div className="text-center">
              <button
                onClick={startGame}
                className="px-6 py-2 shadow-sm shadow-blue text-white hover:shadow-none hover:scale-[0.975] transition-all duration-100"
              >
                Submit
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              className="grid gap-1 p-8 bg-base rounded"
              style={{
                gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
                gridTemplateRows: `repeat(${boardSize}, 1fr)`,
              }}
            >
              {grid.map((row, rowIndex) =>
                row.map((temperature, colIndex) => {
                  const dist = calculateDistance(rowIndex, colIndex);
                  return (
                    <GridTile
                      key={`${rowIndex}-${colIndex}`}
                      row={rowIndex}
                      col={colIndex}
                      distance={dist}
                      temperature={temperature}
                      duration={
                        MAX_ANIM_TIME / (2 * Math.sqrt((boardSize - 1) ** 2))
                      }
                      onClick={handleTileClick}
                    />
                  );
                })
              )}
            </div>
            <div className="text-center">
              <button
                onClick={resetGrid}
                className="px-6 py-2 text-white hover:scale-[0.975] transition-all duration-100"
              >
                Reset
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;

function temperatureToColor(temperature: number): string {
  const minTemp = 200;
  const maxTemp = 1000;
  const t = clamp((temperature - minTemp) / (maxTemp - minTemp), 0, 1);

  let r: number, g: number, b: number;

  if (t < 0.5) {
    const localT = t / 0.5;
    r = 0;
    g = localT * 255;
    b = 255 - localT * 255;
  } else {
    const localT = (t - 0.5) / 0.5;
    r = localT * 255;
    g = 255 - localT * 255;
    b = 0;
  }

  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x));
}
