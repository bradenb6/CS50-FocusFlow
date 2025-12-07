const params = new URLSearchParams(window.location.search);
const date = params.get("date");

const jsDate = new Date(date + "T00:00");

const formatted = jsDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
});

document.getElementById("modalDate").innerText = formatted;
document.getElementById("modalDate").dataset.realdate = date;

function formatHour(h) {
    const ampm = h < 12 ? "AM" : "PM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return hour12 + ":00 " + ampm;
}

function buildGrid() {
    const grid = document.getElementById("dayGrid");
    grid.innerHTML = "";

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

function loadEvents() {
    var date = document.getElementById("modalDate").dataset.realdate;

    fetch("/events/" + date)
        .then(function (r) { return r.json(); })
        .then(function (events) {

            events.forEach(function (ev) {
                var startHour = parseInt(ev.start_time.split(":")[0], 10);

                // Create event <div>
                var el = document.createElement("div");
                el.className = "event";
                el.style.background = ev.color;

                // TEXT ----------------------------
                var text = document.createElement("span");
                text.className = "event-text";
                text.innerText = ev.title + " (" + ev.start_time + " - " + ev.end_time + ")";
                el.appendChild(text);

                // BUTTON WRAPPER ------------------
                var buttons = document.createElement("div");
                buttons.className = "event-buttons hidden";

                // EDIT BUTTON
                var editBtn = document.createElement("button");
                editBtn.className = "event-edit-btn";
                editBtn.dataset.id = ev.id;
                editBtn.innerText = "Edit";
                buttons.appendChild(editBtn);

                // DELETE BUTTON
                var delBtn = document.createElement("button");
                delBtn.className = "event-del-btn";
                delBtn.dataset.id = ev.id;
                delBtn.innerText = "Delete";
                buttons.appendChild(delBtn);

                el.appendChild(buttons);

                // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
                // THIS IS WHERE THE CLICK HANDLER MUST GO
                // (Inside the loop, after 'buttons' exists.)
                // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

                el.addEventListener("click", function (e) {

                    // If clicking on the edit/delete buttons → do nothing here
                    if (e.target.classList.contains("event-edit-btn") ||
                        e.target.classList.contains("event-del-btn")) {
                        return;
                    }

                    // Otherwise toggle button visibility
                    buttons.classList.toggle("hidden");
                });

                // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
                // END OF WHERE THE HANDLER GOES
                // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

                document.getElementById("hour-" + startHour).appendChild(el);
            });
        });
}

function openEventModal() {
    document.getElementById("eventModal").classList.remove("hidden");
}

function closeEventModal() {
    document.getElementById("eventModal").classList.add("hidden");
}

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

    var data = {
        date: date,
        title: title,
        start_time: start_time,
        end_time: end_time,
        category: category,
        color: color
    };

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
            // ADDING NEW EVENT
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

function deleteEvent(id) {
    if (!confirm("Delete this event?")) return;

    fetch("/events/delete/" + id, { method: "POST" })
        .then(function () {
            buildGrid();
            loadEvents();
        });
}

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
