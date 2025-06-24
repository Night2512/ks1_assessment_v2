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

    // Modal elements
    const detailsModal = document.getElementById('detailsModal');
    const closeButton = document.querySelector('.close-button');
    const modalDetailsContent = document.getElementById('modalDetailsContent');

    // Key for storing the password in localStorage after successful login
    const ADMIN_PASSWORD_STORAGE_KEY = 'adminAuthPassword';

    // --- Authentication Logic ---

    async function checkAuth() {
        const storedPassword = localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY);
        if (storedPassword) {
            // Attempt to re-authenticate with the stored password via the server
            // This acts as a basic session check. If the password is still valid, show dashboard.
            try {
                const response = await fetch('/.netlify/functions/admin-auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: storedPassword })
                });

                const data = await response.json();
                if (data.success) {
                    showDashboard();
                    return;
                }
            } catch (error) {
                console.error("Failed to re-authenticate with stored password:", error);
            }
        }
        showAuthSection(); // If no stored password or re-auth fails, show login
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

    loginBtn.addEventListener('click', async () => {
        const enteredPassword = adminPasswordInput.value;
        authMessage.textContent = 'Authenticating...';
        authMessage.style.color = '#007bff';

        try {
            const response = await fetch('/.netlify/functions/admin-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: enteredPassword })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, enteredPassword); // Store the entered password
                authMessage.textContent = 'Login successful!';
                authMessage.style.color = 'green';
                setTimeout(showDashboard, 500); // Give user time to see success message
            } else {
                authMessage.textContent = data.message || 'Incorrect password.';
                authMessage.style.color = 'red';
                adminPasswordInput.value = '';
            }
        } catch (error) {
            console.error('Login error:', error);
            authMessage.textContent = 'An error occurred during login. Please try again.';
            authMessage.style.color = 'red';
            adminPasswordInput.value = '';
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY);
        showAuthSection();
    });

    // --- Data Fetching and Display Logic ---

    let allSubmissions = []; // Store all fetched submissions
    
    async function fetchSubmissions() {
        loadingMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        submissionsTableBody.innerHTML = ''; // Clear existing table rows

        const token = localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY);
        if (!token) { // Should not happen if checkAuth works, but as a safeguard
            authMessage.textContent = 'Authentication token missing. Please log in.';
            showAuthSection();
            return;
        }

        try {
            const response = await fetch('/.netlify/functions/get-submissions', {
                headers: {
                    'Authorization': `Bearer ${token}` // Send the stored password as a token
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
            row.insertCell().textContent = `${submission.score}/${submission.total_questions || 'N/A'}`; // Use N/A if total_questions is missing
            row.insertCell().textContent = submission.expectations;
            
            const actionsCell = row.insertCell();
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'delete-btn';
            deleteBtn.dataset.id = submission.id; // Store submission ID
            actionsCell.appendChild(deleteBtn);

            const viewDetailsBtn = document.createElement('button');
            viewDetailsBtn.textContent = 'View Details';
            viewDetailsBtn.className = 'view-details-btn'; // Add a class for identification
            viewDetailsBtn.dataset.id = submission.id; // Store submission ID
            actionsCell.appendChild(viewDetailsBtn);
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
        } else if (event.target.classList.contains('view-details-btn')) { // Handle View Details button click
            const submissionId = parseInt(event.target.dataset.id);
            const submission = allSubmissions.find(s => s.id === submissionId);
            if (submission && submission.detailed_results) {
                renderDetailedResultsInModal(submission.detailed_results);
            } else {
                alert('Detailed results not found for this submission.');
            }
        }
    });

    async function deleteSubmission(id) {
        loadingMessage.textContent = `Deleting submission ${id}...`;
        loadingMessage.style.display = 'block';
        errorMessage.style.display = 'none';

        const token = localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY);
        if (!token) {
            authMessage.textContent = 'Authentication token missing. Please log in.';
            showAuthSection();
            return;
        }

        try {
            const response = await fetch('/.netlify/functions/delete-submission', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Send the stored password as a token
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

    // --- Details Modal Logic ---
    function renderDetailedResultsInModal(detailedResultsData) { // Renamed parameter for clarity
        let detailsHtml = '<p>No detailed results available.</p>';
        let results;
        try {
            // Check if it's already an object, or if it's a string that needs parsing
            if (typeof detailedResultsData === 'string') {
                results = JSON.parse(detailedResultsData);
            } else if (typeof detailedResultsData === 'object' && detailedResultsData !== null) {
                results = detailedResultsData; // It's already an object
            } else {
                throw new Error("Invalid detailed results format.");
            }

            if (results && typeof results === 'object') {
                detailsHtml = '<ul>';
                for (const key in results) {
                    if (Object.hasOwnProperty.call(results, key)) {
                        const value = results[key];
                        detailsHtml += `<li><strong>${key.toUpperCase()}</strong>: ${value === "" ? "No Answer" : value}</li>`;
                    }
                }
                detailsHtml += '</ul>';
            }
        } catch (e) {
            console.error("Error parsing/processing detailed results:", e);
            detailsHtml = '<p class="error-message">Error loading detailed results format.</p>';
        }
        modalDetailsContent.innerHTML = detailsHtml;
        detailsModal.style.display = 'block'; // Show the modal
    }

    closeButton.addEventListener('click', () => {
        detailsModal.style.display = 'none'; // Hide the modal
    });

    // Close the modal if the user clicks outside of it
    window.addEventListener('click', (event) => {
        if (event.target === detailsModal) {
            detailsModal.style.display = 'none';
        }
    });

    // Initial check on page load
    checkAuth();
});