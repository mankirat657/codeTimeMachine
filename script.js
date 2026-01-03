/*global variables */
const form = document.querySelector("#profileForm");
const showError = document.querySelector(".showError");
const overlay = document.querySelector("#loadingOverlay");
const contentWrapper = document.querySelector("#contentWrapper");
const textarea = document.getElementById("codeEditor");
const lineNumbers = document.getElementById("lineNumbers");
let data = "";
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
let todo = [];
let inboxvalue = null;
let todayvalue = null;
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
      db.createObjectStore("todos", {
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
    dipslayProfileInfo(data);
    form.remove();
    contentWrapper.style.display = "block";
    return data;
  } catch (error) {
    console.error("Error fetching GitHub profile:", error.message);
  } finally {
    hideLoader();
  }
}
function getTodos() {
  return new Promise((resolve, reject) => {
    if (!db) return reject("DB not ready");

    const transaction = db.transaction("todos", "readonly");
    const store = transaction.objectStore("todos");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject("Failed to fetch todos");
  });
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
    todo = await getTodos();
    renderUsers(user);
    getSnapshots();
    searchImplementation();
    displayTodo(todo, check);
    searchTodo(todo);
    inboxvalue = inbox();
    todayvalue = today();
    displayCountLable(inboxvalue, todayvalue);
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
/************code time machine coding end here */

/*from here 2nd moudle advance task manager start */
let sidebar = document.querySelector(".todoSidebar");
let resizeHandler = document.querySelector(".resizeHandle");
let min = 250;
let max = 400;
let isResize = false;
let userName = document.querySelector(".user-name");
let avatarImage = document.querySelector(".avatar img");
let addTaskBtn = document.querySelector(".todoSidebar-add");
let addTaskModal = document.querySelector(".addTaskModal");
let prior = document.querySelector("#prior");
let priority = document.querySelector(".priority");
let locationes = document.querySelector(".location");
let priordisp = document.querySelector(".priorities");
let whereToPut = document.querySelector(".whereToPut");
let taskBtn = document.querySelector("#addTask");
let title = document.querySelector(".title");
let description = document.querySelector(".desc");
let date = document.querySelector(".mydate");
let flag = "";
let inboxText = document.querySelector(".inboxText");
let check = "Inbox";
let currentTodo;
let inserTitle = document.querySelector(".inserTitle");
let todoActions = document.querySelector(".todo-actions");
let taskDisplay = document.querySelector(".taskDisplay");
let todoContainer = document.querySelector(".todocontainer");
let editTodo;
let editingTodoId = null;
let cancelTask = document.querySelector("#cancelTask");
let storageDesc;
let checkedTodo;
let currentItem;
let deleteOverlay = document.querySelector(".delete-overlay");
let deletebtn;
let buttonDeletion = document.querySelector(".btn-deletion");
let display = document.querySelector(".search-overlay");
let searchBtn = document.querySelector(".search");
let searchInput = document.querySelector(".search-input");
let todayCount = document.querySelector(".todayCount");
let inboxCount = document.querySelector(".inboxCount");
console.log(priordisp);

//sidebar resizing code
function updateSidbar() {
  resizeHandler.addEventListener("mousedown", function (e) {
    isResize = true;
  });
  document.addEventListener("mousemove", function (e) {
    if (!isResize) return;

    if (e.clientX <= min) return;
    if (e.clientX >= max) return;
    sidebar.style.width = e.clientX + "px";
  });
  document.addEventListener("mouseup", function (e) {
    isResize = false;
  });
}
updateSidbar();
function dipslayProfileInfo(user) {
  console.log(user);
  userName.textContent = user?.login || "userOne";
  avatarImage.src = user?.avatar_url;
}
function displayAddTaskModal(
  title,
  description,
  date,
  prioritytwo,
  storageLocation
) {
  addTaskBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    addTaskModal.style.scale = "1";
  });

  addTaskModal.addEventListener("click", function (e) {
    e.stopPropagation();
    priordisp.style.display = "none";
    whereToPut.style.display = "none";
  });

  prior.addEventListener("click", function (e) {
    e.stopPropagation();

    const parentRect = priority.getBoundingClientRect();
    const rect = prior.getBoundingClientRect();

    priordisp.style.display = "flex";
    priordisp.style.top = rect.bottom - parentRect.top + "px";
    priordisp.style.left = rect.left - parentRect.left + "px";
  });
  inboxText.addEventListener("click", function (e) {
    e.stopPropagation();
    const secondParentRect = locationes.getBoundingClientRect();
    const secondRect = inboxText.getBoundingClientRect();
    whereToPut.style.display = "flex";
    whereToPut.style.top = secondRect.bottom - secondParentRect.top + "px";
    whereToPut.style.left = secondRect.left - secondParentRect.left + "px";
  });
  cancelTask.addEventListener("click", (e) => {
    addTaskModal.style.scale = "0";

    addTaskModal.children[0].childNodes[1].value = "";
    addTaskModal.children[1].childNodes[1].value = "";
    addTaskModal.children[2].childNodes[1].childNodes[1].childNodes[1].value =
      "";
  });
  // Click outside modal → close modal + priority
  document.body.addEventListener("click", function () {
    addTaskModal.style.scale = "0";
    priordisp.style.display = "none";
    whereToPut.style.display = "none";
    addTaskModal.children[0].childNodes[1].value = "";
    addTaskModal.children[1].childNodes[1].value = "";
    addTaskModal.children[2].childNodes[1].childNodes[1].childNodes[1].value =
      "";
  });
  if (title || description || date || prioritytwo || storageLocation) {
    console.log(addTaskModal.children);
    addTaskModal.children[0].childNodes[1].value = title;
    addTaskModal.children[1].childNodes[1].value = description;
    addTaskModal.children[2].childNodes[1].childNodes[1].childNodes[1].value =
      date;
    inboxText.textContent = storageLocation;
    flag = prioritytwo;
    prior.textContent = prioritytwo;
  }
}

