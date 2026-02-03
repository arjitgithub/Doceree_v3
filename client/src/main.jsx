import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";

import "./DocHubLayoutDesign/header.css";
import "./DocHubLayoutDesign/home.css";
import "./DocHubLayoutDesign/catalog.css";
import "./DocHubLayoutDesign/vendor.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
