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
 *   data-popup     "false" sends clicks straight to Instagram instead of the
 *                  on-page pop-up player
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

  var IG_GLYPH =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="#fff" stroke-width="2"/>' +
    '<circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.2" fill="#fff"/></svg>';

  function fmtViews(n) {
    if (n == null) return "";
    if (n < 10000) return n.toLocaleString("en-US");
    if (n < 100000) return (Math.round(n / 100) / 10).toString().replace(/\.0$/, "") + "K";
    if (n < 1000000) return Math.round(n / 1000) + "K";
    return (Math.round(n / 100000) / 10).toString().replace(/\.0$/, "") + "M";
  }


  // ---- Pop-up player -------------------------------------------------------
  // Clicking a post opens it right on the page: Reels play in a video player,
  // photos show full size. Arrows / swipe / keyboard move between posts.
  // "Watch on Instagram" is always there, and the original link still works
  // for ctrl/cmd-click. Turn off with data-popup="false".
  var box; // { host, root, items, base, index, username }

  function shortcode(url) {
    var m = /instagram\.com\/(?:reel|p|tv)\/([^/?#]+)/.exec(url || "");
    return m ? m[1] : null;
  }

  function buildBox() {
    var host = document.createElement("div");
    host.setAttribute("data-social-feed-popup", "");
    host.style.cssText = "position:fixed;inset:0;z-index:2147483000;display:none";
    document.body.appendChild(host);
    var root = host.attachShadow({ mode: "open" });
    var css =
      ":host{all:initial}*{box-sizing:border-box}" +
      ".bg{position:fixed;inset:0;background:rgba(8,12,24,.88);display:flex;align-items:center;justify-content:center;" +
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:24px 72px}" +
      ".panel{display:flex;max-height:calc(100vh - 48px);background:#fff;border-radius:14px;overflow:hidden;" +
      "box-shadow:0 20px 60px rgba(0,0,0,.45)}" +
      ".media{position:relative;background:#000;display:flex;align-items:center;justify-content:center;" +
      "height:calc(100vh - 48px);max-height:860px;aspect-ratio:9/16}" +
      ".media.photo{aspect-ratio:auto;max-width:min(70vw,860px)}" +
      ".media video,.media img{width:100%;height:100%;object-fit:contain;display:block;background:#000}" +
      ".media iframe{width:100%;height:100%;border:0;background:#fff}" +
      ".side{width:340px;display:flex;flex-direction:column;color:#16213e}" +
      ".who{display:flex;align-items:center;gap:10px;padding:16px 18px;border-bottom:1px solid #eef0f4;font-weight:700;font-size:14px}" +
      ".av{width:32px;height:32px;border-radius:50%;padding:2px;background:linear-gradient(45deg,#f58529,#dd2a7b,#8134af)}" +
      ".av span{display:block;width:100%;height:100%;border-radius:50%;background:#16213e;border:2px solid #fff}" +
      ".who a{color:inherit;text-decoration:none}" +
      ".cap{flex:1 1 auto;min-height:0;overflow:auto;padding:16px 18px;font-size:14px;line-height:1.5;white-space:pre-wrap;word-wrap:break-word}" +
      ".meta{padding:12px 18px;border-top:1px solid #eef0f4;font-size:13px;color:#5b6477;display:flex;gap:14px}" +
      ".meta b{color:#16213e}" +
      ".ig{margin:0 18px 18px;display:flex;align-items:center;justify-content:center;gap:8px;height:42px;border-radius:999px;" +
      "color:#fff;text-decoration:none;font-size:14px;font-weight:700;background:linear-gradient(45deg,#f58529,#dd2a7b 50%,#8134af)}" +
      ".ig svg{width:17px;height:17px}" +
      "button{font:inherit;cursor:pointer;border:0;padding:0}" +
      ".x{position:fixed;top:14px;right:16px;width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;" +
      "display:flex;align-items:center;justify-content:center;z-index:3}" +
      ".x:hover,.arw:hover{background:rgba(255,255,255,.26)}" +
      ".x svg,.arw svg{width:20px;height:20px}" +
      ".arw{position:fixed;top:50%;transform:translateY(-50%);width:46px;height:46px;border-radius:50%;" +
      "background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;z-index:3}" +
      ".arw[hidden]{display:none}.prev{left:14px}.next{right:14px}" +
      ".snd{position:absolute;right:12px;bottom:12px;width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,.55);" +
      "display:flex;align-items:center;justify-content:center;z-index:2}.snd svg{width:18px;height:18px}" +
      ".snd[hidden]{display:none}" +
      ".tap{position:absolute;inset:0;z-index:1;background:transparent}" +
      ".big{position:absolute;left:50%;top:50%;width:68px;height:68px;margin:-34px 0 0 -34px;border-radius:50%;" +
      "background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:2}" +
      ".big svg{width:28px;height:28px;margin-left:4px}.big[hidden]{display:none}" +
      "@media(max-width:860px){" +
      ".bg{padding:0;align-items:stretch}" +
      ".panel{flex-direction:column;max-height:none;width:100%;height:100%;border-radius:0;background:#000}" +
      ".media,.media.photo{flex:1 1 0;min-height:0;height:auto;max-height:none;max-width:none;aspect-ratio:auto;width:100%}" +
      ".side{width:100%;flex:none;background:#fff;border-radius:16px 16px 0 0}" +
      ".who{padding:12px 16px}.cap{flex:none;padding:10px 16px;font-size:13px;max-height:6.2em}" +
      ".meta{display:none}.ig{margin:4px 16px 14px;height:40px}" +
      ".arw{display:none}.x{background:rgba(0,0,0,.45)}}";
    var ic = function (d, fill) {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="' + (fill || "none") + '" stroke="' +
        (fill ? "none" : "#fff") + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" d="' + d + '"/></svg>';
    };
    root.innerHTML =
      "<style>" + css + "</style>" +
      '<div class="bg" role="dialog" aria-modal="true" aria-label="Instagram post">' +
      '<button class="x" aria-label="Close">' + ic("M6 6l12 12M18 6L6 18") + "</button>" +
      '<button class="arw prev" aria-label="Previous post">' + ic("M15 5l-7 7 7 7") + "</button>" +
      '<button class="arw next" aria-label="Next post">' + ic("M9 5l7 7-7 7") + "</button>" +
      '<div class="panel"><div class="media"></div><div class="side">' +
      '<div class="who"><span class="av"><span></span></span><a class="user" target="_blank" rel="noopener"></a></div>' +
      '<div class="cap"></div><div class="meta"></div>' +
      '<a class="ig" target="_blank" rel="noopener"></a></div></div></div>';

    var bg = root.querySelector(".bg");
    bg.addEventListener("click", function (e) { if (e.target === bg) closeBox(); });
    root.querySelector(".x").addEventListener("click", closeBox);
    root.querySelector(".prev").addEventListener("click", function () { step(-1); });
    root.querySelector(".next").addEventListener("click", function () { step(1); });
    document.addEventListener("keydown", function (e) {
      if (!box || box.host.style.display === "none") return;
      if (e.key === "Escape") closeBox();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    });
    // Swipe left/right on phones.
    var sx = null, sy = null;
    bg.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    bg.addEventListener("touchend", function (e) {
      if (sx == null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      sx = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
      else if (dy > 120 && Math.abs(dy) > Math.abs(dx) * 1.5) closeBox();
    }, { passive: true });
    return { host: host, root: root };
  }

  var SND_ON = '<svg viewBox="0 0 24 24"><path fill="#fff" d="M4 9h4l5-4v14l-5-4H4z"/><path fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
  var SND_OFF = '<svg viewBox="0 0 24 24"><path fill="#fff" d="M4 9h4l5-4v14l-5-4H4z"/><path fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" d="M16 9l5 6M21 9l-5 6"/></svg>';
  var BIG_PLAY = '<svg viewBox="0 0 24 24"><path fill="#fff" d="M6 4l15 8-15 8z"/></svg>';

  function embedFallback(media, p) {
    var code = shortcode(p.permalink);
    if (!code) return false;
    media.className = "media";
    media.innerHTML = '<iframe src="https://www.instagram.com/p/' + code + '/embed/" allow="autoplay; encrypted-media" ' +
      'allowfullscreen scrolling="no" title="Instagram post"></iframe>';
    return true;
  }

  function show(i) {
    var items = box.items;
    box.index = (i + items.length) % items.length;
    var p = items[box.index];
    var r = box.root;
    var media = r.querySelector(".media");
    var old = media.querySelector("video");
    if (old) old.pause();
    media.innerHTML = "";

    if (p.video) {
      media.className = "media";
      var v = document.createElement("video");
      v.src = p.video;
      v.poster = box.base + p.image;
      v.playsInline = true;
      v.loop = true;
      v.preload = "auto";
      v.setAttribute("playsinline", "");
      var tap = document.createElement("div");
      tap.className = "tap";
      var big = document.createElement("div");
      big.className = "big";
      big.hidden = true;
      big.innerHTML = BIG_PLAY;
      var snd = document.createElement("button");
      snd.className = "snd";
      snd.setAttribute("aria-label", "Sound on/off");
      var syncSnd = function () { snd.innerHTML = v.muted ? SND_OFF : SND_ON; };
      snd.addEventListener("click", function (e) { e.stopPropagation(); v.muted = !v.muted; syncSnd(); });
      tap.addEventListener("click", function () { if (v.paused) v.play(); else v.pause(); });
      v.addEventListener("play", function () { big.hidden = true; });
      v.addEventListener("pause", function () { big.hidden = false; });
      v.addEventListener("error", function () { embedFallback(media, p); });
      media.appendChild(v);
      media.appendChild(tap);
      media.appendChild(big);
      media.appendChild(snd);
      // Opened by a click, so most browsers allow sound; if not, start muted.
      v.muted = false;
      var pr = v.play();
      if (pr && pr.catch) pr.catch(function () { v.muted = true; syncSnd(); v.play().catch(function () { big.hidden = false; }); });
      syncSnd();
    } else if (p.type === "reel") {
      embedFallback(media, p);
    } else {
      media.className = "media photo";
      var img = document.createElement("img");
      img.src = box.base + p.image;
      img.alt = p.caption ? p.caption.slice(0, 120) : "Instagram post";
      media.appendChild(img);
    }

    var user = r.querySelector(".user");
    user.textContent = box.username;
    user.href = box.profile;
    r.querySelector(".cap").textContent = p.caption || "";
    var meta = [];
    if (p.views != null) meta.push("<span><b>" + fmtViews(p.views) + "</b> views</span>");
    if (p.likes != null) meta.push("<span><b>" + fmtViews(p.likes) + "</b> likes</span>");
    if (p.timestamp) {
      var d = new Date(p.timestamp.replace(/([+-]\d\d)(\d\d)$/, "$1:$2"));
      if (!isNaN(d)) meta.push("<span>" + d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + "</span>");
    }
    r.querySelector(".meta").innerHTML = meta.join("");
    var ig = r.querySelector(".ig");
    ig.href = p.permalink;
    ig.innerHTML = IG_GLYPH + (p.type === "reel" ? "Watch on Instagram" : p.type === "carousel" ? "See all photos on Instagram" : "View on Instagram");
    var many = items.length > 1;
    r.querySelector(".prev").hidden = !many;
    r.querySelector(".next").hidden = !many;
  }

  function step(dir) { if (box) show(box.index + dir); }

  function openBox(feed, items, index) {
    if (!box) box = buildBox();
    box.items = items;
    box.base = base;
    box.username = "@" + feed.username;
    box.profile = feed.profile_url;
    box.lastFocus = document.activeElement;
    box.prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    box.host.style.display = "block";
    show(index);
    box.root.querySelector(".x").focus();
  }

  function closeBox() {
    if (!box) return;
    var v = box.root.querySelector(".media video");
    if (v) v.pause();
    box.root.querySelector(".media").innerHTML = "";
    box.host.style.display = "none";
    document.documentElement.style.overflow = box.prevOverflow || "";
    if (box.lastFocus && box.lastFocus.focus) box.lastFocus.focus();
  }

  // Hook every post link inside a rendered widget up to the pop-up.
  function wirePopup(el, root, feed, items) {
    if (el.dataset.popup === "false") return;
    var links = root.querySelectorAll("a.card, a.tile");
    links.forEach(function (a, i) {
      a.addEventListener("click", function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // let new-tab clicks through
        e.preventDefault();
        openBox(feed, items, i);
      });
    });
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
    var shown = feed.items.slice(0, count);
    var cards = shown.map(function (p) {
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
    var igGlyph = IG_GLYPH;

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

    wirePopup(el, root, feed, shown);
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

    var shown = feed.items.slice(0, count);
    var tiles = shown.map(function (p) {
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
    wirePopup(el, root, feed, shown);
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
