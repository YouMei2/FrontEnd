const API_BASE = 'http://localhost:8080/user';
const userId = localStorage.getItem('userId');

// 1. Name change — FIXED
async function updateName() {
    const newName = document.getElementById('newName').value;
    if (!newName) return alert("Please enter a name");

    try {
        const response = await fetch(`${API_BASE}/${userId}/update-name`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newName: newName })
        });
        if (response.ok) {
            // UPDATE LOCALSTORAGE so the name changes immediately on the site
            localStorage.setItem('userName', newName);
            alert("Name updated successfully!");
            window.location.reload(); // Reload to update the header
        }
        else alert("Failed to update name");
    } catch (e) { alert("Server error"); }
}

// 2. Email change
async function updateEmail() {
    const newEmail = document.getElementById('newEmail').value.trim().toLowerCase();
    if (!newEmail) return alert("Enter new email");

    if (confirm("Changing email will require new verification. Continue?")) {
        try {
            const response = await fetch(`${API_BASE}/${userId}/update-email`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newEmail: newEmail })
            });

            if (response.ok) {
                localStorage.setItem('emailForVerification', newEmail);
                // Mark that we are just changing email, not registering again
                localStorage.setItem('isUpdatingEmail', 'true');
                alert("Code sent to your new email. Redirecting...");
                window.location.href = 'verify.html';
            } else {
                const msg = await response.text();
                alert("Error: " + msg);
            }
        } catch (e) { alert("Server error"); }
    }
}
