import { useState } from "react";
import "./App.css";
import { LogScreen } from "./LogScreen";
import { StatsView } from "./StatsView";

type Tab = "log" | "stats";

function App() {
  const [tab, setTab] = useState<Tab>("log");

  return (
    <div className="app">
      <main>{tab === "log" ? <LogScreen /> : <StatsView />}</main>
      <nav className="tabbar">
        <button className={tab === "log" ? "active" : ""} onClick={() => setTab("log")}>
          Log
        </button>
        <button className={tab === "stats" ? "active" : ""} onClick={() => setTab("stats")}>
          Stats
        </button>
      </nav>
    </div>
  );
}

export default App;
