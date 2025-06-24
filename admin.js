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

    // --- HELPER FUNCTION: Escape HTML characters ---
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') {
            return unsafe; // Return as-is if not a string (e.g., number, null, undefined)
        }
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;"); // Use &#039; for single quotes
    }
    // --- END HELPER FUNCTION ---


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

            let detailedResults = await response.json(); // This could be an object or an array

            let resultsToRender = [];
            if (typeof detailedResults === 'object' && detailedResults !== null && !Array.isArray(detailedResults)) {
                // If it's an object like {"q1": "b", "q2": "c"}
                for (const key in detailedResults) {
                    if (detailedResults.hasOwnProperty(key)) {
                        resultsToRender.push({
                            question: key.toUpperCase(), // e.g., Q1, Q2
                            user_answer: detailedResults[key],
                            // Default values for fields not present in this format
                            correct_answer: 'N/A',
                            score: 'N/A',
                            max_score: 'N/A',
                            outcome: 'Not available'
                        });
                    }
                }
            } else if (Array.isArray(detailedResults)) {
                // If it's already the intended full array format
                resultsToRender = detailedResults;
            }
            // If detailedResults is null or other unexpected type, resultsToRender will remain empty

            renderDetailedResults(resultsToRender);

        } catch (error) {
            console.error('Error fetching detailed results:', error);
            detailedResultsContent.innerHTML = `<p class="error-message">Error: ${error.message}</p>`;
        }
    }

    function renderDetailedResults(results) {
        if (!Array.isArray(results) || results.length === 0) {
            detailedResultsContent.innerHTML = '<p>No detailed results available for this submission, or data could not be parsed into a displayable format.</p>';
            return;
        }

        let html = '';
        results.forEach((item, index) => {
            // Determine outcome class based on available data
            const outcomeClass = item.outcome === 'Correct' ? 'correct' : (item.outcome === 'Incorrect' ? 'incorrect' : '');

            html += `
                <div class="question-item">
                    <h4>${escapeHtml(item.question || `Question ${index + 1}`)}</h4>
                    <p><strong>Your Answer:</strong> ${escapeHtml(item.user_answer || 'N/A')}</p>
                    ${item.correct_answer && item.correct_answer !== 'N/A' ? `<p><strong>Correct Answer:</strong> ${escapeHtml(item.correct_answer)}</p>` : ''}
                    ${item.score && item.score !== 'N/A' ? `<p><strong>Score:</strong> <span class="math-inline">\{escapeHtml\(item\.score\)\}</span>{item.max_score && item.max_score !== 'N/A' ? `/${escapeHtml(item.max_score)}` : ''}</p>` : ''}
                    ${item.outcome && item.outcome !== 'Not available' ? `<p><strong>Outcome:</strong> <span class="<span class="math-inline">\{outcomeClass\}"\></span>{escapeHtml(item.outcome)}</span></p>` : ''}
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