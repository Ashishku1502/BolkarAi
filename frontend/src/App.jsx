import { useState } from "react";
import AskBox from "./components/AskBox.jsx";
import AnswerCard from "./components/AnswerCard.jsx";
import "./App.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { question, answer, sources, error }
  const [history, setHistory] = useState([]);

  async function handleAsk(question) {
    setLoading(true);
    setResult({ question, answer: "", sources: [], error: null });

    try {
      const res = await fetch(`${API_BASE_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      const entry = { question, answer: data.answer, sources: data.sources, error: null };
      setResult(entry);
      setHistory((h) => [entry, ...h].slice(0, 5));
    } catch (err) {
      setResult({
        question,
        answer: "",
        sources: [],
        error: `Couldn't get an answer: ${err.message}. Is the backend running on ${API_BASE_URL}?`,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <span className="hero__brand">Bolkar AI</span>
        <h1 className="hero__headline">Ask anything about any business.</h1>
        <p className="hero__sub">Voice or text in, one verified answer out — no more digging through ten tabs.</p>
      </header>

      <main className="content">
        <AskBox onAsk={handleAsk} loading={loading} />
        <AnswerCard {...(result || {})} />

        {history.length > 1 && (
          <section className="history">
            <h2 className="history__title">Recent questions</h2>
            <ul className="history__list">
              {history.slice(1).map((h, i) => (
                <li key={i}>
                  <button className="history__item" onClick={() => handleAsk(h.question)}>
                    {h.question}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer className="footer">Bolkar AI · MVP build — answers are grounded only in listings seeded in MongoDB.</footer>
    </div>
  );
}
