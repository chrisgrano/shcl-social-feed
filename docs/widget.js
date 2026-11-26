/*
 * Sweet Home Chicagoland social feed widget.
 * Paste onto any page:
 *   <div data-social-feed data-count="9" data-columns="3"></div>
 *   <script src="https://chrisgrano.github.io/shcl-social-feed/widget.js" async></script>
 *
 * Options (all optional, set as data- attributes on the div):
 *   data-layout    "grid" (default), "carousel" (one swipeable row) or "showcase"
 *                  (styled header + swipeable tall cards with view counts)
 *   Showcase only: data-eyebrow, data-title, data-title-highlight, data-title-color,
 *                  data-highlight-color, data-eyebrow-color, data-per-view (cards visible on desktop, default 5)
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

  function fmtViews(n) {
    if (n == null) return "";
    if (n < 10000) return n.toLocaleString("en-US");
    if (n < 100000) return (Math.round(n / 100) / 10).toString().replace(/\.0$/, "") + "K";
    if (n < 1000000) return Math.round(n / 1000) + "K";
    return (Math.round(n / 100000) / 10).toString().replace(/\.0$/, "") + "M";
  }

  // "Showcase" layout: header with eyebrow, two-tone title, arrows and an
  // Instagram-gradient Follow button; tall rounded cards with view counts.
  function renderShowcase(el, feed) {
    var d = el.dataset;
    var count = parseInt(d.count, 10) || 15;
    var eyebrow = d.eyebrow == null ? "Latest on Instagram" : d.eyebrow;
    var title = d.title == null ? "Fresh from" : d.title;
    var highlight = d.titleHighlight == null ? "the feed" : d.titleHighlight;
    var ink = d.titleColor || "#16213e";
    var hl = d.highlightColor || "#3d8fcf";
    var eyebrowColor = d.eyebrowColor || "#e2435c";
    var perView = parseInt(d.perView, 10) || 5;

    var css =
      ":host{display:block;font-family:inherit;overflow-x:clip;color:" + ink + "}" +
      "*{box-sizing:border-box}" +
      ".head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:22px}" +
      ".eyebrow{display:flex;align-items:center;gap:10px;font-size:11px;font-weight:700;letter-spacing:.16em;" +
      "text-transform:uppercase;color:" + eyebrowColor + ";margin:0 0 8px}" +
      ".eyebrow:before{content:'';width:28px;height:2px;border-radius:2px;background:linear-gradient(90deg,#f58529,#dd2a7b,#8134af)}" +
      "h2{margin:0;font-size:clamp(28px,4.2vw,44px);line-height:1.05;font-weight:800;letter-spacing:-.025em;color:" + ink + "}" +
      "h2 span{color:" + hl + "}" +
      ".ctrl{display:flex;align-items:center;gap:10px}" +
      ".nav{width:38px;height:38px;border-radius:50%;border:1px solid #e3e6ec;background:#fff;cursor:pointer;display:flex;" +
      "align-items:center;justify-content:center;padding:0;box-shadow:0 2px 6px rgba(20,30,60,.08);transition:opacity .2s,transform .2s}" +
      ".nav:hover{transform:translateY(-1px)}.nav:disabled{opacity:.35;cursor:default;transform:none}" +
      ".nav svg{width:16px;height:16px}" +
      ".follow{display:inline-flex;align-items:center;gap:8px;height:38px;padding:0 20px 0 16px;margin-left:6px;border-radius:999px;" +
      "color:#fff;text-decoration:none;font-size:14px;font-weight:700;" +
      "background:linear-gradient(45deg,#f58529 0%,#dd2a7b 50%,#8134af 100%);box-shadow:0 6px 16px rgba(221,42,123,.3)}" +
      ".follow svg{width:17px;height:17px}" +
      ".row{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;scrollbar-width:none;" +
      "padding:6px 16px 40px;margin:-6px -16px -14px;scroll-padding-left:16px;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}" +
      ".row::-webkit-scrollbar{display:none}" +
      ".card{position:relative;flex:0 0 calc((100% - " + (perView - 1) * 14 + "px) / " + perView + ");aspect-ratio:9/16;" +
      "border-radius:16px;overflow:hidden;background:#dde3ea;scroll-snap-align:start;display:block;" +
      "box-shadow:0 10px 24px rgba(20,30,60,.16);transition:transform .25s,box-shadow .25s}" +
      ".card:hover{transform:translateY(-4px);box-shadow:0 16px 32px rgba(20,30,60,.22)}" +
      ".card img{width:100%;height:100%;object-fit:cover;display:block}" +
      ".card:after{content:'';position:absolute;inset:auto 0 0 0;height:38%;background:linear-gradient(transparent,rgba(0,0,0,.6))}" +
      ".play{position:absolute;top:10px;right:10px;width:30px;height:30px;border-radius:50%;background:#fff;z-index:1;" +
      "display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.2)}" +
      ".play svg{width:12px;height:12px;margin-left:2px}" +
      ".views{position:absolute;left:12px;bottom:12px;z-index:1;color:#fff;font-size:13px;font-weight:700;" +
      "text-shadow:0 1px 3px rgba(0,0,0,.4)}" +
      "@media(max-width:900px){.card{flex-basis:calc((100% - 28px) / 3)}}" +
      "@media(max-width:600px){.card{flex-basis:62%}.follow{margin-left:0}}";

    var playIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#16213e" d="M6 4l15 8-15 8z"/></svg>';
    var cards = feed.items.slice(0, count).map(function (p) {
      var alt = p.caption ? p.caption.slice(0, 120) : "Instagram post by @" + feed.username;
      var label = p.views != null ? fmtViews(p.views) + " views" : p.likes != null ? fmtViews(p.likes) + " likes" : "";
      return (
        '<a class="card" href="' + esc(p.permalink) + '" target="_blank" rel="noopener">' +
        '<img src="' + esc(base + p.image) + '" alt="' + esc(alt) + '" loading="lazy">' +
        (p.type === "reel" ? '<span class="play">' + playIcon + "</span>" : "") +
        (label ? '<span class="views">' + label + "</span>" : "") +
        "</a>"
      );
    });

    var chev = function (path) {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="' + ink +
        '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" d="' + path + '"/></svg>';
    };
    var igGlyph =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="#fff" stroke-width="2"/>' +
      '<circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.2" fill="#fff"/></svg>';

    var root = el.shadowRoot || el.attachShadow({ mode: "open" });
    root.innerHTML =
      "<style>" + css + "</style>" +
      '<div class="head"><div>' +
      (eyebrow ? '<p class="eyebrow">' + esc(eyebrow) + "</p>" : "") +
      "<h2>" + esc(title) + (highlight ? " <span>" + esc(highlight) + "</span>" : "") + "</h2></div>" +
      '<div class="ctrl">' +
      '<button class="nav prev" aria-label="Previous posts">' + chev("M15 5l-7 7 7 7") + "</button>" +
      '<button class="nav next" aria-label="More posts">' + chev("M9 5l7 7-7 7") + "</button>" +
      (d.follow !== "false"
        ? '<a class="follow" href="' + esc(feed.profile_url) + '" target="_blank" rel="noopener">' + igGlyph + "Follow</a>"
        : "") +
      "</div></div>" +
      '<div class="row">' + cards.join("") + "</div>";

    var row = root.querySelector(".row");
    var prev = root.querySelector(".prev");
    var next = root.querySelector(".next");
    function update() {
      prev.disabled = row.scrollLeft < 5;
      next.disabled = row.scrollLeft + row.clientWidth >= row.scrollWidth - 5;
    }
    prev.addEventListener("click", function () { row.scrollBy({ left: -row.clientWidth * 0.9, behavior: "smooth" }); });
    next.addEventListener("click", function () { row.scrollBy({ left: row.clientWidth * 0.9, behavior: "smooth" }); });
    row.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  function render(el, feed) {
    if (el.dataset.layout === "showcase") return renderShowcase(el, feed);
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
