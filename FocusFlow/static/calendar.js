// Gets the new date
let current = new Date();

// Builds the calendar and loads the sessions that have happened, this is async so it can wait to do the fetch function without freezing the website
async function loadCalendar() {

    // This gets the session totals from the database (and puts a warning if it doesn't work) and awaits a response before turning it into JSON 
    let sessionTotals = {};
    try {
        const res = await fetch("/session_totals");
        sessionTotals = await res.json();
    } catch (e) {
        console.warn("Could not load session totals:", e);
    }

    // This part rebuilds the actual calendar by getting the years months and days and adding 1 to the months because they start at month 0
    const body = document.getElementById("calendarBody");
    body.innerHTML = "";

    const y = current.getFullYear();
    const m = current.getMonth();
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();

    // Writes the header of the month and year
    document.getElementById("monthYear").innerText =
        current.toLocaleString("default", { month: "long" }) + " " + y;

    // Creates a row for the calendar to be built in
    let row = document.createElement("tr");

    // blank cells before start of month
    for (let i = 0; i < first; i++) {
        row.appendChild(document.createElement("td"));
    }

    // Loops through the days and puts them into the year month day format (adds 0s to the beginning of the number until they are two digits each)
    for (let d = 1; d <= days; d++) {

        const dayStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

        // creates each day cell and then lets it also be referenced later (for the days functionality)
        let cell = document.createElement("td");
        cell.setAttribute("data-date", dayStr);   

        // writes the day number
        let html = `<div class="day-number">${d}</div>`;

        // This is the code that takes you to the days route and days page when you click on a day 
        cell.onclick = function () {
            window.location.href = "/day?date=" + dayStr;
        };

        // adds a clickable badge of the study minutes (if totals exist) and lets it expand to show the data that is added later 
        if (sessionTotals[dayStr]) {
            html += `
              <button class="session-badge"
                  onclick="toggleDetails('${dayStr}', event)">
                ${Math.round(sessionTotals[dayStr] / 60)} min
              </button>

              <div id="details-${dayStr}" class="session-details hidden"></div>
            `;
        }

        // puts the cells into the row
        cell.innerHTML = html;
        row.appendChild(cell);

        // This makes it so a new row is added when the previous one reaches 7 days
        if (row.children.length === 7) {
            body.appendChild(row);
            row = document.createElement("tr");
        }
    }

    // adds any weeks of the month that aren't 7 days (if the month ends any day besides Saturday)
    if (row.children.length > 0) {
        body.appendChild(row);
    }
}

// Loads the calendar for the next month when the next button is clicked
function nextM() {
    current.setMonth(current.getMonth() + 1);
    loadCalendar();
}

// Loads the calendar for the previous month when the previoius button is clicked
function prevM() {
    current.setMonth(current.getMonth() - 1);
    loadCalendar();
}

// initial load for the page
loadCalendar();

//javascript for the scroll feature that shrinks the navbar when scrolling down
window.addEventListener("scroll", () => {
    const nav = document.querySelector("nav");

    if (window.scrollY > 10) {
        nav.classList.add("shrink");
    } else {
        nav.classList.remove("shrink");
    }
});

// timer interval variable that is stored for later and a sessionSeconds variable that starts at 0 and will store the amount of seconds of the study session later
let timerInterval = null;
let sessionSeconds = 0;

// Shows the banner with the timer and end session button when start session is clicked
function startSession() {
    document.getElementById("session-banner").classList.remove("hidden");

    // resets the sessionSeconds variable
    sessionSeconds = 0;

    // autofills todays date into the date input feature
    let today = new Date().toISOString().split("T")[0]; 
    document.getElementById("session-date-input").value = today;

    // works the timer so it counts up and formats it (uses every 1000 ms is a second)
    timerInterval = setInterval(function () {
        sessionSeconds++;
        document.getElementById("session-timer").innerHTML = formatTime(sessionSeconds);
    }, 1000);
}

// runs the start session function when the button is clicked
document.getElementById("start-session-btn").onclick = startSession;

// ends the session by hiding the banner and opening the notes modal and inputting the amount of seconds that it took
document.getElementById("end-session-btn").onclick = function () {

    clearInterval(timerInterval);

    document.getElementById("session-banner").classList.add("hidden");

    // OPEN MODAL
    document.getElementById("session-notes-modal").classList.remove("hidden");

    document.getElementById("session-seconds-input").value = sessionSeconds;
};

// formates the time into 00:00:00
function formatTime(sec) {
    var h = String(Math.floor(sec / 3600)).padStart(2, "0");
    var m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    var s = String(sec % 60).padStart(2, "0");
    return h + ":" + m + ":" + s;
}

// function for the submit notes button
document.getElementById("submit-session-notes").onclick = function () {

    // collects all of the notes, seconds, and date
    var notes = document.getElementById("session-notes").value;
    var seconds = parseInt(document.getElementById("session-seconds-input").value, 10);
    var date = document.getElementById("session-date-input").value;

    // sends it with JSON to the app.py route and makes sure it sends otherwise sends an error
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

        // if it worked, this closes the notes form, reloads the calendar (with the new data) and resets the notes input and catches errors with bad network
        document.getElementById("session-notes-modal").classList.add("hidden");
        loadCalendar();
        document.getElementById("session-notes").value = "";
    })
    .catch(function (err) {
        console.error("Fetch failed:", err);
    });
};

// Works the cancel button and hides the notes 
document.getElementById("cancel-session-notes").onclick = function () {
    document.getElementById("session-notes-modal").classList.add("hidden");
};

// works to expand the data stored in the badges on each day
function toggleDetails(dateStr, event) {
    // makes sure to not accidentally do the days function by clicking on the day 
    event.stopPropagation(); 

    // gets the details for that day
    var box = document.getElementById("details-" + dateStr);

    // If the box is already being shown this hides it (so when you click on it it opens and when clicked again it closes)
    if (!box.classList.contains("hidden")) {
        box.classList.add("hidden");
        return;
    }

    // Otherwise gets data with the app.py route using JSON and then builds the table that shows the data with the time and notes attached
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

            // inserts the html and then shows the box 
            box.innerHTML = html;
            box.classList.remove("hidden");
        });
}

