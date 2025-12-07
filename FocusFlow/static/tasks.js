// Show or hide the task form by toggling its "hidden" class.
function toggleTaskForm() {
    const form = document.getElementById("task-form");
    form.classList.toggle("hidden");
}

// Open the edit modal and fill its fields with the task’s current details while setting the correct form action.
function openEditModal(id, title, desc, deadline) {
    const modal = document.getElementById("edit-modal");
    modal.classList.remove("hidden");

    document.getElementById("edit-title").value = title;
    document.getElementById("edit-description").value = desc;
    document.getElementById("edit-deadline").value = deadline;

    document.getElementById("edit-form").action = "/tasks/edit/" + id;
}

// Hide the edit modal by adding the "hidden" class.
function closeEditModal() {
    document.getElementById("edit-modal").classList.add("hidden");

}
