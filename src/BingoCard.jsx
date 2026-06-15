import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "gtgc-bingo-state-v1";
const BOARD_SIZE = 5;
const CENTER_INDEX = 12;
const COLUMN_LABELS = ["B", "I", "N", "G", "O"];
const WINNING_LINES = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20]
];

const shuffle = (items) => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temp = next[index];
    next[index] = next[swapIndex];
    next[swapIndex] = temp;
  }
  return next;
};

const checkForWin = (marked) => WINNING_LINES.some((line) => line.every((index) => marked[index]));

const buildBoard = (payload, dataSignature) => {
  if (!payload || !Array.isArray(payload.entries)) {
    throw new Error("The bingo data is missing a valid entries array.");
  }

  if (payload.entries.length < 24) {
    throw new Error("Add at least 24 entries to src/bingoData.js to generate a card.");
  }

  const sample = shuffle(payload.entries).slice(0, 24);
  const cells = [];
  let sampleIndex = 0;

  for (let index = 0; index < BOARD_SIZE * BOARD_SIZE; index += 1) {
    if (index === CENTER_INDEX) {
      cells.push(payload.freeSpaceText || "FREE");
    } else {
      cells.push(sample[sampleIndex]);
      sampleIndex += 1;
    }
  }

  return {
    dataSignature,
    title: payload.title || "GTGC Bingo",
    cells,
    marked: Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => index === CENTER_INDEX),
    hasWon: false
  };
};

const readStoredState = (dataSignature) => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (parsed.dataSignature !== dataSignature) {
      return null;
    }

    if (!Array.isArray(parsed.cells) || parsed.cells.length !== BOARD_SIZE * BOARD_SIZE) {
      return null;
    }

    if (!Array.isArray(parsed.marked) || parsed.marked.length !== BOARD_SIZE * BOARD_SIZE) {
      return null;
    }

    return {
      title: typeof parsed.title === "string" ? parsed.title : "GTGC Bingo",
      cells: parsed.cells,
      marked: parsed.marked.map(Boolean),
      hasWon: Boolean(parsed.hasWon)
    };
  } catch {
    return null;
  }
};

const storeState = (state) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const clearState = () => {
  window.localStorage.removeItem(STORAGE_KEY);
};

