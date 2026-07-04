# User Requirements

## 1. Problem Statement (verbatim)
Challenge: Destination Discovery & Cultural Experiences.
Build a GenAI-powered platform that helps travelers discover destinations and engage with local culture in meaningful ways. The solution must use Generative AI to recommend attractions, uncover hidden gems, generate immersive storytelling, promote heritage, suggest local events, and connect visitors with authentic cultural experiences.

## 2. Restated in one sentence
A traveler enters their name, a state, a travel date, and a city, and receives a personalized, GenAI-generated cultural guide — real attractions, a hidden gem, an immersive heritage story grounded in the actual weather for that date, a local tip, a social-media-worthy pick, and a chat companion — all built from real data, not invented.

## 3. Who is the user?
- Primary user: A traveler (Indian domestic tourism focus) deciding where and how to explore a state, who wants a guide that feels personal rather than generic.
- Current workaround: Static blog lists, generic "top 10" articles, no personalization to date/travel style, no narrative depth.

## 4. Core user stories
1. As a traveler, I want to enter my name and pick a state, so the experience feels personal from the first screen.
2. As a traveler, I want to see popular attractions for my state as visual tiles and pick my city from a dropdown, so discovery feels guided, not overwhelming.
3. As a traveler, I want the background to reflect the art/culture of my selected state, so the app itself feels immersive before I even get my guide.
4. As a traveler, I want a personalized guide covering attractions, a hidden gem, heritage storytelling, a local tip, and a social-media-worthy spot — grounded in the real weather for my travel date — so the recommendations feel tailored, not generic.
5. As a traveler, I want every place mentioned to link directly to Google Maps, so I can act on the recommendation immediately.
6. As a traveler, I want to hear the story read aloud, so I can enjoy it hands-free or if reading is hard for me.
7. As a traveler, I want a chat companion that greets me by name and lets me ask follow-up questions, so I can go deeper without leaving the app.
8. As a traveler, I want to see other popular destinations nearby, so I can extend my trip planning in one place.

## 5. Success criteria
- [ ] Name → state → date → city flow works end-to-end with real background changes per state
- [ ] Attraction tiles and city dropdown are populated from real API data, not hardcoded
- [ ] Guide generation is grounded in real weather data for the selected date + city
- [ ] Every recommended place has a working, correct Google Maps link
- [ ] Read-aloud works on the generated story
- [ ] Chat bot responds with real Gemini-generated answers, greets user by name
- [ ] Tested end-to-end for at least 3 of the 7 covered states before submission

## 6. Explicit non-goals
- Not building: booking or real messaging with local guides/hosts
- Not building: persistent accounts or saved trip history across sessions
- Not building: coverage for states outside the chosen 7 (Rajasthan, Kerala, Goa, Tamil Nadu, Uttar Pradesh, Uttarakhand, Himachal Pradesh)
- Not building: real-time ticketed events calendar (use Gemini + search grounding or a clearly-labeled curated list instead)

## 7. Judge-facing framing
"We built a personalized GenAI cultural guide: pick your state, date, and city, and instead of a generic list, you get a hidden gem, a heritage story grounded in the real weather you'll actually experience, a local tip, a social-media-worthy pick, direct map links, and a chat companion to go deeper — all generated live from real data."
