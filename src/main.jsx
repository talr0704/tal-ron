import "@fontsource/heebo/hebrew-400.css";
import "@fontsource/heebo/hebrew-500.css";
import "@fontsource/heebo/latin-400.css";
import "@fontsource/noto-serif-hebrew/hebrew-400.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Guest from "./pages/Guest";
import Admin from "./pages/Admin";
import "./styles/main.css";
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Guest />} />
        <Route path="/i/:token" element={<Guest />} />
        <Route path="/admin" element={<Admin />} />
        <Route
          path="*"
          element={
            <main>
              <h1>העמוד לא נמצא</h1>
              <a href="/">חזרה להזמנה</a>
            </main>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
