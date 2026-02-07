document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const confirmModal = document.getElementById("confirm-modal");
  const confirmModalActivity = document.getElementById("confirm-modal-activity");
  const confirmModalEmail = document.getElementById("confirm-modal-email");
  const confirmModalConfirm = document.getElementById("confirm-modal-confirm");
  const confirmModalCancel = document.getElementById("confirm-modal-cancel");

  let pendingDelete = null;

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function openConfirmModal(activityName, email, deleteButton) {
    confirmModalActivity.textContent = activityName;
    confirmModalEmail.textContent = email;
    confirmModal.classList.remove("hidden");
    confirmModal.setAttribute("aria-hidden", "false");
    pendingDelete = { activityName, email, deleteButton };
    confirmModalConfirm.focus();
  }

  function closeConfirmModal() {
    confirmModal.classList.add("hidden");
    confirmModal.setAttribute("aria-hidden", "true");
    pendingDelete = null;
  }

  async function performDelete(activityName, email, deleteButton) {
    deleteButton.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        fetchActivities();
      } else {
        showMessage(result.detail || "Unable to unregister participant.", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister participant. Please try again.", "error");
      console.error("Error unregistering participant:", error);
    } finally {
      deleteButton.disabled = false;
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch(`/activities?ts=${Date.now()}`, {
        cache: "no-store",
      });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = "<option value=\"\">-- Select an activity --</option>";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list HTML
        let participantsHTML = '';
        if (details.participants.length > 0) {
          const participantItems = details.participants
            .map(email => (
              `<li class="participant-item">
                <span class="participant-email">${email}</span>
                <button
                  type="button"
                  class="delete-participant"
                  data-activity="${encodeURIComponent(name)}"
                  data-email="${encodeURIComponent(email)}"
                  aria-label="Unregister ${email}">
                  <span class="delete-icon" aria-hidden="true">Remove</span>
                </button>
              </li>`
            ))
            .join('');
          participantsHTML = `
            <div class="participants-section">
              <h5>Current Participants:</h5>
              <ul class="participants-list">
                ${participantItems}
              </ul>
            </div>
          `;
        } else {
          participantsHTML = `
            <div class="participants-section">
              <h5>Current Participants:</h5>
              <p class="no-participants">No participants yet. Be the first to sign up!</p>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".delete-participant");
    if (!deleteButton) {
      return;
    }

    const activityName = decodeURIComponent(deleteButton.dataset.activity || "");
    const email = decodeURIComponent(deleteButton.dataset.email || "");

    if (!activityName || !email) {
      showMessage("Missing activity or participant information.", "error");
      return;
    }

    openConfirmModal(activityName, email, deleteButton);
  });

  confirmModalCancel.addEventListener("click", () => {
    closeConfirmModal();
  });

  confirmModalConfirm.addEventListener("click", () => {
    if (!pendingDelete) {
      closeConfirmModal();
      return;
    }

    const { activityName, email, deleteButton } = pendingDelete;
    closeConfirmModal();
    performDelete(activityName, email, deleteButton);
  });

  confirmModal.addEventListener("click", (event) => {
    if (event.target === confirmModal) {
      closeConfirmModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !confirmModal.classList.contains("hidden")) {
      closeConfirmModal();
    }
  });

  // Initialize app
  fetchActivities();
});
