import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, isDemo, login, logout, watchAdmin } from "../services/api";
import { canMessageGuest, statuses, messageFor } from "../services/model";
import { parseGuestFile, exportGuests } from "../services/csv";
import Field from "../components/Field";
import GuestCounts from "../components/GuestCounts";
import MessageExamples from "../components/MessageExamples";
const blank = {
  name: "",
  phone: "",
  side: "tal",
  maxAdults: 1,
};
const messageLabels = {
  initial: "הזמנה ראשונית",
  pending: "תזכורת לטרם השיבו",
  maybe: "תזכורת למסמני אולי",
};

function MessageHistory({ sent = [] }) {
  const counts = Object.fromEntries(
    Object.keys(messageLabels).map((type) => [
      type,
      sent.filter((entry) => entry.type === type).length,
    ]),
  );
  const unknown = sent.length - counts.initial - counts.pending - counts.maybe;

  return (
    <>
      <strong>הודעות שנשלחו: {sent.length}</strong>
      {Object.entries(messageLabels).map(
        ([type, label]) =>
          counts[type] > 0 && (
            <small key={type} className="block">
              {label}: {counts[type]}
            </small>
          ),
      )}
      {unknown > 0 && <small className="block">סוג לא רשום: {unknown}</small>}
    </>
  );
}

