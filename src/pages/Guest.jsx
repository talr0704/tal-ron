import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, isDemo } from "../services/api";
import { useEvent } from "../hooks/useEvent";
import Field from "../components/Field";
import { Art, Bloom, Couple, preloadBloom } from "../components/Gouache";

const choices = [
  { value: "yes", label: "מגיעים!", icon: "tick" },
  { value: "maybe", label: "אולי", icon: "heart" },
  { value: "no", label: "לא נוכל להגיע", icon: "flower" },
];
const emptyForm = {
  status: "",
  adults: 1,
  children: 0,
  under5: 0,
  meals: [],
  note: "",
};

const participantList = new Intl.ListFormat("he", { type: "conjunction" });

function savedParticipants({ adults, children, under5 }) {
  return participantList.format(
    [
      adults === 1 ? "מבוגר אחד" : adults > 0 ? `${adults} מבוגרים` : null,
      children === 1 ? "ילד אחד" : children > 0 ? `${children} ילדים` : null,
      under5 === 1
        ? "ילד אחד מתחת לגיל 5"
        : under5 > 0
          ? `${under5} ילדים מתחת לגיל 5`
          : null,
    ].filter(Boolean),
  );
}

export default function Guest() {
  const { token } = useParams();
  return <Invitation key={token} token={token} />;
}

