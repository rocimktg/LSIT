document.addEventListener("DOMContentLoaded", () => {
  const mapFrame = document.querySelector(".contact-map__frame iframe");
  if (!mapFrame || !mapFrame.dataset.src) {
    return;
  }

  const activateMap = () => {
    mapFrame.src = mapFrame.dataset.src;
    mapFrame.removeAttribute("data-src");
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        activateMap();
        observer.disconnect();
      }
    }, { rootMargin: "50px" });

    observer.observe(mapFrame);
  } else {
    activateMap();
  }
});
