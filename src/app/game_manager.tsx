"use client";

import React, { useState } from "react";

// Props interface for GridTile component
interface GridTileProps {
  row: number;
  col: number;
  isClicked: boolean;
  onClick: (row: number, col: number) => void;
}

// Individual grid tile component
const GridTile: React.FC<GridTileProps> = ({
  row,
  col,
  isClicked,
  onClick,
}) => {
  return (
    <button
      className={`
        aspect-square rounded-sm shadow-sm shadow-blue hover:shadow-none
        hover:scale-[0.975] transition-all duration-100
        ${isClicked ? "bg-red" : "bg-transparent hover:bg-gray-200"}
      `}
      onClick={() => onClick(row, col)}
    ></button>
  );
};

// Main game component
const App: React.FC = () => {
  const GRID_SIZE: number = 5; // nxn grid

  // Initialize 2D array for grid state
  const initializeGrid = (): boolean[][] => {
    return Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(false));
  };

  const [grid, setGrid] = useState<boolean[][]>(initializeGrid());

  // Handle tile click
  const handleTileClick = (row: number, col: number): void => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row) => [...row]); // Deep copy
      newGrid[row][col] = !newGrid[row][col]; // Toggle clicked state
      return newGrid;
    });
  };

  // Reset grid
  const resetGrid = (): void => {
    setGrid(initializeGrid());
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-crust">
      <div className=" min-w-[30vw] flex flex-col gap-12 rounded-lg p-6">
        {/* Grid */}
        <div
          className="grid gap-1 p-8 bg-base rounded"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((isClicked, colIndex) => (
              <GridTile
                key={`${rowIndex}-${colIndex}`}
                row={rowIndex}
                col={colIndex}
                isClicked={isClicked}
                onClick={handleTileClick}
              />
            ))
          )}
        </div>
        {/* Controls */}
        <div className="text-center">
          <button
            onClick={resetGrid}
            className="px-6 py-2 shadow-sm shadow-blue text-white hover:shadow-none hover:scale-[0.975] transition-all duration-100"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
