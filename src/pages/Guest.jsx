import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, isDemo } from "../services/api";
import { useEvent } from "../hooks/useEvent";
import { statuses } from "../services/model";
import Field from "../components/Field";
import Arrow from "../components/Arrow";
import Botanical from "../components/Botanical";
import EventIcon from "../components/EventIcon";
export default function Guest() {
  const { token } = useParams(),
    { event, error } = useEvent();
  const [inv, setInv] = useState(null),
    [problem, setProblem] = useState(""),
    [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    status: "yes",
    adults: 1,
    children: 0,
    under5: 0,
    meals: [],
    note: "",
  });
  useEffect(() => {
    setInv(null);
    setSaved(false);
    setProblem("");
    setForm({
      status: "yes",
      adults: 1,
      children: 0,
      under5: 0,
      meals: [],
      note: "",
    });
    if (token)
      api
        .guest(token)
        .then((g) => {
          setInv(g);
          if (g.response) setForm(g.response);
        })
        .catch(() =>
          setProblem("הקישור אינו תקין או שההזמנה בוטלה. פנו לטל או לרון."),
        );
  }, [token]);
  if (!event)
    return <main className="loading">{error || "מכינים לכם משהו יפה…"}</main>;
  const total =
    form.status === "no" ? 0 : form.adults + form.children + form.under5;
  const meals = Array.from(
    { length: total },
    (_, i) => form.meals[i] || event.meals[0],
  );
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setProblem("");
    try {
      await api.respond(token, { ...form, meals });
      setSaved(true);
    } catch {
      setProblem("לא ניתן לשמור. בדקו את הפרטים ונסו שוב.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="guest-site">
      <header className="top">
        <Link to="/">ט & ר</Link>
        <span dir="ltr">{event.date.split("-").reverse().join(" / ")}</span>
        <a href="#rsvp">אישור הגעה ↓</a>
      </header>
      {isDemo && (
        <div className="demo">מצב הדגמה · הנתונים נשמרים בדפדפן הזה בלבד</div>
      )}
      <main>
        <section className="hero" aria-label="ההזמנה שלנו">
          <div className="hero-layout">
            <div className="hero-art">
              <img
                className="garden-background"
                src="/images/wedding-garden.webp"
                alt=""
                fetchPriority="high"
                width="1024"
                height="1536"
              />
              <div className="art-dedication">סיפור האהבה שלנו</div>
              <img
                className="couple"
                src={
                  event.image === "/couple.svg"
                    ? "/images/couple.svg"
                    : event.image || "/images/couple.svg"
                }
                alt="איור זוגי של טל ורון"
              />
              <span className="art-caption">ועכשיו, לפרק הכי יפה</span>
            </div>
            <div className="hero-copy">
              <div className="eyebrow">שמחים להזמין אתכם לחגוג איתנו</div>
              <h1>{event.names}</h1>
              <div className="script">
                <span />
                מתחתנים
                <span />
              </div>
              <div className="date" dir="ltr">
                {event.date.split("-").reverse().join(" . ")}
              </div>
              <p className="hero-location">
                {event.venue} · {event.time}
              </p>
              <p className="intro">
                מכל הרגעים היפים בחיים,
                <br />
                זה הרגע שאנחנו רוצים לחלוק איתכם.
              </p>
              <a className="button guest-primary" href="#rsvp">
                ניפגש בחופה? <span aria-hidden="true">↓</span>
              </a>
              <div className="hero-signature">מחכים לכם, עם הרבה אהבה</div>
            </div>
          </div>
          <Botanical className="hero-sprig" />
        </section>
        <section
          className="event-overview"
          aria-labelledby="event-details-title"
        >
          <div className="section-intro">
            <div className="eyebrow">שמרו לנו את הערב הזה</div>
            <h2 id="event-details-title">כל הפרטים ליום שלנו</h2>
            <span className="little-heart" aria-hidden="true">
              ♡
            </span>
          </div>
          <div className="details">
            <div>
              <EventIcon type="venue" />
              <small>המקום</small>
              <h2>{event.venue}</h2>
              <p>{event.address}</p>
            </div>
            <div>
              <EventIcon type="time" />
              <small>מתחילים לחגוג</small>
              <h2>{event.time}</h2>
              <p>קבלת פנים · חיבוקים · אהבה</p>
            </div>
            <div>
              <EventIcon type="parking" />
              <small>בדרך אלינו</small>
              <h2>ניפגש שם</h2>
              <p>{event.parking}</p>
              <a
                target="_blank"
                rel="noreferrer"
                href={`https://waze.com/ul?q=${encodeURIComponent(event.address)}&navigate=yes`}
              >
                ניווט ב־Waze <Arrow />
              </a>
            </div>
          </div>
        </section>
        <section id="rsvp" className="rsvp">
          <div className="rsvp-card">
            <Botanical className="rsvp-sprig" />
            <div className="eyebrow">המקום שלכם בשמחה שלנו</div>
            <h2>אז, אתם באים?</h2>
            {problem && (
              <p role="alert" className="error">
                {problem}
              </p>
            )}
            {!token ? (
              <>
                <p>לאישור הגעה, פתחו את הקישור האישי שקיבלתם.</p>
                {isDemo && (
                  <Link className="button" to="/i/demo">
                    פתיחת הזמנה לדוגמה
                  </Link>
                )}
              </>
            ) : !inv ? (
              <p>{problem ? "" : "טוענים את ההזמנה…"}</p>
            ) : saved ? (
              <div role="status">
                <h3>תודה, {inv.name} ♡</h3>
                <p>התשובה שלכם נשמרה. אפשר לחזור לקישור ולעדכן אותה.</p>
                <button onClick={() => setSaved(false)}>עדכון התשובה</button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <p className="personal-greeting">
                  היי {inv.name}, נשמח לראות אתכם!
                </p>
                <div
                  className="choices"
                  role="group"
                  aria-label="תשובת ההגעה שלכם"
                >
                  {["yes", "no", "maybe"].map((s) => (
                    <label
                      className={form.status === s ? "selected" : ""}
                      key={s}
                    >
                      <input
                        type="radio"
                        name="status"
                        checked={form.status === s}
                        onChange={() => setForm({ ...form, status: s })}
                      />
                      {statuses[s]}
                    </label>
                  ))}
                </div>
                {form.status !== "no" && (
                  <>
                    <h3 className="form-section-title">מי מגיע איתכם?</h3>
                    <div className="grid3">
                      {[
                        ["adults", "מבוגרים", inv.maxAdults, 1],
                        ["children", "ילדים מגיל 5", inv.maxChildren, 0],
                        ["under5", "ילדים מתחת לגיל 5", inv.maxUnder5, 0],
                      ].map(([key, label, max, min]) => (
                        <Field key={key} label={`${label} (עד ${max})`}>
                          <select
                            value={form[key]}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                [key]: Number(e.target.value),
                              })
                            }
                          >
                            {Array.from({ length: max - min + 1 }, (_, i) => (
                              <option key={i} value={i + min}>
                                {i + min}
                              </option>
                            ))}
                          </select>
                        </Field>
                      ))}
                    </div>
                    <h3 className="form-section-title">משהו טעים לכל אחד</h3>
                    <div className="mealgrid">
                      {meals.map((m, i) => (
                        <Field
                          key={i}
                          label={`מנה לאורח ${i + 1}${i >= form.adults + form.children ? " · מתחת לגיל 5" : ""}`}
                        >
                          <select
                            value={m}
                            onChange={(e) => {
                              const next = [...meals];
                              next[i] = e.target.value;
                              setForm({ ...form, meals: next });
                            }}
                          >
                            {event.meals.map((x) => (
                              <option key={x}>{x}</option>
                            ))}
                          </select>
                        </Field>
                      ))}
                    </div>
                  </>
                )}
                <Field label="משהו שחשוב שנדע? (אופציונלי)">
                  <textarea
                    maxLength="1000"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                  />
                </Field>
                <button
                  className="button guest-primary submit-rsvp"
                  disabled={busy}
                >
                  {busy ? "שומרים…" : "שמירת אישור הגעה"}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
      <footer>
        <span className="footer-monogram">ט & ר</span>
        <p>הכי שמחים שאתם חלק מהסיפור שלנו.</p>
        <span>באהבה, {event.names} ♡</span>
        <Link to="/admin">כניסת מנהלים</Link>
      </footer>
    </div>
  );
}