displayAddTaskModal();
function saveTask() {
  if (!db) return;

  const transaction = db.transaction("todos", "readwrite");
  const store = transaction.objectStore("todos");

  const taskData = {
    title: title.value,
    description: description.value,
    priorities: flag,
    taskCompletionDate: date.value,
    WhereToPut: inboxText.textContent,
  };

  if (editingTodoId !== null) {
    taskData.id = editingTodoId;
    store.put(taskData);
  } else {
    store.add(taskData);
  }

  transaction.oncomplete = async () => {
    editingTodoId = null;
    addTaskModal.style.scale = "0";

    todo = await getTodos();
    displayTodo(todo, check);
  };
}

taskBtn.addEventListener("click", saveTask);
priordisp.addEventListener("click", function (e) {
  const priorItem = e.target.closest(".prior");
  if (!priorItem) return;
  console.log(priorItem);

  flag = priorItem.children[1].textContent;
  prior.textContent = flag;
});
whereToPut.addEventListener("click", function (e) {
  const storageType = e.target.closest(".storage");
  if (!storageType) return;
  storageDesc = storageType.children[1].textContent;
  console.log(storageDesc);
  inboxText.textContent = storageDesc;
});
function displayTodo(todo, check) {
  console.log(todo);
  console.log(check);
  switch (check) {
    case "Inbox":
      currentTodo = todo.filter((f) => f?.WhereToPut === check);
      inserTitle.textContent = "Inbox";
      break;
    case "Upcoming":
      currentTodo = todo.filter((f) => f?.WhereToPut === check);
      inserTitle.textContent = "Upcoming";
      break;
    case "Today":
      currentTodo = todo.filter((f) => f?.WhereToPut === check);
      inserTitle.textContent = "Today";
      break;
    case "Completed":
      currentTodo = todo.filter((f) => f?.WhereToPut === check);
      inserTitle.textContent = "Completed";
      break;
  }
  todoContainer.innerHTML = "";
  if (Array.isArray(currentTodo)) {
    currentTodo.reverse().forEach((item, index) => {
      const todoRow = document.createElement("div");
      todoRow.className = "todo-row";
      todoRow.setAttribute("draggable", "true");
      todoRow.dataset.todoId = item.id;
      todoRow.innerHTML = `
     <button class="todo-status" id="checked">
  ${
    item?.WhereToPut === "Completed"
      ? '<i class="fa-solid fa-circle" style="color: #63E6BE;"></i>'
      : '<i class="fa-regular fa-circle" id="checked"></i>'
  }
</button>

        <div class="todo-main">
          <div class="todo-top">
            <p class="todo-title">${item.title}</p>
            <div class="todo-actions">
              <button class="icon-btn" id="editTodo">
                <i class="fa-regular fa-pen-to-square"></i>
              </button>
              <button class="icon-btn">
                <i class="fa-regular fa-message"></i>
              </button>
              <button class="icon-btn deletebtn">
               <i class="fa-solid fa-trash" style="color: #ff0033;"></i>
              </button>
            </div>
          </div>
          <p class="todo-subtitle">${item.description}</p>
          <div class="todo-date-wrap">
            <i class="fa-regular fa-calendar"></i>
            <span class="todo-date">${item.taskCompletionDate}</span>
            </div>
            <div class="todo-date-flag">
  ${
    item?.priorities
      ? `<p>
      <i class="fa-solid fa-flag" style="color: ${
        item.priorities === "Priority 1"
          ? "#ff5900"
          : item.priorities === "Priority 2"
          ? "#ff5900"
          : item.priorities === "Priority 3"
          ? "#74c0fc"
          : "#ff0000"
      }"></i> ${item.priorities}
    </p>`
      : ""
  }
</div>
      
        </div>
      `;

      editTodo = todoRow.querySelector("#editTodo");
      checkedTodo = todoRow.querySelector("#checked");
      deletebtn = todoRow.querySelector(".deletebtn");
      editTodo.addEventListener("click", function (e) {
        e.stopPropagation();

        editingTodoId = item.id;
        addTaskModal.style.scale = "1";

        title.value = item.title;
        description.value = item.description;
        date.value = item.taskCompletionDate;
        inboxText.textContent = item.WhereToPut;

        flag = item.priorities;
        prior.textContent = item.priorities || "Priority";
      });
      checkedTodo.addEventListener("click", function (e) {
        e.stopPropagation();

        editingTodoId = item.id;
        title.value = item.title;
        description.value = item.description;
        date.value = item.taskCompletionDate;
        inboxText.textContent = "Completed";
        flag = item.priorities;
        prior.textContent = item.priorities || "Priority";

        console.log("clicked");
        saveTask();
      });
      deletebtn.addEventListener("click", function (e) {
        e.stopPropagation();
        deleteOverlay.style.display = "flex";
        window.pendingDeleteId = item.id;
      });
      buttonDeletion.addEventListener("click", async (e) => {
        if (window.pendingDeleteId) {
          await deleteTodo(window.pendingDeleteId);
          delete window.pendingDeleteId; // Clear
        }
      });
      deleteOverlay.addEventListener("click", (e) => {
        if (e.target === deleteOverlay) {
          deleteOverlay.style.display = "none";
          delete window.pendingDeleteId;
        }
      });
      todoRow.addEventListener("mouseenter", () => {
        todoRow.querySelector(".todo-actions").style.display = "flex";
      });

      todoRow.addEventListener("mouseleave", () => {
        todoRow.querySelector(".todo-actions").style.display = "none";
      });
      todoContainer.appendChild(todoRow);
    });
    const todoRow = document.querySelectorAll(".todo-row");
    dragginFunctionality(todoRow);
  }
  console.log(currentTodo);
}
sidebar.addEventListener("click", function (e) {
  const clickedItem = e.target.closest(".clickedItem");
  if (!clickedItem) return;

  check = clickedItem.children[1].textContent;
  displayTodo(todo, check);
});
function dragginFunctionality(todo) {
  currentItem = null;
  let activeRow = null;

  todo.forEach((item) => {
    item.addEventListener("dragstart", () => {
      currentItem = item;
      item.classList.add("dragging");
    });

    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
      currentItem = null;
    });
  });

  todoContainer.addEventListener("dragover", function (e) {
    e.preventDefault();

    const targetRow = e.target.closest(".todo-row");
    if (!targetRow || targetRow === currentItem) return;

    if (activeRow && activeRow !== targetRow) {
      activeRow.style.scale = "1";
      activeRow.style.border = "1px solid #3d3d3d";
    }

    activeRow = targetRow;
    activeRow.style.scale = "1.05";
    activeRow.style.border = "2px solid white";
  });

  todoContainer.addEventListener("drop", function (e) {
    e.preventDefault();

    if (!activeRow || !currentItem) return;

    activeRow.style.scale = "1";
    activeRow.style.border = "1px solid #3d3d3d";

    todoContainer.insertBefore(currentItem, activeRow);

    activeRow = null;
  });
}
async function deleteTodo(id) {
  if (!db || !id) return console.error("No ID or DB not ready");

  const transaction = db.transaction("todos", "readwrite");
  const store = transaction.objectStore("todos");
  store.delete(Number(id));

  transaction.oncomplete = async () => {
    console.log("Todo deleted:", id);
    todo = await getTodos();
    displayTodo(todo, check);
    deleteOverlay.style.display = "none";
  };

  transaction.onerror = () => {
    console.error("Delete failed");
    deleteOverlay.style.display = "none";
  };
}
function searchImplementation() {
  if (!searchBtn || !display || !searchInput) return;

  // OPEN SEARCH
  searchBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    display.style.display = "flex";
    searchInput.value = "";
    searchInput.focus();
    clearSearchResults();
  });

  // CLOSE WHEN CLICKING OVERLAY ONLY
  display.addEventListener("click", (e) => {
    if (e.target === display) {
      closeSearch();
    }
  });

  // BLOCK MODAL CONTENT CLICKS
  document.querySelector(".search-modal")?.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // ESC TO CLOSE
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSearch();
  });
}

