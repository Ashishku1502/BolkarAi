function parseBold(str) {
  if (!str) return "";
  const parts = str.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function renderAnswerContent(text) {
  if (!text) return null;
  const blocks = text.split(/\n\s*\n/);

  return blocks.map((block, idx) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith("### ")) {
      return <h3 key={idx} className="answer-card__heading">{parseBold(trimmed.replace(/^###\s+/, ""))}</h3>;
    }
    if (trimmed.startsWith("> ")) {
      return (
        <blockquote key={idx} className="answer-card__callout">
          {parseBold(trimmed.replace(/^>\s+/, ""))}
        </blockquote>
      );
    }
    if (trimmed === "---") {
      return <hr key={idx} className="answer-card__divider" />;
    }
    if (
      trimmed.includes("\n• ") ||
      trimmed.startsWith("• ") ||
      trimmed.includes("\n- ") ||
      trimmed.startsWith("- ") ||
      trimmed.includes("\n* ") ||
      trimmed.startsWith("* ")
    ) {
      const lines = trimmed.split("\n");
      const listItems = lines.filter((l) => l.trim().startsWith("• ") || l.trim().startsWith("- ") || l.trim().startsWith("* "));
      const preamble = lines.filter((l) => !l.trim().startsWith("• ") && !l.trim().startsWith("- ") && !l.trim().startsWith("* ")).join("\n");
      return (
        <div key={idx} className="answer-card__list-block">
          {preamble && <p className="answer-card__p">{parseBold(preamble)}</p>}
          <ul className="answer-card__list">
            {listItems.map((item, i) => (
              <li key={i}>{parseBold(item.trim().replace(/^[•\-\*]\s+/, ""))}</li>
            ))}
          </ul>
        </div>
      );
    }

    return (
      <p key={idx} className="answer-card__p">
        {parseBold(trimmed)}
      </p>
    );
  });
}

export default function AnswerCard({ question, answer, sources, error }) {
  if (!question) return null;

  return (
    <div className="answer-card">
      <div className="answer-card__question-badge">
        <span className="question-icon">💬</span> "{question}"
      </div>

      {error ? (
        <div className="answer-card__error-box">
          <p className="answer-card__error">{error}</p>
        </div>
      ) : (
        <div className="answer-card__body">
          <div className="answer-card__content">{renderAnswerContent(answer)}</div>
          {sources && sources.length > 0 && (
            <div className="answer-card__sources-container">
              <span className="sources-label">Grounded Sources:</span>
              <div className="answer-card__sources">
                {sources.map((s) => (
                  <span key={s.id || s.name} className={`source-chip${s.verified ? " source-chip--verified" : ""}`}>
                    {s.verified ? "✓ Verified" : "Unverified"} · {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {sources && sources.length === 0 && (
            <p className="answer-card__no-sources">No verified listing matched this question yet — seed data or add a business to improve results.</p>
          )}
        </div>
      )}
    </div>
  );
}
