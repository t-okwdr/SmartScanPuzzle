import numpy as np
from scipy.sparse import eye, kron, diags, csc_matrix, hstack, vstack, lil_matrix
from scipy.linalg import toeplitz

simulation = None

def start_simulation(size: int):
    global simulation
    simulation = LPBFSimulation(size)
    return simulation.get_current_map()

def make_move(index: int):
    global simulation
    if simulation is None:
        return {"success": False, "message": "No active simulation"}
    return simulation.make_move(index)

def get_status():
    global simulation
    if simulation is None:
        return {}
    return {
        "temperatureMap": simulation.get_current_map(),
        "complete": simulation.is_complete(),
        "accuracy": simulation.get_accuracy()
    }

class LPBFSimulation:
    def __init__(self, size: int):
        self.N = size
        self.M = size

        dx = 200e-6
        kt = 24
        rho = 7800
        Cp = 460
        alpha = kt / (rho * Cp)
        P = 180 * 0.37
        self.T_init = 293
        self.T_a = 293
        self.T_m = 273 + 1427
        h = 20
        v_s = 0.6
        dt = dx / v_s / 1

        L = self.N * dx

        F = alpha * dt / dx / dx
        G = alpha * P * dt / kt / dx / dx / dx
        H = alpha * h * dt / kt / dx

        # Construct A matrix
        diagonals = np.array([-2*F] + [F] + [0]*(self.M*self.N-2))
        Ax1 = csc_matrix(toeplitz(diagonals))
        Ax1[0, 0] = -F
        Ax1[self.M * self.N - 1, self.M * self.N - 1] = -F
        Ax = kron(eye(self.M * self.N, format='csc'), Ax1)
        Ay = kron(Ax1, eye(self.M * self.N, format='csc'))
        A = Ax + Ay + eye((self.M * self.N) ** 2, format='csc')
        A = A - H * eye((self.M * self.N) ** 2, format='csc')

        horizontal_stack = hstack([
            A - 0 * F * eye((self.M * self.N) ** 2, format='csc'),
            0 * F * np.ones(((self.M * self.N) ** 2, 1)),
            H * np.ones(((self.M * self.N) ** 2, 1))
        ])
        bottom_part = hstack([
            np.zeros((2, (self.M * self.N) ** 2)),
            eye(2, format='csc')
        ])
        A = vstack([horizontal_stack, bottom_part]).tocsc()

        self.Ab = eye((self.M * self.N) ** 2 + 2, format='csc')
        self.Bb = lil_matrix(((self.M * self.N) ** 2 + 2, self.M ** 2))

        setN1 = []
        for i in range(0, self.N):
            if i % 2 == 0:
                setN1.extend([i * self.M * self.N + j for j in range(1, self.N + 1)])
                setN1.extend([(i + 1) * self.M * self.N + j for j in range(self.N, 0, -1)])

        setN2 = []
        for i in range(1, self.M+1, 2):
            setN2.extend([(j * self.M * self.N + i) for j in range(self.N)])
            setN2.extend([(j * self.M * self.N + i + 1) for j in range(self.N - 1, -1, -1)])

        setM = []
        for i in range(self.M):
            setM.extend([j * self.N + i * self.N * self.N * self.M + 1 for j in range(self.M)])

        pointer = 1
        for i in range(1, self.N ** 2 + 1):
            self.Bb[:, 0:self.M ** 2:2] += G * self.Ab[:, np.array(setM[0:self.M ** 2:2]) + np.array(setN1[self.N ** 2 - pointer]) - 1]
            self.Bb[:, 1:self.M ** 2:2] += G * self.Ab[:, np.array(setM[1:self.M ** 2:2]) + np.array(setN2[self.N ** 2 - pointer]) - 1]
            self.Ab = self.Ab @ A
            pointer += 1

        self.Bb = self.Bb.tocsc()

        self.Cb = csc_matrix(np.block([
            [np.eye((self.M * self.N) ** 2) - np.ones(((self.M * self.N) ** 2, (self.M * self.N) ** 2)) / (self.M * self.M * self.N * self.N), np.zeros(((self.M * self.N) ** 2, 2))],
            [np.zeros((2, (self.M * self.N) ** 2 + 2))]
        ]))

        self.T = np.concatenate([self.T_init * np.ones((self.M * self.N) ** 2), [self.T_a, self.T_a]])
        self.clicked = set()

    def make_move(self, index: int):
        if index in self.clicked:
            return {"success": False, "message": "Tile already selected"}
        if index < 1 or index > self.N * self.M:
            return {"success": False, "message": "Invalid tile index"}

        self.T = self.Ab @ self.T + self.Bb[:, index - 1].toarray().flatten()
        self.clicked.add(index)
        
        return {"success": True, "message": "Move accepted"}

    def get_current_map(self):
        # Extract and reshape the main temperature field (T_2 equivalent)
        full_grid = self.T[: (self.M * self.N) ** 2].reshape((self.M * self.N, self.M * self.N))
        
        # Downsample to N x N by averaging N x N blocks
        chunk_size = self.N
        downsampled = np.zeros((self.N, self.N))

        for i in range(self.N):
            for j in range(self.N):
                block = full_grid[
                    i * chunk_size : (i + 1) * chunk_size,
                    j * chunk_size : (j + 1) * chunk_size
                ]
                downsampled[i, j] = block.mean()

        return downsampled.tolist()

    def is_complete(self):
        return len(self.clicked) >= self.N * self.M

    def get_accuracy(self):
        return float(np.sqrt(np.linalg.norm(self.Cb @ self.T) ** 2) / self.T_m / self.M / self.N)
