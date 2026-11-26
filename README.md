# Sweet Home Chicagoland — Social Feed

Shows the latest @sweethomechicagoland Instagram posts on your websites (e.g. sweethomechicagoland.com), with no paid widget service.

- Every 3 hours, a GitHub Action pulls your latest posts from Instagram and saves copies of the images.
- GitHub Pages hosts the feed and a small embeddable widget.
- It uses a never-expiring Meta token, so there's nothing to renew. A weekly job keeps the schedule from being paused for inactivity.

## One-time setup

### 1. Instagram access token
Meta app **SHCL Social Feed** (business portfolio: Chris Grano, Realtor) → Use cases → Instagram API →
**API setup with Unified login** → **2. Generate access tokens** → **Generate token** for @sweethomechicagoland.
This token never expires.

### 2. Save it as a repo secret
Repo → **Settings → Secrets and variables → Actions → New repository secret**:
name `IG_ACCESS_TOKEN`, value = the token.

(A `GH_PAT` secret is only needed if you ever switch to an expiring Instagram-login token, which starts with "IG".
The weekly job then renews it automatically.)

### 3. Turn on GitHub Pages
Repo → **Settings → Pages → Source: GitHub Actions**.

### 4. Run it
Repo → **Actions → Update Instagram feed → Run workflow**.
When it finishes, open `https://chrisgrano.github.io/shcl-social-feed/` to see the preview and copy the embed code.

## Putting it on your website

**Script embed (preferred).** Paste this into a custom HTML / code block:
```html
<div data-social-feed data-count="9" data-columns="3"></div>
<script src="https://chrisgrano.github.io/shcl-social-feed/widget.js" async></script>
```

**Iframe (if the site builder blocks scripts):**
```html
<iframe src="https://chrisgrano.github.io/shcl-social-feed/embed.html?count=9&columns=3"
        style="width:100%;border:0;height:1100px" loading="lazy"></iframe>
```

**Showcase (styled header + swipeable tall cards with view counts):**
```html
<div data-social-feed data-layout="showcase"></div>
<script src="https://chrisgrano.github.io/shcl-social-feed/widget.js" async></script>
```
Change the wording/colors with `data-eyebrow`, `data-title`, `data-title-highlight`, `data-title-color`,
`data-highlight-color`, `data-eyebrow-color`; `data-per-view` sets how many cards show on desktop (default 5).

**Swipeable single row (carousel):**
```html
<div data-social-feed data-layout="carousel" data-shape="tall" data-count="15"></div>
<script src="https://chrisgrano.github.io/shcl-social-feed/widget.js" async></script>
```

Options: `data-layout` (`grid` or `carousel`), `data-shape` (`square`, `portrait` 4:5, `tall` 9:16),
`data-count`, `data-columns` (grid; phones always show 2), `data-tile-width` (carousel, px), `data-gap`, `data-radius`,
`data-accent` (button color, e.g. `#0b2545`), `data-follow="false"` to hide the Follow button.
For the iframe, pass the same names in the URL (`?count=6&accent=%230b2545`).

## If something breaks
GitHub emails you when an Action fails.
- **Token rejected:** the app was removed, or @sweethomechicagoland's access to it changed. Generate a new token (step 1) and replace the `IG_ACCESS_TOKEN` secret.
