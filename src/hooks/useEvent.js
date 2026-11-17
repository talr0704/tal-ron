import { useEffect, useState } from "react";
import { api } from "../services/api";
export function useEvent() {
  const [event, setEvent] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    api
      .event()
      .then(setEvent)
      .catch(() => setError("לא ניתן לטעון את האירוע. נסו שוב מאוחר יותר."));
  }, []);
  return { event, error };
}
