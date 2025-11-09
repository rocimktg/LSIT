document.addEventListener("DOMContentLoaded", () => {
  const mapFrame = document.querySelector(".contact-map__frame iframe");
  if (mapFrame && mapFrame.dataset.src) {
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
  }

  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const successMessage = document.getElementById("form-success");
    const errorMessage = document.getElementById("form-error");
    const defaultButtonHTML = submitButton ? submitButton.innerHTML : "";

    const setSubmittingState = (isSubmitting) => {
      if (!submitButton) {
        return;
      }

      submitButton.disabled = isSubmitting;
      submitButton.classList.toggle("is-loading", isSubmitting);
      if (isSubmitting) {
        submitButton.innerHTML = "Sending…";
      } else {
        submitButton.innerHTML = defaultButtonHTML;
      }
    };

    const encodeFormData = (formData) => {
      const pairs = new URLSearchParams();
      formData.forEach((value, key) => {
        pairs.append(key, value);
      });
      return pairs.toString();
    };

    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (successMessage) {
        successMessage.hidden = true;
      }
      if (errorMessage) {
        errorMessage.hidden = true;
      }

      const formData = new FormData(contactForm);
      if (!formData.has("form-name")) {
        formData.append("form-name", contactForm.getAttribute("name") || "contact");
      }

      try {
        setSubmittingState(true);
        const response = await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: encodeFormData(formData)
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        contactForm.reset();
        if (successMessage) {
          successMessage.hidden = false;
        }
      } catch (error) {
        console.error("Contact form submission failed", error);
        if (errorMessage) {
          errorMessage.hidden = false;
        }
      } finally {
        setSubmittingState(false);
      }
    });
  }
});
