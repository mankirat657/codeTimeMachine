/*global variables */
const form = document.querySelector("#profileForm");
const showError = document.querySelector(".showError");
const overlay = document.querySelector("#loadingOverlay");
const contentWrapper = document.querySelector("#contentWrapper");
const textarea = document.getElementById("codeEditor");
const lineNumbers = document.getElementById("lineNumbers");
let prevVerCodeBLock = document.querySelector(".prevVersion .codeblocks");
let currVerCodeBLock = document.querySelector(".currVersion .codeblocks");
let username;
let githubId;
let db;
let user;
let functionpages = document.querySelectorAll(".codeTimeMachine");
let buttons = document.querySelectorAll(".pages button");
let codepointer = 1;
let saveTimer = null;
let lastSavedValue = "";
let autosaved = document.querySelectorAll(".autosaved");
let revertBtn = document.querySelector(".revertBtn");
let clicked = true;
let exportBtn = document.querySelector("#export");
/*utilFunction */
function usernameStrenghtChecker(username) {
  if (username.length < 3) {
    showError.innerText = "username can't be less than 3";
    return false;
  } else return true;
}
function timeAgo(timestamp) {
  const diff = Math.floor((Date.now() - timestamp) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;

  return `${Math.floor(diff / 86400)} days ago`;
}

function getFormattedTime() {
  const now = new Date();
  return now.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
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

    getSnapshots();
    if (textarea.value.trim() !== "") {
      runCode();
    }
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
      ).innerHTML = `<i class="fa-solid fa-fan" style="color: #9afc97ff;"></i> Air Quality :- very Unhealthy ${airIndicators.veryHealthy}`;
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
  if (!output) {
    console.error("Output element not found");
    return;
  }

  output.textContent = "";

  const userCode = textarea.value;

  try {
    const capturedLogs = [];
    const customConsole = {
      log: (...args) => capturedLogs.push(args.join(" ")),
      error: (...args) => capturedLogs.push(args.join(" ")),
    };

    new Function("console", userCode)(customConsole);

    output.textContent = capturedLogs.join("\n");
  } catch (err) {
    output.textContent = "❌ Error: " + err.message;
  }
}

let saveTimeout = null;
let isUserTyping = false;

textarea.addEventListener("input", () => {
  isUserTyping = true;

  clearTimeout(saveTimeout);

  saveTimeout = setTimeout(() => {
    if (!db) return;

    if (textarea.value !== lastSavedValue) {
      saveSnapShots(textarea.value);
      lastSavedValue = textarea.value;
    }

    isUserTyping = false;
  }, 10000);
});

function saveSnapShots(value) {
  if (!db) {
    console.error("DB not ready yet");
    return;
  }
  const transaction = db.transaction("codeSnapshots", "readwrite");
  const store = transaction.objectStore("codeSnapshots");
  store.add({
    code: value,
    timestamp: getFormattedTime(),
    cursorPros: textarea.selectionStart,
    createdAt: Date.now(),
  });
  transaction.oncomplete = () => {
    getSnapshots();
    console.log("snapshot saved");
  };

  transaction.onerror = () => {
    console.error("Transaction failed");
  };
}
function getSnapshots() {
  if (!db) {
    console.error("DB not ready yet ");
  }
  const transaction = db.transaction("codeSnapshots", "readonly");
  const store = transaction.objectStore("codeSnapshots");
  const request = store.getAll();
  request.onsuccess = () => {
    displaySnapShots(request.result);
  };
  request.onerror = () => {
    console.error("Failed to fetch snapshots");
  };
}

