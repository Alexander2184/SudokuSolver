// Abstract class for annealing
class AbstractAnnealModel {
    evaluate() {
        throw new Error("Method 'evaluate()' must be implemented");
    }

    revertableChange(args = null) {
        throw new Error("Method 'revertableChange()' must be implemented");
    }

    abortLastChange() {
        throw new Error("Method 'abortLastChange()' must be implemented");
    }

    getParams() {
        throw new Error("Method 'getParams()' must be implemented");
    }
}

function randint(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

class SudokuAnnealModel extends AbstractAnnealModel {
    constructor(board) {
        super();
        this.sqSize = 3;
        this.badness = null;
        this.lastChange = null;
        this.board = [];
        this.fixed = [];
        this.freeCells = [];

        for (let i = 0; i < Math.pow(this.sqSize, 2); i++) {
            const boardLine = [];
            const fixedLine = [];
            const freeLine = [];

            for (let j = 0; j < Math.pow(this.sqSize, 2); j++) {
                const cell = board[i][j];
                if (cell === '-') {
                    boardLine.push(-1);
                    fixedLine.push(false);
                    freeLine.push(j);
                } else {
                    const cellInteger = parseInt(cell, 10);
                    boardLine.push(cellInteger);
                    fixedLine.push(true);
                }
            }

            this.board.push(boardLine);
            this.fixed.push(fixedLine);
            this.freeCells.push(freeLine);
        }

        this.fillIn();
        this.trueEvaluate();
    }

    fillIn() {
        for (let i = 0; i < Math.pow(this.sqSize, 2); i++) {
            const lineNumbers = new Set();
            for (let j = 0; j < Math.pow(this.sqSize, 2); j++) {
                const cell = this.board[i][j];
                if (cell !== -1) {
                    lineNumbers.add(cell);
                }
            }

            let iter = 1;
            for (let j = 0; j < Math.pow(this.sqSize, 2); j++) {
                if (this.board[i][j] === -1) {
                    while (lineNumbers.has(iter)) {
                        iter++;
                    }
                    this.board[i][j] = iter;
                    iter++;
                }
            }
        }
    }

    trueEvaluate() {
        let badness = 0;
        for (let i = 0; i < Math.pow(this.sqSize, 2); i++) {
            badness += this.getRowBadness(i);
        }

        for (let i = 0; i < this.sqSize; i++) {
            for (let j = 0; j < this.sqSize; j++) {
                badness += this.getSquareBadness(i, j);
            }
        }

        this.badness = badness;
    }

    evaluate() {
        return this.badness;
    }

    getRowBadness(rowNum) {
        let badness = Math.pow(this.sqSize, 2);
        const squareNumbers = new Array(9).fill(0);

        for (let i = 0; i < Math.pow(this.sqSize, 2); i++) {
            const cell = this.board[i][rowNum];
            if (squareNumbers[cell - 1] === 0) {
                badness -= 1;
            }
            squareNumbers[cell - 1] = 1;
        }

        return badness;
    }

    getSquareBadness(i, j) {
        let badness = Math.pow(this.sqSize, 2);
        const squareNumbers = new Array(9).fill(0);

        for (let k = 0; k < this.sqSize; k++) {
            for (let l = 0; l < this.sqSize; l++) {
                const cell = this.board[i * this.sqSize + k][j * this.sqSize + l];
                if (squareNumbers[cell - 1] === 0) {
                    badness -= 1;
                }
                squareNumbers[cell - 1] = 1;
            }
        }

        return badness;
    }

    makeChange(change) {
        const rowNum = change[0];
        const firstIdx = change[1];
        const secondIdx = change[2];

        const firstRowBadness = this.getRowBadness(firstIdx);
        const secondRowBadness = this.getRowBadness(secondIdx);
        const firstSqBadness = this.getSquareBadness(Math.floor(rowNum / 3), Math.floor(firstIdx / 3));
        const secondSqBadness = this.getSquareBadness(Math.floor(rowNum / 3), Math.floor(secondIdx / 3));

        const temp = this.board[rowNum][firstIdx];
        this.board[rowNum][firstIdx] = this.board[rowNum][secondIdx];
        this.board[rowNum][secondIdx] = temp;

        const newFirstRowBadness = this.getRowBadness(firstIdx);
        const newSecondRowBadness = this.getRowBadness(secondIdx);
        const newFirstSqBadness = this.getSquareBadness(Math.floor(rowNum / 3), Math.floor(firstIdx / 3));
        const newSecondSqBadness = this.getSquareBadness(Math.floor(rowNum / 3), Math.floor(secondIdx / 3));

        this.badness += (newFirstRowBadness - firstRowBadness);
        this.badness += (newSecondRowBadness - secondRowBadness);
        this.badness += (newFirstSqBadness - firstSqBadness);
        this.badness += (newSecondSqBadness - secondSqBadness);

        this.lastChange = change;
    }

    revertableChange(args = null) {
        let rowNum = randint(0, Math.pow(this.sqSize, 2) - 1);
        while (this.freeCells[rowNum].length < 2) {
            rowNum = randint(0, Math.pow(this.sqSize, 2) - 1);
        }

        const firstPos = randint(0, this.freeCells[rowNum].length - 1);
        let secondPos = randint(0, this.freeCells[rowNum].length - 1);
        while (firstPos === secondPos) {
            secondPos = randint(0, this.freeCells[rowNum].length - 1);
        }

        this.makeChange([rowNum, this.freeCells[rowNum][firstPos], this.freeCells[rowNum][secondPos]]);
    }

    abortLastChange() {
        if (this.lastChange === null) {
            throw new Error("No change was made to undo");
        }
        this.makeChange(this.lastChange);
        this.lastChange = null;
    }

    getParams() {
        return this.board;
    }

    getHash() {
        let hsh = 0;
        for (let i = 0; i < Math.pow(this.sqSize, 2); i++) {
            for (let j = 0; j < Math.pow(this.sqSize, 2); j++) {
                const cell = this.board[i][j];
                hsh *= 13523;
                hsh += cell;
                hsh = hsh % 998244353;
            }
        }
        return hsh;
    }
}

function exponentTempConstructor(a, b, skip = 0) {
    return (i) => b * Math.exp(-(i + skip) * a);
}

function hyperbolicTempConstructor(a, skip = 0) {
    return (i) => a * (1 / (i + skip));
}

function randN1_1() {
    return 2 * Math.random() - 1;
}

function hyperbChangeAttrsConstructor(a, skip = 0) {
    return (i) => [a * randN1_1() / (i + skip), a * randN1_1() / (i + skip)];
}

function halfHypAttrsConstructor(a, skip = 0) {
    return (i) => [a * randN1_1() / Math.sqrt(i + skip), a * randN1_1() / Math.sqrt(i + skip)];
}

function constChangeAttrsConstructor(a, skip = 0) {
    return (i) => [a * randN1_1(), a * randN1_1()];
}

function expChangeAttrsConstructor(a, b, skip = 0) {
    return (i) => [a * randN1_1() * Math.exp(-(i + skip) * b), a * randN1_1() * Math.exp(-(i + skip) * b)];
}

function defaultToleranceFunc(change, temperature) {
    return Math.exp(-change / temperature);
}

function discreteToleranceFunc(change, temperature) {
    return temperature;
}

const maps = new Map();

function simulateAnnealing(annealingModel, temperatureFunc, changeAttrsFunc, iterations,
                          toleranceFunc = discreteToleranceFunc, sudoku = false) {

    for (let i = 1; i <= iterations; i++) {

        if (annealingModel.evaluate() === 0 && sudoku) {
            console.log("Finished successfully, took iterations: " + i);
            break;
        }

        let beforeResult = annealingModel.evaluate();
        if (sudoku) {
            const hash = annealingModel.getHash();
            if (!maps.has(hash)) {
                maps.set(hash, 0);
            }
            beforeResult = beforeResult + maps.get(hash) / 10000;
        }

        annealingModel.revertableChange(changeAttrsFunc(i));

        let afterResult = annealingModel.evaluate();
        if (sudoku) {
            const hash = annealingModel.getHash();
            if (!maps.has(hash)) {
                maps.set(hash, 0);
            }
            afterResult = afterResult + maps.get(hash) / 10000;
        }

        if (beforeResult >= afterResult) {

        } else if (Math.random() < toleranceFunc(afterResult - beforeResult, temperatureFunc(i))) {

        } else {
            annealingModel.abortLastChange();
        }

        if (sudoku) {
            const hash = annealingModel.getHash();
            maps.set(hash, (maps.get(hash) || 0) + 1);
        }
    }

    return annealingModel.getParams().map(row => [...row]);
}

const easySudokuTests = [
    [
        "4--8-2--7",
        "-18-453--",
        "7---9---4",
        "-31--467-",
        "--9-578-1",
        "82----54-",
        "9---78---",
        "-7--6192-",
        "-85-2-7--"
    ],

    [
        "9--3---71",
        "4378--25-",
        "--5-2--49",
        "-584-9-3-",
        "7--1---98",
        "29--3---4",
        "-8--13---",
        "3-4687---",
        "1--25----"
    ]
];

const hardSudokuTests = [
    [
        "1----32--",
        "3------51",
        "----1-7--",
        "-1-6-2-94",
        "-9-8----7",
        "-72---1-3",
        "-3---49--",
        "-8----4--",
        "4-9-5--82"
    ],

    [
        "-2918--6-",
        "5-------8",
        "37---2---",
        "--76---31",
        "-----1---",
        "--3827-49",
        "--24-6-5-",
        "--------6",
        "1--7---84"
    ]
];

const epicSudokuTests = [
    [
        "4---125-3",
        "--8-7----",
        "-------1-",
        "6------9-",
        "-7--2-1-6",
        "-----1-4-",
        "-4-3-----",
        "3----56-2",
        "--------9"
    ],

    [
        "---2----1",
        "-28---9--",
        "----5-3--",
        "4--3---5-",
        "7--------",
        "-1-----47",
        "---574---",
        "9-1--3---",
        "--6--1---"
    ]
];

const funSudokuTests = [
    [
        "---------",
        "---------",
        "---------",
        "---------",
        "---------",
        "---------",
        "---------",
        "---------",
        "---------"
    ]
];

function convertBoardToStringArray(board) {
    return board.map(row => row.split(''));
}

function printBoard(board) {
    console.log('┌───────┬───────┬───────┐');
    for (let i = 0; i < 9; i++) {
        if (i > 0 && i % 3 === 0) {
            console.log('├───────┼───────┼───────┤');
        }

        let rowStr = '│ ';
        for (let j = 0; j < 9; j++) {
            if (j > 0 && j % 3 === 0) {
                rowStr += '│ ';
            }
            const cell = board[i][j];
            rowStr += (cell === -1 || cell === '-') ? '. ' : cell + ' ';
        }
        rowStr += '│';
        console.log(rowStr);
    }
    console.log('└───────┴───────┴───────┘');
}

function formatBoard(board) {
    const formatted = [];
    for (let i = 0; i < 9; i++) {
        const row = [];
        for (let j = 0; j < 9; j++) {
            const cell = board[i][j];
            row.push(cell === -1 ? '-' : cell.toString());
        }
        formatted.push(row.join(''));
    }
    return formatted;
}

export function sudokuExperiment(testIndex = 1, testType = 'hard') {



    let testBoard;
    switch(testType) {
        case 'easy':
            testBoard = easySudokuTests[testIndex];
            break;
        case 'hard':
            testBoard = hardSudokuTests[testIndex];
            break;
        case 'epic':
            testBoard = epicSudokuTests[testIndex];
            break;
        case 'fun':
            testBoard = funSudokuTests[0];
            break;
        default:
            testBoard = easySudokuTests[0];
    }

    return solveBoard(testBoard);
}

export function generateSudokuBoard() {
    return solveBoard(funSudokuTests[0]);
}


export function solveBoard(testBoard) {

    console.log('Исходная доска:');
    printBoard(testBoard.map(row => row.split('').map(c => c === '-' ? -1 : parseInt(c))));
    console.log('');

    const model = new SudokuAnnealModel(testBoard);


    const temperatureFunc = hyperbolicTempConstructor(1000, 1000);
    const changeAttrsFunc = constChangeAttrsConstructor(1);

    const iterations = 10000000;
    let successIteration = -1;

    for (let attempt = 0; attempt < 10; attempt++) {
        console.log(`Попытка ${attempt + 1}...`);

        const result = simulateAnnealing(
            model,
            temperatureFunc,
            changeAttrsFunc,
            iterations,
            discreteToleranceFunc,
            true
        );

        if (model.evaluate() === 0) {
            successIteration = attempt;
            console.log(`✅ Успех на попытке ${attempt + 1}!`);

            const finalBoard = result;
            console.log('\nРешенная доска:');
            printBoard(finalBoard);

            console.log('\nПроверка решения:');
            validateSudoku(finalBoard);

            console.log(formatBoard(finalBoard));
            return formatBoard(finalBoard);
            break;
        }

        maps.clear();
    }

    if (successIteration === -1) {
        console.log('❌ Не удалось решить судоку за 10 попыток');
        console.log(`Последнее значение "плохости": ${model.evaluate()}`);

        const finalBoard = model.getParams();
        console.log('\nЛучшее найденное решение:');
        printBoard(finalBoard);
    }

    return null;
}


function validateSudoku(board) {
    let isValid = true;
    const size = 9;
    const boxSize = 3;

    for (let i = 0; i < size; i++) {
        const row = new Set();
        for (let j = 0; j < size; j++) {
            const cell = board[i][j];
            if (cell === -1) {
                console.log(`❌ Пустая клетка в [${i},${j}]`);
                isValid = false;
            } else if (row.has(cell)) {
                console.log(`❌ Дубликат в строке ${i + 1}: число ${cell}`);
                isValid = false;
            }
            row.add(cell);
        }
    }

    for (let j = 0; j < size; j++) {
        const col = new Set();
        for (let i = 0; i < size; i++) {
            const cell = board[i][j];
            if (col.has(cell)) {
                console.log(`❌ Дубликат в колонке ${j + 1}: число ${cell}`);
                isValid = false;
            }
            col.add(cell);
        }
    }

    for (let box = 0; box < size; box++) {
        const boxSet = new Set();
        const startRow = Math.floor(box / boxSize) * boxSize;
        const startCol = (box % boxSize) * boxSize;

        for (let i = 0; i < boxSize; i++) {
            for (let j = 0; j < boxSize; j++) {
                const cell = board[startRow + i][startCol + j];
                if (boxSet.has(cell)) {
                    console.log(`❌ Дубликат в квадрате ${box + 1}: число ${cell}`);
                    isValid = false;
                }
                boxSet.add(cell);
            }
        }
    }

    if (isValid) {
        console.log('✅ Судоку решено правильно!');
    }

    return isValid;
}