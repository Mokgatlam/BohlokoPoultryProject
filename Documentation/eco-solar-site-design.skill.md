# Skill: "Earthon-style" Eco/Solar Site Design

Use this skill when building landing pages for sustainability, energy, climate-tech, or
agritech brands that want a clean, confident, nature-tech look (dark hero → white body →
black footer sandwich, yellow accent, pill-shaped everything).

## 1. Color System

```css
--color-bg:        #ffffff;   /* main background */
--color-ink:       #0e0e0e;   /* near-black text / footer bg */
--color-muted:     #656565;   /* secondary text */
--color-muted-2:   #979797;   /* tertiary text */
--color-hairline:  #d7d7d7;   /* borders on white */
--color-hairline-dark: #262626; /* borders on black */
--color-surface:   #f6f6f6;   /* card surface on white */
--color-surface-2: #fafafa;
--color-accent:    #fff017;   /* signature yellow-green, the ONLY accent color */
```

Rules:
- Exactly one accent color. It is used for: primary CTA fill, icon-chip backgrounds inside
  dark cards, active step indicators, gradient overlay at page seams.
- Never tint the accent — use it flat at 100% or fade it to transparent in gradients only.
- Body sections alternate white → black → white → black (footer) to create rhythm; never
  more than two consecutive sections of the same background.

## 2. Gradients (the site's signature move)

Three gradient patterns, all directional and subtle — gradients are used as *transitions*
between sections, not as decoration on their own.

1. **Hero darken overlay** (puts text on top of a photo):
   `background: linear-gradient(180deg, rgba(14,14,14,0) 0%, rgba(14,14,14,0.55) 100%);`
   Place as a full-bleed absolutely-positioned div over the hero photo, behind the text.

2. **Section-seam fade to black** (used right before a dark band begins, so the white
   section visually "melts" into the black one):
   `background: linear-gradient(180deg, rgba(13,13,13,0) 0%, #0e0e0e 100%);`
   Height ≈ 40–45% of the dark section, positioned at the bottom of the section above it,
   slightly overscaled in width (103–106%) so it has no visible hard edge.

3. **Accent glow under the footer band** (a soft colored horizon line):
   `background: linear-gradient(180deg, rgba(255,240,23,0) 0%, #fff017 100%); opacity: 0.2;`
   Thin strip, placed at the very bottom edge of the final dark section, behind content.

Implementation note: always pair a gradient div with a sibling photo/solid layer underneath
— gradients sit in their own absolutely-positioned div, never as a CSS background directly
on a flex container that also holds text (keeps stacking/opacity transitions clean).

## 3. Buttons — shape, states, and the signature "morph" hover

All buttons are full pill (`border-radius: 50px`), and there are exactly three variants:

- **Primary (white or yellow fill)** — used in hero / on dark backgrounds.
- **Accent (yellow fill, `#fff017`)** — main conversion CTA everywhere on white sections.
- **Dark (black fill, white text)** — secondary CTA, used for "Read more" type actions.

### Anatomy
A button is two layers stacked: a static label, and a circular icon-chip (also accent-
colored) holding a right-pointing arrow, sitting flush against the right edge of the label
at rest:

```
[ Label text ]( →-chip )
```

### The hover interaction (the thing that makes it feel "alive")
On hover, three things happen together, all on a short spring/ease (180–250ms):
1. The label text doesn't just sit there — a **duplicate label slides up and out** while a
   second copy slides in from below, like a flip/odometer reveal (translateY ±30px,
   opacity 0→1 cross-fade). This is the "double text" trick: render the label twice,
   position one above and one below at rest with opacity logic, then transform both up on
   `:hover`.
2. The circular icon-chip **expands to fill the entire button** as its own background
   layer underneath, sliding/scaling in from the right edge (width 100%, height grows
   ~200–300%, positioned to bleed out top, originating from the chip's location) — this is
   what makes the whole pill "light up" on hover without an actual background-color
   transition (avoids flat color flash, feels like a wipe).
3. The arrow icon's chip itself shifts position slightly (it appears to "pop" from sitting
   inside the label to floating at the trailing edge).

Minimal CSS approximation if you don't want the layered trick:
```css
.btn-pill {
  position: relative;
  overflow: hidden;
  border-radius: 50px;
  padding: 8px 20px 8px 5px;
  display: inline-flex;
  align-items: center;
  gap: 0;
  transition: gap 200ms ease;
}
.btn-pill__fill {
  position: absolute;
  inset: 0;
  background: var(--color-accent);
  transform: scaleY(0.3) translateY(40%);
  transition: transform 220ms cubic-bezier(.2,.8,.2,1);
}
.btn-pill:hover .btn-pill__fill { transform: scaleY(1) translateY(0); }
.btn-pill__icon {
  position: relative;
  z-index: 1;
  border-radius: 50%;
  width: 30px; height: 30px;
  display: grid; place-items: center;
}
```

### Buttons that are NOT pills
- FAQ accordion rows: rounded-rect (16px radius), full-width, plus→x icon morph on open
  (the "+" icon literally redraws: vertical stroke fades out while horizontal stroke
  stays — implement as two `<path>`s in one SVG, animate the vertical one's opacity/scaleY
  on toggle).