function displaySnapShots(result) {
  console.log(result);

  const snapShotsContainer = document.querySelector(".snapShots");
  snapShotsContainer.innerHTML = "";
  prevVerCodeBLock.innerHTML = "";
  currVerCodeBLock.innerHTML = "";

  if (!Array.isArray(result) || result.length === 0) {
    lastSavedValue = textarea.value;
    return;
  }

  result.forEach((item) => {
    const snapTimingsDiv = document.createElement("div");
    snapTimingsDiv.className = "snapTimings";
    snapTimingsDiv.id = item?.id;
    snapTimingsDiv.innerHTML = `
      <p>${item.timestamp}</p>
      <p>${timeAgo(item.createdAt)}</p>
    `;
    snapShotsContainer.appendChild(snapTimingsDiv);
  });

  const sortedSnapshots = [...result].sort((a, b) => b.createdAt - a.createdAt);

  const latestCodeObj = sortedSnapshots[0];
  const previousCodeObj = sortedSnapshots[1] || null;
  //work to find wich line is deducted
  let prevCodearray = previousCodeObj?.code.split("\n");
  let latestCodearray = latestCodeObj?.code.split("\n");
  console.log(prevCodearray);
  console.log(latestCodearray);
  const deductedLines =
    Array.isArray(prevCodearray) &&
    prevCodearray.filter((line) => !latestCodearray.includes(line));

  const commonLines =
    Array.isArray(prevCodearray) &&
    prevCodearray.filter((line) => latestCodearray.includes(line));

  console.log("Common:", commonLines);
  console.log("Deducted:", deductedLines);

  // ---------------- CURRENT VERSION ----------------
  if (latestCodeObj && typeof latestCodeObj.code === "string") {
    textarea.value = latestCodeObj.code;
    lastSavedValue = latestCodeObj.code;
    runCode();
    Array.isArray(deductedLines) &&
      deductedLines.forEach((item) => {
        const codeLine = document.createElement("div");
        codeLine.className = "deductedCode";
        codeLine.textContent = item;
        currVerCodeBLock.appendChild(codeLine);
      });
    latestCodeObj.code.split("\n").forEach((line) => {
      const codeLine = document.createElement("div");
      codeLine.className = "latCode";
      codeLine.textContent = line;
      currVerCodeBLock.appendChild(codeLine);
    });
  }

  // ---------------- PREVIOUS VERSION ----------------
  if (!previousCodeObj || typeof previousCodeObj.code !== "string") {
    console.log("No previous version available");
  } else {
    previousCodeObj?.code.split("\n").forEach((line) => {
      const codeLine = document.createElement("div");
      codeLine.className = "code";
      codeLine.textContent = line;
      prevVerCodeBLock.appendChild(codeLine);
    });
  }

  console.log(latestCodeObj);
  autosaved.forEach((item) => {
    item.textContent = `Auto-Saved at ${latestCodeObj.timestamp}`;
  });

  tabDisplay(snapShotsContainer, result);
}
function tabDisplay(snapShotsContainer, result) {
  const dataCode = document.querySelectorAll("[data-code]");

  snapShotsContainer.onclick = (e) => {
    const tab = e.target.closest(".snapTimings");
    console.log(tab);

    if (!tab) return;
    e.stopPropagation();

    const snapshot = result.find((f) => f.id === Number(tab.id));
    if (!snapshot) return;
    document.querySelector(".showCurrentCode").style.display = "block";
    const lines = snapshot.code.split("\n");

    dataCode.forEach((box) => {
      box.innerHTML = "";

      const ul = document.createElement("ul");
      ul.style.margin = "0";
      ul.style.padding = "0";

      lines.forEach((line) => {
        const li = document.createElement("li");
        li.textContent = line;
        ul.appendChild(li);
      });

      box.appendChild(ul);

      box.style.top = e.clientY + "px";
      box.style.left = e.clientX + "px";
    });

    document.body.addEventListener("click", function (e1) {
      document.querySelector(".showCurrentCode").style.display = "none";
    });
  };
  //context menu work
  const contextMenu = document.getElementById("snapshotContextMenu");

  snapShotsContainer.addEventListener("contextmenu", (e) => {
    const tab = e.target.closest(".snapTimings");
    if (!tab) return;

    e.preventDefault();

    contextMenu.style.top = e.clientY + "px";
    contextMenu.style.left = e.clientX + "px";

    contextMenu.dataset.id = tab.id;
    contextMenu.style.display = "flex";
  });

  contextMenu.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const action = btn.dataset.action;
    const snapId = contextMenu.dataset.id;

    if (action === "revert") {
      console.log("Revert snapshot:", snapId);
      const findCode = result.find((f) => f.id === Number(snapId));
      textarea.value = findCode.code;
    }

    if (action === "delete") {
      deleteSnapshot(snapId);
    }
    if (action === "export") {
      const snapshot = result.find((f) => f.id === Number(snapId));
      exportSnapshot(snapshot.code);
    }

    contextMenu.style.display = "none";
  });

  document.addEventListener("click", () => {
    contextMenu.style.display = "none";
  });
}

function deleteSnapshot(snapshotId) {
  if (!db) {
    console.error("DB not ready yet");
    return;
  }

  const transaction = db.transaction("codeSnapshots", "readwrite");
  const store = transaction.objectStore("codeSnapshots");

  store.delete(Number(snapshotId));

  transaction.oncomplete = () => {
    console.log("snapshot deleted");
    getSnapshots();
  };

  transaction.onerror = () => {
    console.error("Delete transaction failed");
  };
}
function exportCodeToFile(code, filename = "code.js") {
  const blob = new Blob([code], { type: "text/javascript" });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function exportSnapshot(code) {
  const time = new Date().toLocaleString("en-IN").replace(/[\/:, ]/g, "_");

  const filename = `code_snapshot_${time}.js`;
  exportCodeToFile(code, filename);
}
