export const BingoCard = ({ data }) => {
  const storageKey = "gtgc-bingo-state-v1";
  const boardSize = 5;
  const centerIndex = 12;
  const columnLabels = ["B", "I", "N", "G", "O"];
  const winningLines = [
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
  const dataSignature = JSON.stringify({
    title: data?.title || "",
    freeSpaceText: data?.freeSpaceText || "",
    entries: Array.isArray(data?.entries) ? data.entries : []
  });

  const readStoredState = () => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      if (parsed.dataSignature !== dataSignature) {
        return null;
      }

      if (!Array.isArray(parsed.cells) || parsed.cells.length !== boardSize * boardSize) {
        return null;
      }

      if (!Array.isArray(parsed.marked) || parsed.marked.length !== boardSize * boardSize) {
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
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(state));
  };

  const clearState = () => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(storageKey);
  };

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

  const buildBoard = (payload) => {
    if (!payload || !Array.isArray(payload.entries)) {
      throw new Error("The bingo data is missing a valid entries array.");
    }

    if (payload.entries.length < 24) {
      throw new Error("Add at least 24 entries to snippets/bingo-data.jsx to generate a card.");
    }

    const sample = shuffle(payload.entries).slice(0, 24);
    const cells = [];
    let sampleIndex = 0;

    for (let index = 0; index < boardSize * boardSize; index += 1) {
      if (index === centerIndex) {
        cells.push(payload.freeSpaceText || "FREE");
      } else {
        cells.push(sample[sampleIndex]);
        sampleIndex += 1;
      }
    }

    const marked = Array.from({ length: boardSize * boardSize }, (_, index) => index === centerIndex);

    return {
      dataSignature,
      title: payload.title || "GTGC Bingo",
      cells,
      marked,
      hasWon: false
    };
  };

  const checkForWin = (marked) => winningLines.some((line) => line.every((index) => marked[index]));
  const getMarkedCount = (marked) => marked.filter(Boolean).length;

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [title, setTitle] = useState("GTGC Bingo");
  const [cells, setCells] = useState([]);
  const [marked, setMarked] = useState([]);
  const [hasWon, setHasWon] = useState(false);
  const [justWon, setJustWon] = useState(false);
  const markedCount = getMarkedCount(marked);

  const loadBoard = (forceNew) => {
    setStatus("loading");
    setError("");
    setJustWon(false);

    if (!forceNew) {
      const stored = readStoredState();
      if (stored) {
        setTitle(stored.title);
        setCells(stored.cells);
        setMarked(stored.marked);
        setHasWon(stored.hasWon);
        setStatus("ready");
        return;
      }
    }

    try {
      const nextBoard = buildBoard(data);
      setTitle(nextBoard.title);
      setCells(nextBoard.cells);
      setMarked(nextBoard.marked);
      setHasWon(false);
      storeState(nextBoard);
      setStatus("ready");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load bingo data.");
      setStatus("error");
    }
  };

  useEffect(() => {
    loadBoard(false);
  }, [data]);

  const toggleCell = (index) => {
    if (status !== "ready") {
      return;
    }

    const nextMarked = marked.map((value, currentIndex) => {
      if (currentIndex !== index) {
        return value;
      }

      return !value;
    });

    const nextHasWon = checkForWin(nextMarked);
    const shouldCelebrate = nextHasWon && !hasWon;
    const nextCelebrationState = hasWon || nextHasWon;

    setMarked(nextMarked);
    setHasWon(nextCelebrationState);
    setJustWon(shouldCelebrate);

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
    loadBoard(true);
  };

  if (status === "loading") {
    return <div className="not-prose rounded-3xl border border-zinc-200 bg-white/70 p-6 text-sm text-zinc-600 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300">Generating your bingo card...</div>;
  }

  if (status === "error") {
    return <div className="not-prose rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">{error}</div>;
  }

  return <div className="not-prose relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-4 shadow-sm dark:border-white/10 dark:from-zinc-950 dark:to-zinc-900 sm:p-6">
      <style>{`
        @keyframes bingo-pop {
          0% { opacity: 0; transform: scale(0.96); }
          22% { opacity: 1; transform: scale(1.02); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes bingo-confetti {
          0% { transform: translateY(-10%) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(420px) rotate(540deg); opacity: 0; }
        }

        @keyframes fin-flicker {
          0%, 18%, 22%, 62%, 66%, 100% { opacity: 1; }
          20%, 64% { opacity: 0.82; }
        }

        @keyframes fin-reveal {
          0% { opacity: 0; transform: translateY(18px) scale(0.94); letter-spacing: 0.18em; }
          100% { opacity: 1; transform: translateY(0) scale(1); letter-spacing: 0.12em; }
        }

        @keyframes projector-pulse {
          0% { opacity: 0; transform: scale(0.94); }
          35% { opacity: 0.55; transform: scale(1); }
          100% { opacity: 0.25; transform: scale(1.04); }
        }

        @keyframes fin-vignette {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>

      {hasWon ? <>
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden rounded-3xl bg-zinc-950/78 text-amber-50" style={{ animation: "fin-vignette 0.45s ease-out forwards" }}>
            <div className="absolute inset-0" style={{
          animation: "projector-pulse 1.8s ease-out forwards",
          background: "radial-gradient(circle at center, rgba(255,245,214,0.16), rgba(9,9,11,0.02) 34%, rgba(9,9,11,0.82) 100%)"
        }} />
            <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 4px)",
          backgroundSize: "100% 4px"
        }} />
            <div className="absolute inset-3 rounded-3xl border border-amber-100/12" />
            <div className="relative rounded-3xl bg-amber-50/88 px-8 py-10 text-center" style={{
          animation: justWon ? "bingo-pop 0.8s ease-out forwards, fin-flicker 2.4s steps(2, end) forwards" : "none",
          boxShadow: "0 18px 60px rgba(0, 0, 0, 0.35)"
        }}>
              <div className="mb-3 text-xs uppercase text-amber-100/70" style={{ letterSpacing: "0.45em" }}>
                The End
              </div>
              <div className="font-serif text-5xl italic text-zinc-950 sm:text-7xl" style={{
            animation: justWon ? "fin-reveal 0.85s ease-out 0.08s both" : "none",
            textShadow: "0 2px 10px rgba(255, 255, 255, 0.2)"
          }}>
                Fin.
              </div>
            </div>
          </div>
          {Array.from({ length: 54 }, (_, index) => <span key={index} className="pointer-events-none absolute top-0 z-10 rounded-full" style={{
        left: `${1 + index * 1.85}%`,
        width: `${4 + (index % 2) * 2}px`,
        height: `${8 + (index % 3) * 3}px`,
        backgroundColor: ["#f3f4f6", "#f59e0b", "#ef4444", "#fef3c7", "#d4d4d8", "#fde68a"][index % 6],
        animation: `bingo-confetti ${2.8 + (index % 5) * 0.35}s ease-out forwards`,
        animationDelay: `${(index % 18) * 0.045}s`
      }} />)}
        </> : null}

      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-medium uppercase text-blue-600 dark:text-blue-300" style={{ letterSpacing: "0.24em" }}>Randomized Card</div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Tap any square to mark it. The first completed row, column, or diagonal triggers the bingo celebration.</p>
        </div>

        <button type="button" onClick={handleNewCard} className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950">
          New Card
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-5">
        <div className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-zinc-950/70">
          <div className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">Marked Squares</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-white">{markedCount}<span className="ml-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">/ 25</span></div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-zinc-950/70">
          <div className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">Status</div>
          <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-medium ${hasWon ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"}`}>
            {hasWon ? "Bingo achieved" : "In progress"}
          </div>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-5 gap-2 sm:gap-3" aria-hidden="true">
        {columnLabels.map((label) => <div key={label} className="flex h-10 items-center justify-center rounded-2xl bg-zinc-950 text-base font-semibold text-white dark:bg-white dark:text-zinc-950 sm:h-12 sm:text-lg">
            {label}
          </div>)}
      </div>

      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {cells.map((cell, index) => {
          const isMarked = marked[index];
          const isFree = index === centerIndex;

          return <button key={`${cell}-${index}`} type="button" aria-pressed={isMarked} aria-label={`${columnLabels[index % boardSize]}${Math.floor(index / boardSize) + 1}: ${cell}`} onClick={() => toggleCell(index)} className={`aspect-square min-h-20 rounded-2xl border p-2 text-center text-xs font-medium leading-tight transition sm:min-h-24 sm:p-3 sm:text-sm ${isMarked ? "border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 hover:bg-blue-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-blue-400/60 dark:hover:bg-blue-950/30"} ${isFree ? "ring-2 ring-amber-400/70" : ""}`}>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide opacity-70">
                {columnLabels[index % boardSize]}{Math.floor(index / boardSize) + 1}
              </span>
              <span className="flex items-center justify-center break-words">{cell}</span>
            </button>;
        })}
      </div>
    </div>;
};
