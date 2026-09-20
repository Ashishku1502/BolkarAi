export default function AnswerCard({ question, answer, sources, error }) {
  if (!question) return null;

  return (
    <div className="answer-card">
      <p className="answer-card__question">"{question}"</p>

      {error ? (
        <p className="answer-card__error">{error}</p>
      ) : (
        <>
          <p className="answer-card__answer">{answer}</p>
          {sources && sources.length > 0 && (
            <div className="answer-card__sources">
              {sources.map((s) => (
                <span key={s.id} className={`source-chip${s.verified ? " source-chip--verified" : ""}`}>
                  {s.verified ? "✓ " : ""}
                  {s.name}
                </span>
              ))}
            </div>
          )}
          {sources && sources.length === 0 && (
            <p className="answer-card__no-sources">No verified listing matched this question yet — seed data or add a business to improve results.</p>
          )}
        </>
      )}
    </div>
  );
}
