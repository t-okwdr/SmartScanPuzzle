"use client";
import React, { useState, useRef, useEffect } from "react";
import { LPBFSimulation } from "./engine";
import { useNavigate } from "react-router-dom";
import { useRouter } from "next/navigation";
import { getLevel, saveGame, updateLvlStatus } from "./components/levels";
import { number, typeOf } from "mathjs";

interface GridTileProps {
  row: number;
  col: number;
  clicked: boolean;
  distance: number;
  temperature: number;
  duration: number;
  onClick: (row: number, col: number) => void;
}

const GridTile: React.FC<GridTileProps> = ({
  row,
  col,
  clicked,
  distance,
  temperature,
  duration,
  onClick,
}) => {
  const color = temperatureToColor(temperature);

  return (
    <button
      className={`
        aspect-square shadow-sm shadow-blue  transition-colors transition-normal ease-in-out 
        
        ${clicked? "opacity-80" : " border-4  rounded-sm border-gray-900/50  hover:shadow-none hover:scale-[0.975] "}
        ${temperature >= 0 ? "" : "bg-transparent hover:bg-gray-200"}
      `}
      style={
        temperature >= 0
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

const initializeGrid = (gridSize: number): boolean[][] => {
    return Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(false));
  };

const App: React.FC = () => {

    const router = useRouter();

    const handleNavigation = () => {
        router.push(`/levels`)
    }

  const saved = localStorage.getItem("savedata");
  if (saved==null){
    saveGame(1);
  }

  const savedata = JSON.parse(saved!);
  const activeLevel = getLevel(savedata.active);

  const [grid, setGrid] = useState<number[][]>([]);
  const [accuracy, setAccuracy] = useState<string>("--");
  const [size, setSize] = useState(activeLevel.size);
  const [hidden, setHidden] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [lastClicked, setLastClicked] = useState<[number, number] | null>(null);

  const simulationRef = useRef<LPBFSimulation | null>(null);
  const MAX_ANIM_TIME = 1000;

  const parseBoardSize = (): number => {
    // const parsed = parseInt(size);
    // return isNaN(parsed) ? 5 : parsed;
    return activeLevel.size;
  };

  const [clicked, setClicked] = useState<boolean[][]>(initializeGrid(parseBoardSize()));
const startGame = async () => {
  const gameSize = parseBoardSize();
  if (gameSize < 3 || gameSize > 10) {
    alert("Please enter a size between 3 and 10.");
    // return;
  }


  const sim = new LPBFSimulation(gameSize);
  const fetchData = async () => {
    setIsLoading(true);
    try {
      await sim.init(); // ✅ wait for grid from backend
      
      console.log("Obtained Grid")
    } catch (error) {
      console.error("Error: " + error)
    }
    finally {
      setIsLoading(false);
    }
  }
  await fetchData();
  
  simulationRef.current = sim;
  setGrid(sim.getCurrentIslandMap());
  setClicked(initializeGrid(parseBoardSize()))
  setHidden(false);
  setLastClicked(null);
};



  useEffect(() => {
    const autoStartGame = async () => {
      const gameSize = activeLevel.size;


      const sim = new LPBFSimulation(gameSize);
      const fetchData = async () => {
        setIsLoading(true);
        try {
          await sim.init(); // ✅ wait for grid from backend
          
          console.log("Obtained Grid")
        } catch (error) {
          console.error("Error: " + error)
        }
        finally {
          setIsLoading(false);
        }
      }
      await fetchData();
      
      simulationRef.current = sim;
      setGrid(sim.getCurrentIslandMap());
      setClicked(initializeGrid(parseBoardSize()))
      setHidden(false);
      setLastClicked(null);
    };

    autoStartGame();
  }, [activeLevel])


  const resetGrid = async () => {
    const sim = new LPBFSimulation(parseBoardSize());
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await sim.init(); // ✅ wait for grid from backend
        console.log("Reset Grid")
      } catch (error) {
        console.error("Error: " + error)
      }
      finally {
        setIsLoading(false);
      }
    }
    await fetchData();
    
    setAccuracy("--")
    simulationRef.current = sim;
    setGrid(sim.getCurrentIslandMap());
    setClicked(initializeGrid(parseBoardSize()))
    setLastClicked(null);
  };

  const handleTileClick = async (row: number, col: number) => {
    const sim = simulationRef.current;
    
    const index = row * grid.length + col + 1;

    if (!sim) return;

    if (clicked[row][col]==true){
      //screenshake
      return;
    }


    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await sim.makeMove(index);
        console.log("Reset Grid")
        return res;
      } catch (error) {
        console.error("Error: " + error)
      }
      finally {
        setIsLoading(false);
      }
    }
    const result = await fetchData();
    setClicked((prevGrid) => {
      const newGrid = prevGrid.map((row) => [...row]); // Deep copy
      newGrid[row][col] = true;
      return newGrid;
    });

    if (result){
      if (result.success) {
        setGrid(sim.getCurrentIslandMap());
        const acc = await getAccuracy(sim)
        setAccuracy(acc!=null ? acc : "--");
        setLastClicked([row, col]);
        console.log(result.message);
      } else {
        console.warn(result.message);
      }
    }
    
    
    if (await sim.isGameComplete()) {
      const acc = await getAccuracy(sim);
      if (acc){
        console.log(`Game complete! Final accuracy: ${acc}%`);
        if (parseFloat(acc) > activeLevel.reqScore){
          updateLvlStatus(activeLevel.number)
        }
      }
    }
    // setIsLoading(false);
  };

  const getAccuracy = async (sim: LPBFSimulation) => {
    if (!sim) 
      return "0.00";
    // setIsLoading(true);
    try {
      const acc = await sim.getAccuracy();
      return (acc*100).toFixed(2);
    } catch (error) {
      console.error("Error: " + error)
    }
    finally {
      // setIsLoading(false);
    }
  }

  const calculateDistance = (row: number, col: number): number => {
    if (!lastClicked) return 0;
    const [lastRow, lastCol] = lastClicked;
    const dx = lastRow - row;
    const dy = lastCol - col;
    return Math.round(Math.sqrt(dx * dx + dy * dy));
  };

  const boardSize = parseBoardSize();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-crust">
      {isLoading ? (
        <>
          {/* <!-- loading overlay --> */}

          <div className="absolute bg-white/25 z-10 h-full w-full flex items-center justify-center">
            <div className="flex items-center" >
              <span className="text-3xl mr-4">Loading</span>
              {/* <!-- loading icon --> */}
              <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {/* <!-- end loading icon --> */}
            </div>
          </div>

          {/* <!-- end loading overlay --> */}
        </>
      ) : <></>}
      <div className="min-w-[30vw] max-w-[50vw] flex flex-col gap-12 rounded-lg p-6">

        { (
          <>
            <div
              className="p-6 gap-2 bg-base flex flex-col justify-items-center"
            >
              <span className="text-white text-md text-center px-1 py-0.5 border-2 border-blue-300 ">Score To Beat: {activeLevel.reqScore}%</span>
              <span className="text-white text-md text-center px-1 py-0.5 border-2 border-blue-300 ">Your Accuracy: {accuracy}%</span>
            </div>
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
                      clicked={clicked[rowIndex][colIndex]}
                      onClick={handleTileClick}
                    />
                  );
                })
              )}
            </div>
            <div className="text-center">
              <button
                onClick={resetGrid}
                className="px-6 py-2 shadow-sm shadow-blue text-white hover:scale-[0.975] transition-all duration-100"
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
