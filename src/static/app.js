import en from './i18n/en.js';
import es from './i18n/es.js';
import hi from './i18n/hi.js';
import mr from './i18n/mr.js';

const translations = { en, es, hi, mr };
let currentLang = 'en';

function updateTexts() {
  // Update static texts
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const keys = element.getAttribute('data-i18n').split('.');
    let value = translations[currentLang];
    keys.forEach(key => {
      value = value[key];
    });
    element.textContent = value;
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const keys = element.getAttribute('data-i18n-placeholder').split('.');
    let value = translations[currentLang];
    keys.forEach(key => {
      value = value[key];
    });
    element.placeholder = value;
  });

  // Update dynamic content if exists
  updateDynamicContent();
}

function updateDynamicContent() {
  const activitiesList = document.getElementById("activities-list");
  if (activitiesList.children.length > 0 && !activitiesList.querySelector('[data-i18n="loading"]')) {
    fetchActivities(); // Refresh activities with new language
  }
}

document.getElementById('lang').addEventListener('change', (e) => {
  currentLang = e.target.value;
  updateTexts();
});

document.addEventListener("DOMContentLoaded", () => {
  updateTexts();

  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>${translations[currentLang].activity.schedule}</strong> ${details.schedule}</p>
          <p><strong>${translations[currentLang].activity.availability}</strong> ${spotsLeft} ${translations[currentLang].activity.spotsLeft}</p>
          <p><strong>${translations[currentLang].activity.participants}</strong></p>
          <ul class="participants-list">
            ${details.participants.map(email => `<li>${email}</li>`).join('')}
          </ul>
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
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Add timer functionality
  function startTimer(duration) {
    const timerDisplay = document.getElementById('timer-value');
    let timer = duration;
    
    const countdown = setInterval(() => {
      const minutes = parseInt(timer / 60, 10);
      const seconds = parseInt(timer % 60, 10);

      timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

      if (--timer < 0) {
        clearInterval(countdown);
        fetchActivities();
        startTimer(duration); // Restart timer
      }
    }, 1000);
  }

  // Initialize app with timer
  fetchActivities();
  startTimer(1 * 60); // 1 minute

});