export default function BingoCard({ data }) {
  const dataSignature = useMemo(
    () =>
      JSON.stringify({
        title: data?.title || "",
        freeSpaceText: data?.freeSpaceText || "",
        entries: Array.isArray(data?.entries) ? data.entries : []
      }),
    [data]
  );

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [title, setTitle] = useState("GTGC Bingo");
  const [cells, setCells] = useState([]);
  const [marked, setMarked] = useState([]);
  const [hasWon, setHasWon] = useState(false);
  const [justWon, setJustWon] = useState(false);
  const [showFin, setShowFin] = useState(false);

  useEffect(() => {
    setStatus("loading");
    setError("");
    setJustWon(false);
    setShowFin(false);

    const stored = readStoredState(dataSignature);
    if (stored) {
      setTitle(stored.title);
      setCells(stored.cells);
      setMarked(stored.marked);
      setHasWon(stored.hasWon);
      setShowFin(false);
      setStatus("ready");
      return;
    }

    try {
      const nextBoard = buildBoard(data, dataSignature);
      setTitle(nextBoard.title);
      setCells(nextBoard.cells);
      setMarked(nextBoard.marked);
      setHasWon(false);
      setShowFin(false);
      storeState(nextBoard);
      setStatus("ready");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load bingo data.");
      setStatus("error");
    }
  }, [data, dataSignature]);

  useEffect(() => {
    if (!justWon) {
      return undefined;
    }

    setShowFin(true);
    const timeoutId = window.setTimeout(() => {
      setShowFin(false);
      setJustWon(false);
    }, 4200);

    return () => window.clearTimeout(timeoutId);
  }, [justWon]);

  const handleToggle = (index) => {
    if (status !== "ready") {
      return;
    }

    const nextMarked = marked.map((value, currentIndex) => (currentIndex === index ? !value : value));
    const nextHasWon = checkForWin(nextMarked);
    const nextCelebrationState = hasWon || nextHasWon;

    setMarked(nextMarked);
    setHasWon(nextCelebrationState);
    setJustWon(nextHasWon && !hasWon);

    storeState({
      dataSignature,
      title,
      cells,
      marked: nextMarked,
      hasWon: nextCelebrationState
    });
  };

  const handleNewCard = () => {
    clearState();
    setHasWon(false);
    setJustWon(false);
    setShowFin(false);

    try {
      const nextBoard = buildBoard(data, dataSignature);
      setTitle(nextBoard.title);
      setCells(nextBoard.cells);
      setMarked(nextBoard.marked);
      storeState(nextBoard);
      setStatus("ready");
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load bingo data.");
      setStatus("error");
    }
  };

  const markedCount = marked.filter(Boolean).length;

  if (status === "loading") {
    return <div className="card-shell status-card">Generating your bingo card...</div>;
  }

  if (status === "error") {
    return <div className="card-shell status-card status-card-error">{error}</div>;
  }

  return (
    <div className="card-shell">
      <div className="card-header">
        <div>
          <div className="eyebrow">Randomized Card</div>
          <p className="supporting-copy">
            Tap any square to mark it. The first completed row, column, or diagonal triggers the finale.
          </p>
        </div>
        <button className="primary-button" type="button" onClick={handleNewCard}>
          New Card
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Marked Squares</div>
          <div className="stat-value">
            {markedCount}
            <span>/ 25</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Status</div>
          <div className={`status-pill ${hasWon ? "status-pill-won" : ""}`}>{hasWon ? "Bingo achieved" : "In progress"}</div>
        </div>
      </div>

      {showFin ? (
        <>
          <div className="fin-overlay">
            <div className="projector-glow" />
            <div className="scanlines" />
            <div className="fin-frame" />
            <div className={`fin-card ${justWon ? "fin-card-animate" : ""}`}>
              <div className={`fin-title ${justWon ? "fin-title-animate" : ""}`}>Fin.</div>
            </div>
          </div>
          {[
            { left: "16%", top: "22%", delay: "0s", color: "#f59e0b", colorSoft: "#fde68a", colorAlt: "#ef4444" },
            { left: "78%", top: "18%", delay: "0.18s", color: "#60a5fa", colorSoft: "#dbeafe", colorAlt: "#c084fc" },
            { left: "24%", top: "72%", delay: "0.34s", color: "#f87171", colorSoft: "#fee2e2", colorAlt: "#facc15" },
            { left: "84%", top: "70%", delay: "0.48s", color: "#c084fc", colorSoft: "#f3e8ff", colorAlt: "#60a5fa" },
            { left: "50%", top: "14%", delay: "0.64s", color: "#34d399", colorSoft: "#d1fae5", colorAlt: "#facc15" },
            { left: "10%", top: "50%", delay: "0.82s", color: "#fb7185", colorSoft: "#ffe4e6", colorAlt: "#f59e0b" },
            { left: "90%", top: "48%", delay: "0.96s", color: "#facc15", colorSoft: "#fef9c3", colorAlt: "#34d399" }
          ].map((firework, index) => (
            <span
              key={`${firework.left}-${firework.top}`}
              className="firework"
              style={{
                left: firework.left,
                top: firework.top,
                animationDelay: firework.delay,
                "--firework-color": firework.color,
                "--firework-soft": firework.colorSoft,
                "--firework-alt": firework.colorAlt,
                "--firework-size": `${108 + index * 16}px`
              }}
            >
              {Array.from({ length: 14 }, (_, sparkIndex) => (
                <span
                  key={sparkIndex}
                  className="firework-spark"
                  style={{
                    "--spark-angle": `${sparkIndex * (360 / 14)}deg`,
                    animationDelay: `${Number.parseFloat(firework.delay) + sparkIndex * 0.012}s`
                  }}
                />
              ))}
            </span>
          ))}
        </>
      ) : null}

      <div className="column-labels" aria-hidden="true">
        {COLUMN_LABELS.map((label) => (
          <div key={label} className="column-label">
            {label}
          </div>
        ))}
      </div>

      <div className="board-grid">
        {cells.map((cell, index) => {
          const isMarked = marked[index];
          const isFree = index === CENTER_INDEX;

          return (
            <button
              key={`${cell}-${index}`}
              type="button"
              aria-pressed={isMarked}
              aria-label={`${COLUMN_LABELS[index % BOARD_SIZE]}${Math.floor(index / BOARD_SIZE) + 1}: ${cell}`}
              className={`board-cell ${isMarked ? "board-cell-marked" : ""} ${isFree ? "board-cell-free" : ""}`}
              onClick={() => handleToggle(index)}
            >
              <span className="cell-coordinate">
                {COLUMN_LABELS[index % BOARD_SIZE]}
                {Math.floor(index / BOARD_SIZE) + 1}
              </span>
              <span className="cell-text">{cell}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
