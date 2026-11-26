// Pulls your latest Instagram posts and writes docs/feed.json + local image copies.
// Instagram's own media URLs expire, so every image is saved into docs/media/.
// Usage: IG_ACCESS_TOKEN=... node scripts/fetch-instagram.mjs
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const TOKEN = process.env.IG_ACCESS_TOKEN?.trim();
const LIMIT = Number(process.env.FEED_LIMIT || 24);
// Two token types work:
//  - Instagram-login tokens (start with "IG") -> graph.instagram.com, account = "me"
//  - Meta business / system-user tokens (never expire) -> graph.facebook.com, account = IG_USER_ID
const IS_IG_TOKEN = TOKEN?.startsWith("IG");
const API =
  process.env.IG_API_BASE || (IS_IG_TOKEN ? "https://graph.instagram.com" : "https://graph.facebook.com/v21.0");
const ACCOUNT = IS_IG_TOKEN ? "me" : process.env.IG_USER_ID || "17841414618981349"; // @sweethomechicagoland
const DOCS = path.resolve("docs");
const MEDIA_DIR = path.join(DOCS, "media");

if (!TOKEN) {
  console.error("Missing IG_ACCESS_TOKEN");
  process.exit(1);
}

async function api(endpoint, params = {}) {
  const url = new URL(`${API}${endpoint}`);
  for (const [k, v] of Object.entries({ ...params, access_token: TOKEN })) url.searchParams.set(k, v);
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || body.error) {
    throw new Error(`Instagram API error on ${endpoint}: ${JSON.stringify(body.error || body)}`);
  }
  return body;
}

// Pick the still image to show for each post type.
function pickImage(item) {
  if (item.media_type === "VIDEO") return item.thumbnail_url || null;
  if (item.media_type === "CAROUSEL_ALBUM") {
    if (item.media_url && !/\.mp4/i.test(item.media_url)) return item.media_url;
    const first = item.children?.data?.[0];
    if (!first) return item.thumbnail_url || null;
    return first.media_type === "VIDEO" ? first.thumbnail_url : first.media_url;
  }
  return item.media_url || null;
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image download failed (${res.status})`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

const profile = await api(`/${ACCOUNT}`, { fields: "username" });
const media = await api(`/${ACCOUNT}/media`, {
  fields:
    "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url,thumbnail_url}",
  limit: String(LIMIT),
});

await mkdir(MEDIA_DIR, { recursive: true });
const items = [];
for (const item of media.data || []) {
  const src = pickImage(item);
  if (!src) {
    console.warn(`Skipping ${item.id}: no image available`);
    continue;
  }
  const file = `${item.id}.jpg`;
  try {
    await download(src, path.join(MEDIA_DIR, file));
  } catch (err) {
    console.warn(`Skipping ${item.id}: ${err.message}`);
    continue;
  }
  items.push({
    id: item.id,
    type: item.media_type === "VIDEO" ? "reel" : item.media_type === "CAROUSEL_ALBUM" ? "carousel" : "image",
    caption: item.caption || "",
    permalink: item.permalink,
    timestamp: item.timestamp,
    image: `media/${file}`,
  });
}

if (items.length === 0) {
  console.error("No posts came back — leaving the existing feed untouched.");
  process.exit(1);
}

// Remove images for posts that dropped out of the feed.
const keep = new Set(items.map((i) => `${i.id}.jpg`));
for (const f of await readdir(MEDIA_DIR)) {
  if (f.endsWith(".jpg") && !keep.has(f)) await rm(path.join(MEDIA_DIR, f));
}

const feed = { username: profile.username, profile_url: `https://www.instagram.com/${profile.username}/`, items };
await writeFile(path.join(DOCS, "feed.json"), JSON.stringify(feed, null, 2) + "\n");
console.log(`Saved ${items.length} posts for @${profile.username}`);
