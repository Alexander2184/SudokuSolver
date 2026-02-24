import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { sudokuExperiment, solveBoard } from './annealing.js';



const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


sudokuExperiment();


function App() {
  const [board, setBoard] = useState(
    Array(9).fill().map(() => Array(9).fill(''))
  );

  const handleCellChange = (row, col, value) => {
    if (value === '' || /^[1-9]$/.test(value)) {
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = value;
      setBoard(newBoard);
    }
  };

  const handleKeyDown = (row, col, e) => {
    if (e.key === ' ' && board[row][col] !== '') {
      e.preventDefault();
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = '';
      setBoard(newBoard);
    }
  };

  const printSolution = () => {
    const testFormat = board.map(row =>
      row.map(cell => cell === '' ? '-' : cell).join('')
    );
    const res = solveBoard(testFormat)
    if (res == null) {
        window.alert("Решение не найдено. Возможно, введенная доска не имеет решений");
    } else {
        loadBoard(res);
    }

  };

  const renderCell = (row, col) => {
    const cellValue = board[row][col];

    return (
      <input
        key={`${row}-${col}`}
        type="text"
        className="sudoku-cell"
        value={cellValue}
        onChange={(e) => handleCellChange(row, col, e.target.value)}
        onKeyDown={(e) => handleKeyDown(row, col, e)}
        maxLength={1}
        inputMode="numeric"
        pattern="[1-9]*"
      />
    );
  };

  const clearBoard = () => {
    setBoard(Array(9).fill().map(() => Array(9).fill('')));
  };

  const loadBoard = (board) => {
    const newBoard = board.map(row =>
      row.split('').map(cell => cell === '-' ? '' : cell)
    );
    setBoard(newBoard);
  };

  const exampleTestBoard = [
    "4--8-2--7",
    "-18-453--",
    "7---9---4",
    "-31--467-",
    "--9-578-1",
    "82----54-",
    "9---78---",
    "-7--6192-",
    "-85-2-7--"
  ];

  return (
    <div className="App">
      <header className="app-header">
        <h1>🎮 Редактор судоку</h1>
        <p>Введите цифры 1-9 | Пробел - очистить ячейку</p>
      </header>

      <main>

        <div className="sudoku-container">
          <div className="sudoku-board">
            {board.map((row, rowIndex) => (
              <div key={rowIndex} className="sudoku-row">
                {row.map((_, colIndex) => renderCell(rowIndex, colIndex))}
              </div>
            ))}
          </div>
        </div>

        <div className="control-panel">
          <button
            className="btn btn-primary"
            onClick={printSolution}
          >
            📋 Решить доску судоку
          </button>

          <button
            className="btn btn-secondary"
            onClick={clearBoard}
          >
            🗑️ Очистить доску
          </button>

          <button
            className="btn btn-success"
            onClick={() => loadBoard(exampleTestBoard)}
          >
            📂 Загрузить пример
          </button>
        </div>

      </main>
    </div>
  );
}
