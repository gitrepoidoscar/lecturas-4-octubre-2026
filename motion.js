/* Lightweight motion: only visible images are updated; no content starts hidden. */
(function () {
    'use strict';
    var preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    var stages = Array.from(document.querySelectorAll('.chapter-stage'));
    var visible = new Set();
    var pending = false;
    function frame() {
        pending = false;
        if (preference.matches) return;
        visible.forEach(function (stage) {
            var rect = stage.getBoundingClientRect();
            var shift = Math.max(-16, Math.min(16, (window.innerHeight / 2 - rect.top - rect.height / 2) * .045));
            stage.style.setProperty('--image-shift', shift.toFixed(1) + 'px');
        });
    }
    function schedule() { if (!pending && !preference.matches) { pending = true; requestAnimationFrame(frame); } }
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target);
                if (entry.isIntersecting && !entry.target.dataset.revealed && !preference.matches) {
                    entry.target.dataset.revealed = 'true';
                    entry.target.classList.add('is-revealing');
                    entry.target.addEventListener('animationend', function () { entry.target.classList.remove('is-revealing'); }, { once:true });
                }
            }); schedule();
        }, { threshold:.05 });
        stages.forEach(function (stage) { stage.classList.add('motion-reveal'); observer.observe(stage); });
    }
    window.addEventListener('scroll', schedule, { passive:true });
    window.addEventListener('resize', schedule, { passive:true });
    preference.addEventListener('change', function () {
        stages.forEach(function (stage) { stage.style.removeProperty('--image-shift'); stage.classList.remove('is-revealing'); }); schedule();
    });
    document.querySelectorAll('.illustration-grid').forEach(function (track, i) {
        track.classList.add('gallery-track'); track.id = 'illustration-track-' + i;
        var controls = document.createElement('div'); controls.className = 'gallery-controls';
        [-1, 1].forEach(function (direction) {
            var button = document.createElement('button'); button.type = 'button';
            button.textContent = direction < 0 ? '←' : '→';
            button.setAttribute('aria-label', direction < 0 ? 'Ilustraciones anteriores' : 'Ilustraciones siguientes');
            button.setAttribute('aria-controls', track.id);
            button.addEventListener('click', function () { track.scrollBy({ left:direction * (track.firstElementChild.getBoundingClientRect().width + 24), behavior:preference.matches ? 'instant' : 'smooth' }); });
            controls.appendChild(button);
        });
        track.parentNode.insertBefore(controls, track);
    });
}());
