import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

setAuthTokenGetter(() => {
  if (typeof localStorage !== "undefined") {
    return localStorage.getItem("tv_token");
  }
  return null;
});

createRoot(document.getElementById("root")!).render(<App />);
