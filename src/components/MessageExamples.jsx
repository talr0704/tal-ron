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
      <p className="muted">
        הדוגמאות זמינות גם ללא בחירת מוזמנים. בהכנת הודעה לנמען, שם המוזמן
        והקישור האישי יוחלפו אוטומטית בפרטים שלו. אפשר לערוך את הנוסח לפני פתיחת
        WhatsApp.
      </p>
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
              <h4>{title}</h4>
              <p className="message-text">{text}</p>
              <div className="toolbar">
                <button
                  type="button"
                  aria-pressed={style === id}
                  onClick={() => onSelect(id)}
                >
                  {style === id ? "הסגנון הנבחר" : "בחירת סגנון זה"}
                </button>
                <button
                  type="button"
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
