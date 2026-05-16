// =====================================================================
// Festival AI — two surfaces:
//   1. enrichFestivalContent(festival)
//        Admin one-shot. Returns { description, preparationNotes }
//        rewritten in a warm, authoritative Vedic voice (~3-4 lines each).
//   2. generatePersonalizedFestivalEmail(festival, recipient, karma?)
//        Per-recipient HTML body for the 7-day reminder. Pulls in the
//        user's recent activity (karma + dharma + streak) so the email
//        feels written *for* them. Pandits get a different tone (calendar
//        + booking-spike framing). Always falls back to a static template
//        if OpenAI errors so reminders never silently disappear.
// =====================================================================
import OpenAI from "openai";

type FestivalLite = {
  id?: number;
  name: string;
  date: string;
  description?: string | null;
  preparationNotes?: string | null;
};

type Recipient = {
  type: "user" | "pandit";
  name: string;
  email: string;
};

type KarmaContext = {
  karma: number;
  dharma: number;
  level: number;
  fastingStreak: number;
} | null;

const MODEL = "gpt-4o-mini";

// Escape every piece of text — AI output, festival fields (admin can paste
// HTML), and recipient names (attacker-controlled via profile) — before it
// touches the email HTML. Without this we have a stored-XSS / content-
// injection class bug across every reminder we send.
function esc(s: string | null | undefined): string {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function client(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  try { return new OpenAI(); } catch { return null; }
}

// --- B: enrich festival content (admin one-click) ----------------------
export async function enrichFestivalContent(festival: FestivalLite):
  Promise<{ description: string; preparationNotes: string } | null>
{
  const ai = client();
  if (!ai) return null;
  const prompt = `You are a senior Vedic pandit writing for Vedic Tatva, a premium spiritual platform.

Festival: ${festival.name}
Date: ${festival.date}

Write two short, authoritative pieces in English (NO emoji, NO hashtags):
1. "description" — 2 to 3 sentences explaining the spiritual significance and the deity/event being honoured. Warm, reverent, factual.
2. "preparationNotes" — 3 to 4 short bullet-style lines (separated by " • ") covering samagri, fast/diet rules, ideal puja time, and one symbolic act the devotee should perform. Practical, specific, no fluff.

Respond as strict JSON: {"description": "...", "preparationNotes": "..."}`;

  try {
    const r = await ai.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = r.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    if (typeof parsed.description !== "string" || typeof parsed.preparationNotes !== "string") return null;
    return {
      description: parsed.description.trim().slice(0, 800),
      preparationNotes: parsed.preparationNotes.trim().slice(0, 800),
    };
  } catch (e) {
    console.error("[festival-ai] enrich failed:", (e as Error).message);
    return null;
  }
}

// --- A: personalised reminder email ------------------------------------
function staticEmailBody(f: FestivalLite, r: Recipient): string {
  const cta = r.type === "pandit"
    ? "Block your calendar early — bookings spike before festivals."
    : 'Plan your puja, samagri & pandit booking now at <a href="https://vedictatva.com">vedictatva.com</a>.';
  return `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:auto">
      <h2 style="color:#7a1d1d;font-family:'Playfair Display',serif">${esc(f.name)}</h2>
      <p>Namaste ${esc(r.name)},</p>
      <p><strong>${esc(f.name)}</strong> falls on <strong>${esc(f.date)}</strong> — exactly one week away.</p>
      ${f.description ? `<p>${esc(f.description)}</p>` : ""}
      ${f.preparationNotes ? `<div style="background:#fdf6e9;border:1px solid #e6d3a3;border-radius:8px;padding:12px 16px;margin:16px 0">
        <strong style="color:#7a1d1d">Preparation</strong><br/>${esc(f.preparationNotes)}
      </div>` : ""}
      <p style="font-size:13px;color:#666;margin-top:20px">${cta}</p>
    </div>`;
}

export async function generatePersonalizedFestivalEmail(
  festival: FestivalLite,
  recipient: Recipient,
  karma: KarmaContext,
): Promise<{ subject: string; html: string; text: string }> {
  const fallbackSubject = `${festival.name} is in 7 days — prepare your sadhana`;
  const ai = client();

  if (!ai) {
    return {
      subject: fallbackSubject,
      html: staticEmailBody(festival, recipient),
      text: `${festival.name} is in 7 days (${festival.date}). ${festival.preparationNotes || ""}`,
    };
  }

  const karmaLine = karma
    ? `Their tracker: Karma ${karma.karma}, Dharma ${karma.dharma}, Level ${karma.level}, fasting streak ${karma.fastingStreak} day(s).`
    : `They have not logged any spiritual activities yet.`;

  const audience = recipient.type === "pandit"
    ? `Recipient is a registered pandit on Vedic Tatva named ${recipient.name || "Panditji"}. Frame the message around: bookings will spike, prepare samagri lists, block the calendar, and offer to lead online puja for devotees. Tone: respectful peer-to-peer.`
    : `Recipient is a devotee named ${recipient.name || "Sadhak"}. ${karmaLine} Frame the message around: spiritual significance, what they can do this week to prepare (one specific suggestion that ties to their tracker if data exists), and a gentle nudge to book a pandit or order samagri from Vedic Tatva. Tone: warm, encouraging, not salesy.`;

  const prompt = `You are writing a 7-day-prior festival reminder email for Vedic Tatva.

Festival: ${festival.name}
Date: ${festival.date}
${festival.description ? `Significance: ${festival.description}` : ""}
${festival.preparationNotes ? `Preparation notes: ${festival.preparationNotes}` : ""}

${audience}

Constraints:
- NO emoji, NO hashtags, NO exclamation overload (max one)
- 90 to 140 words for the body
- Plain prose, NOT bullets
- Sign off as "Vedic Tatva"
- Output strict JSON: {"subject": "...", "body": "..."} where body is plain text (newlines OK, no HTML)`;

  try {
    const r = await ai.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = r.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    const subject = (typeof parsed.subject === "string" && parsed.subject.trim()) || fallbackSubject;
    const body = (typeof parsed.body === "string" && parsed.body.trim()) || "";
    if (!body) throw new Error("empty body");

    // Escape THEN render: model body is treated as untrusted plain text,
    // newlines become <br/> only after escaping. Festival fields likewise.
    const paragraphs = body.split(/\n\n+/).map((p: string) =>
      `<p style="margin:0 0 12px">${esc(p).replace(/\n/g, "<br/>")}</p>`).join("");
    const html = `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:auto;color:#2b1d1d">
        <h2 style="color:#7a1d1d;font-family:'Playfair Display',serif;margin:0 0 16px">${esc(festival.name)}</h2>
        ${paragraphs}
        ${festival.preparationNotes ? `<div style="background:#fdf6e9;border:1px solid #e6d3a3;border-radius:8px;padding:12px 16px;margin:18px 0">
          <strong style="color:#7a1d1d">Quick preparation</strong><br/>${esc(festival.preparationNotes)}
        </div>` : ""}
        <p style="font-size:13px;color:#666;margin-top:20px">
          <a href="https://vedictatva.com" style="color:#7a1d1d">Open Vedic Tatva</a> &middot;
          book a pandit, order samagri, or join a live puja.
        </p>
      </div>`;
    // subject is a header — strip newlines/control chars to prevent header injection.
    const safeSubject = subject.replace(/[\r\n]+/g, " ").slice(0, 200);
    return { subject: safeSubject, html, text: body };
  } catch (e) {
    console.error("[festival-ai] personalised email failed, falling back:", (e as Error).message);
    return {
      subject: fallbackSubject,
      html: staticEmailBody(festival, recipient),
      text: `${festival.name} is in 7 days (${festival.date}). ${festival.preparationNotes || ""}`,
    };
  }
}
