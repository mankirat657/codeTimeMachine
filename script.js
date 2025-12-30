/*global variables */
const form = document.querySelector("#profileForm");
const showError = document.querySelector(".showError");
const overlay = document.querySelector("#loadingOverlay");
const contentWrapper = document.querySelector("#contentWrapper");
const textarea = document.getElementById("codeEditor");
const lineNumbers = document.getElementById("lineNumbers");
let username;
let githubId;
let db;
let user;
let functionpages = document.querySelectorAll(".codeTimeMachine");
let buttons = document.querySelectorAll(".pages button");
let codepointer = 1;
let saveTimer = null;
let lastSavedValue = "";
/*utilFunction */
function usernameStrenghtChecker(username) {
  if (username.length < 3) {
    showError.innerText = "username can't be less than 3";
    return false;
  } else return true;
}

function showLoader() {
  overlay.classList.remove("hidden");
}
function hideLoader() {
  overlay.classList.add("hidden");
}
/*setting up the user profile */
function profileSetup() {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    console.dir(e, form);
    username = e.srcElement[0].value;
    githubId = e.srcElement[1].value;
    console.log(username, githubId);
    const value = usernameStrenghtChecker(username);
    if (value) {
      fetchUserProfileData(githubId);
      saveUser(username, githubId);
    }
  });
}
profileSetup();
/*database creation using indexdb*/
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("UserDb", 3);

    request.onupgradeneeded = function (event) {
      db = event.target.result;
      if (!db.objectStoreNames.contains("users")) {
        db.createObjectStore("users", { keyPath: "id", autoIncrement: true });
      }
      db.createObjectStore("codeSnapshots", {
        keyPath: "id",
        autoIncrement: true,
      });
    };

    request.onsuccess = function (event) {
      db = event.target.result;
      console.log("DB ready");
      resolve(db);
    };

    request.onerror = function () {
      console.error("DB failed to open");
      reject("DB failed");
    };
  });
}

initDB();
/*saving user to the database */
function saveUser(username, githubId) {
  if (!db) {
    console.error("DB not ready yet");
    return;
  }

  const transaction = db.transaction("users", "readwrite");
  const store = transaction.objectStore("users");

  store.add({ username, githubId });

  transaction.oncomplete = () => {
    console.log("User saved");
  };

  transaction.onerror = () => {
    console.error("Transaction failed");
  };
}

async function fetchUserProfileData(githubId) {
  showLoader();
  try {
    const response = await fetch(`https://api.github.com/users/${githubId}`);

    if (!response.ok) {
      throw new Error("User not found");
    }

    const data = await response.json();
    console.log(data);
    form.remove();
    contentWrapper.style.display = "block";
    return data;
  } catch (error) {
    console.error("Error fetching GitHub profile:", error.message);
  } finally {
    hideLoader();
  }
}
function getUser() {
  return new Promise((resolve, reject) => {
    if (!db) reject("Db not ready");
    const transaction = db.transaction("users", "readonly");
    const store = transaction.objectStore("users");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject("Failed to fetch users");
  });
}
document.addEventListener("DOMContentLoaded", async (e) => {
  try {
    await initDB();
    user = await getUser();
    renderUsers(user);
  } catch (err) {
    console.error(err);
  }
});
function renderUsers(users) {
  if (users && users.length > 0) {
    form.remove();
    contentWrapper.style.display = "block";
    users.forEach((u) => {
      fetchUserProfileData(u?.githubId);
    });
  } else {
  }
}
async function getWeatherData() {
  try {
    const response = await fetch(
      "http://api.weatherapi.com/v1/current.json?key=4a1e52e2c52049b6a60160342252504&q=India&aqi=yes"
    );

    if (!response.ok) {
      throw new Error("Weather data not fetched");
    }

    return await response.json();
  } catch (error) {
    console.error(error);
  }
}

