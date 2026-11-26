// Extends the Instagram long-lived token (good for 60 days) and prints the new one.
// The workflow saves the result back into the repo's IG_ACCESS_TOKEN secret.
const TOKEN = process.env.IG_ACCESS_TOKEN;
if (!TOKEN) {
  console.error("Missing IG_ACCESS_TOKEN");
  process.exit(1);
}

const url = new URL("https://graph.instagram.com/refresh_access_token");
url.searchParams.set("grant_type", "ig_refresh_token");
url.searchParams.set("access_token", TOKEN);

const res = await fetch(url);
const body = await res.json();
if (!res.ok || !body.access_token) {
  console.error(`Token refresh failed: ${JSON.stringify(body.error || body)}`);
  process.exit(1);
}

const days = Math.round((body.expires_in || 0) / 86400);
console.error(`Token refreshed; valid for about ${days} more days.`);
process.stdout.write(body.access_token);
