# Japa Guided Audio and Achievement Sharing Design

## Goal

Extend the existing Japa Counter journey with clearer spoken guidance and a deliberate completion flow:

1. Announce each pranayama exercise name and its benefit.
2. Announce the selected mantra's benefits before chanting begins.
3. After chanting, announce completion, give a devotional blessing, and speak a positive Hindi thought for the day.
4. Open an achievement-sharing screen immediately after the closing narration finishes.

The existing breathing phase recordings and their browser speech fallback remain unchanged.

## Voice Rules

### Existing breathing voice

The current breathing guide voice remains the authority for:

- Warmup introduction
- Exercise names
- Exercise benefits
- Inhale, hold, exhale, rest, and humming cues
- Skip and progress behavior

Each exercise starts with one short spoken introduction in the existing voice:

- **Nadi Shodhana:** announces the name and that it helps balance attention and settle the breath.
- **Sama Vritti:** announces the name and that an even rhythm helps steady the mind.
- **Bhramari:** announces the name and that gentle humming helps reduce mental noise before chanting.

The exercise timer starts after its introduction finishes. If the recorded introduction cannot play, the existing browser speech fallback is used. If both voice paths fail, the exercise continues after a short bounded delay and the benefit remains visible on screen.

### Male Hindi devotional cinematic voice

The male Hindi devotional cinematic voice is used only for:

- The selected mantra's benefits before chanting
- The chanting-complete announcement
- The final blessing and positive-day wish
- The daily positive thought

Breathing instructions must not be converted to this Hindi voice.

## Journey and State Transitions

The flow is an explicit state sequence so narration, chanting, and sharing cannot overlap:

1. `warmup_intro`
2. `exercise_intro`
3. `exercise_active`
4. Repeat exercise introduction and active states for all three stages
5. `mantra_benefit_intro`
6. `chanting_ready`
7. `chanting_active`
8. `chanting_complete_narration`
9. `achievement_share`

### Starting a session

- The first tap on a new mala opens the current warmup.
- Users may skip an exercise or the complete warmup as they can today.
- Skipping the warmup moves to the mantra-benefit introduction, not directly to counting.
- Returning to a saved, partially completed mala does not replay the warmup or mantra-benefit narration.

### Before chanting

- The app selects the benefit text for the currently selected mantra.
- The Hindi devotional narration plays once.
- Manual counting and auto-chant remain disabled until narration finishes.
- If devotional narration fails, concise Hindi benefit text remains visible and the user may continue after a bounded timeout.

### After chanting

When the selected target is completed:

- Counting and auto-chant stop.
- The closing Hindi narration announces that chanting is complete.
- It gives a short devotional blessing and wishes the devotee a positive day.
- It speaks the daily positive thought.
- The achievement share screen opens immediately after the closing narration ends.
- If playback fails or times out, the text remains visible and the share screen still opens.

The existing completion counters, mala totals, streak updates, bell, and visual blessing remain authoritative and must not be double-counted by the new transition.

## Mantra Benefits

Each mantra has a concise Hindi benefit script derived from the existing mantra library. The script must:

- Name the mantra.
- Describe spiritual or reflective benefits without medical guarantees.
- Avoid promising cures, wealth, protection, or supernatural outcomes as certainty.
- Fit comfortably in a short spoken introduction.

If a mantra lacks a dedicated script, use a neutral fallback explaining that focused repetition can support steadiness, devotion, and mindful attention.

## Daily Positive Thought

### Primary source

The server requests one short Hindi devotional positive thought from the configured AI provider.

The prompt requires:

- One or two short sentences
- Warm, devotional, and uplifting Hindi
- No predictions, fear, guilt, medical advice, financial advice, or unverifiable promises
- No claim that the thought is a divine message
- Suitability for spoken delivery at the end of Japa

### Daily stability and shuffling

- A successful thought is cached by local calendar date in India Standard Time.
- The same user receives the same thought for that day, avoiding a different result on every replay.
- A new day selects or generates a different thought where possible.
- The client must not call AI repeatedly during the same completion flow.

### Curated fallback

A reviewed library of Hindi positive thoughts is bundled with the app. A deterministic date-based selection chooses the fallback so it changes daily without network access. The fallback is always available when AI is disabled, slow, malformed, or unavailable.

## Audio Delivery

Hindi devotional narration uses a reusable narration interface rather than embedding provider calls into the counter component.

The interface accepts:

- Narration purpose
- Hindi text
- Stable cache key
- Completion callback
- Failure callback

The preferred path is the configured male Hindi devotional cinematic audio service already supported by the project. A browser Hindi voice may be used only as a graceful fallback when no recorded/generated clip is available. Audio requests are cached so replaying the same mantra benefit or daily closing does not repeatedly incur generation latency.

All audio has a maximum wait and playback timeout. A failed voice service must never trap the user before chanting or sharing.

## Achievement Share Screen

The share screen opens automatically after closing narration and displays:

- Selected mantra
- Repetition target completed
- Mala count
- Current streak
- Today's count
- Lifetime count
- Devotee name when already available

### Prefilled promotional message

The fixed prefix is:

> I completed my Japa on the Vedic Tatva Digital Japa Counter.

The message then includes the selected mantra and achievement, followed by the canonical Japa Counter link. It must not expose private local data beyond the achievement values already shown on screen.

### Share actions

1. Native device share when available
2. WhatsApp share
3. Copy message and link
4. Dismiss or continue another mala

Opening the share screen is automatic; sending remains an explicit user action.

## Accessibility and User Control

- Every narration has equivalent visible text.
- Announcements use a polite live region and do not compete with phase countdown updates.
- Voice and music controls remain independently available.
- Reduced-motion preferences continue to be respected.
- A visible Continue action is available if narration fails or the user does not want to wait.
- The app never auto-opens an external share target or sends a message.

## Error Handling

- Recorded breathing introduction failure: use the current browser voice fallback.
- Hindi narration failure: show the script and continue after a bounded delay.
- AI thought failure: use the curated daily fallback.
- Share API failure: retain WhatsApp and copy options.
- Interrupted audio or component unmount: cancel pending callbacks and prevent duplicate transitions.
- Reload during a completed-mala transition: preserve the completed achievement and avoid replaying or incrementing it twice.

## Data and Privacy

- Counts and streaks remain in the existing local persistence model.
- Daily thought responses contain no user profile or private activity data.
- The AI request receives only the narration purpose and content constraints.
- No share action occurs without a user tap.

## Testing

Focused automated checks should cover:

- Exercise name and benefit narration occurs once before each stage.
- Existing phase recordings and fallback remain unchanged.
- Warmup skip still triggers mantra-benefit narration.
- Saved partial malas do not replay the complete introduction sequence.
- Chanting cannot start while mantra-benefit narration is active.
- Closing narration occurs once after target completion.
- Share screen opens after successful, failed, and timed-out closing narration.
- AI thought is stable for the IST calendar day.
- Curated fallback works when AI is unavailable or malformed.
- Achievement values and promotional copy match persisted counter state.
- Native Share, WhatsApp, and copy fallbacks remain user initiated.

## Out of Scope

- Replacing the existing pranayama exercises
- Re-recording the existing breathing phase cues
- Automatic posting to social networks
- Medical or therapeutic claims
- Personalized spiritual predictions