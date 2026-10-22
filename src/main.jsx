import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { resetLocalEmployeeDirectory } from "./settings/local-directory-reset.js";
import "./styles.css";
import "./billing.css";

try {
  resetLocalEmployeeDirectory(window.localStorage, window.location);
} catch (error) {
  console.warn('Не удалось очистить локальные демо-данные сотрудников', error);
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
