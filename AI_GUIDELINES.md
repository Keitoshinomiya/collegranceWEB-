# AI Development Guidelines (UI/UX Visual Lock)

## ⚠️ CRITICAL: VISUAL PRESERVATION RULES
The user has approved the current visual state of the website (as of Dec 2025).
**DO NOT MODIFY** the styling or structure of the following elements unless explicitly instructed by the user. Even during refactoring, these styles must be preserved exactly as they are.

### 1. Product Cards & Fragrance Notes (styles.css)
*   **PC View (Desktop)**:
    *   The layout inside `.notes-overlay` uses a tight Grid layout.
    *   **Requirement**: Keep `.notes-row` as `grid-template-columns: 60px 1fr;` and `gap: 0px;`. The labels (TOP/MID/BASE) must remain close to the values.
*   **Mobile View**:
    *   The note overlay must expand to fit content.
    *   **Requirement**: Keep `.notes-overlay` with `height: auto !important;` and `min-height: 110%;`. Do not revert to fixed height or `100%`.
    *   **Requirement**: Keep grid columns optimized for mobile (`45px 1fr`).

### 2. Delivery Truck Animation (styles.css)
*   **Shape**: The truck must remain a **Box Truck** (high cargo area).
*   **Animation**: Maintain the current `.truck-anim` CSS. Do not simplify it back to a flat shape or remove the window/wheel details.

### 3. Filter Buttons (styles.css)
*   **"ALL" Button**: Must remain visible.
*   **Requirement**: Ensure `.filter-btn` has an explicit `color` property defined to prevent white-text-on-white-background issues.

---

## 🛡️ Development Protocol
When performing future edits:
1.  **Read `assets/css/styles.css` first**.
2.  Pay special attention to the CSS rules appended at the end of the file (Mobile fixes, PC hover fixes).
3.  If modifying CSS, **append** changes or specifically target the class carefully. Do not bulk-replace large sections of CSS if it risks overwriting these specific adjustments.