(async () => {
  const mydata = await getWeatherData();
  console.log(mydata);
  displayData(mydata);
})();
function displayData(mydata) {
  console.log(mydata);

  document.querySelector(
    "#temp"
  ).innerHTML = `<i class="fa-solid fa-temperature-low" style="color: #9afc97ff;"></i> Temprature: ${mydata?.current?.feelslike_c}°C / ${mydata?.current?.feelslike_f}°F`;
  document.querySelector(
    ".heatIndex"
  ).innerHTML = `<i class="fa-solid fa-fire-flame-curved" style="color: #9afc97ff;"></i> Heat Index: ${mydata?.current?.heatindex_c}°C / ${mydata?.current?.heatindex_f}°F`;
  document.querySelector(
    ".humidity"
  ).innerHTML = `<i class="fa-solid fa-umbrella-beach" style="color: #9afc97ff;"></i> Humidity: ${mydata?.current?.humidity}`;
  document.querySelector(
    ".windDegreeSpeed"
  ).innerHTML = `<i class="fa-solid fa-wind" style="color: #9afc97ff;"></i> Wind Degree & Speed: ${mydata?.current?.wind_degree} / ${mydata?.current?.wind_kph}kph & ${mydata.current?.wind_mph}mph`;
  let airIndicators = {
    good: "🟢",
    moderate: "🟡",
    unhealthyForSensitive: "🟠",
    unhealthy: "🔴",
    veryHealthy: "🟣",
    hazardous: "⚫",
  };
  switch (mydata?.current?.air_quality?.["us-epa-index"]) {
    case 1:
      document.querySelector(
        ".airQuality"
      ).innerHTML = `<i class="fa-solid fa-fan" style="color: #9afc97ff;"></i> Air Quality :- Good ${airIndicators.good}`;
      break;
    case 2:
      document.querySelector(
        ".airQuality"
      ).innerHTML = `<i class="fa-solid fa-fan" style="color: #9afc97ff;"></i> Air Quality :- Moderate ${airIndicators.moderate}`;
      break;
    case 2:
      document.querySelector(
        ".airQuality"
      ).innerHTML = `<i class="fa-solid fa-fan" style="color: #9afc97ff;"></i> Air Quality :- Moderate ${airIndicators.moderate}`;
      break;
    case 3:
      document.querySelector(
        ".airQuality"
      ).innerHTML = `<i class="fa-solid fa-fan" style="color: #9afc97ff;"></i> Air Quality :- unhealthy For Sensitive ${airIndicators.unhealthyForSensitive}`;
      break;
    case 4:
      document.querySelector(
        ".airQuality"
      ).innerHTML = `<i class="fa-solid fa-fan" style="color: #9afc97ff;"></i> Air Quality :- unhealthy ${airIndicators.unhealthy}`;
      break;
    case 5:
      document.querySelector(
        ".airQuality"
      ).innerHTML = `<i class="fa-solid fa-fan" style="color: #9afc97ff;"></i> Air Quality :- veryHealthy ${airIndicators.veryHealthy}`;
      break;
    case 6:
      document.querySelector(
        ".airQuality"
      ).innerHTML = `<i class="fa-solid fa-fan" style="color: #9afc97ff;"></i> Air Quality :- hazardous ${airIndicators.hazardous}`;
      break;
  }
}
// 117e71628b2dd7f3f3ef7f3772d00f8c
functionpages.forEach((item) => {
  item.addEventListener("click", function (e) {
    document.querySelectorAll(".pages")[item.id].style.display = "block";
  });
});

buttons.forEach((item) => {
  item.addEventListener("click", (e) => {
    document.querySelectorAll(".pages")[item.id].style.display = "none";
  });
});
function updateLineNumbers() {
  const lines = textarea.value.split("\n").length;

  lineNumbers.innerHTML = "";
  for (let i = 1; i <= lines; i++) {
    const p = document.createElement("p");
    p.innerText = i;
    lineNumbers.appendChild(p);
  }
}

textarea.addEventListener("input", updateLineNumbers);
textarea.addEventListener("scroll", () => {
  lineNumbers.scrollTop = textarea.scrollTop;
});
function runCode() {
  const output = document.getElementById("output");
  output.textContent = "";

  const originalLog = console.log;

  console.log = function (...args) {
    output.textContent += args.join(" ") + "\n";
  };

  try {
    new Function(textarea.value)();
  } catch (err) {
    output.textContent = "❌ Error: " + err.message;
  }

  console.log = originalLog;
}
runCode();
function scheduleAutoSave() {
  clearTimeout(saveTimer);

  saveTimer = setTimeout(() => {
    if (textarea.value !== lastSavedValue) {
      saveSnapShots(textarea.value);
      lastSavedValue = textarea.value;
      console.log("Snapshot saved");
    }
  }, 5000);
}

textarea.addEventListener("input", scheduleAutoSave);
function saveSnapShots(value) {
  if (!db) {
    console.error("DB not ready yet");
    return;
  }
  const transaction = db.transaction("codeSnapshots", "readwrite");
  const store = transaction.objectStore("codeSnapshots");
  store.add({
    code: value,
    timestamp: Date.now(),
    cursorPros: textarea.selectionStart,
  });
}
// function saveUser(username, githubId) {
//   if (!db) {
//     console.error("DB not ready yet");
//     return;
//   }

//   const transaction = db.transaction("users", "readwrite");
//   const store = transaction.objectStore("users");

//   store.add({ username, githubId });

//   transaction.oncomplete = () => {
//     console.log("User saved");
//   };

//   transaction.onerror = () => {
//     console.error("Transaction failed");
//   };
// }
