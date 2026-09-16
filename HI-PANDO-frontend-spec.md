# HI PANDO — Real Estate App (Dubai) — Frontend Build Spec

> Use this file as the working spec inside CodeApp. It defines scope, design direction, screens, components, and data shape for the **Buyer-facing frontend only** (no backend integration yet — use mock/local data).

---

## 1. Project Overview

**App name:** Hi Pando
**Domain (reference):** hipando.ai (Buyer Portal)
**Category:** Real estate discovery platform
**City focus:** Dubai, UAE
**Reference UX:** NoBroker (website/app) — same opening screen pattern, top search bar with location search, a "Sign In / Sign Up" button in the top-right, and category tabs for Buy / Rent / Commercial.

**What this phase covers:**
A responsive **frontend-only** web app (mobile + desktop) where a user can:
1. Land on a NoBroker-style home screen with a hero search bar.
2. Search Dubai locations/communities and filter by purpose (Sale / Rent) and property type.
3. See a results/listings page showing matching properties as cards.
4. Open a property details page.
5. Sign up / log in (UI only for now — wire to Clerk later per tech stack).

No backend calls are required in this phase. Wire the UI to a local mock dataset (`data/properties.js`) so the app is fully functional and demo-able on its own.

---

## 2. Tech Stack (per project's official Technology Stack doc — follow exactly)

| Layer | Technology | Notes |
|---|---|---|
| Framework | **Next.js** (App Router) | Pages, routing, layouts |
| UI library | **React** | Component-based UI |
| Language | **JavaScript** (NOT TypeScript) | Per project spec — plain `.js` / `.jsx` files only |
| Design system | **Astryx** | Primary UI system — buttons, cards, forms, tabs, dialogs, badges, nav |
| Theming | **Astryx Theme** | Shared Hi Pando design tokens (colors, type, spacing); each portal (Buyer here) gets its own accent color |
| Styling | **Custom CSS** | Only where Astryx doesn't already cover the layout/visual need — no Tailwind CSS, no Shadcn/UI (explicitly excluded in this project) |
| Auth (later) | **Clerk** | Sign up / login — for now, build the UI screens only |
| State (this phase) | React state / Context | No backend yet, so keep data in mock files + local state |

> If Astryx isn't available as an installable package in your CodeApp environment, scaffold the components as plain React + custom CSS matching Astryx's visual language (rounded cards, soft shadows, consistent spacing scale) so swapping in real Astryx components later is a drop-in replacement.

---

## 3. Brand & Visual Direction

- **Accent color (Buyer portal):** Warm teal/green (matches the "End User / Buyer" persona color used in the product deck) — e.g. `#1E7A5F` primary, with a light mint background tint for highlights.
- **Tone:** Clean, trustworthy, modern — similar density and card style to NoBroker, not overly playful.
- **Currency:** AED (e.g. `AED 1,850,000` for sale, `AED 120,000/yr` for rent).
- **Units:** sq. ft.
- **Typography:** One clean sans-serif (system font stack is fine): bold headings, medium-weight labels, regular body text.

---

## 4. Information Architecture / Screens

### 4.1 Home / Landing Screen (`/`)
This is the primary NoBroker-style screen:

- **Top navigation bar** (sticky):
  - Left: Hi Pando logo
  - Center/left of center: nav links — Buy, Rent, Commercial, New Projects
  - Right: **"Sign In / Sign Up"** button (pill-shaped, primary accent color)
- **Hero section** directly below nav:
  - Large heading, e.g. "Find your place in Dubai"
  - **Search bar** (the centerpiece), containing:
    - Location/community input with autosuggest (e.g. "Dubai Marina", "Downtown Dubai", "Business Bay")
    - Purpose toggle: **Buy / Rent** (tabs or segmented control)
    - Property type dropdown: Apartment, Villa, Townhouse, Plot, Commercial
    - "Search" button (primary CTA)
  - Optional secondary row of quick filter chips: Bedrooms (Studio, 1, 2, 3, 4+), Budget range
- **Below the fold:**
  - "Popular localities in Dubai" — horizontally scrollable cards (Dubai Marina, Downtown Dubai, Palm Jumeirah, JVC, Business Bay, Arabian Ranches, Dubai Hills Estate)
  - "Featured Properties" — a grid of 6–8 property cards pulled from mock data
  - Simple footer

### 4.2 Search Results / Listings Screen (`/search`)
Reached after submitting the hero search (query params carry location, purpose, type, filters).

- **Top:** the same compact search bar (sticky), pre-filled with the last search, editable inline
- **Left sidebar (desktop) / collapsible filter drawer (mobile):**
  - Purpose: Buy / Rent
  - Property type (checkboxes)
  - Price range (slider or min/max inputs, AED)
  - Bedrooms
  - Area (sq. ft. range)
  - Amenities (Pool, Gym, Parking, Pet-friendly, Furnished)
- **Main area:**
  - Results count: "128 properties found in Dubai Marina"
  - Sort dropdown: Newest, Price (low–high), Price (high–low)
  - **Grid/list of property cards** (see 5.2 for card content) showing the properties that match the current search/filter state
  - Empty state: friendly message + illustration when no results match ("No properties found — try adjusting your filters")
  - Pagination or "Load more"

### 4.3 Property Details Screen (`/property/[id]`)
- Image gallery (carousel)
- Title, price, purpose badge (For Sale / For Rent), location/community
- Key facts row: Bedrooms, Bathrooms, Area (sq ft), Property type, Furnishing status
- Description
- Amenities list (icon grid)
- Location block (community name + map placeholder)
- "Contact Agent / Enquire" button (UI only — no backend action required yet)
- Similar properties section (reuses the property card component)

