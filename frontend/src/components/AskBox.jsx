import { useState } from "react";
import VoiceButton from "./VoiceButton.jsx";

const SUGGESTIONS = [
  "Tell me about Hero Splendor",
  "Compare Creta vs Hyryder",
  "Find a lawyer near me",
  "Explain the SecureLife family health plan",
];

export default function AskBox({ onAsk, loading }) {
  const [value, setValue] = useState("");

  const submit = (question) => {
    const q = (question ?? value).trim();
    if (!q || loading) return;
    onAsk(q);
  };

  return (
    <div className="ask-box">
      <form
        className="ask-box__form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          className="ask-box__input"
          type="text"
          placeholder="Ask anything about a business, product, or professional…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={loading}
        />
        <VoiceButton
          disabled={loading}
          onResult={(transcript) => {
            setValue(transcript);
            submit(transcript);
          }}
        />
        <button className="ask-box__submit" type="submit" disabled={loading || !value.trim()}>
          {loading ? "Asking…" : "Ask"}
        </button>
      </form>

      <div className="ask-box__suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className="suggestion-chip" onClick={() => submit(s)} disabled={loading}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
