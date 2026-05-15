const API_URL = 'https://wheel-web-site-api-apfhdfbxd7dud0cj.austriaeast-01.azurewebsites.net/user';


// --- Authentication Guard ---
// Checks if the user is logged in. If not, redirects to the registration page.
(function() {
    const currentUserId = localStorage.getItem('userId');
    const path = window.location.pathname.toLowerCase();

    // Checking for presence of keywords in the URL
    const isLoginPage = path.includes('login.html');
    const isRegisterPage = path.includes('register.html');
    const isVerifyPage = path.includes('verify.html');
    
    // Root handling: if path is just "/" or ends with project folder name
    const isRoot = path === '/' || path.endsWith('/') || path.endsWith('index.html');

    const isPublicPage = isLoginPage || isRegisterPage || isVerifyPage;

    // Redirection logic:
    // Only redirect if there is NO userId AND it's NOT a public page AND it's NOT the root/index
    if (!currentUserId && !isPublicPage && !isRoot) {
        console.log("Access denied. Redirecting to registration...");
        window.location.replace('register.html');
    }
})();


const registerForm = document.getElementById('registerForm');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = registerForm.querySelector('button');
        const inputs = registerForm.querySelectorAll('input');

        const userData = {
            user:     inputs[0].value,
            email:    inputs[1].value.trim().toLowerCase(),
            password: inputs[2].value
        };

        submitBtn.disabled = true;
        submitBtn.innerText = "Sending...";

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            // 1. SUCCESSFUL REGISTRATION (200 OK)
            if (response.ok) {
                localStorage.setItem('emailForVerification', userData.email);
                alert('Account created! Check your email.');
                window.location.href = 'verify.html';
                return;
            }

            // 2. ERROR HANDLING (400, 409 etc.)

            // Try to read the error text
            let errorText = "";
            try {
                errorText = await response.text();
            } catch (err) {
                errorText = "unknown_error";
            }

            console.log("Status Code:", response.status);
            console.log("Server Response:", errorText);

            // CHECK FOR REDIRECT (if status 409 or text contains 'verify')
            if (response.status === 409 || errorText.toLowerCase().includes("verify") || errorText.toLowerCase().includes("not enabled")) {
                localStorage.setItem('emailForVerification', userData.email);
                alert('This account is not verified yet. Redirecting to verification page...');
                window.location.href = 'verify.html';
                return;
            }

            // IF ACCOUNT IS ALREADY FULLY VERIFIED (400 Bad Request)
            if (errorText.includes("exists") || response.status === 400) {
                alert(userData.email + ": \n\nThis account already exists and is verified! Please log in.");
            } else {
                alert("Registration error: " + errorText);
            }

            submitBtn.disabled = false;
            submitBtn.innerText = "Sign Up";

        } catch (err) {
            console.error("Network error:", err);
            alert('Server is offline or connection refused!');
            submitBtn.disabled = false;
            submitBtn.innerText = "Sign Up";
        }
    });
}