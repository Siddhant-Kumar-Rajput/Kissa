# Business Rules & Definition of Done

## 1. Hard rules — the AI coding tool must never violate these

1. **No hardcoded destination data.** Attractions, hidden gems, heritage text, and events must come from a live API response at runtime. If you catch the AI writing a static array of "attractions" as a fallback, that's a disqualification risk — replace it with a real error state instead.
2. **No hallucinated Gemini output presented as fact.** Every Gemini prompt for the guide/story must include the real fetched data (place names, Wikipedia summary, weather) as context, and the prompt must explicitly instruct Gemini to only elaborate on the given facts, not invent new place names or historical claims.
3. **No fake loading.** The "personalizing your guide" screen must be tied to the actual async calls resolving — not a `setTimeout` pretending to load while nothing happens.
4. **No fake map pins or fake links.** Every Google Maps link must be built from a real place name returned by the API, not a placeholder.
5. **No exposed API keys in frontend code.** Gemini and OpenTripMap keys live server-side only.
6. **No silent failures.** If OpenTripMap, Wikipedia, Open-Meteo, or Gemini fails or times out, show a real error/fallback message to the user — never let the UI silently show blank or fake data as if it succeeded.

## 2. Edge cases to handle explicitly

| Case | Required behavior |
|---|---|
| User enters no name / blank name | Default to "traveler" or require input before continuing — never send blank string into a prompt |
| Selected state has thin Wikipedia/OpenTripMap coverage | Show whatever real data exists; do not pad with invented attractions to hit a target count |
| No attractions returned for a city | Show a clear "no results found for this city" state, offer to pick another city |
| Weather API fails or date is out of forecast range | Fall back to a general seasonal note (e.g., "this region is typically warm in [month]") sourced from real seasonal knowledge, clearly not presented as live weather |
| Gemini API fails/times out | Show a retry option; never substitute a hardcoded canned paragraph |
| User asks the chat bot something unrelated to the destination | Bot should gently redirect back to the destination context, not hallucinate an unrelated answer |

## 3. Definition of Done (check before every commit, and before final submission)

- [ ] Feature actually runs end-to-end when I click through it myself, not just in the code
- [ ] No mock/sample/placeholder data left anywhere in the final build
- [ ] Every GenAI output is traceable to a real API call feeding it real facts
- [ ] API keys are not visible in any frontend file or committed to version control
- [ ] Tested on at least 3 of the 7 states without errors
- [ ] Read-aloud actually produces audio when clicked
- [ ] Every Maps link actually opens the correct location
- [ ] Final submission is the version being graded — not an earlier "best attempt"
