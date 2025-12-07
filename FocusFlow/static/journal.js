function toggleJournalForm() {
    const card = document.getElementById("journal-entry");
    card.classList.toggle("hidden");
}

function toggleEntry(id) {
    const content = document.getElementById(`entry-${id}`);
    content.classList.toggle("hidden");
}

function startEdit(id) {
    document.getElementById(`entry-${id}`).classList.add("hidden");
    document.getElementById(`edit-${id}`).classList.remove("hidden");
}

function cancelEdit(id) {
    document.getElementById(`edit-${id}`).classList.add("hidden");
    document.getElementById(`entry-${id}`).classList.remove("hidden");
}

function saveEdit(id) {
    var newText = document.getElementById("edit-text-" + id).value;

    fetch("/journal/edit/" + id, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newText })
    })
    .then(function(res) {
        if (res.ok) {
            document.getElementById("content-" + id).textContent = newText;

            cancelEdit(id);
        }
    });
}