const VERIFY_API = 'https://wheel-web-site-api-apfhdfbxd7dud0cj.austriaeast-01.azurewebsites.net/user/verify';

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


document.addEventListener('DOMContentLoaded', () => {
    const displayEmail = document.getElementById('displayEmail');
    const verifyForm = document.getElementById('verifyForm');
    const verifyBtn = document.getElementById('verifyBtn');
    const codeInput = document.getElementById('codeInput');


    if (displayEmail) {
        displayEmail.innerText = localStorage.getItem('emailForVerification') || "your email";
    }

    if (verifyForm) {
        verifyForm.addEventListener('submit', async(e) => {
            e.preventDefault();

            console.log("verification...");

            const email = localStorage.getItem('emailForVerification');
            if (!email) {
                alert("Error: email has not found. register again.");
                window.location.href = 'register.html';
                return;
            }

            verifyBtn.disabled = true;
            verifyBtn.innerText = "verification...";

            try {
                const response = await fetch(VERIFY_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: email,
                        code: codeInput.value.trim()
                    })
                });

                if (response.ok) {
                    alert('Account has been verified!');
                    localStorage.removeItem('emailForVerification');

                    // CHECK: is this email change or new registration?
                    const isUpdating = localStorage.getItem('isUpdatingEmail');

                    if (isUpdating === 'true') {
                        localStorage.removeItem('isUpdatingEmail');
                        window.location.href = 'index.html'; // Return to main page
                    } else {
                        window.location.href = 'login.html'; // To login, if new user
                    }
                } else {
                    const errorMsg = await response.text();
                    alert('Error: ' + errorMsg);
                    verifyBtn.disabled = false;
                    verifyBtn.innerText = "Verify Account";
                }
            } catch (err) {
                console.error("Error network:", err);
                alert('Server connection failed. Make sure Spring Boot is active.');
                verifyBtn.disabled = false;
                verifyBtn.innerText = "Verify Account";
            }
        });
    }
});

const RESEND_API = 'https://wheel-web-site-api-apfhdfbxd7dud0cj.austriaeast-01.azurewebsites.net/user/resend-code';
const resendBtn = document.getElementById('resendBtn'); // Make sure the button has this ID

if (resendBtn) {
    resendBtn.addEventListener('click', async(e) => {
        e.preventDefault();

        const email = localStorage.getItem('emailForVerification');
        if (!email) {
            alert("Email not found. Please register again.");
            return;
        }

        resendBtn.disabled = true;
        resendBtn.innerText = "Sending...";

        try {
            const response = await fetch(RESEND_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });

            if (response.ok) {
                alert('A new code has been sent to your email!');
            } else {
                const msg = await response.text();
                alert('Failed: ' + msg);
            }
        } catch (err) {
            alert('Server error. Check connection.');
        } finally {
            resendBtn.disabled = false;
            resendBtn.innerText = "Resend Code";
        }
    });
}