
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from engine import start_simulation, make_move, get_status

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use localhost/production domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InitRequest(BaseModel):
    size: int

class MoveRequest(BaseModel):
    index: int

@app.post("/api/init")
def init(req: InitRequest):
    grid = start_simulation(req.size)
    return {"grid": grid}

@app.post("/api/move")
def move(req: MoveRequest):
    return make_move(req.index)

@app.get("/api/status")
def status():
    return get_status()
