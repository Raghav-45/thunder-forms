# Thunder Forms — TODO

> Product vision: AI-Native Form Builder — "the form builder that thinks for you"

---

## Known Issues / Tech Debt

- No CLAUDE.md, no architecture docs
- README is default Next.js boilerplate — says nothing about the actual product
- Landing page uses placeholder images from shadcnblocks CDN and claims "10k+ users" (likely fake social proof — keep it as it is)
- `FormResponseViewerCard.tsx` uses hardcoded fake data

---

## TODO

### 1. Double-click submit protection
**What:** Add loading state + disable submit button during form submission. Prevent duplicate responses.
**Effort:** S

### 2. Route group rename
**What:** Rename `app/(test)/` to `app/(builder)/` for the builder and `app/(public)/` for form submission pages.
**Effort:** S

### 3. Smart templates gallery
**What:** 8 templates across 5 categories, dashboard page with grid view.
**Effort:** L

### 4. CSV export
**What:** Auth-protected endpoint + download button on responses page.
**Effort:** S

### 5. Form duplication
**What:** API route + button in form table. Copy form record with new ID, append "(Copy)" to title.
**Effort:** S

### 6. Revive templates with AI customization
**What:** Un-comment templates page UI, build template browsing gallery, add AI template customization flow (pick template → AI asks 3 questions about your use case → generates tailored form).
**Why:** Smart templates are a key pillar of the AI-native vision. Guided path for users who don't know what fields they need.
**Effort:** L (1-2 days)
**Depends on:** AI generation fix (#2)
**Context:** DB model already exists (templates table in Prisma schema). UI code is commented out in `app/(app)/templates/page.tsx`.

### 7. CSV/Excel export of form responses
**What:** Add "Download CSV" button on responses page. Convert JSON response data to CSV format, trigger browser download.
**Why:** Table stakes for any form builder. Users collect data to analyze it — if they can't export, they'll use another tool.
**Effort:** S (1 hour)
**Depends on:** Nothing