- Tab/process step buttons: pill again, but only the *active* one is filled with white +
  yellow number-badge; inactive ones are outline-only on the dark background.

## 4. Scroll & reveal motion (site-wide rhythm)

Every section title, paragraph, image, and card group follows the same entrance recipe —
consistency here is what makes the site feel "designed" rather than animated piecemeal:

```
initial: { opacity: 0, transform: translateY(50px) }
animate (on enter viewport): { opacity: 1, transform: translateY(0) }
ease: spring(damping: 60, stiffness: 400) OR cubic-bezier(.16,1,.3,1)
stagger: ~80–120ms between siblings in the same group
```

Apply this to: section heading, supporting paragraph, button row, then each card/column —
in that order, top to bottom, left to right. Never animate more than ~6 siblings
independently; group large lists (e.g. icon-feature rows) as a single block.

Counters (the "X / +83 / 70%" stat numbers) count up from 0 to the target value while
scrolling into view, monospace/tabular-nums so digits don't jiggle widths.

Slideshow/carousel cards (service cards, results cards, process step images) use a
horizontal-scroll-snap container with small dot pagination at the bottom-center, dots at
opacity 1 (active) / 0.5–0.7 (inactive), no arrows shown until hover on desktop.

## 5. Layout grammar

- Max content width: 1280px, with side gutters 20–30px mobile, 30px tablet, 30px+ desktop.
- Section vertical padding: 60–120px (more on desktop, compresses to 30–60px on mobile).
- Header: floating pill nav, fixed/sticky, frosted (`backdrop-filter: blur(45px)`), sits
  ~20–32px from the top, NOT full-width edge-to-edge — it's an island.
- Two-column sections (text+image) always put the heading/copy on one side, a single large
  rounded-corner (16–24px) photo or stat block on the other; alternate which side per
  section for visual rhythm (don't put image-right every time).
- Cards: `border-radius: 16–24px`, either:
  - light card on white surface (`#f6f6f6`) with hairline border, or
  - dark card (`#0e0e0e`) with a yellow icon-chip and white heading, used to show
    contrast/impact pairs side-by-side (e.g. "before/after", "this/not just that").
- Footer: full-bleed black band, background photo + dark overlay + the accent glow
  gradient at the very bottom edge; contains newsletter form (pill input + dark pill
  button), 3-column sitemap, and circular outline social icons.

## 6. Typography

- Display headings: 60–80px desktop / 36–40px mobile, tight tracking (`-0.02em`), a
  rounded geometric sans (Urbanist or similar weight 500/700).
- Body copy: 16–20px, a humanist sans (Inter-class), weight 400–600, line-height ~140%.
- Headings are always set on a *single accent word or none at all* — don't color individual
  words; let the yellow live only in UI chrome, not inline text spans.
- Eyebrow/label text above a section heading: small, muted-gray, sometimes wrapped in
  literal `[ ]` bracket characters as a faux-breadcrumb ("[ Home ] [ Residential ]") — use
  this bracket motif sparingly, max one row per page.

## 7. Iconography (no emoji — ever)

Use a single consistent **line/duotone icon set** (Lucide, Phosphor, or custom SVG at
24–40px) for: sun/panel, leaf, battery, recycling/cycle, building, chart, document, social
glyphs. Icons sit inside a colored chip:
- on white sections: black chip + yellow icon, OR yellow chip + black icon
- on dark sections: black chip + yellow icon (chips are circular, 48–64px, radius 50%
  unless paired with text where they're squircle 8–16px radius)

Never use Unicode emoji for bullets, list markers, or section dividers — always a real SVG
icon or a typographic character (•, →, [ ]) consistent with the rest of the kit.

## 8. Imagery

Photography style: warm/golden daylight, real solar installations, farmland, skyline shots,
slight desaturation, consistent crop ratio per row (don't mix square + tall + wide
randomly inside one grid — pick one asymmetric trio like `landscape / tall-portrait /
landscape` and repeat that exact pattern wherever a 3-image cluster appears).

For sourcing/generating these images in an Artifact or page build, use whatever image
generation or stock-search tool is available in your environment (e.g. an image-generation
MCP connector if the user has one connected, or licensed stock photography) — request:
"golden-hour solar panel field, wide landscape, documentary photography, no people" style
prompts, and keep every image in the same color grade so the page reads as one shoot.

## 9. Build checklist

When implementing a page with this skill:
- [ ] Pick the single accent color and use it nowhere else but CTAs/chips/glow gradients
- [ ] Header is a floating frosted pill, not edge-to-edge
- [ ] Hero photo has the dark bottom-gradient overlay, headline + 1-line subcopy + CTA only
- [ ] Every section transition uses the fade-to-black or fade-to-white seam gradient, not a
      hard color cut
- [ ] Buttons use the double-text-flip + expanding-chip hover (or the simplified CSS
      fallback above) — never a flat background-color hover transition
- [ ] Scroll-reveal is fade+translateY(50px) on every section, staggered by sibling
- [ ] Stat numbers count up, tabular-nums
- [ ] FAQ uses plus→cross icon morph, not a chevron rotate
- [ ] Zero emoji anywhere — icons only
- [ ] Footer is black, has the bottom accent-glow gradient line, newsletter pill form,
      3-column link grid, circular outline social icons