function closeSearch() {
  display.style.display = "none";
}

function searchTodo(todo) {
  console.log(todo);
  let findTodo;
  searchInput.addEventListener("input", function (e) {
    console.log(this.value);
    findTodo = todo.find((f) => f.title === this.value);
  });
}
const searchResults = document.querySelector(".search-results");

function clearSearchResults() {
  if (searchResults) searchResults.innerHTML = "";
}

function searchTodo(todoList) {
  if (!searchInput || !searchResults) return;

  searchInput.addEventListener("input", function () {
    const query = this.value.trim().toLowerCase();
    searchResults.innerHTML = "";

    if (!query) return;

    const filteredTodos = todoList.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.WhereToPut.toLowerCase().includes(query)
    );

    if (filteredTodos.length === 0) {
      searchResults.innerHTML = `<p class="no-result">No results found</p>`;
      return;
    }

    filteredTodos.forEach(renderSearchItem);
  });
}
function renderSearchItem(todo) {
  const div = document.createElement("div");
  div.className = "search-item";

  div.innerHTML = `
    <div class="search-item-top">
      <p class="search-title"><i class="fa-solid fa-heading" style="color: #FFD43B;"></i> ${
        todo.title
      }</p>
      <div class="search-location"><i class="fa-solid fa-audio-description" style="color: #74C0FC;"></i> ${
        todo.WhereToPut
      }</div>
      <p class="search-desc"><i class="fa-solid fa-box-open" style="color: #B197FC;"></i> ${
        todo.description || ""
      }</p>
    </div>
  `;

  div.addEventListener("click", () => {
    jumpToTodo(todo.id, todo.WhereToPut);
    closeSearch();
  });

  searchResults.appendChild(div);
}
function jumpToTodo(todoId, location) {
  check = location;
  displayTodo(todo, check);

  setTimeout(() => {
    const row = document.querySelector(`[data-todo-id="${todoId}"]`);
    if (!row) return;

    row.scrollIntoView({ behavior: "smooth", block: "center" });
    row.classList.add("highlight");

    setTimeout(() => row.classList.remove("highlight"), 1500);
  }, 100);
}
const inbox = () => todo.filter((t) => t?.WhereToPut === "Inbox");
const today = () => todo.filter((t) => t?.WhereToPut === "Today");
function displayCountLable(todos, t1) {
  console.log(todos.length);
  todayCount.textContent = t1.length;
  inboxCount.textContent = todos.length;
}
