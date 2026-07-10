# Scrapp Launch Guide: Dev → Real Users → Real Impact

**Your constraint:** 5 hrs/week × 2 weeks = **~10 total working hours**. Every task below is sized to fit that. This guide is ruthlessly prioritized — do the tasks in order and skip anything marked *optional* until users exist.

**Your context:** Scrapp already won 4th place in the Congressional App Challenge 2025 — the recognition is done. That changes the goal of this plan: you're no longer optimizing for a demo video and a judging deadline, you're optimizing for **actual people using this to actually dispose of actual waste correctly**. That's a better problem to have. It also means the CAC win is a credibility asset you can *use* right now — "award-winning student app" opens doors (school admin, city officials, local press) that a random side project doesn't. Use that door, then build something that matters independent of the award.

---

## 0. The One Strategic Decision (make it before spending an hour)

**Drop YOLO from the production path. Ship GPT-4o-mini vision as the only classifier.**

Why:
- `yolov8x.pt` needs ~2–4 GB RAM and a beefy CPU. Hosting that costs $20–50/mo and is the single thing standing between you and a $5/mo backend.
- Your `openai_classifier.py` already does the real work (item + material + route + confidence, structured JSON). YOLO's 80 COCO classes ("bottle", "cup") are strictly worse for waste routing than a vision LLM that can tell a #5 PP yogurt tub from a compostable one.
- Cost reality: a 1280px `high`-detail image to GPT-4o-mini ≈ **$0.001–0.003 per scan**. $5 of OpenAI credit ≈ 2,000–5,000 scans. At real usage levels this stays cheap for a long time.

Keep YOLO in the repo behind an env flag (`USE_YOLO=false`) rather than deleting it — it's a reasonable fallback if OpenAI pricing/availability ever changes, and it's evidence of real engineering iteration if you ever write about this project.

---

## 1. Budget (total: ~$25–40 to launch, ~$12–15/mo to run)

| Item | Cost | Where | Verdict |
|---|---|---|---|
| Domain (e.g. `scrapp.app`, `getscrapp.com`, `usescrapp.app`) | ~$10–15/yr | Porkbun or Cloudflare Registrar (at-cost, no upsells) | **Buy** |
| Frontend hosting (Next.js) | $0 | Vercel Hobby tier | **Use** |
| Backend hosting (Flask, no YOLO) | $0–7/mo | Render free tier (spins down after 15 min idle) or Render Starter $7/mo always-on; Railway Hobby $5/mo also fine | **Start free, upgrade if cold starts hurt** |
| OpenAI API | ~$5/mo | platform.openai.com — set a **hard usage cap of $10/mo** in billing settings | **Fund with $10** |
| Google Maps/Places API | $0 | Google's monthly free credit covers thousands of map loads + Places searches at your scale. Set a budget alert at $5 anyway. | **Free at your scale** |
| Analytics | $0 | PostHog free tier (1M events/mo) + Vercel Analytics | **Use** |
| Google Play developer account | $25 one-time | *Optional, Phase 3* — wrap the PWA with Bubblewrap/TWA | **Defer** |
| Apple Developer Program | $99/yr | Not worth it for this timeline; iOS users install the PWA via Share → Add to Home Screen | **Skip** |

---

## 2. Timeline

### Week 1 — "It's live" (5 hours)

**Hour 1 — Backend goes to production**
1. Add `USE_YOLO` env flag to `final/app.py`; when false, skip model load and route `/predict` straight through `classify_waste()`. Delete `ultralytics` + `opencv-python-headless` from `requirements.txt` for the prod build (keeps the Docker image small and the RAM footprint tiny).
2. Add `gunicorn` to requirements; run with `gunicorn -w 2 -b 0.0.0.0:$PORT final.app:app`.
3. Deploy to Render: connect the `scrapp-backend` GitHub repo, set `OPENAI_API_KEY` env var, done. Your `Dockerfile` already exists — Render builds it directly.

