const VERIFY_API = 'http://localhost:8080/user/verify';

document.addEventListener('DOMContentLoaded', () => {
    const displayEmail = document.getElementById('displayEmail');
    const verifyForm = document.getElementById('verifyForm');
    const verifyBtn = document.getElementById('verifyBtn');
    const codeInput = document.getElementById('codeInput');


    if (displayEmail) {
        displayEmail.innerText = localStorage.getItem('emailForVerification') || "your email";
    }

    if (verifyForm) {
        verifyForm.addEventListener('submit', async (e) => {
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

const RESEND_API = 'http://localhost:8080/user/resend-code';
const resendBtn = document.getElementById('resendBtn'); // Make sure the button has this ID

if (resendBtn) {
    resendBtn.addEventListener('click', async (e) => {
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