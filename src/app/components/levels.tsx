'use client'
import { useRouter } from "next/navigation";
import { BrowserRouter, Link } from "react-router";

export interface ILevel {
    number: number,
    reqScore: number,
    size: number,
    completed: boolean
}


export const Level: React.FC<ILevel> = ({
  number,
  reqScore,
  size,
  completed
}) => 
{
    const router = useRouter();

    const handleNavigation = () => {
        router.push(`/`)
    }
  return (
    <button className={` text-md text-center px-1 py-0.5 border-2 border-blue-300 hover:scale-105 transition-transform duration-100 hover:active:opacity-75 ${completed ? "bg bg-green-300 text-black" : "text-white"}`} 
        onClick={e => {saveGame(number);handleNavigation()}}
        >
        Level {number} {"("+size+"x"+size+")"} - Score To Beat: {reqScore}%
    </button>
  );
};

export const saveGame = (active: number) => {
    
    if (localStorage.getItem("savedata")==null){
        createSaveData(active);
    }
    else{
        updateActiveLvl(active);
    }
}

const createSaveData = (activeLvl: number) => {
    var completed : boolean[] = new Array(levels.length);
    for (let i = 0; i < levels.length; i++) {
        completed[i] = levels[i].completed;
    }
    
    localStorage.setItem("savedata", JSON.stringify({active: activeLvl, completed}))
}

const updateActiveLvl = (activeLvl: number) => {
    
    const saved = localStorage.getItem("savedata");
    const savedata = JSON.parse(saved!);
    
    localStorage.setItem("savedata", JSON.stringify({active: activeLvl, completed: savedata.completed}))
}

export const updateLvlStatus = (level: number) => {
    
    const saved = localStorage.getItem("savedata");
    const savedata = JSON.parse(saved!);
    var completed = savedata.completed;
    completed[level-1] = true;
    levels[level-1].completed = true;
    
    localStorage.setItem("savedata", JSON.stringify({active: savedata.active, completed}))
}

export const loadData = () => {
    if (localStorage.getItem("savedata")!=null){
        const saved = localStorage.getItem("savedata");
        const savedata = JSON.parse(saved!);
        var completed = savedata.completed;
        for (let i = 0; i < levels.length; i++) {
            levels[i].completed = completed[i];
        }
    }
}

export const getLevel = (num: number) => {
    return levels[num-1];
}

export const levels : ILevel[] = [
    {number:1, reqScore:5, size:3, completed:false},
    {number:2, reqScore:8, size:4, completed:false},
    {number:3, reqScore:10, size:4, completed:false},
    {number:4, reqScore:12, size:5, completed:false},
    {number:5, reqScore:15, size:5, completed:false}
  ]