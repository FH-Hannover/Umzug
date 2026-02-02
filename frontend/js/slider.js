(() => {
  const track = document.getElementById("servicesTrack");
  const prevBtn = document.getElementById("servicesPrev");
  const nextBtn = document.getElementById("servicesNext");
  const dotsWrap = document.getElementById("servicesDots");

  if (!track || !prevBtn || !nextBtn || !dotsWrap) return;

  const slides = Array.from(track.children);
  const count = slides.length;

  let index = 0;
  let timer = null;

  // Dots erstellen
  const dots = slides.map((_, i) => {
    const b = document.createElement("button");
    b.className = "slider-dot" + (i === 0 ? " active" : "");
    b.type = "button";
    b.ariaLabel = `Bild ${i + 1}`;
    b.addEventListener("click", () => goTo(i, true));
    dotsWrap.appendChild(b);
    return b;
  });

  function update() {
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle("active", i === index));
  }

  function goTo(i, userAction = false) {
    index = (i + count) % count;
    update();
    if (userAction) restartAutoplay();
  }

  function next() { goTo(index + 1, true); }
  function prev() { goTo(index - 1, true); }

  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  // Autoplay
  function startAutoplay() {
    timer = setInterval(() => goTo(index + 1), 4500);
  }
  function stopAutoplay() {
    if (timer) clearInterval(timer);
    timer = null;
  }
  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  // Pause bei Hover (Desktop)
  track.addEventListener("mouseenter", stopAutoplay);
  track.addEventListener("mouseleave", startAutoplay);

  // Swipe (Mobile)
  let startX = 0;
  let isDown = false;

  track.addEventListener("touchstart", (e) => {
    isDown = true;
    startX = e.touches[0].clientX;
    stopAutoplay();
  }, { passive: true });

  track.addEventListener("touchend", (e) => {
    if (!isDown) return;
    isDown = false;
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;

    if (Math.abs(diff) > 40) {
      diff < 0 ? goTo(index + 1, true) : goTo(index - 1, true);
    }
    startAutoplay();
  }, { passive: true });

  update();
  startAutoplay();
})();
