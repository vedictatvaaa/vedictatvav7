# Devotee Authentication Redesign

## Scope

Redesign only the existing devotee login, signup, password-reset, and reset-confirmation views. Preserve all authentication APIs, session behavior, redirects, routes, validation rules, referral handling, password recovery, and backend functionality.

Partner, Pandit, and Admin authentication are outside this scope.

## Visual Direction

Use the approved reference-led treatment:

- warm ivory page background;
- existing Vedic Tatva text wordmark and tagline;
- deep maroon primary actions;
- restrained muted-gold details;
- soft borders, subtle shadows, and a light frosted surface;
- elegant serif headings with readable supporting typography;
- generous whitespace and minimal line icons;
- no photography, illustrations, Om symbol, new logo, heavy gradient, statistics, or decorative desktop panel.

## Page Structure

Use the existing website header behavior and routes. On mobile it retains the hamburger on the left, centered wordmark, and search/cart actions on the right.

The main login view contains:

1. `Welcome Back` as the single page H1.
2. `Sign in to continue your spiritual journey.`
3. A compact trust line: `Sacred Products`, `Trusted Experts`, and `A More Mindful You`.
4. A focused authentication panel headed `Login as Devotee`.
5. Supporting copy: `Access your orders, puja bookings, saved items and more.`
6. Email and password controls with persistent accessible labels.
7. Password visibility, remember-me, and forgot-password controls.
8. A dominant `Sign In →` action.
9. The existing Google sign-in only when its current configuration enables it.
10. The existing transition into account creation.
11. A small linked Terms and Privacy Policy notice.

Do not display WhatsApp sign-in because the application does not currently support it. Remove the current Pandit login promotion from this page.

## Other Authentication States

Signup, password recovery, and reset confirmation use the same visual shell. Their existing fields, validation, referral-code behavior, submission logic, and state transitions remain unchanged.

Devotee password signup requires a full name, an exact 10-digit mobile number, an email address, a password, and matching password confirmation. Before registration, the user must verify the email with a single-use six-digit code that expires after 10 minutes. Registration tokens are consumed atomically and cannot be replayed. First-time Google users must complete this required signup flow before Google can be linked to the verified account.

## Warm Sanctuary Glass Refinement

The authentication surface uses a modern sanctuary direction with a premium glass treatment. Atmospheric ivory, maroon, muted rose, and amber light form the background, with abstract Vedic geometry floating quietly behind translucent surfaces. The interface should feel luminous, contemporary, welcoming, and spiritually grounded without relying on deity photography or ornamental excess.

The authentication form uses a restrained translucent panel with clear contrast, soft backdrop blur, subtle borders, and controlled depth. Brand messaging is concise, typography is contemporary, and decorative elements remain secondary to the task. On mobile, the composition condenses so the form stays immediately accessible without horizontal overflow or excessive introductory content.

The guest action is labeled **“Continue as guest”**. Login, signup, email verification, referrals, redirects, password recovery, Google sign-in, validation, keyboard operation, reduced-motion behavior, and screen-reader semantics remain functionally unchanged.

## Responsive Behavior

Design mobile-first. Keep the form centered and comfortably touch-sized. On tablet and desktop, constrain the content width instead of stretching it. Maintain generous surrounding whitespace without adding a split-screen promotional panel.

The large global footer is not rendered on the authentication experience. No decorative footer slogan is added.

## Accessibility and Semantics

- Use one H1 on the login view.
- Keep real labels associated with every input.
- Preserve browser autofill and password-manager attributes.
- Maintain keyboard access and visible focus states.
- Keep validation feedback textual rather than color-only.
- Preserve disabled and loading states.
- Respect accessible contrast.

## Metadata

Use a concise authentication-specific page title and meta description. Do not add keyword-focused marketing copy.

## Verification

- Confirm login, signup, forgot-password, and reset-confirmation transitions.
- Confirm Google appears only when configured.
- Confirm current redirect and referral behavior remains intact.
- Check mobile and desktop layouts.
- Check keyboard navigation, labels, password visibility, loading states, and footer absence.