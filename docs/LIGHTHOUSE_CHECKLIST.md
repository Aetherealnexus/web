# Lighthouse Quick Audit Checklist — Aethereal Nexus

Run `lhci autorun` in CI or `npx -y lighthouse http://localhost:8080` locally.

Priority fixes (high → low)

1. LCP (Largest Contentful Paint)
   - Ensure hero/branding assets are preloaded and use modern formats (`.webp`/`.avif`/`.woff2`).
   - Inline critical CSS for above-the-fold content (done minimally in `index.html`).
   - Defer or idle-load heavy JS bundles (main app now loaded with requestIdleCallback).

2. CLS (Cumulative Layout Shift)
   - Provide intrinsic width/height for images and media. Add `width`/`height` or CSS aspect boxes.
   - Ensure canvas elements have `width`/`height` attributes (canvas already sized).
   - Avoid inserting content above existing content without reserving space.

3. Accessibility (a11y)
   - Ensure landmark roles and skip links are present (skip link added).
   - Ensure focus states are visible and focus is managed for modals/reading panel (implemented).
   - Provide meaningful alt text for images and labels for interactive controls.

4. Best practices & Performance
   - Serve fonts as `.woff2` with `font-display: swap` (CSS updated; run font conversion script and commit `.woff2` or host externally).
   - Use long-term caching and content-hashed filenames for `app.js`/CSS in production.
   - Remove unused JS or split code into smaller chunks.

5. SEO
   - Hreflang and canonical are set; ensure sitemap and robots reflect correct domains.
   - Provide structured data (already present) and keep social images optimized.

How to run locally

```bash
# from web/
python -m http.server 8080 &
# then in another terminal
npx -y lighthouse http://localhost:8080 --output html --output-path=./lighthouse-report.html
```

Using CI

- Open a branch and push a PR. The provided GitHub Actions workflow will run LHCI and pa11y and attach results.

Suggested next PRs

- Convert Playfair fonts to `.woff2` and commit or host externally.
- Add asset hashing + caching headers (requires server config).
- Generate optimized hero/social images (`.webp`/`.avif`) and update `og:image` and preloads.
- Generate optimized hero/social images (`.webp`/`.avif`) and update `og:image` and preloads. See `scripts/convert-images.*` for helpers.
