# Sharp-Thesis Validator Examples

Reference examples for pass/fail behavior across industries and modes.

---

## Enchantents (B2B Glamping/Resort Development)

### Long-form PASS

| Input | Result | Reason |
|-------|--------|--------|
| "Why cheap glamping fabric costs more than hurricane damage" | PASS | Single claim (fabric > hurricane cost), number ($168,960 vs $25K), urgency (tropical UV 2x faster), 56 chars |
| "The 6-unit resort that pays back in 14 months" | PASS | Claim (pays back fast), number (6-unit, 14 months), urgency (payback window), 44 chars |
| "How one developer's 44,000-person waitlist terrifies hotel chains" | PASS | Claim (waitlist threatens hotels), number (44,000), urgency (competitive threat), 64 chars |
| "Why skipping glamping tent maintenance costs $25,000 per unit per season" | PASS | Claim (skipping maintenance costs), number ($25,000), urgency (per season), 68 chars |

### Long-form FAIL

| Input | Failed Criteria | Why |
|-------|-----------------|-----|
| "Glamping tents are durable" | 1, 2, 3 | Descriptive, no number, no urgency |
| "All about glamping fabric options" | 1, 2, 3 | Survey topic, no claim, no number, no urgency |
| "Why you need marine-grade acrylic" | 1, 3 | "Why you need" is not a claim; no urgency |
| "The ultimate guide to glamping tent fabrics" | 1, 2, 3 | Survey, no claim, no number, no urgency |
| "Glamping fabric durability matters" | 1, 2, 3 | Descriptive, no concrete number, no urgency |

### Social PASS

| Input | Result | Reason |
|-------|--------|--------|
| "Survived 3 hurricane seasons with zero patches. This $2,800 fabric isn't cheap — it's cheap to replace." | PASS | Claim (fabric survives), number ($2,800), urgency relaxed (social), 108 chars |
| "6-unit resort saves $152K/decade by buying the right fabric once. Thread: why most get this wrong." | PASS | Claim (saves money), number ($152K, decade), urgency relaxed, 95 chars |

### Social FAIL

| Input | Failed Criteria | Why |
|-------|-----------------|-----|
| "Our glamping tents are the best! DM for details." | 1, 2 | No arguable claim, no concrete number |
| "Check out our new glamping collection!" | 1, 2, 3 | Promotional, no claim, no number, no urgency |
| "Glamping fabric tips 🧵" | 1, 2 | Topic, not claim; no number |

---

## Nomadixgear (DTC Consumer Gear)

### Long-form PASS

| Input | Result | Reason |
|-------|--------|--------|
| "The $400 tent that survived 3 seasons without a single patch" | PASS | Claim (outperforms), number ($400, 3 seasons), urgency (seasonal), 60 chars |
| "Why your $800 sleeping bag fails at 30°F (and the $120 one that doesn't)" | PASS | Comparative claim, numbers ($800, $120, 30°F), urgency (winter approaching), 72 chars |
| "The 48-hour break-in protocol that adds 3 years to tent lifespan" | PASS | Claim (protocol extends life), number (48 hours, 3 years), urgency (before season), 62 chars |

### Long-form FAIL

| Input | Failed Criteria | Why |
|-------|-----------------|-----|
| "Best camping tents for 2026" | 1, 2, 3 | Survey, no claim, no number, no urgency |
| "How to choose a tent fabric" | 1, 2, 3 | Instructional, no claim, no number, no urgency |

### Social PASS

| Input | Result | Reason |
|-------|--------|--------|
| "3 seasons, 0 patches, 1 $400 tent. The math is brutal. 🧮 Thread:" | PASS | Claim (tent lasts), numbers (3, 0, $400), urgency relaxed, 64 chars |
| "Stop buying $120 sleeping bags that fail at 30°F. This $800 one saves you $2,400 in replacements. 🔥" | PASS | Claim (cheap costs more), numbers ($120, 30°F, $800, $2,400), urgency relaxed, 98 chars |

---

## AIwithJai (Content/AI Consulting)

### Long-form PASS

| Input | Result | Reason |
|-------|--------|--------|
| "AI already outsells developers who ignore it" | PASS | Claim (AI beats humans), implied number (market data), urgency (competitive), 48 chars |
| "The 3-degree gap that costs $7,200/month in lost bookings" | PASS | Claim (gap costs money), numbers (3-degree, $7,200), urgency (monthly loss), 56 chars |
| "Why your content pipeline loses $50K/year to AI slop" | PASS | Claim (pipeline loses money), number ($50K/year), urgency (annual loss), 52 chars |

### Long-form FAIL

