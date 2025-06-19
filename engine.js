"use strict";
// Author: C. He
// Date: 06-11-2025
// Purpose: Game based on Simulation for Laser Powder Bed Fusion (LPBF)
// Converted to TypeScript
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.LPBFSimulation = exports.createLPBFGame = void 0;
// Matrix utility functions
var MatrixUtils = /** @class */ (function () {
    function MatrixUtils() {
    }
    MatrixUtils.zeros = function (rows, cols) {
        var matrix = [];
        for (var i = 0; i < rows; i++) {
            var row = [];
            for (var j = 0; j < cols; j++) {
                row.push(0);
            }
            matrix.push(row);
        }
        return matrix;
    };
    MatrixUtils.identity = function (size) {
        var matrix = this.zeros(size, size);
        for (var i = 0; i < size; i++) {
            matrix[i][i] = 1;
        }
        return matrix;
    };
    MatrixUtils.multiply = function (A, B) {
        var rowsA = A.length;
        var colsA = A[0].length;
        var colsB = B[0].length;
        var result = this.zeros(rowsA, colsB);
        for (var i = 0; i < rowsA; i++) {
            for (var j = 0; j < colsB; j++) {
                for (var k = 0; k < colsA; k++) {
                    result[i][j] += A[i][k] * B[k][j];
                }
            }
        }
        return result;
    };
    MatrixUtils.multiplyVector = function (A, v) {
        var rows = A.length;
        var result = [];
        for (var i = 0; i < rows; i++) {
            result[i] = 0;
            for (var j = 0; j < v.length; j++) {
                result[i] += A[i][j] * v[j];
            }
        }
        return result;
    };
    MatrixUtils.add = function (A, B) {
        var rows = A.length;
        var cols = A[0].length;
        var result = this.zeros(rows, cols);
        for (var i = 0; i < rows; i++) {
            for (var j = 0; j < cols; j++) {
                result[i][j] = A[i][j] + B[i][j];
            }
        }
        return result;
    };
    MatrixUtils.addVectors = function (a, b) {
        return a.map(function (val, idx) { return val + b[idx]; });
    };
    MatrixUtils.scale = function (A, scalar) {
        return A.map(function (row) { return row.map(function (val) { return val * scalar; }); });
    };
    MatrixUtils.transpose = function (A) {
        var rows = A.length;
        var cols = A[0].length;
        var result = this.zeros(cols, rows);
        for (var i = 0; i < rows; i++) {
            for (var j = 0; j < cols; j++) {
                result[j][i] = A[i][j];
            }
        }
        return result;
    };
    MatrixUtils.getColumn = function (A, colIndex) {
        return A.map(function (row) { return row[colIndex]; });
    };
    MatrixUtils.getDiagonal = function (A) {
        var size = Math.min(A.length, A[0].length);
        var result = [];
        for (var i = 0; i < size; i++) {
            result[i] = A[i][i];
        }
        return result;
    };
    return MatrixUtils;
}());
var LPBFSimulation = /** @class */ (function () {
    function LPBFSimulation(gameSize) {
        this.initializeParameters(gameSize);
        this.setupMatrices();
        this.initializeGameState();
    }
    LPBFSimulation.prototype.initializeParameters = function (gameSize) {
        var N = gameSize;
        var M = gameSize;
        // Define parameters
        var dx = 200e-6; // x-axis spacing [m]
        var kt = 24; // Conductivity [W/mK]
        var rho = 7800; // Density [kg/m^3]
        var Cp = 460; // Heat Capacity [J/kgK]
        var alpha = kt / (rho * Cp); // Diffusivity [m^2/s]
        var P = 180 * 0.37; // Laser power [W]
        var T_init = 293; // Initial Temperature [K]
        var T_a = 293; // Ambient Temperature [K]
        var T_m = 273 + 1427;
        var h = 20; // Convection coefficient [W/m^2K]
        var v_s = 0.6;
        var dt = dx / v_s / 1; // Sampling time [s]
        var L = N * dx;
        var F = (alpha * dt) / dx / dx;
        var G = (alpha * P * dt) / kt / dx / dx / dx;
        var H = (alpha * h * dt) / kt / dx;
        var n_s = dx / dt / v_s;
        this.params = {
            dx: dx,
            kt: kt,
            rho: rho,
            Cp: Cp,
            alpha: alpha,
            P: P,
            T_init: T_init,
            T_a: T_a,
            T_m: T_m,
            h: h,
            v_s: v_s,
            dt: dt,
            L: L,
            F: F,
            G: G,
            H: H,
            n_s: n_s
        };
        this.gameState = {
            gameSize: gameSize,
            N: N,
            M: M,
            T: [],
            T_2: [],
            subset: [],
            R_expert: [],
            R_2: [],
            currentStep: 0
        };
    };
    LPBFSimulation.prototype.createToeplitzMatrix = function (diagonals, size) {
        var matrix = MatrixUtils.zeros(size, size);
        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size; j++) {
                var diff = Math.abs(i - j);
                if (diff < diagonals.length) {
                    matrix[i][j] = diagonals[diff];
                }
            }
        }
        return matrix;
    };
    LPBFSimulation.prototype.setupMatrices = function () {
        var _a = this.gameState, N = _a.N, M = _a.M;
        var _b = this.params, F = _b.F, G = _b.G, H = _b.H, T_init = _b.T_init, T_a = _b.T_a;
        // Create simplified matrices for demonstration
        // In the original Python code, these involve complex sparse matrix operations
        var matrixSize = Math.pow((M * N), 2) + 2;
        // Initialize matrices
        this.A = MatrixUtils.identity(matrixSize);
        this.Bb = MatrixUtils.zeros(matrixSize, Math.pow(M, 2));
        this.Ab = MatrixUtils.identity(matrixSize);
        // Generate scanning patterns
        var setN1 = this.generateSetN1(N, M);
        var setN2 = this.generateSetN2(N, M);
        var setM = this.generateSetM(N, M);
        // Build control matrices (simplified)
        this.buildControlMatrices(setN1, setN2, setM, G, N, M);
        // Construct observation matrix
        this.Cb = this.constructObservationMatrix(M, N);
        // Initialize temperature vector
        this.Tm0 = [];
        for (var i = 0; i < Math.pow((M * N), 2); i++) {
            this.Tm0.push(T_init);
        }
        this.Tm0.push(T_a);
        this.Tm0.push(T_a);
        // Compute lambda matrices for optimization
        this.computeLambdaMatrices();
    };
    LPBFSimulation.prototype.generateSetN1 = function (N, M) {
        var setN1 = [];
        for (var i = 0; i < N; i++) {
            if (i % 2 === 0) {
                // Forward scan
                for (var j = 1; j <= N; j++) {
                    setN1.push(i * M * N + j);
                }
                // Reverse scan
                for (var j = N; j >= 1; j--) {
                    setN1.push((i + 1) * M * N + j);
                }
            }
        }
        return setN1;
    };
    LPBFSimulation.prototype.generateSetN2 = function (N, M) {
        var setN2 = [];
        for (var i = 1; i <= M; i += 2) {
            // Forward scan
            for (var j = 0; j < N; j++) {
                setN2.push(j * M * N + i);
            }
            // Reverse scan
            for (var j = N - 1; j >= 0; j--) {
                setN2.push(j * M * N + i + 1);
            }
        }
        return setN2;
    };
    LPBFSimulation.prototype.generateSetM = function (N, M) {
        var setM = [];
        for (var i = 0; i < M; i++) {
            for (var j = 0; j < M; j++) {
                setM.push(j * N + i * N * N * M + 1);
            }
        }
        return setM;
    };
    LPBFSimulation.prototype.buildControlMatrices = function (setN1, setN2, setM, G, N, M) {
        // Simplified matrix building process
        console.log("Building control matrices...");
        // In the original code, this involves iterative matrix multiplication
        // For simplicity, we'll create basic control matrices
        var matrixSize = Math.pow((M * N), 2) + 2;
        // Fill some basic values for demonstration
        for (var i = 0; i < matrixSize; i++) {
            for (var j = 0; j < Math.pow(M, 2); j++) {
                if (i < Math.pow((M * N), 2)) {
                    this.Bb[i][j] = G * Math.random() * 0.1; // Simplified random values
                }
            }
        }
    };
    LPBFSimulation.prototype.constructObservationMatrix = function (M, N) {
        var size = Math.pow((M * N), 2);
        var totalSize = size + 2;
        // Create observation matrix
        var matrix = MatrixUtils.zeros(totalSize, totalSize);
        // Fill identity part
        for (var i = 0; i < size; i++) {
            matrix[i][i] = 1;
            // Subtract 1/(M*M*N*N) for averaging
            for (var j = 0; j < size; j++) {
                matrix[i][j] -= 1 / (M * M * N * N);
            }
        }
        return matrix;
    };
    LPBFSimulation.prototype.computeLambdaMatrices = function () {
        // Compute lambda matrices for control optimization
        var BbT = MatrixUtils.transpose(this.Bb);
        var BbTCb = MatrixUtils.multiply(BbT, this.Cb);
        var BbTCbBb = MatrixUtils.multiply(BbTCb, this.Bb);
        // Extract diagonal
        this.lambda_0 = MatrixUtils.getDiagonal(BbTCbBb);
        // Compute lambda_1 = 2 * BbT * Cb * Ab
        var CbAb = MatrixUtils.multiply(this.Cb, this.Ab);
        var BbTCbAb = MatrixUtils.multiply(BbT, CbAb);
        this.lambda_1 = MatrixUtils.scale(BbTCbAb, 2);
    };
    LPBFSimulation.prototype.initializeGameState = function () {
        var _a = this.gameState, N = _a.N, M = _a.M;
        this.gameState.T = this.Tm0.slice();
        this.gameState.T_2 = this.Tm0.slice();
        // Create subset array [1, 2, 3, ..., M*N]
        this.gameState.subset = [];
        for (var i = 1; i <= M * N; i++) {
            this.gameState.subset.push(i);
        }
        this.gameState.currentStep = 0;
    };
    LPBFSimulation.prototype.getGameState = function () {
        return __assign({}, this.gameState);
    };
    LPBFSimulation.prototype.getUnscannedIslands = function () {
        return this.gameState.subset.slice();
    };
    LPBFSimulation.prototype.makeMove = function (selectedIndex) {
        var _a = this.gameState, subset = _a.subset, N = _a.N, M = _a.M;
        var T_m = this.params.T_m;
        // Check if selectedIndex is in subset
        var found = false;
        for (var i = 0; i < subset.length; i++) {
            if (subset[i] === selectedIndex) {
                found = true;
                break;
            }
        }
        if (!found) {
            return {
                success: false,
                message: "Invalid selection. Number not in unscanned islands."
            };
        }
        // Expert move (optimal choice)
        var c = this.computeOptimalChoice();
        var sortedIndices = this.sortIndicesByValue(c);
        var K = 0;
        var expertFound = false;
        while (!expertFound && K < sortedIndices.length) {
            var candidateIndex = sortedIndices[K] + 1;
            for (var i = 0; i < subset.length; i++) {
                if (subset[i] === candidateIndex) {
                    expertFound = true;
                    break;
                }
            }
            if (!expertFound)
                K++;
        }
        // Update expert solution
        this.gameState.T = this.updateTemperature(this.gameState.T, sortedIndices[K]);
        var expertNorm = this.computeNorm(this.gameState.T);
        this.gameState.R_expert.push(Math.sqrt(Math.pow(expertNorm, 2)) / T_m / M / N);
        // Update player solution
        var playerIndex = selectedIndex - 1;
        this.gameState.T_2 = this.updateTemperature(this.gameState.T_2, playerIndex);
        var playerNorm = this.computeNorm(this.gameState.T_2);
        this.gameState.R_2.push(Math.sqrt(Math.pow(playerNorm, 2)) / T_m / M / N);
        // Remove selected index from subset
        var newSubset = [];
        for (var i = 0; i < subset.length; i++) {
            if (subset[i] !== selectedIndex) {
                newSubset.push(subset[i]);
            }
        }
        this.gameState.subset = newSubset;
        this.gameState.currentStep++;
        // Calculate accuracy
        var expertMean = this.gameState.R_expert.reduce(function (a, b) { return a + b; }, 0) /
            this.gameState.R_expert.length;
        var playerMean = this.gameState.R_2.reduce(function (a, b) { return a + b; }, 0) / this.gameState.R_2.length;
        var accuracyScore = (expertMean / playerMean) * 100;
        return {
            success: true,
            message: "Move successful. Accuracy: ".concat(accuracyScore.toFixed(2), "%"),
            accuracyScore: accuracyScore
        };
    };
    LPBFSimulation.prototype.computeOptimalChoice = function () {
        // Compute optimal choice using lambda matrices
        var lambdaT = MatrixUtils.multiplyVector(this.lambda_1, this.gameState.T);
        var c = MatrixUtils.addVectors(this.lambda_0, lambdaT);
        return c;
    };
    LPBFSimulation.prototype.sortIndicesByValue = function (values) {
        return values
            .map(function (value, index) { return ({ value: value, index: index }); })
            .sort(function (a, b) { return a.value - b.value; })
            .map(function (item) { return item.index; });
    };
    LPBFSimulation.prototype.updateTemperature = function (T, controlIndex) {
        // Update temperature using control input
        var AbT = MatrixUtils.multiplyVector(this.Ab, T);
        var BbCol = MatrixUtils.getColumn(this.Bb, controlIndex);
        return MatrixUtils.addVectors(AbT, BbCol);
    };
    LPBFSimulation.prototype.computeNorm = function (T) {
        // Compute norm using observation matrix
        var CbT = MatrixUtils.multiplyVector(this.Cb, T);
        return Math.sqrt(CbT.reduce(function (sum, val) { return sum + val * val; }, 0));
    };
    LPBFSimulation.prototype.getCurrentTemperatureMap = function () {
        var _a = this.gameState, N = _a.N, M = _a.M;
        var tempData = this.gameState.T_2.slice(0, Math.pow((M * N), 2));
        // Reshape 1D array to 2D matrix
        var matrix = [];
        for (var i = 0; i < M * N; i += N) {
            matrix.push(tempData.slice(i, i + N));
        }
        return matrix;
    };
    LPBFSimulation.prototype.isGameComplete = function () {
        return this.gameState.subset.length === 0;
    };
    LPBFSimulation.prototype.getFinalAccuracy = function () {
        if (this.gameState.R_expert.length === 0 ||
            this.gameState.R_2.length === 0) {
            return 0;
        }
        var expertMean = this.gameState.R_expert.reduce(function (a, b) { return a + b; }, 0) /
            this.gameState.R_expert.length;
        var playerMean = this.gameState.R_2.reduce(function (a, b) { return a + b; }, 0) / this.gameState.R_2.length;
        return (expertMean / playerMean) * 100;
    };
    return LPBFSimulation;
}());
exports.LPBFSimulation = LPBFSimulation;
// Usage example
function createLPBFGame(gameSize) {
    if (gameSize < 3 || gameSize > 10) {
        throw new Error("Game size must be between 3 and 10");
    }
    return new LPBFSimulation(gameSize);
}
exports.createLPBFGame = createLPBFGame;
// Demo usage
console.log("=== LPBF Simulation Game Demo ===");
try {
    // Create a game with size 3 (smallest allowed)
    var game = createLPBFGame(3);
    console.log("Game created successfully!");
    console.log("Game size:", game.getGameState().gameSize);
    console.log("Initial unscanned islands:", game.getUnscannedIslands());
    // Make a few moves
    var moveCount = 0;
    while (!game.isGameComplete() && moveCount < 5) {
        var unscanned = game.getUnscannedIslands();
        console.log("\nMove ".concat(moveCount + 1, ":"));
        console.log("Available islands:", unscanned);
        // Pick the first available island
        var selectedIsland = unscanned[0];
        var result = game.makeMove(selectedIsland);
        console.log("Selected island: ".concat(selectedIsland));
        console.log("Result: ".concat(result.message));
        if (result.accuracyScore) {
            console.log("Current accuracy: ".concat(result.accuracyScore.toFixed(2), "%"));
        }
        moveCount++;
    }
    if (game.isGameComplete()) {
        console.log("\n=== Game Complete! ===");
        console.log("Final accuracy: ".concat(game.getFinalAccuracy().toFixed(2), "%"));
    }
    else {
        console.log("\n=== Demo stopped after ".concat(moveCount, " moves ==="));
        console.log("Remaining islands: ".concat(game.getUnscannedIslands().length));
    }
}
catch (error) {
    console.error("Error running simulation:", error);
}
console.log("\n=== Demo Complete ===");
