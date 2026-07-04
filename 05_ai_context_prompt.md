# AI Context Prompt — Paste This at the Start of Every Coding Session

Copy everything below into your AI coding tool (alongside the 4 filled docs) before asking it to write any code.

---

You are helping me build a hackathon project. Before writing any code, read and strictly follow these constraints:

1. This project has a fixed scope defined in `01_user_requirements.md`, `02_prd.md`, `03_srs.md`, and `04_business_rules.md`. Do not add features, screens, or data sources that aren't in these docs. Do not invent scope.

2. Never write hardcoded, mock, sample, or placeholder data for attractions, hidden gems, heritage facts, weather, or events. Every data point must come from a real API call defined in `03_srs.md`'s data flow table. If a real API call isn't wired yet, write an explicit TODO and a visible "not yet implemented" state — never a fake stand-in that looks finished.

3. Every Gemini prompt you write for generation must include the real fetched data (place names, Wikipedia text, weather data) as context, and must instruct Gemini to only elaborate on the provided facts, not invent new place names, dates, or historical claims.

4. Never expose API keys in frontend/client code. All external API calls must go through a backend route.

5. Handle every failure case explicitly (API timeout, empty result, invalid input) with a real user-facing message — never fail silently or fall back to fake data.

6. Before telling me a feature is "done," walk through it as if you were a hackathon evaluator testing it fresh: does it actually run end-to-end, right now, with real data? If not, say so.

7. Optimize for one fully working flow over many partially working ones.

---

## Pre-submission checklist — run through this out loud, end to end, before you submit

**Disqualification check (from the event's own rules):**
- [ ] No static/hardcoded pages presenting fake outcomes as real
- [ ] No mock/sample data presented as real data
- [ ] No hallucinated AI responses — every Gemini call is wired and grounded
- [ ] If there's any login/auth, test credentials are ready to share (this project has none by design)
- [ ] Tested end-to-end as an evaluator would, not just in my own dev flow

**Scoring parameter check:**
- [ ] Code Quality — clean, readable, no leftover debug code
- [ ] Problem Statement Alignment — all six required elements (attractions, hidden gems, storytelling, heritage, local events/tips, authentic experience) are clearly present
- [ ] Security — no exposed keys, input sanitized before hitting the AI prompt
- [ ] Efficiency — no redundant/sequential API calls that could be parallelized or cached
- [ ] Testing — verified working on 3+ of the 7 states
- [ ] Accessibility — read-aloud works, keyboard navigation works, alt text present, contrast is readable over background art
