document.addEventListener("DOMContentLoaded", () => {
  const leadForm = document.getElementById("lead-form");
  if (!leadForm) {
    return;
  }

  const submitButton = leadForm.querySelector('button[type="submit"]');
  const successMessage = document.getElementById("lead-success");
  const errorMessage = document.getElementById("lead-error");
  const defaultButtonHTML = submitButton ? submitButton.innerHTML : "";

  const setSubmittingState = (isSubmitting) => {
    if (!submitButton) {
      return;
    }

    submitButton.disabled = isSubmitting;
    submitButton.classList.toggle("is-loading", isSubmitting);
    submitButton.innerHTML = isSubmitting ? "Sending…" : defaultButtonHTML;
  };

  const encodeFormData = (formData) => {
    const params = new URLSearchParams();
    formData.forEach((value, key) => {
      params.append(key, value);
    });
    return params.toString();
  };

  leadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (successMessage) {
      successMessage.hidden = true;
    }
    if (errorMessage) {
      errorMessage.hidden = true;
    }

    const formData = new FormData(leadForm);
    if (!formData.has("form-name")) {
      formData.append("form-name", leadForm.getAttribute("name") || "lead-capture");
    }

    try {
      setSubmittingState(true);
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encodeFormData(formData)
      });

      if (!response.ok) {
        throw new Error(`Form submission failed: ${response.status}`);
      }

      leadForm.reset();
      if (successMessage) {
        successMessage.hidden = false;
      }
    } catch (error) {
      console.error("Lead capture form submission failed", error);
      if (errorMessage) {
        errorMessage.hidden = false;
      }
    } finally {
      setSubmittingState(false);
    }
  });
});
