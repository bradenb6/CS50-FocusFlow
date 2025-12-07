// Opens the form for the goal when the button is clicked by removing the hidden class from goal-form
function toggleGoalForm() {
    const card = document.getElementById("goal-form");
    card.classList.toggle("hidden");
}

// Opens the edit modal when clicked and gets the values that are being edited to work with app.py to update the database
function openEditModal(id, title, desc, deadline) {
    const modal = document.getElementById("edit-modal");
    modal.classList.remove("hidden");

    document.getElementById("edit-title").value = title;
    document.getElementById("edit-description").value = desc;
    document.getElementById("edit-deadline").value = deadline;

    document.getElementById("edit-form").action = `/goals/edit/${id}`;
}


// Closes the edit model by adding the hidden class
function closeEditModal() {
    document.getElementById("edit-modal").classList.add("hidden");

}
