import { useState } from "react";
import "./App.css";
import { LogScreen } from "./LogScreen";
import { StatsView } from "./StatsView";

type Tab = "log" | "stats";

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M24,6 m-18,0 a18,18 0 1,0 36,0 a18,18 0 1,0 -36,0 Z
           M31,3 m-15,0 a15,15 0 1,0 30,0 a15,15 0 1,0 -30,0 Z"
      />
    </svg>
  );
}

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
