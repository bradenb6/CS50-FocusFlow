const params = new URLSearchParams(window.location.search);
const date = params.get("date");
//assumes time is midnight
const jsDate = new Date(date + "T00:00");
//Convert the Date object into a full, readable date.
const formatted = jsDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
});
//Display the formatted date in the modal and store the original date value in a data attribute.
document.getElementById("modalDate").innerText = formatted;
document.getElementById("modalDate").dataset.realdate = date;

// Convert a 24-hour number (0–23) into a 12-hour time string with AM/PM (e.g., 14 → "2:00 PM").
function formatHour(h) {
    const ampm = h < 12 ? "AM" : "PM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return hour12 + ":00 " + ampm;
}

// Get the day grid element and clear out any existing content so we can rebuild it.
function buildGrid() {
    const grid = document.getElementById("dayGrid");
    grid.innerHTML = "";

// Create 24 hourly rows by adding a time label and a matching empty slot for each hour of the day.
    for (var hour = 0; hour < 24; hour++) {
        let label = document.createElement("div");
        label.className = "hour";
        label.innerText = formatHour(hour);

        let slot = document.createElement("div");
        slot.className = "slot";
        slot.id = `hour-${hour}`;

        grid.appendChild(label);
        grid.appendChild(slot);
    }
}

// Fetch all events for the selected date and create a colored event element positioned at its starting hour.
function loadEvents() {
    var date = document.getElementById("modalDate").dataset.realdate;

    fetch("/events/" + date)
        .then(function (r) { return r.json(); })
        .then(function (events) {

            events.forEach(function (ev) {
                var startHour = parseInt(ev.start_time.split(":")[0], 10);

                // Create event
                var el = document.createElement("div");
                el.className = "event";
                el.style.background = ev.color;

                var text = document.createElement("span");
                text.className = "event-text";
                text.innerText = ev.title + " (" + ev.start_time + " - " + ev.end_time + ")";
                el.appendChild(text);

                // Button wrapper
                var buttons = document.createElement("div");
                buttons.className = "event-buttons hidden";

                // Edit button
                var editBtn = document.createElement("button");
                editBtn.className = "event-edit-btn";
                editBtn.dataset.id = ev.id;
                editBtn.innerText = "Edit";
                buttons.appendChild(editBtn);

                // Delete button
                var delBtn = document.createElement("button");
                delBtn.className = "event-del-btn";
                delBtn.dataset.id = ev.id;
                delBtn.innerText = "Delete";
                buttons.appendChild(delBtn);

                el.appendChild(buttons);


                el.addEventListener("click", function (e) {

                    // Skip toggle logic when clicking Edit/Delete buttons.
                    if (e.target.classList.contains("event-edit-btn") ||
                        e.target.classList.contains("event-del-btn")) {
                        return;
                    }

                // Toggle the visibility of the event's action buttons, then place the event element into its matching hourly slot.
                    buttons.classList.toggle("hidden");
                });

                document.getElementById("hour-" + startHour).appendChild(el);
            });
        });
}

// Show the event modal by removing its "hidden" class.
function openEventModal() {
    document.getElementById("eventModal").classList.remove("hidden");
}

// Hide the event modal by adding the "hidden" class.
function closeEventModal() {
    document.getElementById("eventModal").classList.add("hidden");
}

// Collect form data, validate required fields, and prepare event information for creating or updating an entry.
function saveEvent() {
    var date = document.getElementById("modalDate").dataset.realdate;

    var title = document.getElementById("eventTitle").value;
    var start_time = document.getElementById("startTime").value;
    var end_time = document.getElementById("endTime").value;
    var category = document.getElementById("category").value;

    var color = document.querySelector("#category option[value='" + category + "']").dataset.color;

    var id = document.getElementById("editEventId").value;

    if (!title || !start_time || !end_time) {
        alert("Please fill out all fields.");
        return;
    }

    // Package all event details into a single data object to send to the server.
    var data = {
        date: date,
        title: title,
        start_time: start_time,
        end_time: end_time,
        category: category,
        color: color
    };

    // If an ID exists, update the event; otherwise create a new one, then refresh the grid and close the modal.
    if (id) {
        fetch("/events/edit/" + id, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })
        .then(function () {
            closeEventModal();
            document.getElementById("editEventId").value = "";
            buildGrid();
            loadEvents();
        });
    } else {
        fetch("/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })
        .then(function () {
            closeEventModal();
            buildGrid();
            loadEvents();
        });
    }
}

// Listen for clicks on edit or delete buttons anywhere in the document and trigger the correct action without toggling the event box.
document.addEventListener("click", function (e) {
    if (e.target.classList.contains("event-edit-btn")) {
        let id = e.target.dataset.id;
        editEvent(id);
        e.stopPropagation();
    }
    if (e.target.classList.contains("event-del-btn")) {
        let id = e.target.dataset.id;
        deleteEvent(id);
        e.stopPropagation();
    }
});

// Ask for confirmation, delete the event on the server, then rebuild and reload the day’s schedule.
function deleteEvent(id) {
    if (!confirm("Delete this event?")) return;

    fetch("/events/delete/" + id, { method: "POST" })
        .then(function () {
            buildGrid();
            loadEvents();
        });
}

// Load all events for the selected date and search for the one matching the given ID.
function editEvent(id) {
    var date = document.getElementById("modalDate").dataset.realdate;

    fetch("/events/" + date)
        .then(function (r) {
            return r.json();
        })
        .then(function (events) {

            var ev = null;

            for (var i = 0; i < events.length; i++) {
                if (events[i].id == id) {
                    ev = events[i];
                    break;
                }
            }

            if (!ev) return;

            // Set ID for editing
            document.getElementById("editEventId").value = id;

            // Change modal title
            document.getElementById("eventModalTitle").innerText = "Edit Event";

            // Prefill modal fields
            document.getElementById("eventTitle").value = ev.title;
            document.getElementById("startTime").value = ev.start_time;
            document.getElementById("endTime").value = ev.end_time;
            document.getElementById("category").value = ev.category;

            // Open modal
            document.getElementById("eventModal").classList.remove("hidden");
        });
}

buildGrid();
loadEvents();

