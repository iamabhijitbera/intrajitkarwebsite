/* ==========================================================================
   Debanshu Interior Decoration — static site script
   Loads data/*.json and renders the site chrome and every repeated collection.
   No build step, no dependencies. Serve over http:// (see README.md).
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------- paths --- */
  // Top-level pages set data-root=""; pages inside /locations/ set data-root="../"
  var ROOT = document.body.getAttribute("data-root") || "";
  var PAGE = document.body.getAttribute("data-page") || "";
  var SLUG = document.body.getAttribute("data-slug") || "";
  var DATA_DIR = ROOT + "data/";

  /* ------------------------------------------------------------- icons --- */
  var SVG_OPEN =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';

  var icons = {
    phone:
      SVG_OPEN +
      '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 ' +
      '19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 ' +
      '2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 ' +
      'A2 2 0 0 1 22 16.92z"/></svg>',
    whatsapp: SVG_OPEN + '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
    chevronDown: SVG_OPEN + '<path d="m6 9 6 6 6-6"/></svg>',
    chevronRight: SVG_OPEN + '<path d="m9 18 6-6-6-6"/></svg>',
    arrowRight: SVG_OPEN + '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
    check: SVG_OPEN + '<path d="M20 6 9 17l-5-5"/></svg>',
    menu:
      SVG_OPEN +
      '<line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>',
    close: SVG_OPEN + '<path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  };

  /* ------------------------------------------------------------ helpers --- */
  var ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return ESCAPES[c];
    });
  }

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function mount(name) {
    return $('[data-mount="' + name + '"]');
  }

  function getJSON(name) {
    return fetch(DATA_DIR + name + ".json", { cache: "no-cache" }).then(function (res) {
      if (!res.ok) throw new Error("could not load " + name + ".json (HTTP " + res.status + ")");
      return res.json();
    });
  }

  /* -------------------------------------------------------- data loading --- */
  Promise.all([getJSON("site"), getJSON("images"), getJSON("services"), getJSON("projects"), getJSON("locations")])
    .then(function (results) {
      var data = {
        site: results[0],
        images: results[1],
        services: results[2],
        projects: results[3],
        locations: results[4],
      };

      // id -> src lookup built from the product image registry in images.json
      data.productImage = {};
      data.images.products.forEach(function (product) {
        product.usedFor.forEach(function (key) {
          if (!data.productImage[key]) data.productImage[key] = product.src;
        });
      });

      window.SITE_DATA = data;

      renderChrome(data);
      renderPage(data);
      initInteractions();
      scrollToHash();
    })
    .catch(function (error) {
      console.warn("[Debanshu] site data failed to load:", error.message);
      var banner = document.createElement("div");
      banner.className = "noscript-banner";
      banner.innerHTML =
        "Some sections could not load. If you opened this file directly from disk, serve the folder over HTTP " +
        "instead — run <strong>node server.js</strong> and open the printed address.";
      document.body.insertBefore(banner, document.body.firstChild);
    });

  /* -------------------------------------------------------- site chrome --- */
  function renderChrome(data) {
    var header = mount("header");
    var footer = mount("footer");
    var floating = mount("floating");

    if (header) {
      header.className = "site-header";
      header.innerHTML = headerMarkup(data);
      setActiveNav();

      var toggle = $(".menu-toggle", header);
      toggle.addEventListener("click", function () {
        var open = $(".mobile-menu", header).classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        toggle.innerHTML = open ? icons.close : icons.menu;
      });
    }

    if (footer) {
      footer.className = "site-footer";
      footer.innerHTML = footerMarkup(data);
    }

    if (floating) {
      floating.innerHTML = floatingMarkup(data.site);
    }
  }

  // Header dropdown = the six main services plus two specialist items.
  function navServiceLinks(data) {
    var links = data.services.main.map(function (s) {
      return { label: s.title, slug: s.slug };
    });
    ["false-ceiling", "custom-furniture"].forEach(function (slug) {
      var match = data.services.extended.filter(function (e) {
        return e.slug === slug;
      })[0];
      if (match) links.push({ label: match.title, slug: match.slug });
    });
    return links;
  }

  function headerMarkup(data) {
    var site = data.site;
    var serviceLinks = navServiceLinks(data);

    var serviceItems = serviceLinks
      .map(function (s) {
        return '<a href="' + ROOT + "services.html#" + esc(s.slug) + '">' + esc(s.label) + "</a>";
      })
      .join("");

    var locationItems = data.locations.items
      .map(function (l) {
        return '<a href="' + ROOT + "locations/" + esc(l.slug) + '.html">' + esc(l.name) + "</a>";
      })
      .join("");

    var primaryLinks = site.nav
      .map(function (item) {
        var key = item.href.replace(".html", "");
        if (key === "services" || key === "locations") {
          var items = key === "services" ? serviceItems : locationItems;
          return (
            '<div class="nav__item">' +
            '<a class="nav__link" data-nav="' + key + '" href="' + ROOT + item.href + '">' +
            esc(item.label) +
            icons.chevronDown +
            "</a>" +
            '<div class="dropdown dropdown--' + key + '">' + items + "</div>" +
            "</div>"
          );
        }
        return (
          '<a class="nav__link" data-nav="' + key + '" href="' + ROOT + item.href + '">' + esc(item.label) + "</a>"
        );
      })
      .join("");

    var mobileGroups = [
      { title: "Services", slugs: serviceLinks },
      { title: "Locations", slugs: data.locations.items },
    ]
      .map(function (group) {
        return (
          '<div class="mobile-menu__group">' +
          '<p class="mobile-menu__group-title">' + esc(group.title) + "</p>" +
          '<div class="mobile-menu__group-list">' +
          group.slugs
            .map(function (entry) {
              if (group.title === "Services") {
                return '<a href="' + ROOT + "services.html#" + esc(entry.slug) + '">' + esc(entry.label) + "</a>";
              }
              return '<a href="' + ROOT + "locations/" + esc(entry.slug) + '.html">' + esc(entry.name) + "</a>";
            })
            .join("") +
          "</div></div>"
        );
      })
      .join("");

    return (
      '<div class="container header-inner">' +
      '<a class="logo" href="' + ROOT + 'index.html">' +
      '<span class="logo__name">DEBANSHU</span>' +
      '<span class="logo__sub">INTERIOR DECORATION</span>' +
      "</a>" +
      '<nav class="nav" aria-label="Main">' + primaryLinks + "</nav>" +
      '<div class="header-ctas">' +
      '<a class="btn btn-coral" href="' + site.phoneTel + '">' + icons.phone + " Call Now</a>" +
      '<a class="btn btn-outline-dark" href="' + site.whatsappLink + '" target="_blank" rel="noopener noreferrer">' +
      icons.whatsapp +
      " WhatsApp</a>" +
      "</div>" +
      '<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu">' +
      icons.menu +
      "</button>" +
      "</div>" +
      '<div class="mobile-menu" id="mobile-menu">' +
      '<div class="mobile-menu__links">' +
      site.nav
        .map(function (i) {
          return '<a href="' + ROOT + i.href + '">' + esc(i.label) + "</a>";
        })
        .join("") +
      "</div>" +
      mobileGroups +
      '<div class="mobile-menu__ctas">' +
      '<a class="btn btn-coral" href="' + site.phoneTel + '">' + icons.phone + " Call</a>" +
      '<a class="btn btn-outline-dark" href="' + site.whatsappLink + '" target="_blank" rel="noopener noreferrer">' +
      icons.whatsapp +
      " WhatsApp</a>" +
      "</div></div>"
    );
  }

  function footerMarkup(data) {
    var site = data.site;
    var bySlug = {};
    data.locations.items.forEach(function (l) {
      bySlug[l.slug] = l;
    });

    return (
      '<div class="container footer-grid">' +
      '<div class="footer-brand">' +
      '<p class="footer-brand__name">DEBANSHU</p>' +
      '<p class="footer-brand__sub">INTERIOR DECORATION</p>' +
      "<p>" +
      esc(site.tagline) +
      ".</p>" +
      "</div>" +
      '<div class="footer-col">' +
      '<h3 class="eyebrow eyebrow--gold">Explore</h3>' +
      "<ul>" +
      site.nav
        .map(function (i) {
          return '<li><a href="' + ROOT + i.href + '">' + esc(i.label) + "</a></li>";
        })
        .join("") +
      "</ul></div>" +
      '<div class="footer-col">' +
      '<h3 class="eyebrow eyebrow--gold">Popular Services</h3>' +
      "<ul>" +
      data.services.main
        .map(function (s) {
          return '<li><a href="' + ROOT + "services.html#" + esc(s.slug) + '">' + esc(s.title) + "</a></li>";
        })
        .join("") +
      "</ul></div>" +
      '<div class="footer-col footer-col--areas">' +
      '<h3 class="eyebrow eyebrow--gold">Service Areas</h3>' +
      "<ul>" +
      site.footerAreas
        .map(function (slug) {
          var l = bySlug[slug];
          if (!l) return "";
          return '<li><a href="' + ROOT + "locations/" + esc(l.slug) + '.html">' + esc(l.name) + "</a></li>";
        })
        .join("") +
      "</ul>" +
      '<h3 class="eyebrow eyebrow--gold mt-8">Contact</h3>' +
      '<div class="footer-contact">' +
      '<a href="' + site.phoneTel + '">' + icons.phone + " " + esc(site.phoneDisplay) + "</a>" +
      '<a href="' + site.whatsappLink + '" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">' +
      icons.whatsapp +
      "</a></div></div></div>" +
      '<div class="footer-bottom">© ' +
      new Date().getFullYear() +
      " " +
      esc(site.businessName) +
      " · " +
      esc(site.locality) +
      ", " +
      esc(site.region) +
      "</div>"
    );
  }

  function floatingMarkup(site) {
    return (
      '<div class="floating-desktop">' +
      '<a class="floating-whatsapp" href="' +
      site.whatsappLink +
      '" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">' +
      icons.whatsapp +
      "</a>" +
      '<a class="floating-call" href="' +
      site.phoneTel +
      '" aria-label="Call Debanshu Interior Decoration">' +
      icons.phone +
      "</a></div>" +
      '<div class="floating-mobile">' +
      '<a class="call" href="' + site.phoneTel + '">' + icons.phone + " Call Now</a>" +
      '<a class="whatsapp" href="' + site.whatsappLink + '" target="_blank" rel="noopener noreferrer">' +
      icons.whatsapp +
      " WhatsApp</a></div>" +
      '<div class="floating-spacer" aria-hidden="true"></div>'
    );
  }

  function setActiveNav() {
    var active = PAGE === "location" ? "locations" : PAGE === "home" ? "index" : PAGE;
    $$("[data-nav]").forEach(function (link) {
      if (link.getAttribute("data-nav") === active) link.classList.add("is-active");
    });
  }

  /* ------------------------------------------------------- page sections --- */
  function renderPage(data) {
    var hero = mount("heroSlider");
    if (hero) initHeroSlider(hero);

    var servicesDetail = mount("servicesDetail");
    if (servicesDetail) renderServicesDetail(servicesDetail, data);

    var servicesGrid = mount("servicesGrid");
    if (servicesGrid) {
      renderServicesGrid(
        servicesGrid,
        data,
        servicesGrid.getAttribute("data-slugs"),
        servicesGrid.getAttribute("data-location")
      );
    }

    var projectsGrid = mount("projectsGrid");
    if (projectsGrid) {
      var limit = Number(projectsGrid.getAttribute("data-limit")) || 0;
      var tag = projectsGrid.getAttribute("data-heading") || "h3";
      renderProjects(projectsGrid, limit ? data.projects.items.slice(0, limit) : data.projects.items, tag);
    }

    var projectFilters = mount("projectFilters");
    if (projectFilters) renderProjectFilters(projectFilters, data, projectsGrid);

    var locationsGrid = mount("locationsGrid");
    if (locationsGrid) renderLocations(locationsGrid, data);

    var why = mount("why");
    if (why) renderWhy(why, data, why.getAttribute("data-heading"));

    var process = mount("process");
    if (process) renderProcess(process, data, process.getAttribute("data-heading"));

    var extended = mount("extendedServices");
    if (extended) renderExtendedServices(extended, data);

    var cta = mount("finalCta");
    if (cta) renderFinalCta(cta, data);

    var nearby = mount("nearbyLocations");
    if (nearby) renderNearby(nearby, data);
  }

  function renderServicesDetail(el, data) {
    var site = data.site;
    el.innerHTML = data.services.main
      .map(function (s, i) {
        var src = ROOT + (data.productImage[s.imageId] || "");
        var flip = i % 2 === 1 ? " service-detail--flip" : "";
        return (
          '<article class="service-detail' + flip + '" id="' + esc(s.slug) + '">' +
          '<div class="service-detail__media">' +
          '<img src="' + esc(src) + '" alt="' +
          esc(s.title + " service in Howrah by Debanshu Interior Decoration") +
          '" loading="lazy" width="800" height="380">' +
          '</div>' +
          '<div class="service-detail__body">' +
          '<p class="eyebrow">' + esc(s.num) + " — Service</p>" +
          '<h2 class="h3">' + esc(s.title) + "</h2>" +
          "<p>" + esc(s.description) + "</p>" +
          '<ul class="benefits">' +
          s.benefits
            .map(function (b) {
              return "<li>" + icons.check + esc(b) + "</li>";
            })
            .join("") +
          "</ul>" +
          '<p class="suitable">Suitable for: ' + esc(s.suitable) + "</p>" +
          '<div class="btn-group">' +
          '<a class="btn btn-coral" href="' + site.phoneTel + '">' + icons.phone + " Call " + esc(site.phoneDisplay) + "</a>" +
          '<a class="btn btn-outline-dark" href="' + site.whatsappLink + '" target="_blank" rel="noopener noreferrer">' +
          icons.whatsapp +
          " WhatsApp Us</a>" +
          "</div></div></article>"
        );
      })
      .join("");
  }

  function renderServicesGrid(el, data, slugsAttr, locationName) {
    var list = data.services.main;

    if (slugsAttr) {
      var slugs = slugsAttr.split(",").map(function (s) {
        return s.trim();
      });
      list = slugs
        .map(function (slug) {
          return list.filter(function (s) {
            return s.slug === slug;
          })[0];
        })
        .filter(Boolean);
    }

    el.className = "services-grid";
    el.innerHTML = list
      .map(function (s) {
        var src = ROOT + (data.productImage[s.imageId] || "");
        var alt =
          s.title + " design" + (locationName ? " in " + locationName : "") + " by Debanshu Interior Decoration";
        return (
          '<article class="service-card">' +
          '<div class="service-card__media">' +
          '<img src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy" width="800" height="260">' +
          '<span class="service-card__num">' + esc(s.num) + "</span>" +
          "</div>" +
          "<h3>" + esc(s.title + (locationName ? " in " + locationName : "")) + "</h3>" +
          "<p>" + esc(s.short) + "</p>" +
          '<a class="link-arrow" href="' + ROOT + "services.html#" + esc(s.slug) + '">Explore Service ' +
          icons.arrowRight +
          "</a>" +
          "</article>"
        );
      })
      .join("");
  }

  function projectCard(p, index, headingTag) {
    var tag = headingTag || "h3";
    var tall = index % 3 === 1 ? " project-card--tall" : "";
    return (
      '<figure class="project-card' + tall + '">' +
      '<img src="' + esc(ROOT + p.image) + '" alt="' + esc(p.alt) + '" loading="lazy" width="800" height="420">' +
      "<figcaption>" +
      "<" + tag + ">" + esc(p.title) + "</" + tag + ">" +
      "<p>" + esc(p.location + " · " + p.type) + "</p>" +
      "</figcaption></figure>"
    );
  }

  function renderProjects(el, items, headingTag) {
    el.className = "masonry";
    el.innerHTML = items
      .map(function (p, i) {
        return projectCard(p, i, headingTag);
      })
      .join("");
  }

  function renderProjectFilters(el, data, grid) {
    var current = "All";

    function paintActive() {
      $$(".filter-btn", el).forEach(function (btn) {
        var active = btn.getAttribute("data-filter") === current;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", String(active));
      });
    }

    el.className = "filter-bar";
    el.innerHTML = data.projects.categories
      .map(function (c) {
        return (
          '<button class="filter-btn" type="button" data-filter="' +
          esc(c) +
          '" aria-pressed="false">' +
          esc(c) +
          "</button>"
        );
      })
      .join("");

    el.addEventListener("click", function (event) {
      var btn = event.target.closest(".filter-btn");
      if (!btn) return;
      current = btn.getAttribute("data-filter");
      var items =
        current === "All"
          ? data.projects.items
          : data.projects.items.filter(function (p) {
              return p.category === current;
            });
      renderProjects(grid, items, grid.getAttribute("data-heading") || "h3");
      paintActive();
    });

    paintActive();
  }

  function renderLocations(el, data) {
    if (el.getAttribute("data-mode") === "pills") {
      el.className = "pill-cloud";
      el.innerHTML = data.locations.items
        .map(function (l) {
          return '<a class="pill" href="' + ROOT + "locations/" + esc(l.slug) + '.html">' + esc(l.name) + "</a>";
        })
        .join("");
      return;
    }

    el.className = "location-grid";
    el.innerHTML = data.locations.items
      .map(function (l) {
        return (
          '<a class="location-card" href="' + ROOT + "locations/" + esc(l.slug) + '.html">' +
          "<h3>Interior Decorator in " + esc(l.name) + "</h3>" +
          "<p>" + esc(l.intro) + "</p>" +
          '<span class="link-arrow">View ' + esc(l.name) + " " + icons.arrowRight + "</span>" +
          "</a>"
        );
      })
      .join("");
  }

  function renderWhy(el, data, heading) {
    el.className = "section section--espresso";
    el.innerHTML =
      '<div class="container">' +
      '<p class="eyebrow eyebrow--gold">Why Debanshu</p>' +
      '<h2 class="h2 mt-4" style="max-width:48rem">' +
      esc(heading || "Designed With Purpose. Finished With Precision.") +
      "</h2>" +
      '<div class="why-grid">' +
      data.services.why
        .map(function (w, i) {
          return (
            '<div class="why-item">' +
            '<span class="why-item__num">0' + (i + 1) + "</span>" +
            "<h3>" + esc(w.title) + "</h3>" +
            "<p>" + esc(w.text) + "</p>" +
            "</div>"
          );
        })
        .join("") +
      "</div></div>";
  }

  function renderProcess(el, data, heading) {
    el.className = "section section--beige";
    el.innerHTML =
      '<div class="container">' +
      '<p class="eyebrow">How We Work</p>' +
      '<h2 class="h2 mt-4" style="max-width:42rem">' +
      esc(heading || "Our Interior Design Process") +
      "</h2>" +
      '<div class="card-grid card-grid--5 mt-16">' +
      data.services.process
        .map(function (p) {
          return (
            '<div class="process-item">' +
            '<span class="process-item__num">' + esc(p.num) + "</span>" +
            "<h3>" + esc(p.title) + "</h3>" +
            "<p>" + esc(p.text) + "</p>" +
            "</div>"
          );
        })
        .join("") +
      "</div></div>";
  }

  function renderExtendedServices(el, data) {
    var limit = Number(el.getAttribute("data-limit")) || 0;
    var list = limit ? data.services.extended.slice(0, limit) : data.services.extended;
    var linked = el.getAttribute("data-link") === "true";

    el.className = "card-grid card-grid--3";
    el.innerHTML = list
      .map(function (e) {
        var href = ROOT + "services.html#" + esc(e.slug);
        var inner = "<h3>" + esc(e.title) + "</h3><p>" + esc(e.text) + "</p>";
        return linked
          ? '<a class="extended-card" id="' + esc(e.slug) + '" href="' + href + '">' + inner + "</a>"
          : '<div class="extended-card" id="' + esc(e.slug) + '">' + inner + "</div>";
      })
      .join("");
  }

  function renderFinalCta(el, data) {
    var site = data.site;
    el.className = "final-cta";
    el.innerHTML =
      '<div class="container final-cta__inner">' +
      '<h2 class="h2">Let’s Design A Space You’ll Love Coming Home To</h2>' +
      "<p>Have an interior project in mind? Talk to " +
      esc(site.businessName) +
      " about your home, office or commercial space.</p>" +
      '<p class="final-cta__phone">' + esc(site.phoneDisplay) + "</p>" +
      '<div class="btn-group">' +
      '<a class="btn btn-coral" href="' + site.phoneTel + '">' + icons.phone + " Call Now</a>" +
      '<a class="btn btn-outline-light" href="' + site.whatsappLink + '" target="_blank" rel="noopener noreferrer">' +
      icons.whatsapp +
      " WhatsApp Us</a>" +
      "</div></div>";
  }

  function renderNearby(el, data) {
    var others = data.locations.items.filter(function (l) {
      return l.slug !== SLUG;
    });
    el.innerHTML =
      others
        .slice(0, 6)
        .map(function (n) {
          return '<a class="pill" href="' + ROOT + "locations/" + esc(n.slug) + '.html">' + esc(n.name) + "</a>";
        })
        .join("") +
      '<a class="pill" href="' + ROOT + 'locations.html">All Areas</a>';
  }

  /* -------------------------------------------------------- interactions --- */
  function initHeroSlider(hero) {
    var slides = $$(".hero__slide", hero);
    var panels = $$(".hero__panel", hero);
    var dots = $$(".hero__dot", hero);
    if (slides.length < 2) return;

    var index = 0;
    var timer = null;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
        slide.setAttribute("aria-hidden", String(i !== index));
      });
      panels.forEach(function (panel, i) {
        panel.classList.toggle("is-active", i === index);
        panel.setAttribute("aria-hidden", String(i !== index));
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
        dot.setAttribute("aria-current", i === index ? "true" : "false");
      });
    }

    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    function start() {
      stop();
      if (reduce) return;
      timer = setInterval(function () {
        show(index + 1);
      }, 6500);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        start();
      });
    });

    show(0);
    start();
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
  }

  // Deep links such as services.html#modular-kitchen are rendered by JS,
  // so scroll to the target once the markup exists.
  function scrollToHash() {
    if (!window.location.hash) return;
    var target = document.getElementById(window.location.hash.slice(1));
    if (!target) return;
    requestAnimationFrame(function () {
      target.scrollIntoView();
    });
  }

  function initInteractions() {
    var header = $(".site-header");
    if (header) {
      var onScroll = function () {
        header.classList.toggle("is-scrolled", window.scrollY > 20);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
  }
})();
