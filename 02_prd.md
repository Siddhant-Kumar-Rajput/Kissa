# Product Requirements Document (PRD)

## 1. Vision
A screen-by-screen personalized cultural discovery app: name → state → date → city, with a state-themed visual transition, culminating in a GenAI-generated guide that is grounded in real place data and real weather — not a static list, not a hallucinated story.

## 2. Goals
- Goal 1: Every generated claim traces back to a real API call (places, heritage text, weather)
- Goal 2: The screen flow itself (background changes per state, tile-based discovery, loading state) is part of the "immersive" pitch, not just the final text output
- Goal 3: One fully working flow beats a wider flow with gaps

## 3. Feature list — prioritized

### MVP (must work end-to-end, no exceptions)
| # | Feature | Scoring parameter it serves | Real logic or API? |
|---|---|---|---|
| 1 | Flash/landing screen, name input | Code Quality | Frontend only |
| 2 | State selection screen with themed background swap | Problem Statement Alignment (heritage/culture) | Wikimedia Commons images per state |
| 3 | Date picker | Problem Statement Alignment (feeds weather grounding) | Native HTML date input |
| 4 | City dropdown + popular attraction tiles for chosen state | Problem Statement Alignment, Code Quality | OpenTripMap / Wikipedia |
| 5 | Loading/"personalizing" state | Code Quality (UX polish) | Frontend only |
| 6 | Generated guide: attractions, hidden gem, heritage story, local tip, social-media-worthy pick | Problem Statement Alignment (core requirement) | Gemini API, grounded with real fetched data |
| 7 | Weather-aware grounding in the story | Problem Statement Alignment, Code Quality (real use of the date input) | Open-Meteo API (free, no key) |
| 8 | Google Maps links on every place mentioned | Efficiency (useful, low-friction output) | Plain Maps search URL, no API key needed |
| 9 | Read-aloud on the story | Accessibility | Browser SpeechSynthesis API, no key |
| 10 | Chat bot, greets by name, answers follow-ups | Problem Statement Alignment (authentic engagement) | Gemini API |
| 11 | Nearby popular destinations | Problem Statement Alignment | OpenTripMap radius search from selected city |

### Stretch (only after MVP fully works and is tested)
| # | Feature | Why it's stretch |
|---|---|---|
| 1 | Local events suggestion via Gemini + Google Search grounding tool | Needs the grounding tool wired correctly; risk of looking fabricated if not | 
| 2 | Downloadable "shareable story card" image | Extra canvas/image rendering work |
| 3 | Traveling-as / interest-tag personalization input | Cheap to add, high personalization value — bump to MVP if time allows |

## 4. Out of scope (explicit)
- Any "connect with a local host" feature that isn't a real, working contact mechanism
- Login/auth, saved history, payments
- States outside the 7 covered

## 5. Assumptions & constraints
- Constraint: a few hours, solo, AI-assisted coding (vibe coding) — every AI-written module must be checked against `04_business_rules.md` before being considered done
- Constraint: free-tier APIs only, no billing account setup
- Assumption: Gemini free API key and OpenTripMap free key are available before build starts

## 6. Timeline vs hackathon phases
| Phase | What must be true by end of phase |
|---|---|
| Setup (~20 min) | API keys obtained (Gemini, OpenTripMap), skeleton screens scaffolded |
| Core build (~1.5-2 hrs) | Full screen flow wired, OpenTripMap + Wikipedia + Open-Meteo calls working, Gemini guide generation grounded and returning real output |
| Enhancement (~30-45 min) | Maps links, read-aloud, chat bot wired |
| Hardening (~20-30 min) | Error handling for failed/empty API responses, remove any leftover placeholder data, basic accessibility pass (labels, contrast, read-aloud confirmed working) |
| Final (~15 min) | End-to-end test on 3+ states, final submission only — best attempt isn't kept |

## 7. Success metrics
- Full flow works live for at least 3 of the 7 states in front of a judge
- Zero hardcoded/mock content remains in the submitted build
- Weather-grounding and read-aloud are both visibly functioning in the demo
