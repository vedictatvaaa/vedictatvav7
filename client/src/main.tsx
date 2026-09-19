import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/pwa";
import { initializeGoogleConsentMode } from "./lib/consent";
import { capturePanditCorrectionToken } from "./lib/pandit-correction-token";

capturePanditCorrectionToken();
const registrationUrl = new URL(window.location.href);
if (["/pandit/signup", "/become-pandit"].includes(registrationUrl.pathname)) {
  const draftToken = registrationUrl.searchParams.get("draft");
  if (draftToken && /^[A-Za-z0-9_-]{40,80}$/.test(draftToken)) {
    window.sessionStorage.setItem("pandit_registration_draft_token", draftToken);
    registrationUrl.searchParams.delete("draft");
    window.history.replaceState({}, "", `${registrationUrl.pathname}${registrationUrl.search}${registrationUrl.hash}`);
  }
}

initializeGoogleConsentMode();
createRoot(document.getElementById("root")!).render(<App />);
registerServiceWorker();
