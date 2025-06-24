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
    const closeModalBtn = document.getElementById('closeModalBtn');
    const closeSpanButton = document.querySelector('.close-button');
    const detailedResultsContent = document.getElementById('detailedResultsContent');


    // Key for storing the password in localStorage after successful login
    const ADMIN_PASSWORD_STORAGE_KEY = 'adminAuthPassword';

    // --- Authentication Logic ---

    async function checkAuth() {
        const storedPassword = localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY);
        if (storedPassword) {
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
        showAuthSection();
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
        fetchSubmissions();
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
                localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, enteredPassword);
                authMessage.textContent = 'Login successful!';
                authMessage.style.color = 'green';
                setTimeout(showDashboard, 500);
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

    let allSubmissions = [];
    
    async function fetchSubmissions() {
        loadingMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        submissionsTableBody.innerHTML = '';

        const token = localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY);
        if (!token) {
            authMessage.textContent = 'Authentication token missing. Please log in.';
            showAuthSection();
            return;
        }

        try {
            const response = await fetch('/.netlify/functions/get-submissions', {
                headers: {
                    'Authorization': `Bearer ${token}`
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
            displaySubmissions(allSubmissions);
            loadingMessage.style.display = 'none';

        } catch (error) {
            console.error('Error fetching submissions:', error);
            errorMessage.textContent = `Error: ${error.message}`;
            loadingMessage.style.display = 'none';
        }
    }

    function displaySubmissions(submissionsToDisplay) {
        submissionsTableBody.innerHTML = '';
        if (submissionsToDisplay.length === 0) {
            submissionsTableBody.innerHTML = '<tr><td colspan="8">No submissions found.</td></tr>';
            return;
        }

        submissionsToDisplay.forEach(submission => {
            const row = submissionsTableBody.insertRow();
            
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
            row.insertCell().textContent = `${submission.score}/${submission.total_questions || 'N/A'}`;
            row.insertCell().textContent = submission.expectations;
            
            const actionsCell = row.insertCell();
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'delete-btn';
            deleteBtn.dataset.id = submission.id;
            actionsCell.appendChild(deleteBtn);

            const detailsCell = row.insertCell();
            const viewDetailsBtn = document.createElement('button');
            viewDetailsBtn.textContent = 'View Details';
            viewDetailsBtn.className = 'view-details-btn';
            viewDetailsBtn.dataset.id = submission.id;
            detailsCell.appendChild(viewDetailsBtn);
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
        displaySubmissions(allSubmissions);
    }


    // --- Deletion Logic ---

    submissionsTableBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const submissionId = event.target.dataset.id;
            if (confirm(`Are you sure you want to delete submission ID ${submissionId}? This action cannot be undone.`)) {
                await deleteSubmission(submissionId);
            }
        }
        if (event.target.classList.contains('view-details-btn')) {
            const submissionId = event.target.dataset.id;
            await fetchAndDisplayDetailedResults(submissionId);
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
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id: parseInt(id) })
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
            alert(result.message);
            fetchSubmissions();
            loadingMessage.style.display = 'none';

        } catch (error) {
            console.error('Error deleting submission:', error);
            errorMessage.textContent = `Error: ${error.message}`;
            loadingMessage.style.display = 'none';
        }
    }

    // --- Detailed Results Modal Logic ---

    async function fetchAndDisplayDetailedResults(id) {
        detailedResultsContent.innerHTML = 'Loading detailed results...';
        detailsModal.style.display = 'block';

        const token = localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY);
        if (!token) {
            authMessage.textContent = 'Authentication token missing. Please log in.';
            showAuthSection();
            return;
        }

        try {
            const response = await fetch(`/.netlify/functions/get-submission-details?id=${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                authMessage.textContent = 'Session expired or unauthorized. Please log in again.';
                showAuthSection();
                closeModal();
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch detailed results for ID ${id}.`);
            }

            const detailedResults = await response.json();
            renderDetailedResults(detailedResults);

        } catch (error) {
            console.error('Error fetching detailed results:', error);
            detailedResultsContent.innerHTML = `<p class="error-message">Error: ${error.message}</p>`;
        }
    }

    function renderDetailedResults(results) {
        // --- FIX: Added Array.isArray check ---
        if (!Array.isArray(results) || results.length === 0) {
            detailedResultsContent.innerHTML = '<p>No detailed results available for this submission, or data is in an unexpected format.</p>';
            // You can add a console.warn here for debugging if needed:
            // console.warn('Detailed results were not an array or were empty:', results);
            return;
        }

        let html = '';
        results.forEach((item, index) => {
            const outcomeClass = item.outcome === 'Correct' ? 'correct' : 'incorrect';
            html += `
                <div class="question-item">
                    <h4>Q${index + 1}. ${item.question}</h4>
                    <p><strong>Your Answer:</strong> ${item.user_answer}</p>
                    <p><strong>Correct Answer:</strong> ${item.correct_answer}</p>
                    <p><strong>Score:</strong> ${item.score}/${item.max_score}</p>
                    <p><strong>Outcome:</strong> <span class="${outcomeClass}">${item.outcome}</span></p>
                </div>
            `;
        });
        detailedResultsContent.innerHTML = html;
    }

    function closeModal() {
        detailsModal.style.display = 'none';
        detailedResultsContent.innerHTML = '';
    }

    // Close modal listeners
    closeModalBtn.addEventListener('click', closeModal);
    closeSpanButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === detailsModal) {
            closeModal();
        }
    });

    // Initial check on page load
    checkAuth();
});