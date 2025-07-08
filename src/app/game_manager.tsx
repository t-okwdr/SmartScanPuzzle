"use client";

import { abs, round } from "mathjs";
import React, { useState } from "react";

// Props interface for GridTile component
interface GridTileProps {
  row: number;
  col: number;
  distance: number;
  duration: number;
  color: string;
  onClick: (row: number, col: number) => void;
}


// Individual grid tile component
const GridTile: React.FC<GridTileProps> = ({
  row,
  col,
  distance,
  duration,
  onClick,
  color,
}) => {
  return (
    <button
      className={`
        aspect-square rounded-sm shadow-sm shadow-blue hover:shadow-none
        hover:scale-[0.975] transition-colors  transition-normal ease-in-out 
        ${distance>=0 ? `` : "bg-transparent hover:bg-gray-200 "}
      `}
      style={ distance>=0 ? { backgroundColor: `${color}`, transitionDelay: (distance*duration/3).toFixed(0)+"ms", transitionDuration: duration.toFixed(0)+"ms"} : { } }
      onClick={() => onClick(row, col)}
    ></button>
  );
};


// Main game component
const App: React.FC = () => {
  const [hidden, setHidden] = useState<boolean>(true);
  
  const [size, setSize] = useState("5");
  
  var GRID_SIZE: number = 5; // nxn grid
  var MAX_ANIM_TIME: number = 1000; // time in ms
  
  const startGame = (): void =>  {
    setHidden(false);
    GRID_SIZE = parseInt(size+1);
    console.log(GRID_SIZE)
    resetGrid();
    console.log(grid.length)
  }
  //change to ints that can calculate distance from button press, 0 means off
  // Initialize 2D array for grid state
  const initializeGrid = (): number[][] => {
    return Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(-1));
  };

  const convertToHex = ({r,g,b} : {r:number,g:number,b:number}): string => {
    var col = '#';
    col += round(r).toString(16).padStart(2,"0");
    col += round(g).toString(16).padStart(2,"0");
    col += round(b).toString(16).padStart(2,"0");
    // console.log(col);
    return col;
  }

  const distance = (origRow: number, origCol: number, destRow: number, destCol: number): number => {
    let horiz = abs(origRow-destRow)**2,vert = abs(origCol-destCol)**2;
    // console.log("orig rc("+origRow+","+origCol+")" + " dest rc("+destRow+","+destCol+")" + " dist: " + ((horiz + vert)**0.5));
    return (horiz + vert)**0.5;
  }

  const [grid, setGrid] = useState<number[][]>(initializeGrid());

  // Handle tile click
  const handleTileClick = (row: number, col: number): void => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row) => [...row]); // Deep copy
      console.clear();
      for (var i = 0; i < newGrid.length; i++){
        for (var j = 0; j < newGrid[i].length; j++){
          newGrid[i][j] = distance(row,col,i,j);
        }
      }
      // newGrid[row][col] = !newGrid[row][col]; // Toggle clicked state
      return newGrid;
    });
  };

  // Reset grid
  const resetGrid = (): void => {
    setGrid(initializeGrid());
  };


const calculateTemperature = ((dist: number) => {
  return (abs(GRID_SIZE-dist))*1000;
});

    
function colorTemperatureToRGB(kelvin: number){

    var temp = kelvin / 100;

    var red, green, blue;

    if( temp <= 66 ){ 

        red = 255; 
        
        green = temp;
        green = 99.4708025861 * Math.log(green) - 161.1195681661;

        
        if( temp <= 19){

            blue = 0;

        } else {

            blue = temp-10;
            blue = 138.5177312231 * Math.log(blue) - 305.0447927307;

        }

    } else {

        red = temp - 60;
        red = 329.698727446 * Math.pow(red, -0.1332047592);
        
        green = temp - 60;
        green = 288.1221695283 * Math.pow(green, -0.0755148492 );

        blue = 255;

    }


    return {
        r : clamp(red,   0, 255),
        g : clamp(green, 0, 255),
        b : clamp(blue,  0, 255)
    }

}


function clamp( x: number, min: number, max: number ) {

    if(x<min){ return min; }
    if(x>max){ return max; }

    return round(x);

}

  return (
    <div className = {`flex flex-col items-center justify-center min-h-screen bg-crust   `}>
      <div className=" min-w-[30vw] flex flex-col gap-12 rounded-lg p-6">
        { hidden ? 
        <>
          <div className=" flex flex-row gap-4 h-auto justify-center" >
            <label className=" font-bold text-white size-16 w-auto">Board Size:</label>
            <input 
              name="Size" 
              className=" border-2 border-white text-gray-300 h-6 pl-2 "
              value={size}
              onChange={e =>  {setSize(e.target.value)} }
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
        :
        <>
          {/* Grid */}
          <div
            className={`grid gap-1 p-8 bg-base rounded `}
            style={hidden ? undefined : {
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
            }}
          >
            {grid.map((row, rowIndex) =>
              row.map((dist, colIndex) => (
                <GridTile
                  key={`${rowIndex}-${colIndex}`}
                  row={rowIndex}
                  col={colIndex}
                  distance={dist}
                  duration={MAX_ANIM_TIME/(2*((GRID_SIZE-1)**2)**(0.5))}
                  onClick={handleTileClick}
                  color={convertToHex(colorTemperatureToRGB(calculateTemperature(dist)))}
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
        </>
      }
      </div>
    </div>
  );
};

export default App;
