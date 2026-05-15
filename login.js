// Endpoint for user authentication
const LOGIN_URL = 'https://wheel-web-site-api-apfhdfbxd7dud0cj.austriaeast-01.azurewebsites.net/user/login';


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

// Selecting the login form element from the DOM
const loginForm = document.getElementById('loginForm');

// Check if the form exists on the current page before adding the listener
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        // Prevent default form submission (page reload)
        e.preventDefault();

        // Get all input fields within the form
        const inputs = loginForm.querySelectorAll('input');

        // Prepare the login data object
        const loginData = {
            email: inputs[0].value.trim().toLowerCase(),
            password: inputs[1].value
        };

        try {
            // Send a POST request to the login API
            const response = await fetch(LOGIN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            });

            if (response.ok) {
                // Parse the JSON response from the server
                const user = await response.json();

                // AUTHENTICATION STORAGE
                // Save the User ID so script.js can handle protected UI and tasks
                localStorage.setItem('userId', user.id);
                // Set login status flag
                localStorage.setItem('isLoggedIn', 'true');
                // Store the username for the welcome message
                localStorage.setItem('userName', user.user);
                //

                alert(`Welcome, ${user.user}!`);

                // Redirect the user to the main tasks page
                window.location.href = 'index.html';
            } else {
                const errMsg = await response.text();

                // ADDED: Intercept 401 error from your Java controller
                if (response.status === 401 && errMsg.includes("verify")) {
                    alert('Please verify your email first!');
                    localStorage.setItem('emailForVerification', loginData.email);
                    window.location.href = 'verify.html';
                } else {
                    alert('Login failed: ' + errMsg);
                }
            }
        } catch (err) {
            // Log connection errors to the console
            console.error("Login error:", err);
            alert('Server error! Please check if your Spring Boot backend is running.');
        }
    });
}