document.addEventListener('DOMContentLoaded', () => {
    const authSection = document.getElementById('authSection');
    const adminPasswordInput = document.getElementById('adminPassword');
    const loginBtn = document.getElementById('loginBtn');
    const authMessage = document.getElementById('authMessage');
    const dashboardContent = document.getElementById('dashboardContent');
    const submissionsTableBody = document.querySelector('#submissionsTable tbody');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const logoutBtn = document.getElementById('logoutBtn');
    const filterChildNameInput = document.getElementById('filterChildName');
    const filterParentEmailInput = document.getElementById('filterParentEmail');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');

    // IMPORTANT: In a real production environment, for better security,
    // you should hash this password on the server-side and compare hashes.
    // For this demonstration, we're using a simple shared secret.
    const FRONTEND_PASSWORD = "YOUR_FRONTEND_PASSWORD_HERE"; // This will be replaced by Netlify Env Var via build process (Netlify Functions use process.env, frontend needs to be set up)
                                                          // For now, hardcode if testing locally, but it will be replaced by a build step or similar.

    // A simpler way to manage this on the frontend without exposing it directly in source:
    // In Netlify build settings, you can define a build environment variable (e.g., REACT_APP_FRONTEND_PASSWORD for React,
    // or inject it into a global JS variable during build for vanilla JS).
    // For direct use in vanilla JS, you'd typically have a build step that replaces a placeholder or generates this file.
    // For this example, we'll assume a direct client-side comparison, which is NOT ideal for production.
    // For proper security, the password check should primarily happen server-side via the Netlify Function.
    // The current Netlify Functions (get-submissions, delete-submission) *do* perform server-side checks.
    // This client-side check is primarily for initial UI access control.

    const ADMIN_TOKEN_KEY = 'adminAuthToken'; // Key for localStorage

    // --- Authentication Logic ---

    function checkAuth() {
        const token = localStorage.getItem(ADMIN_TOKEN_KEY);
        if (token === FRONTEND_PASSWORD) { // Simple token comparison
            showDashboard();
        } else {
            showAuthSection();
        }
    }

    function showAuthSection() {
        authSection.style.display = 'block';
        dashboardContent.style.display = 'none';
        authMessage.textContent = '';
        adminPasswordInput.value = '';
    }

    function showDashboard() {
        authSection.style.display = 'none';
        dashboardContent.style.display = 'block';
        fetchSubmissions(); // Load data when dashboard is shown
    }

    loginBtn.addEventListener('click', () => {
        const enteredPassword = adminPasswordInput.value;
        if (enteredPassword === FRONTEND_PASSWORD) {
            localStorage.setItem(ADMIN_TOKEN_KEY, FRONTEND_PASSWORD); // Store a "token"
            showDashboard();
        } else {
            authMessage.textContent = 'Incorrect password.';
            adminPasswordInput.value = '';
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        showAuthSection();
    });

    // --- Data Fetching and Display Logic ---

    let allSubmissions = []; // Store all fetched submissions
    
    async function fetchSubmissions() {
        loadingMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        submissionsTableBody.innerHTML = ''; // Clear existing table rows

        try {
            const token = localStorage.getItem(ADMIN_TOKEN_KEY);
            const response = await fetch('/.netlify/functions/get-submissions', {
                headers: {
                    'Authorization': `Bearer ${token}` // Send the token
                }
            });

            if (response.status === 401) {
                authMessage.textContent = 'Session expired or unauthorized. Please log in again.';
                showAuthSection();
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch submissions.');
            }

            allSubmissions = await response.json();
            displaySubmissions(allSubmissions); // Display all initially
            loadingMessage.style.display = 'none';

        } catch (error) {
            console.error('Error fetching submissions:', error);
            errorMessage.textContent = `Error: ${error.message}`;
            loadingMessage.style.display = 'none';
        }
    }

    function displaySubmissions(submissionsToDisplay) {
        submissionsTableBody.innerHTML = ''; // Clear current display
        if (submissionsToDisplay.length === 0) {
            submissionsTableBody.innerHTML = '<tr><td colspan="7">No submissions found.</td></tr>';
            return;
        }

        submissionsToDisplay.forEach(submission => {
            const row = submissionsTableBody.insertRow();
            
            // Format date
            const submissionDate = new Date(submission.submission_time);
            const formattedDate = submissionDate.toLocaleString('en-GB', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            row.insertCell().textContent = formattedDate;
            row.insertCell().textContent = submission.child_name;
            row.insertCell().textContent = submission.parent_name;
            row.insertCell().textContent = submission.parent_email;
            row.insertCell().textContent = `${submission.score}/${submission.total_questions || 30}`; // Assume 30 if total_questions not available
            row.insertCell().textContent = submission.expectations;
            
            const actionsCell = row.insertCell();
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'delete-btn';
            deleteBtn.dataset.id = submission.id; // Store submission ID
            actionsCell.appendChild(deleteBtn);
        });
    }

    // --- Filtering Logic ---
    applyFilterBtn.addEventListener('click', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);

    function applyFilters() {
        const childNameFilter = filterChildNameInput.value.toLowerCase().trim();
        const parentEmailFilter = filterParentEmailInput.value.toLowerCase().trim();

        const filtered = allSubmissions.filter(submission => {
            const matchesChildName = childNameFilter === '' || submission.child_name.toLowerCase().includes(childNameFilter);
            const matchesParentEmail = parentEmailFilter === '' || submission.parent_email.toLowerCase().includes(parentEmailFilter);
            return matchesChildName && matchesParentEmail;
        });

        displaySubmissions(filtered);
    }

    function clearFilters() {
        filterChildNameInput.value = '';
        filterParentEmailInput.value = '';
        displaySubmissions(allSubmissions); // Show all again
    }


    // --- Deletion Logic ---

    submissionsTableBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const submissionId = event.target.dataset.id;
            if (confirm(`Are you sure you want to delete submission ID ${submissionId}? This action cannot be undone.`)) {
                await deleteSubmission(submissionId);
            }
        }
    });

    async function deleteSubmission(id) {
        loadingMessage.textContent = `Deleting submission ${id}...`;
        loadingMessage.style.display = 'block';
        errorMessage.style.display = 'none';

        try {
            const token = localStorage.getItem(ADMIN_TOKEN_KEY);
            const response = await fetch('/.netlify/functions/delete-submission', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Send the token
                },
                body: JSON.stringify({ id: parseInt(id) }) // Send ID as a number
            });

            if (response.status === 401) {
                authMessage.textContent = 'Session expired or unauthorized. Please log in again.';
                showAuthSection();
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to delete submission ${id}.`);
            }

            const result = await response.json();
            alert(result.message); // Show success message
            fetchSubmissions(); // Refresh the list after deletion
            loadingMessage.style.display = 'none';

        } catch (error) {
            console.error('Error deleting submission:', error);
            errorMessage.textContent = `Error: ${error.message}`;
            loadingMessage.style.display = 'none';
        }
    }

    // Initial check on page load
    checkAuth();
});