export default function Admin() {
  const [admin, setAdmin] = useState(null),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [guests, setGuests] = useState([]),
    [event, setEvent] = useState(null),
    [tab, setTab] = useState("guests"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [side, setSide] = useState("all"),
    [edit, setEdit] = useState(null),
    [type, setType] = useState("initial"),
    [style, setStyle] = useState("casual"),
    [copied, setCopied] = useState(null),
    [busy, setBusy] = useState(false);
  useEffect(() => watchAdmin(setAdmin), []);
  async function reload() {
    const [g, e] = await Promise.all([api.list(), api.event()]);
    setGuests(g);
    setEvent(e);
  }
  useEffect(() => {
    if (admin) reload().catch(() => setError("טעינת הנתונים נכשלה"));
  }, [admin]);
  async function action(fn, msg) {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await fn();
      await reload();
      setNotice(msg);
    } catch (e) {
      setError(e.message || "הפעולה נכשלה");
    } finally {
      setBusy(false);
    }
  }
  if (admin === null) return <main>טוענים…</main>;
  if (!admin)
    return (
      <main className="login card">
        <Link to="/">ט & ר</Link>
        <h1>כניסת מנהלים</h1>
        <p>שמחה גדולה, מסודרת עד הפרט הקטן.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await login(email, password);
              setError("אם אין הרשאת מנהל, פנו לבעל הפרויקט.");
            } catch {
              setError("הכניסה נכשלה. בדקו אימייל וסיסמה.");
            }
          }}
        >
          <Field label="אימייל">
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="סיסמה">
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <button className="button">כניסה</button>
          <p role="alert">{error}</p>
        </form>
      </main>
    );
  const shown = guests.filter(
    (g) =>
      (g.name + " " + g.phone).includes(search) &&
      (filter === "all" || (g.response?.status || "pending") === filter) &&
      (side === "all" || g.side === side),
  );
  const recipients = guests.filter((guest) => canMessageGuest(guest, type));
  const yes = guests.filter((g) => g.response?.status === "yes");
  const sum = (k) => yes.reduce((n, g) => n + (g.response[k] || 0), 0);
  const counts = Object.fromEntries(
    Object.keys(statuses).map((s) => [
      s,
      guests.filter((g) => (g.response?.status || "pending") === s).length,
    ]),
  );
  function link(g) {
    return `${location.origin}/i/${g.token}`;
  }
  function deleteGuest(guest) {
    if (
      busy ||
      !window.confirm(
        `למחוק את ההזמנה של ${guest.name}? התשובה שנשמרה תימחק והקישור האישי יבוטל.`,
      )
    )
      return;

    return action(async () => {
      await api.deleteGuest(guest.id);
      setGuests((current) => current.filter(({ id }) => id !== guest.id));
    }, "המוזמן נמחק");
  }
  async function copyRecipientText(id, text, feedback) {
    setCopied(null);
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ id, feedback });
    } catch {
      setCopied({
        id,
        feedback: "ההעתקה נכשלה. בדקו את הרשאות הלוח ונסו שוב.",
      });
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([exportGuests(guests)], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "tal-ron-guests.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="admin">
      <header className="adminhead">
        <div>
          <Link to="/">ט & ר / החתונה שלנו</Link>
          <h1>כל השמחה, במקום אחד.</h1>
        </div>
        <div>
          {isDemo ? (
            <span className="pill">הדגמה מקומית</span>
          ) : (
            <button onClick={() => logout()}>יציאה</button>
          )}
        </div>
      </header>
      <nav className="tabs">
        {[
          ["guests", "מוזמנים ואישורי הגעה"],
          ["messages", "הזמנות ותזכורות"],
          ["event", "פרטי האירוע"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-current={tab === id ? "page" : undefined}
            className={tab === id ? "active" : ""}
            onClick={() => {
              setTab(id);
              if (id === "messages")
                reload().catch(() => setError("טעינת הנתונים נכשלה"));
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="success">
          {notice}
        </p>
      )}
      {!event ? (
        <p>טוענים נתונים…</p>
      ) : (
        <>
          <section className="stats">
            {Object.entries(statuses).map(([s, label]) => (
              <div className="card" key={s}>
                <small>{label} · הזמנות</small>
                <strong>{counts[s]}</strong>
              </div>
            ))}
            <div className="card">
              <small>מגיעים בפועל</small>
              <strong>{sum("adults") + sum("children") + sum("under5")}</strong>
              <small>
                {sum("adults")} מבוגרים · {sum("children")} ילדים ·{" "}
                {sum("under5")} מתחת ל־5
              </small>
            </div>
          </section>
          {tab === "guests" && (
            <section className="card">
              <div className="toolbar">
                <h2>
                  המוזמנים שלנו <small>({guests.length})</small>
                </h2>
                <button
                  className="button"
                  onClick={() => setEdit({ ...blank })}
                >
                  ＋ הוספת מוזמן
                </button>
                <button onClick={download}>ייצוא CSV</button>
                <label className="filebutton">
                  ייבוא CSV או Excel
                  <input
                    type="file"
                    accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    disabled={busy}
                    onChange={async (e) => {
                      const f = e.target.files[0];
                      if (!f) return;
                      await action(async () => {
                        const rows = await parseGuestFile(f);
                        let done = 0;
                        try {
                          for (const row of rows) {
                            await api.saveGuest(row);
                            done++;
                          }
                        } catch {
                          throw Error(
                            `הייבוא נעצר לאחר ${done} שורות. בדקו את הרשימה לפני ניסיון נוסף.`,
                          );
                        }
                      }, "הייבוא הושלם");
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              <div className="toolbar">
                <input
                  aria-label="חיפוש מוזמנים"
                  placeholder="חיפוש לפי שם או טלפון…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  aria-label="סינון תשובות"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">כל התשובות</option>
                  {Object.entries(statuses).map(([k, v]) => (
                    <option value={k} key={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="סינון צד"
                  value={side}
                  onChange={(e) => setSide(e.target.value)}
                >
                  <option value="all">שני הצדדים</option>
                  <option value="tal">הצד של טל</option>
                  <option value="ron">הצד של רון</option>
                </select>
              </div>
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      {[
                        "שם",
                        "צד",
                        "תשובה",
                        "מכסת מבוגרים",
                        "מגיעים",
                        "הודעות ותזכורות",
                        "פעולות",
                      ].map((x) => (
                        <th key={x}>{x}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((g) => (
                      <tr key={g.id}>
                        <td>
                          <strong>{g.name}</strong>
                          <small className="block">{g.phone}</small>
                        </td>
                        <td>{g.side === "tal" ? "טל" : "רון"}</td>
                        <td>
                          <span
                            className={`badge ${g.response?.status || "pending"}`}
                          >
                            {statuses[g.response?.status || "pending"]}
                          </span>
                        </td>
                        <td>{g.maxAdults}</td>
                        <td>
                          {g.response ? (
                            <GuestCounts
                              adults={g.response.adults}
                              children={g.response.children}
                              under5={g.response.under5}
                            />
                          ) : (
                            "טרם השיבו"
                          )}
                          {g.response?.note && (
                            <small className="block">{g.response.note}</small>
                          )}
                        </td>
                        <td>
                          <MessageHistory sent={g.sent} />
                        </td>
                        <td>
                          <button onClick={() => setEdit({ ...g })}>
                            עריכה
                          </button>{" "}
                          <button
                            onClick={() =>
                              action(
                                () => navigator.clipboard.writeText(link(g)),
                                "הקישור הועתק",
                              )
                            }
                          >
                            העתקת קישור
                          </button>{" "}
                          <button
                            type="button"
                            className="delete-guest"
                            aria-label={`מחיקת ההזמנה של ${g.name}`}
                            disabled={busy}
                            onClick={() => deleteGuest(g)}
                          >
                            מחיקה
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!shown.length && <p>לא נמצאו מוזמנים.</p>}
              </div>
            </section>
          )}
          {tab === "messages" && (
            <section className="card">
              <h2>קצת אהבה, ישר לוואטסאפ</h2>
              <p>
                העתיקו את המספר לחיפוש ב־WhatsApp ואת ההודעה להדבקה בצ׳אט. סמנו
                שליחה לאחר ששלחתם בפועל.
              </p>
              <div className="grid3">
                <Field label="תבנית">
                  <select
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                      setCopied(null);
                    }}
                  >
                    {Object.entries(messageLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="סגנון">
                  <select
                    value={style}
                    onChange={(e) => {
                      setStyle(e.target.value);
                      setCopied(null);
                    }}
                  >
                    <option value="casual">קליל ואישי</option>
                    <option value="formal">רשמי ואלגנטי</option>
                  </select>
                </Field>
              </div>
              <MessageExamples
                event={event}
                type={type}
                style={style}
                onSelect={(next) => {
                  setStyle(next);
                  setCopied(null);
                }}
              />
              <h3>הודעות אישיות למוזמנים</h3>
              {!recipients.length && <p>אין מוזמנים מתאימים לתבנית הזו.</p>}
              {recipients.map((guest) => {
                const phone = guest.phone?.trim();
                return (
                  <div className="recipient" key={guest.id}>
                    <div className="recipient-info">
                      <strong>{guest.name}</strong>
                      <small className="block">
                        אישורי שליחה: {guest.sent?.length || 0}
                      </small>
                    </div>
                    <div className="recipient-actions">
                      <button
                        type="button"
                        className="button"
                        onClick={() =>
                          copyRecipientText(
                            guest.id,
                            messageFor(guest, event, type, style, link(guest)),
                            "ההודעה הועתקה",
                          )
                        }
                      >
                        העתקת הודעה
                      </button>
                      <button
                        type="button"
                        disabled={!phone}
                        onClick={() =>
                          copyRecipientText(guest.id, phone, "המספר הועתק")
                        }
                      >
                        העתקת מספר
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          action(
                            () => api.markSent(guest.id, type),
                            "השליחה סומנה ידנית",
                          )
                        }
                      >
                        סימון כנשלחה
                      </button>
                    </div>
                    {copied?.id === guest.id && (
                      <small className="recipient-feedback" role="status">
                        {copied.feedback}
                      </small>
                    )}
                  </div>
                );
              })}
            </section>
          )}
          {tab === "event" && (
            <section className="card">
              <h2>פרטי היום שלנו</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  action(() => api.saveEvent(event), "פרטי האירוע נשמרו");
                }}
              >
                <div className="grid3">
                  {[
                    ["names", "שמות הזוג"],
                    ["date", "תאריך", "date"],
                    ["time", "קבלת פנים", "time"],
                    ["venue", "אולם"],
                    ["address", "כתובת"],
                    ["parking", "חניה"],
                    ["image", "נתיב איור או כתובת HTTPS"],
                  ].map(([k, l, t]) => (
                    <Field key={k} label={l}>
                      <input
                        required
                        type={t || "text"}
                        value={event[k]}
                        onChange={(e) =>
                          setEvent({ ...event, [k]: e.target.value })
                        }
                      />
                    </Field>
                  ))}
                </div>
                <p>לשינוי האיור, עדכנו את הנתיב שלו בפרטי האירוע.</p>
                <button disabled={busy} className="button">
                  שמירת פרטי האירוע
                </button>
              </form>
            </section>
          )}
        </>
      )}
      {edit && (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-title"
        >
          <form
            className="card"
            onSubmit={(e) => {
              e.preventDefault();
              action(async () => {
                await api.saveGuest(edit);
                setEdit(null);
              }, "ההזמנה נשמרה");
            }}
          >
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <h2 id="edit-title">{edit.id ? "עריכת הזמנה" : "הזמנה חדשה"}</h2>
            <Field label="שם">
              <input
                autoFocus
                required
                maxLength="120"
                value={edit.name}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              />
            </Field>
            <Field label="טלפון">
              <input
                type="tel"
                value={edit.phone}
                onChange={(e) => setEdit({ ...edit, phone: e.target.value })}
              />
            </Field>
            <Field label="צד">
              <select
                value={edit.side}
                onChange={(e) => setEdit({ ...edit, side: e.target.value })}
              >
                <option value="tal">טל</option>
                <option value="ron">רון</option>
              </select>
            </Field>
            <Field label="מכסת מבוגרים">
              <input
                type="number"
                min="1"
                max="20"
                required
                value={edit.maxAdults}
                onChange={(e) =>
                  setEdit({ ...edit, maxAdults: Number(e.target.value) })
                }
              />
            </Field>
            <p>בן/בת זוג נכללים במכסת המבוגרים. ברירת המחדל היא מבוגר אחד.</p>
            <button className="button" disabled={busy}>
              שמירה
            </button>{" "}
            <button type="button" onClick={() => setEdit(null)}>
              ביטול
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
