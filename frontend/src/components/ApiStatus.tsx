"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type State = "checking" | "up" | "down";

// Shows whether the NestJS API and PostgreSQL answer (GET /api/health).
export default function ApiStatus() {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((r) => r.json())
      .then((h) => setState(h.database === "up" ? "up" : "down"))
      .catch(() => setState("down"));
  }, []);

  const label = {
    checking: "Checking API and database…",
    up: "API and database connected",
    down: "API or database not reachable",
  }[state];

  return (
    <p data-testid="api-status" data-state={state} className="flex items-center gap-2 text-sm text-muted">
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${
          state === "up" ? "bg-ok" : state === "down" ? "bg-bad" : "bg-border"
        }`}
      />
      {label}
    </p>
  );
}
