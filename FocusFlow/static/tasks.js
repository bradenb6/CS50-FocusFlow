function toggleTaskForm() {
    const form = document.getElementById("task-form");
    form.classList.toggle("hidden");
}

function openEditModal(id, title, desc, deadline) {
    const modal = document.getElementById("edit-modal");
    modal.classList.remove("hidden");

    document.getElementById("edit-title").value = title;
    document.getElementById("edit-description").value = desc;
    document.getElementById("edit-deadline").value = deadline;

    document.getElementById("edit-form").action = "/tasks/edit/" + id;
}

function closeEditModal() {
    document.getElementById("edit-modal").classList.add("hidden");
}