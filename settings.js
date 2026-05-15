const API_BASE = 'https://wheel-web-site-api-apfhdfbxd7dud0cj.austriaeast-01.azurewebsites.net/user';
const userId = localStorage.getItem('userId');

// --- Authentication Guard ---
// Checks if the user is logged in. If not, redirects to the registration page.
(function() {
    const currentUserId = localStorage.getItem('userId');
    const path = window.location.pathname.toLowerCase();

    // 1. Define Public Pages
    const isLoginPage = path.includes('login.html');
    const isRegisterPage = path.includes('register.html');
    const isVerifyPage = path.includes('verify.html');
    
    // 2. Enhanced Root/Home Page Detection
    // Checks for: site root, trailing slash, index file, or the repository folder name
    const isRoot = path === '/' || 
                   path.endsWith('/') || 
                   path.endsWith('index.html') || 
                   path.endsWith('/frontend'); 

    const isPublicPage = isLoginPage || isRegisterPage || isVerifyPage || isRoot;

    // 3. Redirection Logic
    if (!currentUserId && !isPublicPage) {
        console.log("Access denied. Unauthorized path: " + path);
        // Use replace to prevent the user from getting stuck in a back-button loop
        window.location.replace('register.html');
    }
})();

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
        } else alert("Failed to update name");
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

// 3. Update Password
async function updatePassword() {
    const oldPassInput = document.getElementById('oldPassword');
    const newPassInput = document.getElementById('newPassword');
    
    const currentPassword = oldPassInput.value;
    const newPassword = newPassInput.value;

    if (!currentPassword || !newPassword) {
        return alert("Please fill in both password fields");
    }

    if (newPassword.length < 6) {
        return alert("New password must be at least 6 characters long");
    }

    if (currentPassword === newPassword) {
        return alert("New password cannot be the same as the current password");
    }

    try {
        const response = await fetch(`${API_BASE}/${userId}/update-password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                oldPassword: currentPassword,
                newPassword: newPassword
            })
        });

        if (response.ok) {
            alert("Password updated successfully!");
            oldPassInput.value = '';
            newPassInput.value = '';
        } else {
            const errorMsg = await response.text();
            alert("Error: " + (errorMsg || "Invalid current password"));
        }
    } catch (e) {
        console.error(e);
        alert("Server error. Please try again later.");
    }
}

// 4. Delete Account (Safest method)
async function deleteAccount() {
    // Double confirmation to prevent accidental clicks
    const firstConfirm = confirm("WARNING! You are about to permanently delete your account and all your data (wheel, tasks, diary). This action is irreversible. Do you want to continue?");
    
    if (!firstConfirm) return;

    const finalPrompt = prompt("To confirm, please type 'DELETE' in all caps:");

    if (finalPrompt !== "DELETE") {
        return alert("Deletion cancelled. Confirmation text was incorrect.");
    }

    try {
        const response = await fetch(`${API_BASE}/${userId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            alert("Your account and all associated data have been successfully deleted. Farewell!");
            
            // Clear all session and local data
            localStorage.clear();
            
            // Redirect to the registration page
            window.location.href = 'register.html';
        } else {
            const errorMsg = await response.text();
            alert("Failed to delete account: " + errorMsg);
        }
    } catch (e) {
        console.error(e);
        alert("An error occurred during deletion. Please check your connection.");
    }
}