function Invitation({ token }) {
  const { event, error } = useEvent();
  const [inv, setInv] = useState(null);
  const [problem, setProblem] = useState("");
  const [saved, setSaved] = useState(null);
  const [celebrate, setCelebrate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const submitting = useRef(false);
  const savedTitle = useRef(null);
  const retryButton = useRef(null);
  const choiceGroup = useRef(null);
  const editing = useRef(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    api.guest(token).then(
      (guest) => {
        if (!active) return;
        setInv(guest);
        if (guest.response) {
          setForm(guest.response);
          setSaved(guest.response);
        }
      },
      () => {
        if (active)
          setProblem("הקישור אינו תקין או שההזמנה בוטלה. פנו לטל או לרון.");
      },
    );
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (celebrate) savedTitle.current?.focus();
  }, [celebrate]);

  useEffect(() => {
    if (!saved && editing.current) {
      editing.current = false;
      choiceGroup.current?.querySelector(":checked")?.focus();
    }
  }, [saved]);

  useEffect(() => {
    if (problem && inv) retryButton.current?.focus();
  }, [problem, inv]);

  const total =
    !form.status || form.status === "no"
      ? 0
      : form.adults + form.children + form.under5;
  const meals = event
    ? Array.from({ length: total }, (_, i) => form.meals[i] || event.meals[0])
    : [];

  async function submit(e) {
    e.preventDefault();
    if (!form.status || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setProblem("");
    const response =
      form.status === "no"
        ? { ...form, adults: 0, children: 0, under5: 0, meals }
        : { ...form, meals };
    try {
      await api.respond(token, response);
      setForm(response);
      setSaved(response);
      setCelebrate(true);
    } catch {
      setProblem("לא ניתן לשמור. בדקו את הפרטים ונסו שוב.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  useEffect(() => {
    if (form.status === "yes" && !saved) preloadBloom();
  }, [form.status, saved]);

  function choose(status) {
    setProblem("");
    setForm((previous) => ({
      ...previous,
      status,
      adults: status === "no" ? previous.adults : Math.max(previous.adults, 1),
    }));
  }

  function edit() {
    editing.current = true;
    setCelebrate(false);
    setSaved(null);
  }

  if (!event)
    return (
      <main
        className="guest-site guest-loading"
        role={error ? "alert" : "status"}
      >
        {error || "טוענים את פרטי החתונה…"}
      </main>
    );

  const [year, month, day] = event.date.split("-");
  const venue = event.venue === "אולם דואאה (DUEE)" ? "דואה" : event.venue;
  const city = event.address.split(",").at(-1).trim();
  const savedChoice = choices.find(({ value }) => value === saved?.status);
  const participants = savedChoice && savedParticipants(saved);

  return (
    <div className="guest-site" dir="rtl">
      <main className="invitation-layout">
        <div className="invitation-card">
          <header className="invitation-hero">
            <Art name="cloud-left" className="hero-cloud hero-cloud-left" />
            <Art name="cloud-right" className="hero-cloud hero-cloud-right" />
            <p className="guest-name-frame">
              {inv?.name?.trim() || "נשמח לחגוג איתכם!"}
            </p>
            <h1>
              החתונה של <strong>{event.names}</strong>
            </h1>
            <time className="wedding-date" dateTime={event.date} dir="ltr">
              {Number(day)}.{Number(month)}.{year.slice(-2)}
            </time>
            <p className="wedding-venue">
              <Art name="event-pin" className="event-detail-icon" />
              <span>
                {venue}
                {city !== venue && ` · ${city}`}
              </span>
            </p>
            <p className="wedding-time">
              <Art name="event-clock" className="event-detail-icon" />
              <span>
                קבלת פנים ב־<time dir="ltr">{event.time}</time>
              </span>
            </p>
            <Couple image={event.image} />
          </header>

          <section
            id="rsvp"
            className="invitation-response"
            aria-label="אישור הגעה"
          >
            {!token ? (
              <>
                <p>לאישור הגעה, פתחו את הקישור האישי שקיבלתם.</p>
                {isDemo && (
                  <Link className="guest-action" to="/i/demo">
                    פתיחת הזמנה לדוגמה
                  </Link>
                )}
              </>
            ) : !inv ? (
              problem ? (
                <p role="alert" className="guest-error">
                  {problem}
                </p>
              ) : (
                <p role="status">טוענים את ההזמנה…</p>
              )
            ) : savedChoice ? (
              <div className="response-result">
                {saved.status === "maybe" && (
                  <Art name="response-maybe-dove" className="resting-dove" />
                )}
                {saved.status === "yes" &&
                  (celebrate ? (
                    <Bloom />
                  ) : (
                    <Art name="bloom-5" className="saved-flower" />
                  ))}
                <div role="status">
                  <h2 tabIndex={-1} ref={savedTitle} className="saved-heading">
                    {celebrate && (
                      <Art
                        name="response-confirmed"
                        className="saved-confirmation-icon"
                      />
                    )}
                    {celebrate ? "התשובה נשמרה" : "התשובה הקודמת"}
                  </h2>
                  <p className={`saved-choice choice-${saved.status}`}>
                    {savedChoice.label}
                  </p>
                  {saved.status === "maybe" && <p>נשמח לעדכון כשתדעו</p>}
                  {saved.status === "no" && (
                    <p className="saved-decline">
                      <Art
                        name="response-petal"
                        className="event-detail-icon"
                      />
                      תודה שעדכנתם
                    </p>
                  )}
                  {participants && (
                    <p className="saved-participants">
                      <Art
                        name="response-participants"
                        className="event-detail-icon"
                      />
                      <span>{participants}</span>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="guest-action guest-icon-action"
                  onClick={edit}
                >
                  <Art name="response-edit" className="event-detail-icon" />
                  עדכון תשובה
                </button>
              </div>
            ) : (
              <form onSubmit={submit} aria-busy={busy}>
                <fieldset disabled={busy} className="rsvp-fields">
                  <legend className="guest-visually-hidden">
                    תשובת ההגעה שלכם
                  </legend>
                  <div className="attendance-choices" ref={choiceGroup}>
                    {choices.map(({ value, label, icon }) => (
                      <label
                        key={value}
                        className={`attendance-choice choice-${value}`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value={value}
                          checked={form.status === value}
                          onChange={() => choose(value)}
                        />
                        <Art name={`icon-${icon}`} className="choice-icon" />
                        <span>{label}</span>
                        <span className="selection-mark" aria-hidden="true">
                          ✓
                        </span>
                      </label>
                    ))}
                  </div>
                  {form.status && (
                    <div className="response-details">
                      {form.status === "maybe" && (
                        <>
                          <Art
                            name="response-maybe-dove"
                            className="resting-dove"
                          />
                          <h2>אולי</h2>
                          <p>נשמח לשמוע! אפשר לעדכן את התשובה בהמשך.</p>
                        </>
                      )}
                      {form.status === "no" && (
                        <>
                          <h2>לא נוכל להגיע</h2>
                          <p>תודה שעדכנתם. נתגעגע אליכם!</p>
                        </>
                      )}
                      {form.status === "yes" && <h2>פרטי הגעה</h2>}
                      {form.status === "yes" && (
                        <ArrivalFields
                          inv={inv}
                          event={event}
                          form={form}
                          setForm={setForm}
                          meals={meals}
                        />
                      )}
                      {form.status === "maybe" && (
                        <details className="tentative-details">
                          <summary>פרטי הגעה משוערים</summary>
                          <ArrivalFields
                            inv={inv}
                            event={event}
                            form={form}
                            setForm={setForm}
                            meals={meals}
                          />
                        </details>
                      )}
                      <Field label="הערות (אופציונלי)">
                        <textarea
                          maxLength={1000}
                          value={form.note}
                          onChange={(e) =>
                            setForm({ ...form, note: e.target.value })
                          }
                        />
                      </Field>
                      {problem && (
                        <p role="alert" className="guest-error">
                          {problem}
                        </p>
                      )}
                      <button
                        className="guest-action submit-rsvp"
                        type="submit"
                        ref={retryButton}
                        disabled={busy}
                      >
                        {busy ? "שומרים…" : "שמירת אישור הגעה"}
                      </button>
                    </div>
                  )}
                </fieldset>
              </form>
            )}
            {busy && (
              <span className="guest-visually-hidden" role="status">
                שומרים את התשובה…
              </span>
            )}
          </section>
        </div>
        <aside
          className="invitation-logistics"
          aria-labelledby="arrival-information"
        >
          <Art name="event-chuppah" className="event-chuppah" />
          <h2 id="arrival-information">פרטי האירוע והגעה</h2>
          <p>{event.address}</p>
          <p className="event-parking">
            <Art name="event-parking" className="event-detail-icon" />
            <span>
              {event.parking === "חניה מול האולם"
                ? "החניה מול האולם"
                : event.parking}
            </span>
          </p>
          <a
            className="guest-action guest-icon-action waze-action"
            target="_blank"
            rel="noreferrer"
            href={`https://waze.com/ul?q=${encodeURIComponent(event.address)}&navigate=yes`}
          >
            <Art name="event-waze" className="event-detail-icon" />
            ניווט לדואה
          </a>
        </aside>
      </main>
      <footer className="invitation-footer">
        {isDemo && <small>מצב הדגמה · הנתונים נשמרים בדפדפן הזה בלבד</small>}
        <Link to="/admin">כניסת מנהלים</Link>
      </footer>
    </div>
  );
}

function ArrivalFields({ inv, event, form, setForm, meals }) {
  return (
    <>
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
      <h3 className="form-section-title">בחירת ארוחה</h3>
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
  );
}
