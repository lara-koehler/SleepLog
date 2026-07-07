import { useState } from "react";
import "./App.css";
import { LogScreen } from "./LogScreen";
import { StatsView } from "./StatsView";
import { MoonIcon } from "./icons";

type Tab = "log" | "stats";

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="24" width="8" height="18" rx="2" fill="currentColor" />
      <rect x="20" y="14" width="8" height="28" rx="2" fill="currentColor" />
      <rect x="32" y="20" width="8" height="22" rx="2" fill="currentColor" />
    </svg>
  );
}

function App() {
  const [tab, setTab] = useState<Tab>("log");

  return (
    <div className="app">
      <main>{tab === "log" ? <LogScreen /> : <StatsView />}</main>
      <nav className="tabbar">
        <button className={tab === "log" ? "active" : ""} onClick={() => setTab("log")}>
          <MoonIcon />
          Log
        </button>
        <button className={tab === "stats" ? "active" : ""} onClick={() => setTab("stats")}>
          <ChartIcon />
          Stats
        </button>
      </nav>
    </div>
  );
}

export default App;
