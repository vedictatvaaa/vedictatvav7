import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/pwa";
import { initializeGoogleConsentMode } from "./lib/consent";

initializeGoogleConsentMode();
createRoot(document.getElementById("root")!).render(<App />);
registerServiceWorker();