### 4.4 Sign In / Sign Up (`/sign-in`, `/sign-up`)
- Simple centered card matching Astryx form components
- Fields: Mobile number (primary, matches product flow) or Email, OTP/password step
- "Continue" button
- Toggle link between sign in and sign up
- This can be a UI shell now; Clerk integration comes later per tech stack

---

## 5. Core Components to Build

### 5.1 `<TopNav />`
Logo, nav links, Sign In/Sign Up button. Sticky, responsive (collapses to hamburger on mobile).

### 5.2 `<PropertyCard />`
Reused on Home, Search Results, and Similar Properties. Shows:
- Cover image
- Purpose badge (Sale/Rent) — top-left corner of image
- Price (AED, formatted, "/yr" suffix if rent)
- Title / property type + bedroom count (e.g. "2 BHK Apartment")
- Location (community, city)
- Small icon row: bed count, bath count, area (sq ft)
- Favorite/heart icon (UI only)

### 5.3 `<SearchBar />`
Location input with autosuggest, purpose toggle (Buy/Rent), property type select, search button. Used in both hero (large variant) and results page (compact variant) — build as one component with a `variant="hero" | "compact"` prop.

### 5.4 `<FilterPanel />`
Sidebar/drawer with all filter controls described in 4.2. Emits an `onChange(filters)` callback; parent page re-filters the mock dataset.

### 5.5 `<LocalityCard />`
Small card for "Popular localities" section — locality image, name, "X properties available".

### 5.6 `<PropertyGallery />`
Image carousel for the details page.

### 5.7 `<AmenityBadge />`
Small icon + label chip (Pool, Gym, Parking, etc.), reused in filters and details page.

---

## 6. Mock Data Shape

Create `data/properties.js` with an array of objects like this (generate ~20–30 sample entries across Dubai communities):

```js
export const properties = [
  {
    id: "hp-1001",
    title: "2 BHK Apartment in Dubai Marina",
    purpose: "sale",              // "sale" | "rent"
    type: "Apartment",            // Apartment | Villa | Townhouse | Plot | Commercial
    price: 1850000,               // AED; if purpose === "rent", treat as AED/year
    community: "Dubai Marina",
    city: "Dubai",
    bedrooms: 2,
    bathrooms: 2,
    areaSqft: 1250,
    furnishing: "Semi-Furnished", // Furnished | Semi-Furnished | Unfurnished
    amenities: ["Pool", "Gym", "Parking", "Balcony"],
    images: ["/images/properties/hp-1001-1.jpg", "/images/properties/hp-1001-2.jpg"],
    description: "A bright 2-bedroom apartment with marina views...",
    postedOn: "2026-08-20"
  }
  // ...more entries
];
```

Also create `data/localities.js` for the "Popular localities" section:

```js
export const localities = [
  { name: "Dubai Marina", image: "/images/localities/dubai-marina.jpg", count: 128 },
  { name: "Downtown Dubai", image: "/images/localities/downtown.jpg", count: 94 },
  { name: "Palm Jumeirah", image: "/images/localities/palm.jpg", count: 61 },
  { name: "Business Bay", image: "/images/localities/business-bay.jpg", count: 77 },
  { name: "JVC", image: "/images/localities/jvc.jpg", count: 143 },
  { name: "Arabian Ranches", image: "/images/localities/arabian-ranches.jpg", count: 39 },
  { name: "Dubai Hills Estate", image: "/images/localities/dubai-hills.jpg", count: 52 }
];
```

---

## 7. Suggested Folder Structure

```
hi-pando-frontend/
├─ app/
│  ├─ layout.js
│  ├─ page.js                  # Home
│  ├─ search/
│  │  └─ page.js               # Search results
│  ├─ property/
│  │  └─ [id]/
│  │     └─ page.js            # Property details
│  ├─ sign-in/
│  │  └─ page.js
│  └─ sign-up/
│     └─ page.js
├─ components/
│  ├─ TopNav.jsx
│  ├─ SearchBar.jsx
│  ├─ PropertyCard.jsx
│  ├─ FilterPanel.jsx
│  ├─ LocalityCard.jsx
│  ├─ PropertyGallery.jsx
│  └─ AmenityBadge.jsx
├─ data/
│  ├─ properties.js
│  └─ localities.js
├─ styles/
│  └─ globals.css              # custom CSS supplementing Astryx Theme tokens
└─ public/
   └─ images/
```

---

## 8. Build Order (recommended)

1. Scaffold Next.js App Router project, JavaScript only.
2. Set up `globals.css` with base Astryx Theme–style tokens (colors, spacing, radius, shadow) as CSS variables.
3. Build `TopNav` and drop it into the root `layout.js`.
4. Build `PropertyCard` against a couple of hardcoded mock objects — get the visual right first.
5. Build `data/properties.js` and `data/localities.js` with realistic Dubai sample data.
6. Build Home screen: hero + `SearchBar` (hero variant) + localities row + featured properties grid.
7. Build `/search` page: compact `SearchBar` + `FilterPanel` + results grid, wired to filter the mock `properties` array by purpose, type, community text match, price range, bedrooms.
8. Build `/property/[id]` details page.
9. Build `/sign-in` and `/sign-up` UI shells.
10. Pass on responsiveness (mobile-first check) and empty/loading states.

---

## 9. Out of Scope for This Phase

- Backend/API integration (FastAPI, MongoDB, etc.)
- Real authentication (Clerk wiring)
- WhatsApp/voice AI features (Vapi.ai, Kapso.ai)
- Payment or lead-management flows

These belong to later phases per the full product architecture; this spec is scoped to the **buyer-facing frontend UI only**, matching the NoBroker-style experience requested.
