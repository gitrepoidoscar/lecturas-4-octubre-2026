/* «La viña confiada» — adapted copy of the story-magazine starter script (no dependencies).
   From the starter: progress bar, chapter scroll-spy, hide-on-scroll nav, WAI-ARIA tabs,
   native <dialog> lightbox with focus return.
   Changes in this copy:
     * Tabs are progressive enhancement: every panel is visible in the HTML; this script
       reveals the tablist and hides only the NON-selected panels (first tab selected).
     * Escape also closes the mobile menu / chapter list and returns focus.
     * Respects prefers-reduced-motion for programmatic scrolling.
   Deliberately NOT included: scroll-reveal that hides content, parallax, autoplay. */
(function () {
    "use strict";

    var doc = document.documentElement;
    doc.classList.add("js");
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var nav = document.querySelector(".site-nav");
    var bar = document.querySelector(".progress-bar");
    var railLinks = Array.prototype.slice.call(document.querySelectorAll(".chapter-rail a[href^='#']"));
    var targets = railLinks
        .map(function (a) { return { link: a, el: document.getElementById(a.getAttribute("href").slice(1)) }; })
        .filter(function (t) { return t.el; });

    var lastY = window.scrollY;
    var ticking = false;

    function onScroll() {
        var y = window.scrollY;
        var max = doc.scrollHeight - window.innerHeight;
        if (bar) bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";

        if (targets.length) {
            var probe = y + window.innerHeight * 0.35;
            var active = null;
            targets.forEach(function (t) { if (t.el.getBoundingClientRect().top + y <= probe) active = t; });
            targets.forEach(function (t) {
                if (t === active) t.link.setAttribute("aria-current", "true");
                else t.link.removeAttribute("aria-current");
            });
        }

        if (nav && !nav.classList.contains("open") && !nav.contains(document.activeElement)) {
            if (y > 400 && y > lastY + 5) nav.classList.add("is-hidden");
            else if (y < lastY - 5 || y <= 400) nav.classList.remove("is-hidden");
        }
        lastY = y;
        ticking = false;
    }
    window.addEventListener("scroll", function () {
        if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
    }, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    // Keyboard focus inside the nav always shows it.
    if (nav) nav.addEventListener("focusin", function () { nav.classList.remove("is-hidden"); });

    // Mobile menu toggle
    var toggle = document.querySelector(".nav-toggle");
    function closeMenu(returnFocus) {
        if (!nav) return;
        var wasOpen = nav.classList.contains("open");
        nav.classList.remove("open");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
        var d = nav.querySelector("details[open]");
        if (d) d.removeAttribute("open");
        if (returnFocus && wasOpen && toggle && toggle.offsetParent !== null) toggle.focus();
    }
    if (toggle && nav) {
        toggle.addEventListener("click", function () {
            var open = nav.classList.toggle("open");
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
        });
        nav.addEventListener("click", function (e) {
            if (e.target.closest("a[href^='#']")) closeMenu(false);
        });
        nav.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                var d = nav.querySelector("details[open]");
                if (d) { d.removeAttribute("open"); d.querySelector("summary").focus(); }
                else closeMenu(true);
            }
        });
    }

    // Tabs: WAI-ARIA pattern, progressive enhancement.
    document.querySelectorAll("[data-tabs]").forEach(function (box) {
        var list = box.querySelector("[role='tablist']");
        if (!list) return;
        var tabs = Array.prototype.slice.call(list.querySelectorAll("[role='tab']"));
        function select(tab, focus) {
            tabs.forEach(function (t) {
                var on = t === tab;
                t.setAttribute("aria-selected", on ? "true" : "false");
                t.tabIndex = on ? 0 : -1;
                var panel = document.getElementById(t.getAttribute("aria-controls"));
                if (panel) panel.hidden = !on;
            });
            if (focus) tab.focus();
        }
        tabs.forEach(function (tab, i) {
            tab.addEventListener("click", function () { select(tab, false); });
            tab.addEventListener("keydown", function (e) {
                var n = null;
                if (e.key === "ArrowRight" || e.key === "ArrowDown") n = tabs[(i + 1) % tabs.length];
                if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = tabs[(i - 1 + tabs.length) % tabs.length];
                if (e.key === "Home") n = tabs[0];
                if (e.key === "End") n = tabs[tabs.length - 1];
                if (n) { e.preventDefault(); select(n, true); }
            });
        });
        list.hidden = false;
        box.classList.add("tabs-enhanced");
        var initial = tabs.filter(function (t) { return t.getAttribute("aria-selected") === "true"; })[0] || tabs[0];
        select(initial, false);
    });

    // Lightbox using native <dialog>: Escape closes (native), focus returns to opener.
    var dialog = document.getElementById("lightbox");
    if (dialog && typeof dialog.showModal === "function") {
        var dImg = dialog.querySelector("img");
        var dCap = dialog.querySelector(".lightbox-caption");
        var closeBtn = dialog.querySelector(".lightbox-close");
        var opener = null;
        document.querySelectorAll(".art-open").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var img = btn.querySelector("img");
                opener = btn;
                dImg.src = btn.getAttribute("data-full-src") || img.currentSrc || img.src;
                dImg.alt = btn.getAttribute("data-alt") || img.alt;
                if (dCap) dCap.textContent = btn.getAttribute("data-caption") || dImg.alt;
                dialog.showModal();
                if (closeBtn) closeBtn.focus();
            });
        });
        dialog.addEventListener("click", function (e) {
            if (e.target === dialog || e.target.closest(".lightbox-close")) dialog.close();
        });
        dialog.addEventListener("close", function () {
            dImg.src = "data:,";
            dImg.alt = "";
            if (opener) opener.focus();
            opener = null;
        });
    } else {
        // Without <dialog> support the image simply stays in the page at full width.
        document.querySelectorAll(".art-open").forEach(function (btn) { btn.classList.add("no-dialog"); });
    }

    // Skip link / in-page anchors: honour reduced motion and move focus to target.
    document.addEventListener("click", function (e) {
        var a = e.target.closest("a[href^='#']");
        if (!a || a.getAttribute("href").length < 2) return;
        var el = document.getElementById(a.getAttribute("href").slice(1));
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
        el.focus({ preventScroll: true });
        if (history.replaceState) history.replaceState(null, "", a.getAttribute("href"));
    });
})();