**Hour 2 — Frontend goes to production**
1. Deploy `scrapp` repo to Vercel (free). Set `NEXT_PRIVATE_BACKEND_URL` to the Render URL, plus both Google Maps keys.
2. **Lock down the keys**: restrict `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to your domain in Google Cloud Console (it's public — this is mandatory, not optional). Keep the Places key server-side only.
3. Buy the domain, point it at Vercel (one CNAME). HTTPS is automatic — required for camera access on mobile, so this also fixes "camera doesn't work over http" forever.

**Hour 3 — Make the PWA actually installable**
You already have `manifest.ts` — finish the job:
1. Verify manifest has `display: "standalone"`, 192px + 512px icons, theme color.
2. Run Lighthouse (Chrome DevTools → Lighthouse → PWA + Performance) on the deployed URL; fix anything red.
3. Test the full loop **on a real phone over cellular**: install to home screen → open → scan an actual object → get an answer. This is your product; if this loop is >10 seconds or flaky, nothing else matters.

**Hour 4 — Instrumentation (you cannot improve what you can't see)**
1. `npm i posthog-js`, initialize in `layout.tsx`.
2. Track exactly four events: `scan_started`, `scan_result` (with `route` + `confidence` properties), `result_feedback` (see hour 5), `locations_viewed`.
3. Enable Vercel Analytics (one toggle) for page views/visitors.

**Hour 5 — The feedback button (your accuracy metric)**
Add a "Was this right? 👍 / 👎" prompt on the result screen, firing `result_feedback` with `correct: true/false` and the classified route. This single feature gives you:
- Your headline quality metric (**classification accuracy as rated by real users**),
- A prioritized list of what the classifier gets wrong,
- Proof (not a guess) of whether the app is actually helping people dispose of things correctly.

### Week 2 — "Real people use it" (5 hours)

**Hour 6 — Localize disposal rules (highest-impact product change)**
Recycling rules are hyper-local — that's the whole reason your app needs to exist. Minimum viable version: hardcode YOUR city/county's actual rules (your municipal waste website lists accepted plastics by number, battery/e-waste drop-offs, compost availability) into the GPT system prompt in `openai_classifier.py`: *"You are advising residents of [City, State]. Curbside recycling accepts #1, #2, #5 plastics; glass goes to drop-off only; …"*. This turns generic advice into **correct local advice**, which is the actual moat: it's the difference between an app people try once and an app people keep using because it's right about *their* bins.

**Hour 7 — Polish the 3 screens users actually see**
Scan page, result page, locations page. Fix the top papercut on each (you know what they are). Add a one-line "how it works" on the landing page with an install prompt.

**Hours 8–9 — Distribution (this is where impact actually comes from)**
Do all of these; each is ~20–30 min:
1. **School**: Ask your environmental/green club and a science teacher to have one class scan 3 items each. Print a QR-code poster ("Not sure which bin? Scan it.") and put it next to the school's recycling bins — this is the perfect point-of-confusion placement. Lead with "this won 4th place in the Congressional App Challenge" when you ask — it's a real door-opener for getting a busy admin's yes.
2. **City**: Email your city/county waste management department (find the recycling coordinator — they exist and they answer email). One paragraph: award-winning student project, free app that reduces contamination, can we link your official rules / would you share it with residents? A reply from them is a real partnership, not a checkbox — it means your local-rules data stays accurate and their department gets a free contamination-reduction tool.
3. **Local subreddit / Nextdoor / Buy Nothing group / town Facebook group**: one honest post — "We built a free app that tells you which bin something goes in — it placed 4th nationally in the Congressional App Challenge. Would love feedback." The award is a credibility signal for strangers deciding whether to trust an app with their camera.
4. **Local press**: a one-paragraph pitch to your local paper or patch.com — "local student's award-winning app now live for the whole community" is a genuinely easy local-news story, and local coverage is high-leverage distribution you can't otherwise buy.

**Hour 10 — Measure, fix, write it down**
1. Open PostHog: how many scans? What % 👎? What items fail?
2. Fix the single biggest classifier failure (usually a prompt tweak in `openai_classifier.py`).
3. Start `IMPACT.md` in the repo: launch date, users, scans, accuracy %, quotes from real users, any partnerships. Update weekly — this is the record of whether the thing you built is actually working, independent of any award.

### After the 2 weeks (ongoing, <1 hr/week)
- Weekly: check PostHog, fix one thing, update `IMPACT.md`.
- Once you have real numbers (hundreds of scans, a school or city partnership): consider whether to enter a *new* iteration in the 2026 challenge (deadline **October 26, 2026, 12 pm ET** — re-entry with a live, improved product is allowed and a "now serving N real users" story is stronger than a prototype), but don't let that deadline drive scope — it's optional upside, not the goal.
- *Optional if traction is real*: Play Store listing via [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) TWA wrapper ($25 one-time, ~3 hrs) — makes the app discoverable to people who wouldn't otherwise find a PWA.

---

## 3. Metrics — what to measure and what "working" looks like

| Metric | How measured | 2-week target | End-of-summer target |
|---|---|---|---|
| **Total scans** (north star) | PostHog `scan_result` | 100 | 1,000 |
| **Unique users** | PostHog / Vercel Analytics | 30 | 200 |
| **Classification accuracy** | 👍 / (👍+👎) on `result_feedback` | ≥80% | ≥90% |
| **Scan completion rate** | `scan_result` / `scan_started` | ≥85% (below = camera/latency bug) | ≥90% |
| **Time to result** | PostHog event timestamps | ≤8 s p90 | ≤5 s p90 |
| **Week-2 return rate** | PostHog retention view | ≥15% | ≥25% |
| **Locations page usage** | `locations_viewed` / sessions | ≥10% | ≥15% |
| **PWA installs** | `appinstalled` event listener | 10 | 50 |
| **Community partnerships** | Manual (IMPACT.md) | 1 (school club) | 2–3 (school + city dept.) |
| **Cost per scan** | OpenAI usage dashboard / scans | ≤$0.005 | ≤$0.003 |

**The metric that matters most for real-world impact:** estimated *contamination avoided* — every 👍 on a "this goes in trash/hazardous, not recycling" result is one contamination event prevented. Count those separately; it converts "app usage" into an actual environmental-impact number, which is the thing worth telling a city department or a reporter.

---

## 4. High-impact moves, ranked (if you only do five things)

1. **Ship on a real domain with HTTPS this week.** A live URL changes every conversation from "we built this last year" to "try it right now."
2. **Local rules in the prompt.** Generic recycling advice is a Google search; *your city's* advice is a product people keep coming back to.
3. **The 👍/👎 feedback loop.** It's your accuracy metric, your roadmap, and the proof that this actually helps.
4. **QR poster next to actual bins** (school first, then library/community center — ask permission, they say yes to students, especially with the award behind you). Point-of-confusion distribution beats any social post.
5. **Email the city recycling coordinator and local press.** One real institutional partner or one local news story reaches more people in a week than months of solo posting — and the CAC win is exactly the hook that makes both of those emails easy to write.

## 5. Things to deliberately NOT do in these 10 hours

- Native iOS/Android apps, accounts/login, PocketBase (it's in `package.json` but unused in `src/` — remove the dependency), gamification, multi-city support, fine-tuning your own model, redesigns. All of these are post-traction problems.

---

## Sources

- [Congressional App Challenge — dates & rules](https://www.congressionalappchallenge.us/students/rules/) (2026 deadline Oct 26, 12 pm ET; teams ≤4; any language/platform) — relevant only if you choose to re-enter with a future iteration; not a driver of this plan.
- [Render vs Railway vs Fly.io pricing, 2026](https://dev.to/pavel-hostim/render-vs-railway-vs-flyio-pricing-compared-2026-2e5p) — Render free tier (spins down after 15 min) / $7 Starter; Railway $5 Hobby; Fly.io pay-as-you-go ~$8–25/mo
- [Fly.io pricing](https://fly.io/pricing/)
- OpenAI GPT-4o-mini vision pricing: platform.openai.com/pricing (~$0.001–0.003 per high-detail image at 1280px)
