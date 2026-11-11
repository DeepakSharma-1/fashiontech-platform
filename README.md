# ALOKIT multi-page website prototype

## Pages
- `index.html` — Editorial homepage
- `about.html` — ALOKIT's idea, founder story and principles
- `designs.html` — Clearly labelled illustrative sample designs
- `process.html` — Designer journey and manufacturing process
- `studio.html` — Interactive garment concept editor and designer submission form
- `assets/style.css` — Shared responsive editorial styling

## Design studio features
- Garment choices: T-shirt, hoodie, jacket, jeans, shorts, shirt, sweatshirt, skirt, cap and tote bag
- Garment colour swatches and custom colour
- Surface patterns: solid, stripes, grid and dots
- Fabric/material choices: cotton, organic cotton, jersey, denim, linen, silk, satin, wool, fleece, polyester, canvas, rayon/viscose, leather and cotton-poly blend
- Fabric weight and finish selectors; material choices are included in the local submission JSON
- Interactive drag-to-rotate 360-degree presentation, front/back views and auto-spin
- Make your own freeform product canvas
- Draw and erase tools
- Upload artwork and add text
- Download a preview
- Finish design opens a designer submission form
- Required identity/contact details, typed signature, requested production quantity (minimum 10), originality confirmation and consent to review
- Form creates a local JSON record for download

## Important prototype limitations
This is a static prototype. The form does not transmit or store personal data on a server. The JSON record and design preview are generated locally in the browser. Before accepting real submissions, connect a secure backend, access controls, storage, spam protection, a privacy notice and a retention/deletion process. The garment editor is a visual concept mockup, not a production-ready pattern or technical pack. Its 360-degree interaction rotates the 2D mockup in a 3D-style presentation; it is not a photorealistic 3D garment mesh. The custom product option is a freeform drawing canvas. Fabric/material selections are concept preferences only; final material availability, composition, weight and finish must be confirmed with a manufacturer and swatch samples. The uploaded artwork preview is a placement visual; the downloadable preview includes the garment and drawing canvas but may not perfectly composite uploaded art on every browser.

## Publish on GitHub Pages
Upload all files and folders in this project to the root of `DeepakSharma-1/fashiontech-platform`. In Settings → Pages, select Deploy from a branch, branch `main`, folder `/ (root)`.


Studio v4: the Make your own workspace is a clean blank canvas. Selecting it disables product rotation and enables direct pointer drawing, erasing and clearing. The instructional placeholder text has been removed.


## Supabase-connected build (v5 integration)
New pages:
- `account.html` — designer sign-up and login
- `admin.html` — founder-only submissions dashboard

New scripts:
- `assets/supabase-config.js` — public project URL and publishable key placeholders
- `assets/supabase-client.js` — shared Supabase client
- `assets/auth.js` — designer authentication and profile setup
- `assets/alokit-studio-backend.js` — saves profiles, designs, private previews, submissions and consent records
- `assets/admin.js` — founder-only dashboard

### Required setup before testing
1. In `assets/supabase-config.js`, replace the two placeholders with the Supabase Project URL and **publishable** key (or legacy anon key).
2. Never put a Supabase secret/service_role key, database password, or personal access token in frontend files or GitHub.
3. Run `supabase-setup-v2.sql` once in the Supabase SQL Editor.
4. In Supabase Authentication settings, configure the Site URL and allowed redirect URLs for your local test URL and final GitHub Pages URL.
5. Create a designer account through `account.html`, verify the email if confirmation is enabled, and log in.
6. Test one design submission with a test account before inviting real designers.

### Current integration behavior
- Studio submissions require a signed-in designer account.
- Designer profile, design, submission and consent records are written to Supabase.
- A PNG preview is uploaded to the private `designer-artwork` bucket under the designer's user ID.
- The form enforces a minimum requested quantity of 10.
- The founder dashboard checks `is_alokit_admin()` before reading records.
- The frontend uses only the Supabase publishable/anon key; RLS remains the access-control boundary.

### Important launch limitations
- This is an initial integration, not a completed production security review.
- Do not collect real customer data until you have tested email verification, RLS with a second non-admin account, storage access isolation, and GitHub Pages redirects.
- The current studio stores the composed preview image. It does not yet persist editable drawing layers or the original uploaded artwork as separate files.
- Add rate limiting / CAPTCHA and a server-side submission endpoint before opening public signups widely.
- Publish a privacy notice and obtain appropriate consent before collecting personal data.