| Input | Failed Criteria | Why |
|-------|-----------------|-----|
| "AI tools for content creation" | 1, 2, 3 | Survey, no claim, no number, no urgency |
| "Why AI is important for creators" | 1, 3 | "Why X is important" = not a claim; no urgency |

### Social PASS

| Input | Result | Reason |
|-------|--------|--------|
| "Your content pipeline loses $50K/year to AI slop. Here's the 3-step fix I gave a client last week 🧵" | PASS | Claim (pipeline loses), number ($50K), urgency relaxed, 98 chars |
| "3-degree gap = $7,200/month lost bookings. The fix takes 2 hours. 🔥" | PASS | Claim (gap costs), numbers (3-degree, $7,200, 2 hours), urgency relaxed, 72 chars |

---

## Universal Weak → Sharp Patterns

| Weak Topic (always FAIL) | Sharp Reframe (PASS template) |
|--------------------------|-------------------------------|
| "X is important" | "Why ignoring X costs $Y/month" |
| "All about X" | "The $X mistake that Y every Z" |
| "Why you need X" | "X beats Y because Z (data: $A vs $B)" |
| "Guide to X" | "The $X shortcut that saves Y hours" |
| "Best practices for X" | "The 1 rule that separates $X winners from $Y losers" |
| "How to do X" | "Why your X fails at [metric] (and the fix)" |

---

## Number Detection Patterns (Criterion 2)

| Pattern | Example Matches |
|---------|-----------------|
| Currency | $1,200, $2,800, $168,960, USD 50000, €450, £3000 |
| Percentage | 60%, 91 percent, 41% reduction, 10x |
| Timeframe | 18 months, 3 years, 6 months, 14 days, 48 hours |
| Count | 6 units, 44,000 people, 3 replacements, 5x ROI |
| Ratio | 10:1, 3:1, 60/40 split |

---

## Urgency Detection Patterns (Criterion 3)

| Type | Example Matches |
|------|-----------------|
| Seasonal | "before hurricane season", "this summer", "winter approaching" |
| Deadline | "by 2026", "Q1 deadline", "before the regulation changes" |
| Market shift | "new competitor", "market shifting", "demand surged 91%" |
| Competitor | "terrifies hotel chains", "disrupting the market", "first to market" |
| Data | "new study shows", "latest data reveals", "2026 survey finds" |
| Product | "just launched", "version 2.0", "new release" |

---

## Title Length Edge Cases

| Title | Chars | long-form (80) | social (280) |
|-------|-------|----------------|--------------|
| "Why cheap glamping fabric costs more than hurricane damage" | 56 | ✅ | ✅ |
| "The $2,800 cover that outlasts 5 cheaper replacements" | 52 | ✅ | ✅ |
| "AI already outsells developers who ignore it" | 48 | ✅ | ✅ |
| "Survived 3 hurricane seasons with zero patches. This $2,800 fabric isn't cheap — it's cheap to replace." | 108 | ❌ | ✅ |
| "Your content pipeline loses $50K/year to AI slop. Here's the 3-step fix I gave a client last week" | 94 | ❌ | ✅ |

---

## Brand-Specific Banned Patterns (Claims Blacklist)

### Enchantents (from brand-overrides.md + landscape.md)
- "geodesic dome" / "PVDF" / "PVC" / "cotton canvas" / "yurt" / "pod"
- "indestructible" / "hurricane-proof" / "lifetime guarantee"
- "the best" / "perfect" / "flawless" / "ultimate"

### Nomadixgear (from brand-overrides.md)
- "military-grade" (unless spec-verified)
- "indestructible" / "lifetime"
- "cheapest" / "lowest price"

### AIwithJai (from brand-overrides.md)
- "guaranteed results" / "10x guaranteed"
- "no code required" (unless literally true)
- "replaces developers" / "fire your team"

---

## Test Commands

```bash
# Test long-form PASS
sharp-thesis-validator "Why cheap glamping fabric costs more than hurricane damage" --brand enchantents --mode long-form

# Test long-form FAIL
sharp-thesis-validator "Glamping tents are durable" --brand enchantents --mode long-form

# Test social PASS
sharp-thesis-validator "Survived 3 hurricane seasons with zero patches. This $2,800 fabric isn't cheap — it's cheap to replace." --brand nomadixgear --mode social

# Test social FAIL
sharp-thesis-validator "Our glamping tents are the best! DM for details." --brand nomadixgear --mode social

# Test without brand (universal only)
sharp-thesis-validator "The 3-degree gap that costs $7,200/month in lost bookings" --mode long-form

# Test with thesis-config override
sharp-thesis-validator "Short thesis" --brand enchantents --mode long-form
```