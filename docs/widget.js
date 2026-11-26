/*
 * Sweet Home Chicagoland social feed widget.
 * Paste onto any page:
 *   <div data-social-feed data-count="9" data-columns="3"></div>
 *   <script src="https://chrisgrano.github.io/shcl-social-feed/widget.js" async></script>
 *
 * Options (all optional, set as data- attributes on the div):
 *   data-layout    "grid" (default) or "carousel" (one swipeable row)
 *   data-count     number of posts to show (default 9 grid / 12 carousel)
 *   data-columns   grid only: columns on desktop (default 3; phones always use 2)
 *   data-tile-width carousel only: tile width in px on desktop (default 240)
 *   data-shape     "square" (default), "portrait" (4:5) or "tall" (9:16, like Reels)
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
    var carousel = el.dataset.layout === "carousel";
    var count = parseInt(el.dataset.count, 10) || (carousel ? 12 : 9);
    var tileW = parseInt(el.dataset.tileWidth, 10) || 240;
    var ratio = { portrait: "4/5", tall: "9/16" }[el.dataset.shape] || "1/1";
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
      "a.tile{position:relative;display:block;aspect-ratio:" + ratio + ";overflow:hidden;border-radius:" + radius + "px;background:#eee}" +
      "a.tile img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s}" +
      "a.tile:hover img,a.tile:focus img{transform:scale(1.05)}" +
      ".badge{position:absolute;top:8px;right:8px;width:22px;height:22px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))}" +
      ".cap{position:absolute;inset:0;display:flex;align-items:flex-end;padding:12px;box-sizing:border-box;" +
      "background:linear-gradient(transparent 40%,rgba(0,0,0,.75));color:#fff;font-size:13px;line-height:1.35;" +
      "opacity:0;transition:opacity .25s}" +
      ".cap span{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}" +
      "a.tile:hover .cap,a.tile:focus .cap{opacity:1}" +
      ".wrap{position:relative}" +
      ".row{display:flex;gap:" + gap + "px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;" +
      "scrollbar-width:none;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}" +
      ".row::-webkit-scrollbar{display:none}" +
      ".row a.tile{flex:0 0 " + tileW + "px;scroll-snap-align:start}" +
      "@media(max-width:600px){.row a.tile{flex-basis:70%}}" +
      ".nav{position:absolute;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;border:0;" +
      "background:rgba(255,255,255,.92);box-shadow:0 2px 8px rgba(0,0,0,.25);cursor:pointer;display:flex;" +
      "align-items:center;justify-content:center;padding:0;transition:opacity .2s}" +
      ".nav svg{width:20px;height:20px}" +
      ".nav[hidden]{display:none}" +
      ".prev{left:8px}.next{right:8px}" +
      "@media(hover:none){.nav{display:none}}" +
      ".follow{display:flex;justify-content:center;margin-top:16px}" +
      ".follow a{background:" + accent + ";color:#fff;text-decoration:none;padding:10px 22px;border-radius:999px;font-size:14px;font-weight:600;text-align:center}";

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
    var chevron = function (d) {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="#111" stroke-width="2.5" ' +
        'stroke-linecap="round" stroke-linejoin="round" d="' + d + '"/></svg>';
    };
    var body = carousel
      ? '<div class="wrap"><div class="row">' + tiles.join("") + "</div>" +
        '<button class="nav prev" aria-label="Previous posts" hidden>' + chevron("M15 5l-7 7 7 7") + "</button>" +
        '<button class="nav next" aria-label="More posts">' + chevron("M9 5l7 7-7 7") + "</button></div>"
      : '<div class="grid">' + tiles.join("") + "</div>";
    root.innerHTML = "<style>" + css + "</style>" + body + follow;
    if (carousel) wireCarousel(root);
  }

  // Arrow buttons for mouse users (phones just swipe).
  function wireCarousel(root) {
    var row = root.querySelector(".row");
    var prev = root.querySelector(".prev");
    var next = root.querySelector(".next");
    function update() {
      prev.hidden = row.scrollLeft < 5;
      next.hidden = row.scrollLeft + row.clientWidth >= row.scrollWidth - 5;
    }
    function page(dir) {
      row.scrollBy({ left: dir * row.clientWidth * 0.9, behavior: "smooth" });
    }
    prev.addEventListener("click", function () { page(-1); });
    next.addEventListener("click", function () { page(1); });
    row.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
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
