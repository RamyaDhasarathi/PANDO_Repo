# HI PANDO — In-App Assistant (Chat Bot) Build Spec

> Extension to `HI-PANDO-frontend-spec.md`. Adds a NoBroker-style floating chat assistant to the Hi Pando frontend. This phase is **frontend-only** — the bot answers from a local mock knowledge base / rule-based logic now, structured so it can be swapped for the real AI layer (Claude + GPT-4o-mini + RAG, per the project's Technology Stack doc) later without changing the UI.

---

## 1. Purpose

A persistent assistant, "**Hi Pando Assistant**," that:
- Greets the user and offers help on landing
- Answers questions about listed properties (price, location, amenities, availability)
- Answers general platform/FAQ questions (how buying/renting works, brokerage, documents needed, how search works)
- Helps narrow down a search conversationally (e.g. "Show me 2 BHK in Dubai Marina under 2M AED")
- Offers a "Talk to an agent" handoff button when it can't resolve something

---

## 2. Placement & Behavior (matches nobroker.com pattern)

- **Position:** Fixed floating button, **bottom-right corner** of the viewport, on every page (mounted once in the root layout, not per-page).
- **Collapsed state:** A circular floating action button (FAB) with the Hi Pando bot icon/avatar, teal accent background (`#1E7A5F`), small white chat/message icon. A subtle pulsing dot or "1" badge can appear to invite a first click.
- **Expanded state:** Clicking the FAB opens a **chat panel docked to the right edge of the screen** (not a centered modal) — same placement pattern as NoBroker's site widget:
  - **Desktop:** Panel is ~380px wide, anchored bottom-right, floats above page content with a shadow, page content stays visible/scrollable behind it.
  - **Mobile:** Panel expands to a full-screen (or near full-screen bottom sheet) overlay for usability.
- **Minimize/close:** Header of the panel has a minimize (–) button (collapses back to the FAB, keeps conversation state) and a close (×) button (also collapses to FAB — chat state persists in memory for the session either way).
- **Persistence:** Conversation state should persist while navigating between pages (Home → Search → Property Details) within the same session — store it in a top-level Context/Provider, not per-page state.

---

## 3. Visual Design

- Reuses the same Astryx Theme tokens as the rest of the app (see main frontend spec): teal primary `#1E7A5F`, mint tint backgrounds, rounded corners, soft shadows, consistent spacing scale.
- **Bot message bubbles:** left-aligned, light mint/gray background, bot avatar icon next to the first bubble in a sequence.
- **User message bubbles:** right-aligned, solid teal background, white text.
- **Quick reply chips:** pill-shaped buttons under a bot message offering tappable shortcuts (e.g. "Search 2BHK", "Rent vs Buy", "Talk to agent") — tapping one sends it as a user message.
- **Typing indicator:** three-dot animation in a bot bubble while a response is "loading" (simulate a short delay even with mock data, so it feels alive).
- **Header:** bot avatar + "Hi Pando Assistant" name + a small "Online" status dot + minimize/close icons.
- **Footer input bar:** text input with placeholder "Ask about a property or locality…", send button (paper-plane icon), and optionally a mic icon (visual only, non-functional for now).

---

## 4. Conversation Flows to Support (mock/rule-based)

### 4.1 Greeting (on first open each session)
> "Hi 👋 I'm the Hi Pando Assistant. I can help you find properties in Dubai, answer questions about buying or renting, or connect you with an agent. What are you looking for?"
Quick replies: `Buy a property` · `Rent a property` · `FAQs` · `Talk to an agent`

### 4.2 Property search assistance
User types something like: *"2 bedroom apartment in Dubai Marina under 2 million"*
- Bot parses simple keywords (bedrooms, community name, purpose, price ceiling) against `data/properties.js`
- Responds with a short summary + inline mini property cards (reuse `PropertyCard` in a compact variant) for the top 2–3 matches
- Ends with: "Want to see all results?" → button that routes to `/search` with those filters pre-applied

### 4.3 FAQ answers (keyword-matched against a local FAQ dataset)
Example topics to seed in `data/botFaq.js`:
- "How does brokerage work?" 
- "What documents do I need to buy property in Dubai?"
- "Can foreigners buy property in Dubai?"
- "What's the difference between freehold and leasehold?"
- "How do I schedule a site visit?"
- "Is the price negotiable?"

### 4.4 Fallback / handoff
If no keyword match is found:
> "I couldn't find an exact answer for that. Would you like to talk to one of our agents?"
Buttons: `Talk to an agent` (UI only — opens a contact form or mailto/tel link) · `Try again`

---

## 5. Components to Build

| Component | Responsibility |
|---|---|
| `ChatBotProvider.jsx` | Context provider holding conversation state (messages array, open/closed state), mounted once in root `layout.js` |
| `ChatBotButton.jsx` | The floating action button (collapsed state) |
| `ChatBotPanel.jsx` | The expanded chat panel container (header, message list, input bar) |
| `ChatMessage.jsx` | Renders a single message bubble (bot or user variant) |
| `ChatQuickReplies.jsx` | Row of pill/chip buttons under a bot message |
| `ChatInput.jsx` | Text input + send button at the bottom of the panel |
| `ChatTypingIndicator.jsx` | Animated three-dot "bot is typing" bubble |
| `ChatPropertyMiniCard.jsx` | Compact property card variant used inline in bot responses |

---

## 6. Mock Data / Logic (frontend-only phase)

### `data/botFaq.js`
```js
export const botFaq = [
  {
    id: "faq-1",
    keywords: ["brokerage", "commission", "fee"],
    question: "How does brokerage work?",
    answer: "Brokerage in Dubai is typically 2% of the sale price for buy transactions, and one month's rent for rental transactions. Exact terms can vary by listing."
  },
  {
    id: "faq-2",
    keywords: ["documents", "papers", "buy property", "requirements"],
    question: "What documents do I need to buy property in Dubai?",
    answer: "You'll generally need a valid passport, Emirates ID (if a resident), proof of funds, and a signed Memorandum of Understanding (MOU / Form F) for the transaction."
  },
  {
    id: "faq-3",
    keywords: ["foreigner", "expat", "can i buy", "non-resident"],
    question: "Can foreigners buy property in Dubai?",
    answer: "Yes — foreigners can buy freehold property in designated freehold areas of Dubai, such as Dubai Marina, Downtown Dubai, Palm Jumeirah, and Business Bay."
  },
  {
    id: "faq-4",
    keywords: ["freehold", "leasehold", "difference"],
    question: "What's the difference between freehold and leasehold?",
    answer: "Freehold means full ownership of the property and land indefinitely. Leasehold means you have rights to use the property for a fixed term (often up to 99 years) without owning the land."
  },
  {
    id: "faq-5",
    keywords: ["site visit", "schedule", "viewing", "tour"],
    question: "How do I schedule a site visit?",
    answer: "Open any property's details page and tap 'Contact Agent / Enquire' — the agent will help you schedule a convenient viewing time."
  },
  {
    id: "faq-6",
    keywords: ["negotiable", "negotiate", "lower price", "discount"],
    question: "Is the price negotiable?",
    answer: "Many listings do allow some negotiation. The best way to find out is to enquire directly on the property page and ask the agent."
  }
];
```

### `data/botIntents.js` (very simple rule-based parser for this phase)
```js
// Extremely lightweight keyword parsing — replace with real NLU (Claude / GPT-4o-mini + RAG) later.
export function parseSearchIntent(message) {
  const text = message.toLowerCase();
  const bedroomMatch = text.match(/(\d+)\s*(bhk|bedroom|br)/);
  const purpose = text.includes("rent") ? "rent" : text.includes("buy") || text.includes("sale") ? "sale" : null;
  const priceMatch = text.match(/(under|below|less than)\s*([\d.]+)\s*(million|m|k)?/);

  return {
    bedrooms: bedroomMatch ? parseInt(bedroomMatch[1], 10) : null,
    purpose,
    maxPrice: priceMatch ? normalizePrice(priceMatch[2], priceMatch[3]) : null,
    community: matchKnownCommunity(text) // check against localities.js names
  };
}
```

> Wiring these into `ChatBotPanel.jsx`: on user send → check `parseSearchIntent` first (if it looks like a search) → else check `botFaq` keyword match → else fallback message.

---

## 7. Folder Structure Additions

```
hi-pando-frontend/
├─ components/
│  ├─ chatbot/
│  │  ├─ ChatBotProvider.jsx
│  │  ├─ ChatBotButton.jsx
│  │  ├─ ChatBotPanel.jsx
│  │  ├─ ChatMessage.jsx
│  │  ├─ ChatQuickReplies.jsx
│  │  ├─ ChatInput.jsx
│  │  ├─ ChatTypingIndicator.jsx
│  │  └─ ChatPropertyMiniCard.jsx
├─ data/
│  ├─ botFaq.js
│  └─ botIntents.js
```

Mount `<ChatBotProvider>` (which internally renders `<ChatBotButton>` + `<ChatBotPanel>`) once inside `app/layout.js`, wrapping the page content, so it floats on every screen.

---

## 8. Build Order

1. Build `ChatBotButton` (FAB) and get its fixed bottom-right positioning correct across breakpoints.
2. Build `ChatBotPanel` shell (header, empty message list, input bar) with the open/close animation.
3. Build `ChatMessage` (bot vs. user bubble variants) and hardcode a couple of test messages to check styling.
4. Build `ChatBotProvider` to hold `messages[]` and `isOpen` state; wire the button to toggle the panel.
5. Add the greeting message + `ChatQuickReplies` on first open.
6. Build `data/botFaq.js` + simple keyword matcher; wire FAQ answers into the panel.
7. Build `data/botIntents.js` + `parseSearchIntent`; wire property-search style questions to pull from `data/properties.js` and render `ChatPropertyMiniCard` results inline.
8. Add `ChatTypingIndicator` with a short artificial delay before each bot response for a natural feel.
9. Add the fallback/handoff flow ("Talk to an agent").
10. Test responsive behavior: confirm the panel becomes a full-screen sheet on mobile widths.

---

## 9. Out of Scope for This Phase

- Real AI responses (Anthropic Claude / GPT-4o-mini via FastAPI + RAG) — this phase uses local keyword logic only
- WhatsApp handoff (Kapso.ai) or voice (Vapi.ai)
- Persisting chat history to a database — session-only state is enough for now

When the backend AI layer is ready, only `ChatBotProvider`'s message-sending function needs to change (swap the local `parseSearchIntent` / `botFaq` lookup for an API call) — the UI components stay the same.
