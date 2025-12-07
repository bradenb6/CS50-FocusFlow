// Opens the journal form by removing the hidden class when clicked
function toggleJournalForm() {
    const card = document.getElementById("journal-entry");
    card.classList.toggle("hidden");
}

// Makes it so the entries either are shown or hidden when clicked
function toggleEntry(id) {
    const content = document.getElementById(`entry-${id}`);
    content.classList.toggle("hidden");
}

// Hides the normal entry view and shows the edit view by adding and removing the hidden class when edit is clicked
function startEdit(id) {
    document.getElementById(`entry-${id}`).classList.add("hidden");
    document.getElementById(`edit-${id}`).classList.remove("hidden");
}

// Hides the edit view and shows the normal entry view when cancel is clicked
function cancelEdit(id) {
    document.getElementById(`edit-${id}`).classList.add("hidden");
    document.getElementById(`entry-${id}`).classList.remove("hidden");
}

// Saves the edit by getting the edited text and sending it to the server using JSON to send the new content and then checks to make sure it worked before closing the edit form by using the cancelEdit() function
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
