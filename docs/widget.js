/*
 * Sweet Home Chicagoland social feed widget.
 * Paste onto any page:
 *   <div data-social-feed data-count="9" data-columns="3"></div>
 *   <script src="https://chrisgrano.github.io/shcl-social-feed/widget.js" async></script>
 *
 * Options (all optional, set as data- attributes on the div):
 *   data-count     number of posts to show (default 9)
 *   data-columns   columns on desktop (default 3; phones always use 2)
 *   data-gap       space between tiles in px (default 6)
 *   data-radius    corner rounding in px (default 4)
 *   data-follow    "false" hides the Follow button
 *   data-accent    button color (default #111)
 */
(function () {
  var script = document.currentScript;
  var base = script ? script.src.replace(/widget\.js(\?.*)?$/, "") : "";
  var feedPromise;

  function loadFeed() {
    if (!feedPromise) {
      feedPromise = fetch(base + "feed.json", { cache: "no-cache" }).then(function (r) {
        if (!r.ok) throw new Error("feed " + r.status);
        return r.json();
      });
    }
    return feedPromise;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var ICONS = {
    reel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M8 5v14l11-7z"/></svg>',
    carousel:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M4 8h10v12H4zM8 4h12v12h-2V6H8z"/></svg>',
  };

  function render(el, feed) {
    var count = parseInt(el.dataset.count, 10) || 9;
    var cols = parseInt(el.dataset.columns, 10) || 3;
    var gap = parseInt(el.dataset.gap, 10);
    if (isNaN(gap)) gap = 6;
    var radius = parseInt(el.dataset.radius, 10);
    if (isNaN(radius)) radius = 4;
    var accent = el.dataset.accent || "#111";
    var showFollow = el.dataset.follow !== "false";

    var css =
      ":host{display:block;font-family:inherit}" +
      ".grid{display:grid;grid-template-columns:repeat(" + cols + ",1fr);gap:" + gap + "px}" +
      "@media(max-width:600px){.grid{grid-template-columns:repeat(2,1fr)}}" +
      "a.tile{position:relative;display:block;aspect-ratio:1/1;overflow:hidden;border-radius:" + radius + "px;background:#eee}" +
      "a.tile img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s}" +
      "a.tile:hover img,a.tile:focus img{transform:scale(1.05)}" +
      ".badge{position:absolute;top:8px;right:8px;width:22px;height:22px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))}" +
      ".cap{position:absolute;inset:0;display:flex;align-items:flex-end;padding:12px;box-sizing:border-box;" +
      "background:linear-gradient(transparent 40%,rgba(0,0,0,.75));color:#fff;font-size:13px;line-height:1.35;" +
      "opacity:0;transition:opacity .25s}" +
      ".cap span{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}" +
      "a.tile:hover .cap,a.tile:focus .cap{opacity:1}" +
      ".follow{display:flex;justify-content:center;margin-top:16px}" +
      ".follow a{background:" + accent + ";color:#fff;text-decoration:none;padding:10px 22px;border-radius:999px;font-size:14px;font-weight:600}";

    var tiles = feed.items.slice(0, count).map(function (p) {
      var alt = p.caption ? p.caption.slice(0, 120) : "Instagram post by @" + feed.username;
      return (
        '<a class="tile" href="' + esc(p.permalink) + '" target="_blank" rel="noopener">' +
        '<img src="' + esc(base + p.image) + '" alt="' + esc(alt) + '" loading="lazy">' +
        (ICONS[p.type] ? '<span class="badge">' + ICONS[p.type] + "</span>" : "") +
        (p.caption ? '<span class="cap"><span>' + esc(p.caption) + "</span></span>" : "") +
        "</a>"
      );
    });

    var follow = showFollow
      ? '<div class="follow"><a href="' + esc(feed.profile_url) + '" target="_blank" rel="noopener">Follow @' +
        esc(feed.username) + " on Instagram</a></div>"
      : "";

    var root = el.shadowRoot || el.attachShadow({ mode: "open" });
    root.innerHTML = "<style>" + css + '</style><div class="grid">' + tiles.join("") + "</div>" + follow;
  }

  function init() {
    var els = document.querySelectorAll("[data-social-feed]:not([data-feed-ready])");
    if (!els.length) return;
    loadFeed()
      .then(function (feed) {
        els.forEach(function (el) {
          el.setAttribute("data-feed-ready", "");
          render(el, feed);
        });
      })
      .catch(function (err) {
        console.warn("Social feed failed to load:", err);
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
