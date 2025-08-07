'use client'

import { Level, levels, ILevel, loadData } from "../components/levels";


const Home = () => {
  loadData();
  return(
  <div className="bg-crust flex flex-col items-center justify-center min-h-screen">
    <div className="p-6 gap-2 bg-base flex flex-col justify-items-center w-md">  
      {levels.map(level => {
        return (
          
          <Level key={level.number} number={level.number} reqScore={level.reqScore} size={level.size} completed={level.completed} ></Level> 
          // <Level number={level.number} reqScore={level.reqScore} size={level.size} completed={level.completed} ></Level> 
        )
      })} 
    </div>

  </div>)
}

export default Home;
