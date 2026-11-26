# Sweet Home Chicagoland — Social Feed

Shows the latest @sweethomechicagoland Instagram posts on your websites (e.g. sweethomechicagoland.com), with no paid widget service.

- Every 3 hours, a GitHub Action pulls your latest posts from Instagram and saves copies of the images.
- GitHub Pages hosts the feed and a small embeddable widget.
- Every Monday, a second Action renews your Instagram token so it never expires.

## One-time setup

### 1. Get an Instagram access token
Use the Meta app you already have for Instagram (or create one at developers.facebook.com):

1. **App Dashboard → Instagram → API setup with Instagram login**.
2. The account must be a Business or Creator account (Instagram app → Settings → Account type).
3. Under **Generate access tokens**, add @sweethomechicagoland and click **Generate token**.
   This gives you a long-lived token (about 60 days). The `instagram_business_basic` permission is all this needs.

### 2. Make a GitHub token for the auto-refresh
GitHub → Settings → Developer settings → **Fine-grained tokens** → Generate new token:
- Repository access: **Only this repo** (`shcl-social-feed`)
- Permissions: **Secrets → Read and write**
- Expiration: the longest it allows (set a calendar reminder to renew it)

### 3. Add both as repo secrets
Repo → **Settings → Secrets and variables → Actions → New repository secret**:
| Name | Value |
|---|---|
| `IG_ACCESS_TOKEN` | the Instagram token from step 1 |
| `GH_PAT` | the GitHub token from step 2 |

### 4. Turn on GitHub Pages
Repo → **Settings → Pages → Source: GitHub Actions**.

### 5. Run it
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

Options: `data-count`, `data-columns` (phones always show 2), `data-gap`, `data-radius`,
`data-accent` (button color, e.g. `#0b2545`), `data-follow="false"` to hide the Follow button.
For the iframe, pass the same names in the URL (`?count=6&accent=%230b2545`).

## If something breaks
GitHub emails you when an Action fails.
- **Token expired or invalid:** generate a new Instagram token (step 1) and paste it into the `IG_ACCESS_TOKEN` secret.
- **Refresh job fails at "gh secret set":** the `GH_PAT` token expired. Make a new one (step 2).
