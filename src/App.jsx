import BingoCard from "./BingoCard.jsx";
import { bingoData } from "./bingoData.js";

export default function App() {
  return (
    <main className="app-shell">
      <header className="title-section">
        <p className="hero-kicker">GTGC Bingo</p>
        <h1>GTGC Bingo</h1>
      </header>

      <BingoCard data={bingoData} />
    </main>
  );
}
