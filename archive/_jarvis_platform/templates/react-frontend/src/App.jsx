import { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🤖 JARVIS Frontend</h1>
        <p>Aplicación React creada por JARVIS MARK VII</p>
      </header>

      <main className="App-main">
        <div className="counter-section">
          <h2>Contador de Ejemplo</h2>
          <button onClick={() => setCount(count + 1)} className="counter-btn">
            Contador: {count}
          </button>
          <button onClick={() => setCount(0)} className="reset-btn">
            Resetear
          </button>
        </div>

        <div className="info-section">
          <p>Esta es una aplicación React + Vite generada automáticamente.</p>
          <p>Edita <code>src/App.jsx</code> para empezar a desarrollar.</p>
        </div>
      </main>

      <footer className="App-footer">
        <p>Generado con React + Vite por JARVIS</p>
        <p>⚡ {new Date().toLocaleDateString('es-ES')}</p>
      </footer>
    </div>
  );
}

export default App;
