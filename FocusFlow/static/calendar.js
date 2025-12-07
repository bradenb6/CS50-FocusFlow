let current = new Date();

async function loadCalendar() {

    // ---- 1. GET SESSION TOTALS SAFELY ----
    let sessionTotals = {};
    try {
        const res = await fetch("/session_totals");
        sessionTotals = await res.json();
    } catch (e) {
        console.warn("Could not load session totals:", e);
    }

    // ---- 2. BUILD CALENDAR ----
    const body = document.getElementById("calendarBody");
    body.innerHTML = "";

    const y = current.getFullYear();
    const m = current.getMonth();
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();

    document.getElementById("monthYear").innerText =
        current.toLocaleString("default", { month: "long" }) + " " + y;

    let row = document.createElement("tr");

    // blank cells before start of month
    for (let i = 0; i < first; i++) {
        row.appendChild(document.createElement("td"));
    }

    // ---- 3. LOOP THROUGH DAYS ----
    for (let d = 1; d <= days; d++) {

        const dayStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

        let cell = document.createElement("td");
        cell.setAttribute("data-date", dayStr);   

        // write the day number
        let html = `<div class="day-number">${d}</div>`;

        cell.onclick = function () {
            window.location.href = "/day?date=" + dayStr;
        };

        // add badge if totals exist
        if (sessionTotals[dayStr]) {
            html += `
              <button class="session-badge"
                  onclick="toggleDetails('${dayStr}', event)">
                ${Math.round(sessionTotals[dayStr] / 60)} min
              </button>

              <div id="details-${dayStr}" class="session-details hidden"></div>
            `;
        }

        cell.innerHTML = html;
        row.appendChild(cell);

        // row full → push + new row
        if (row.children.length === 7) {
            body.appendChild(row);
            row = document.createElement("tr");
        }
    }

    // add leftover row
    if (row.children.length > 0) {
        body.appendChild(row);
    }
}

function nextM() {
    current.setMonth(current.getMonth() + 1);
    loadCalendar();
}

function prevM() {
    current.setMonth(current.getMonth() - 1);
    loadCalendar();
}

// initial load
loadCalendar();

//javascript for the scroll feature for the navbar
window.addEventListener("scroll", () => {
    const nav = document.querySelector("nav");

    if (window.scrollY > 10) {
        nav.classList.add("shrink");
    } else {
        nav.classList.remove("shrink");
    }
});

let timerInterval = null;
let sessionSeconds = 0;

function startSession() {
    document.getElementById("session-banner").classList.remove("hidden");

    sessionSeconds = 0;

    let today = new Date().toISOString().split("T")[0];
    document.getElementById("session-date-input").value = today;

    timerInterval = setInterval(function () {
        sessionSeconds++;
        document.getElementById("session-timer").innerHTML = formatTime(sessionSeconds);
    }, 1000);
}

document.getElementById("start-session-btn").onclick = startSession;

document.getElementById("end-session-btn").onclick = function () {

    clearInterval(timerInterval);

    document.getElementById("session-banner").classList.add("hidden");

    // OPEN MODAL
    document.getElementById("session-notes-modal").classList.remove("hidden");

    document.getElementById("session-seconds-input").value = sessionSeconds;
};

function formatTime(sec) {
    var h = String(Math.floor(sec / 3600)).padStart(2, "0");
    var m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    var s = String(sec % 60).padStart(2, "0");
    return h + ":" + m + ":" + s;
}

document.getElementById("submit-session-notes").onclick = function () {

    var notes = document.getElementById("session-notes").value;
    var seconds = parseInt(document.getElementById("session-seconds-input").value, 10);
    var date = document.getElementById("session-date-input").value;

    fetch("/save_session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            date: date,
            seconds: seconds,
            notes: notes
        })
    })
    .then(function (res) {
        if (!res.ok) {
            console.error("SAVE ERROR:", res.status, res.statusText);
            return;
        }

        // success
        document.getElementById("session-notes-modal").classList.add("hidden");
        loadCalendar();
        document.getElementById("session-notes").value = "";
    })
    .catch(function (err) {
        console.error("Fetch failed:", err);
    });
};

document.getElementById("cancel-session-notes").onclick = function () {
    document.getElementById("session-notes-modal").classList.add("hidden");
};

function toggleDetails(dateStr, event) {
    event.stopPropagation(); // prevent row clicks etc.

    var box = document.getElementById("details-" + dateStr);

    // If already visible → collapse
    if (!box.classList.contains("hidden")) {
        box.classList.add("hidden");
        return;
    }

    // Otherwise load & open
    fetch("/day_details/" + dateStr)
        .then(function (r) {
            return r.json();
        })
        .then(function (data) {

            var html = data.sessions.map(function (s) {
                return (
                    '<div class="detail-row">' +
                        '<b>' + formatTime(s.seconds) + '</b><br>' +
                        (s.notes ? s.notes : "") +
                    "</div>"
                );
            }).join("");

            box.innerHTML = html;
            box.classList.remove("hidden");
        });
}
