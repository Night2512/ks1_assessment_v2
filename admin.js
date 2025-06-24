// Filename: admin.js
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

    // --- HELPER FUNCTION: Escape HTML characters (updated to be safer) ---
    function escapeHtml(text) {
        if (typeof text !== 'string') {
            return text; // Return non-strings as is (e.g., numbers, null, undefined)
        }
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    // --- Authentication Logic ---
    function authenticateAdmin() {
        const password = adminPasswordInput.value;
        fetch('/.netlify/functions/admin-auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: password }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, password); // Store for future sessions
                authSection.style.display = 'none';
                dashboardContent.style.display = 'block';
                fetchAllSubmissions();
            } else {
                authMessage.textContent = data.message;
                authMessage.style.color = 'red';
            }
        })
        .catch(error => {
            console.error('Authentication error:', error);
            authMessage.textContent = 'An error occurred during authentication.';
            authMessage.style.color = 'red';
        });
    }

    function checkAuthOnLoad() {
        const storedPassword = localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY);
        if (storedPassword) {
            // Attempt to re-authenticate silently with stored password
            fetch('/.netlify/functions/admin-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: storedPassword }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    authSection.style.display = 'none';
                    dashboardContent.style.display = 'block';
                    fetchAllSubmissions();
                } else {
                    // Stored password invalid, clear it
                    localStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY);
                    authSection.style.display = 'block';
                    dashboardContent.style.display = 'none';
                    loadingMessage.style.display = 'none'; // Hide loading if not authenticated
                }
            })
            .catch(error => {
                console.error('Auto-authentication error:', error);
                localStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY); // Clear on error
                authSection.style.display = 'block';
                dashboardContent.style.display = 'none';
                loadingMessage.style.display = 'none';
            });
        } else {
            authSection.style.display = 'block';
            dashboardContent.style.display = 'none';
            loadingMessage.style.display = 'none';
        }
    }

    function logoutAdmin() {
        localStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY);
        location.reload(); // Reload to show login screen
    }

    // --- Fetch and Display Submissions ---
    let allSubmissions = []; // Store all fetched submissions

    async function fetchAllSubmissions() {
        loadingMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        submissionsTableBody.innerHTML = ''; // Clear existing table content

        try {
            const storedPassword = localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY);
            const response = await fetch('/.netlify/functions/get-submissions', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${storedPassword}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized: Invalid or expired password. Please log in again.');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            allSubmissions = await response.json();
            displaySubmissions(allSubmissions);
        } catch (error) {
            console.error('Error fetching submissions:', error);
            errorMessage.textContent = `Failed to load submissions: ${error.message}`;
            errorMessage.style.color = 'red';
            errorMessage.style.display = 'block';
            if (error.message.includes('Unauthorized')) {
                logoutAdmin(); // Force re-login if unauthorized
            }
        } finally {
            loadingMessage.style.display = 'none';
        }
    }

    function displaySubmissions(submissions) {
        submissionsTableBody.innerHTML = '';
        if (submissions.length === 0) {
            submissionsTableBody.innerHTML = '<tr><td colspan="8">No submissions found.</td></tr>';
            return;
        }

        submissions.forEach(submission => {
            const row = submissionsTableBody.insertRow();
            row.dataset.id = submission.id; // Store ID for actions
            row.innerHTML = `
                <td>${new Date(submission.submitted_at).toLocaleString()}</td>
                <td>${escapeHtml(submission.child_name)}</td>
                <td>${escapeHtml(submission.parent_name || 'N/A')}</td>
                <td>${escapeHtml(submission.parent_email)}</td>
                <td>${escapeHtml(submission.score)}/${escapeHtml(submission.total_questions || 'N/A')}</td>
                <td>${escapeHtml(submission.expectations)}</td>
                <td><button class="delete-btn" data-id="${submission.id}">Delete</button></td>
                <td><button class="details-btn" data-id="${submission.id}">View Details</button></td>
            `;
        });

        // Add event listeners to new buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', handleDeleteClick);
        });
        document.querySelectorAll('.details-btn').forEach(button => {
            button.addEventListener('click', handleDetailsClick);
        });
    }

    // --- Filtering Logic ---
    function applyFilters() {
        const childNameFilter = filterChildNameInput.value.toLowerCase();
        const parentEmailFilter = filterParentEmailInput.value.toLowerCase();

        const filteredSubmissions = allSubmissions.filter(submission => {
            const matchesChildName = submission.child_name.toLowerCase().includes(childNameFilter);
            const matchesParentEmail = submission.parent_email.toLowerCase().includes(parentEmailFilter);
            return matchesChildName && matchesParentEmail;
        });
        displaySubmissions(filteredSubmissions);
    }

    function clearFilters() {
        filterChildNameInput.value = '';
        filterParentEmailInput.value = '';
        displaySubmissions(allSubmissions); // Show all original submissions
    }

    // --- Delete Submission Logic ---
    async function handleDeleteClick(event) {
        const submissionId = event.target.dataset.id;
        if (!confirm(`Are you sure you want to delete submission ID: ${submissionId}?`)) {
            return;
        }

        try {
            const storedPassword = localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY);
            const response = await fetch('/.netlify/functions/delete-submission', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${storedPassword}`,
                },
                body: JSON.stringify({ id: parseInt(submissionId) }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized: Invalid or expired password. Please log in again.');
                }
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete submission.');
            }

            // Remove the row from the table
            event.target.closest('tr').remove();
            // Update allSubmissions array
            allSubmissions = allSubmissions.filter(s => s.id !== parseInt(submissionId));
            alert('Submission deleted successfully!');

        } catch (error) {
            console.error('Error deleting submission:', error);
            alert(`Error deleting submission: ${error.message}`);
            if (error.message.includes('Unauthorized')) {
                logoutAdmin(); // Force re-login if unauthorized
            }
        }
    }

    // --- View Details Logic (Modal) ---
    async function handleDetailsClick(event) {
        const submissionId = event.target.dataset.id;
        detailedResultsContent.innerHTML = 'Loading detailed results...';
        detailsModal.style.display = 'block';

        try {
            const storedPassword = localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY);
            const response = await fetch(`/.netlify/functions/get-submission-details?id=${submissionId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${storedPassword}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized: Invalid or expired password. Please log in again.');
                }
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch detailed results.');
            }

            const results = await response.json(); // This 'results' is the detailed_results from the backend
            console.log("Fetched detailed results:", results); // Debugging line

            // Convert the object of results into an array of values if it's an object
            // This handles cases where detailed_results might be stored as { "Q1": {}, "Q2": {} }
            const resultsArray = Array.isArray(results) ? results : Object.values(results);

            renderDetailedResults(resultsArray); // Pass the array to the rendering function

        } catch (error) {
            console.error('Error fetching detailed results:', error);
            detailedResultsContent.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            if (error.message.includes('Unauthorized')) {
                logoutAdmin(); // Force re-login if unauthorized
            }
        }
    }

    function renderDetailedResults(results) {
        let html = '';
        if (!results || results.length === 0) {
            detailedResultsContent.innerHTML = '<p>No detailed results available for this submission.</p>';
            return;
        }
        results.forEach((item, index) => {
            const outcomeClass = item.outcome === 'Correct' ? 'correct' : (item.outcome === 'Incorrect' ? 'incorrect' : '');

            html += `
                <div class="question-item">
                    <h4>${escapeHtml(item.question || `Question ${index + 1}`)}</h4>
                    <p><strong>Your Answer:</strong> ${escapeHtml(item.user_answer || 'N/A')}</p>
                    ${item.correct_answer && item.correct_answer !== 'N/A' ? `<p><strong>Correct Answer:</strong> ${escapeHtml(item.correct_answer)}</p>` : ''}
                    ${item.score && item.score !== 'N/A' ? `<p><strong>Score:</strong> ${escapeHtml(item.score)}${item.max_score && item.max_score !== 'N/A' ? `/${escapeHtml(item.max_score)}` : ''}</p>` : ''}
                    ${item.outcome && item.outcome !== 'Not available' ? `<p><strong>Outcome:</strong> <span class=\"${outcomeClass}\">${escapeHtml(item.outcome)}</span></p>` : ''}
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
        if (event.target == detailsModal) {
            closeModal();
        }
    });

    // --- Event Listeners ---
    loginBtn.addEventListener('click', authenticateAdmin);
    adminPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            authenticateAdmin();
        }
    });
    logoutBtn.addEventListener('click', logoutAdmin);
    applyFilterBtn.addEventListener('click', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);

    // Initial check on page load
    checkAuthOnLoad();
});