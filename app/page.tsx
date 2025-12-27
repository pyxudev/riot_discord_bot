"use client";

import { useState } from "react";

export default function RegisterForm() {
  const [playerName, setPlayerName] = useState("");
  const [tagId, setTagId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        playerName,
        tagId,
      }),
    });

    setLoading(false);

    if (res.ok) {
      alert("Registered!");
      setPlayerName("");
      setTagId("");
    } else {
      alert("Error");
    }
  };

  return (
    <div id="register-form">
      <h1>Riot Statistic Register</h1>

      <div id="inputs">
        <input
          type="text"
          placeholder="Your Player Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        <b>#</b>
        <input
          type="text"
          placeholder="Your Hash Tag Id"
          value={tagId}
          onChange={(e) => setTagId(e.target.value)}
        />
      </div>

      <button onClick={handleRegister} disabled={loading}>
        {loading ? "Saving..." : "Register"}
      </button>
    </div>
  );
}