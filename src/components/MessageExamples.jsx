import { useState } from "react";
import { messageFor } from "../services/model";
export default function MessageExamples({ event, type, style, onSelect }) {
  const [feedback, setFeedback] = useState("");
  return (
    <section
      className="message-examples"
      aria-labelledby="message-examples-title"
    >
      <h3 id="message-examples-title">דוגמאות להודעות</h3>
      <div className="example-grid">
        {[
          ["casual", "קליל ואישי"],
          ["formal", "רשמי ואלגנטי"],
        ].map(([id, title]) => {
          const text = messageFor(
            { name: "{שם המוזמן}" },
            event,
            type,
            id,
            "{הקישור האישי}",
          );
          return (
            <article
              className={`message-example ${style === id ? "chosen" : ""}`}
              key={id}
            >
              <div className="example-heading">
                <h4>{title}</h4>
                {style === id && (
                  <span className="example-selected-badge">
                    <span aria-hidden="true">✓</span> נבחר
                  </span>
                )}
              </div>
              <p className="message-text">{text}</p>
              <div className="toolbar">
                <button
                  type="button"
                  className="example-select"
                  aria-pressed={style === id}
                  onClick={() => onSelect(id)}
                >
                  {style === id ? "הסגנון הנבחר" : "בחירת סגנון זה"}
                </button>
                <button
                  type="button"
                  className="example-copy"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(text);
                      setFeedback(
                        "הדוגמה הועתקה. יש להחליף את שם המוזמן והקישור האישי לפני שימוש.",
                      );
                    } catch {
                      setFeedback(
                        "לא ניתן להעתיק אוטומטית. אפשר לסמן את טקסט הדוגמה ולהעתיק ידנית.",
                      );
                    }
                  }}
                >
                  העתקת דוגמה
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {feedback && <p role="status">{feedback}</p>}
    </section>
  );
}
