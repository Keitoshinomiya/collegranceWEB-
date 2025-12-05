# AI Development Guidelines (COLLEGRANCE Webapp)
Last Updated: 2025-12-05 (Ver. 2.0)

## ⚠️ CRITICAL: VISUAL & LOGIC PRESERVATION RULES
The user has strictly approved the current state of the website. Any future AI-driven modifications must adhere to these rules to prevent regression.

### 1. Visual Styling Rules (CSS)

#### A. Typography
*   **Primary Font**: `Zen Kaku Gothic Antique` (sans-serif).
*   **Usage**: Used for Main text, Headings, and English text. Do not revert to `Courier` or `Times`.

#### B. Image Filters (Le Labo Style)
*   **Global Default**: `sepia(10%) grayscale(10%) contrast(95%) brightness(102%)`.
*   **Logo**: `filter: none !important;` (Must remain clear).
*   **Hero Background**:
    *   **PC**: `blur(4px) brightness(0.9) sepia(5%)`.
    *   **Mobile**: `blur(2px) brightness(0.95)` (Reduced blur for clarity).
*   **Vertical Video**: `sepia(10%) grayscale(10%) contrast(95%)`.
*   **Journal Images**: `sepia(5%) grayscale(10%)`.

#### C. Product Cards & Fragrance Notes
*   **PC View (Desktop)**:
    *   **Overlay**: Must extend *below* the card (`min-height: 140%`).
    *   **Grid Layout**: `.notes-row` must use `grid-template-columns: 60px 1fr;` with `gap: 0px;`.
    *   **Alignment**: Labels (TOP/MID) must be close to values.
*   **Mobile View**:
    *   **Overlay Height**: `height: auto !important;` and `min-height: 110%;` (To fit long text).
    *   **Grid Layout**: `grid-template-columns: 45px 1fr;` (Optimized for narrow screens).
    *   **Tap Hint**: "TAP TO VIEW NOTES" pill must be visible on mobile only.

#### D. Delivery Truck Animation
*   **Shape**: **Box Truck** (High cargo area, separate cab).
*   **Components**: Must include `.truck-body`, `.truck-cab` (with window cutout), `.truck-wheel` (with internal spokes), and `.wind-lines`.
*   **Animation**: Bounce (truck) + Spin (wheels) + Flow (wind).
*   **Prohibited**: Do not simplify to a flat SVG or icon. Keep the CSS-constructed shape.

#### E. Filter UI
*   **"ALL" Button**: Must have explicit `color` defined (e.g., `#666` or `var(--color-text-main)`). Do not let it become invisible (white text on white bg).
*   **Layout**: Flex container with wrapping on PC, horizontal scroll on Mobile.

### 2. Logic & Content Rules (JavaScript)

#### A. Journal/Blog Section
*   **Data Source**: `window.journalArticles` (in `assets/js/articles.js`).
*   **Sorting Rule**: **Always sort by Date (Newest First)**.
    *   Logic Location: `assets/js/script.js`.
    *   Code: `sort((a, b) => new Date(b.date) - new Date(a.date))`.
*   **Homepage Display**:
    *   **Limit**: **Latest 6 articles only**.
    *   **Carousel**: Displayed in `.journal-grid` / `#journalTrack`.
*   **Mega Menu**:
    *   **Limit**: **Latest 1 article** (Most recent story).

#### B. Product Filtering
*   **Mechanism**: `data-filter` attribute on buttons vs `data-color` / `data-category` on cards.
*   **Behavior**: Simple show/hide with fade-in animation.

### 3. Development Protocol
1.  **Read First**: Before editing CSS, read `assets/css/styles.css`, especially the **end of the file** where critical specific fixes are stored.
2.  **Append Strategy**: When fixing UI, **append** new rules to the bottom of `styles.css` or specifically target the element. Avoid bulk-replacing large blocks of CSS which might wipe out previous fine-tuning (like the truck animation or mobile note spacing).
3.  **Mobile First Check**: Always verify how changes affect the mobile view (width < 768px), specifically for text overflow in cards and hero section readability.
