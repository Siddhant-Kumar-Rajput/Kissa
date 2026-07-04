# Software Requirements Specification (SRS)

> This is the doc you paste into your AI coding tool alongside the PRD. It exists to stop the AI from guessing architecture or inventing data sources.

## 1. Screen-by-screen functional flow

1. **Flash screen** — app name/logo, brief tagline. Transitions to name input.
2. **Name input screen** — "What would you like me to call you?" → stores `username` in app state.
3. **State selection screen** — grid/list of 7 states (Rajasthan, Kerala, Goa, Tamil Nadu, Uttar Pradesh, Uttarakhand, Himachal Pradesh). On selection: background transitions to that state's art/culture imagery (Wikimedia Commons). Stores `selectedState`.
4. **Date selection screen** — native date input, "When would you like to travel?" Stores `travelDate`.
5. **City + attraction tiles screen** — dropdown of tourist-spot cities for `selectedState` (from OpenTripMap/Wikipedia data, not hardcoded); popular attractions for the state shown as tiles above/beside the dropdown. Stores `selectedCity`.
6. **Loading screen** — "Personalizing your guide..." shown while backend fetches + generates. Must be a real loading state tied to actual async calls completing, not a fixed timer pretending to load.
7. **Guide screen** — renders:
   - Recommended attractions (real, from API)
   - Hidden gem (real place, re-ranked/highlighted by Gemini, not invented)
   - Immersive heritage story (Gemini-generated, grounded in real Wikipedia facts + real weather for `travelDate`/`selectedCity`)
   - Local tip / authentic experience note
   - Social-media-worthy pick (Gemini re-ranks the same real attraction list)
   - Nearby popular destinations (OpenTripMap radius search)
   - Every place name is a tappable Google Maps link
   - Read-aloud button on the story (browser SpeechSynthesis)
8. **Chat panel** — persistent or accessible from guide screen. Opens with: "Hi {username}, would you like to explore this time?" Real Gemini call per message, with `selectedState`/`selectedCity` passed as context so answers stay relevant.

## 2. Non-functional requirements (mapped to scoring parameters)

### Code Quality (High Impact)
- Single responsibility per function/component: separate concerns for API fetch, data transform, and render — do not let the AI collapse everything into one giant handler.
- Consistent naming for state variables across screens (`username`, `selectedState`, `travelDate`, `selectedCity`).
- No dead code, no leftover console.logs, no commented-out mock data left in the final build.

### Problem Statement Alignment (High Impact)
- Every one of the six required elements (attractions, hidden gems, storytelling, heritage, local events/tips, authentic experience angle) must have a visibly distinct section in the guide output — don't let them blur into one paragraph.

### Security (Medium Impact)
- API keys (Gemini, OpenTripMap) must live in backend/server environment variables — never shipped in frontend JS or committed to the repo.
- All external API calls go through your own backend route, not called directly from the browser with an exposed key.
- Sanitize/validate user text input (name field) before including it in any prompt sent to Gemini.

### Efficiency (Medium Impact)
- Batch or parallelize independent API calls where possible (e.g., fetch OpenTripMap attractions and Wikipedia heritage text concurrently, not sequentially).
- Cache state-level data (attraction tiles, background images) per state for the session so re-selecting a state doesn't re-fetch unnecessarily.

### Testing (Low Impact, tie-breaker)
- Manually verified end-to-end for at least 3 of the 7 states before submission.
- Basic handling verified for: empty/invalid name, no attractions returned, weather API failure, Gemini API failure/timeout.

### Accessibility (Low Impact, tie-breaker)
- Read-aloud (SpeechSynthesis) functioning on the guide story.
- All interactive elements (buttons, dropdown, date input) have visible focus states and are keyboard-navigable.
- Sufficient color contrast against the state background images (add a semi-transparent overlay behind text if needed).
- Images (state backgrounds, attraction tiles) have descriptive alt text.

## 3. Data flow / API integration map

| Step | API | Key needed | Notes |
|---|---|---|---|
| State background art | Wikimedia Commons | No | Query by state name |
| State heritage/city text | Wikipedia REST API (`/page/summary/`) | No | Grounds the heritage story |
| Attractions + hidden gems + nearby destinations | OpenTripMap | Yes () | Use `rate` field to distinguish popular vs hidden |
| Weather for travel date + city | Open-Meteo | No | Feed real conditions into the Gemini prompt |
| Story, heritage note, tip, social-media pick, hidden-gem framing | Gemini API | Yes () | Always pass real fetched data as grounding context in the prompt — never let it generate from the place name alone |
| Chat bot | Gemini API | Yes (free, same key) | Pass `selectedState`, `selectedCity`, `username` as context each message |
| Maps links | None (URL format only) | No | `https://www.google.com/maps/search/?api=1&query=PLACE+NAME` |
| Read-aloud | Browser SpeechSynthesis API | No | Client-side only |

## 4. Tech stack recommendation
- Frontend: React (Vite) or plain HTML/JS if time is tighter — keep it simple enough that AI-generated code stays debuggable by you
- Backend: minimal Node/Express (or serverless functions) — purely to hide API keys and proxy calls
- No database needed — all state lives in-session (React state or plain JS variables)
