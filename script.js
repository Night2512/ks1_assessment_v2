document.addEventListener('DOMContentLoaded', () => {
    // --- Customizable Content (for Admins) ---
    const CUSTOM_CONTENT = {
        mainTitle: "Key Stage 1 Online Assessment - Mona Teaches",
        infoHeading: "Start Your Assessment",
        infoInstructions: "Please provide the following information to begin the assessment:",
        assessmentIntro: "The assessment has a 15 minute time limit. It will automatically submit once this time expires.",
        securityCheckText: "Please complete the security check above to enable the 'Start Assessment' button.",
        resultsHeading: "Assessment Results",
        emailSending: "Sending your detailed results email...",
        emailSentSuccess: "Email sent successfully! Please check your inbox (and spam folder).",
        emailFailed: "Failed to send email. Please contact support if this persists.",
        networkError: "Failed to send email: Network error. Please check your connection.",
        timeUpMessage: "Time's up! Your assessment has been automatically submitted.",
        expectationsBelow: "Below Expectations",
        expectationsMeets: "Meets Expectations",
        expectationsAbove: "Above Expectations",
        resultsEmailMessage: "Your full detailed results have been sent to your email address." // New custom message
    };

    // Apply customizable content
    document.getElementById('mainTitle').textContent = CUSTOM_CONTENT.mainTitle;
    document.getElementById('mainTitleReplicated').textContent = CUSTOM_CONTENT.mainTitle;
    document.getElementById('infoHeading').textContent = CUSTOM_CONTENT.infoHeading;
    document.getElementById('infoInstructions').textContent = CUSTOM_CONTENT.infoInstructions;
    document.getElementById('assessmentIntroText').textContent = CUSTOM_CONTENT.assessmentIntro; // Apply 15-min text
    document.getElementById('securityCheckText').textContent = CUSTOM_CONTENT.securityCheckText;
    document.getElementById('resultsHeading').textContent = CUSTOM_CONTENT.resultsHeading;

    // --- DOM Elements ---
    const infoCollectionSection = document.getElementById('infoCollection');
    const assessmentSection = document.getElementById('assessmentSection');
    const resultsSection = document.getElementById('results');
    const infoForm = document.getElementById('infoForm');
    const parentNameInput = document.getElementById('parentName');
    const childNameInput = document.getElementById('childName');
    const parentEmailInput = document.getElementById('parentEmail');
    const keyStageSelect = document.getElementById('keyStage');
    const startAssessmentBtn = document.getElementById('startAssessmentBtn'); // Ensure this is correctly retrieved
    const assessmentForm = document.getElementById('assessmentForm');
    const questionsContainer = document.getElementById('questionsContainer');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    const submitAssessmentBtn = document.getElementById('submitAssessmentBtn');
    const timeDisplay = document.getElementById('time');
    const currentQNumSpan = document.getElementById('currentQNum');
    const totalQNumSpan = document.getElementById('totalQNum');
    const detailedResultsDiv = document.getElementById('detailedResults');
    const overallScoreH3 = document.getElementById('overallScore');
    const overallExpectationsH3 = document.getElementById('overallExpectations');
    const sendEmailBtn = document.getElementById('sendEmailBtn');
    const emailStatusP = document.getElementById('emailStatus');

    let currentQuestionIndex = 0;
    let score = 0;
    let questions = []; // This will be populated from the JSON
    let timer;
    const TIME_LIMIT = 15 * 60; // 15 minutes in seconds
    let timeLeft = TIME_LIMIT;

    // --- Data Objects ---
    let assessmentData = {
        parentName: '',
        childName: '',
        parentEmail: '',
        keyStage: '',
        score: 0,
        totalQuestions: 0,
        expectations: '',
        detailedResults: []
    };

    // --- Utility Functions ---
    function showSection(section) {
        infoCollectionSection.style.display = 'none';
        assessmentSection.style.display = 'none';
        resultsSection.style.display = 'none';
        section.style.display = 'block';
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // --- Timer Functions ---
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function startTimer() {
        timer = setInterval(() => {
            timeLeft--;
            timeDisplay.textContent = formatTime(timeLeft);
            if (timeLeft <= 0) {
                clearInterval(timer);
                submitAssessment(true); // Automatically submit when time is up
            }
        }, 1000);
    }

    // --- Assessment Flow Functions ---
    async function loadQuestions() {
        try {
            const response = await fetch('questions.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            questions = data.questions;
            shuffleArray(questions); // Randomize question order
            assessmentData.totalQuestions = questions.length;
            totalQNumSpan.textContent = questions.length;
            displayQuestion();
        } catch (error) {
            console.error('Error loading questions:', error);
            questionsContainer.innerHTML = '<p>Error loading assessment questions. Please try again later.</p>';
            nextQuestionBtn.disabled = true;
            submitAssessmentBtn.disabled = true;
        }
    }

    function displayQuestion() {
        if (questions.length === 0) {
            questionsContainer.innerHTML = '<p>No questions available.</p>';
            nextQuestionBtn.style.display = 'none';
            submitAssessmentBtn.style.display = 'block';
            submitAssessmentBtn.disabled = true;
            return;
        }

        const question = questions[currentQuestionIndex];
        currentQNumSpan.textContent = currentQuestionIndex + 1;

        let optionsHtml = '';
        const inputType = question.type === 'multiple-choice' ? 'radio' : 'text';

        if (question.type === 'multiple-choice' && question.options) {
            optionsHtml = question.options.map((option, idx) => `
                <div class="option-block">
                    <input type="${inputType}" id="option${idx}" name="answer" value="${option}" required>
                    <label for="option${idx}">${option}</label>
                </div>
            `).join('');
        } else if (question.type === 'text-input') {
            optionsHtml = `
                <div class="option-block">
                    <label for="textAnswer">Your Answer:</label>
                    <input type="${inputType}" id="textAnswer" name="answer" required>
                </div>
            `;
        }

        questionsContainer.innerHTML = `
            <div class="question-block">
                <h3>${question.topic}</h3>
                <p class="question-text-content">${question.question}</p>
                ${optionsHtml}
            </div>
        `;

        // Manage button visibility
        if (currentQuestionIndex === questions.length - 1) {
            nextQuestionBtn.style.display = 'none';
            submitAssessmentBtn.style.display = 'block';
        } else {
            nextQuestionBtn.style.display = 'block';
            submitAssessmentBtn.style.display = 'none';
        }
    }

    function nextQuestion() {
        const selectedAnswer = document.querySelector('input[name="answer"]:checked')?.value || document.getElementById('textAnswer')?.value;

        if (!selectedAnswer) {
            alert('Please select or enter an answer before proceeding.');
            return;
        }

        recordAnswer(selectedAnswer);

        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            displayQuestion();
        } else {
            // This case should ideally be handled by submitAssessmentBtn becoming visible
            // and the user clicking it. But as a fallback:
            submitAssessment();
        }
    }

    function recordAnswer(userAnswer) {
        const question = questions[currentQuestionIndex];
        let isCorrect = false;
        let outcome = 'Incorrect';
        let questionScore = 0;
        let maxScore = 1;

        if (question.type === 'multiple-choice') {
            isCorrect = userAnswer === question.correctAnswer;
        } else if (question.type === 'text-input') {
            // Case-insensitive comparison for text answers
            isCorrect = userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
        }

        if (isCorrect) {
            score++;
            questionScore = 1;
            outcome = 'Correct';
        }

        assessmentData.detailedResults.push({
            question: question.question,
            topic: question.topic,
            user_answer: userAnswer,
            correct_answer: question.correctAnswer,
            outcome: outcome,
            score: questionScore,
            max_score: maxScore
        });
    }

    function calculateOverallExpectations() {
        const percentage = (score / assessmentData.totalQuestions) * 100;
        if (percentage >= 90) {
            return CUSTOM_CONTENT.expectationsAbove + " (Excellent understanding)";
        } else if (percentage >= 70) {
            return CUSTOM_CONTENT.expectationsMeets + " (Good understanding)";
        } else {
            return CUSTOM_CONTENT.expectationsBelow + " (Needs improvement)";
        }
    }

    async function submitAssessment(timeUp = false) {
        clearInterval(timer); // Stop the timer

        // Record the answer for the last question if not already recorded
        const selectedAnswer = document.querySelector('input[name="answer"]:checked')?.value || document.getElementById('textAnswer')?.value;
        if (selectedAnswer) {
            recordAnswer(selectedAnswer);
        }

        if (timeUp) {
            alert(CUSTOM_CONTENT.timeUpMessage);
        }

        assessmentData.score = score;
        assessmentData.expectations = calculateOverallExpectations();

        showSection(resultsSection);
        overallScoreH3.textContent = `Overall Score: ${assessmentData.score}/${assessmentData.totalQuestions}`;
        overallExpectationsH3.textContent = `Overall Outcome: ${assessmentData.expectations}`;

        detailedResultsDiv.innerHTML = `<p>${CUSTOM_CONTENT.resultsEmailMessage}</p>`; // Show a message that results will be emailed
        sendEmailBtn.style.display = 'block'; // Make the send email button visible
    }

    // --- Event Listeners ---

    // Info Form Submission
    infoForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent default form submission

        // Only proceed if the button is enabled (meaning Turnstile passed)
        if (startAssessmentBtn.disabled) {
            alert('Please complete the security check.');
            return;
        }

        assessmentData.parentName = parentNameInput.value.trim();
        assessmentData.childName = childNameInput.value.trim();
        assessmentData.parentEmail = parentEmailInput.value.trim();
        assessmentData.keyStage = keyStageSelect.value;

        if (assessmentData.parentName && assessmentData.childName && assessmentData.parentEmail && assessmentData.keyStage) {
            showSection(assessmentSection);
            loadQuestions();
            startTimer();
        } else {
            alert('Please fill in all required fields.');
        }
    });

    // Send Email Button
    sendEmailBtn.addEventListener('click', async () => {
        emailStatusP.textContent = CUSTOM_CONTENT.emailSending;
        sendEmailBtn.disabled = true; // Disable to prevent multiple clicks

        try {
            const response = await fetch('/.netlify/functions/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    parentName: assessmentData.parentName,
                    childName: assessmentData.childName,
                    parentEmail: assessmentData.parentEmail,
                    keyStage: assessmentData.keyStage,
                    resultsText: `Overall Score: ${assessmentData.score}/${assessmentData.totalQuestions}\nOverall Outcome: ${assessmentData.expectations}`,
                    resultsHtml: generateResultsEmailHtml(assessmentData) // Function to generate HTML email content
                }),
            });

            const data = await response.json();
            if (response.ok) {
                emailStatusP.textContent = CUSTOM_CONTENT.emailSentSuccess;
                emailStatusP.style.color = 'green';
            } else {
                emailStatusP.textContent = `${CUSTOM_CONTENT.emailFailed} Error: ${data.error || 'Unknown error'}`;
                emailStatusP.style.color = 'red';
                console.error('Email sending error:', data);
            }
        } catch (error) {
            emailStatusP.textContent = CUSTOM_CONTENT.networkError;
            emailStatusP.style.color = 'red';
            console.error('Network or other error sending email:', error);
        } finally {
            sendEmailBtn.disabled = false;
        }
    });

    // Helper function to generate HTML for the email
    function generateResultsEmailHtml(data) {
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9; }
                h2, h3, h4 { color: #0056b3; }
                .question-item { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dashed #eee; }
                .question-item:last-child { border-bottom: none; }
                .score-summary { text-align: center; margin-top: 25px; padding-top: 15px; border-top: 2px solid #007bff; }
                .correct { color: green; }
                .incorrect { color: red; }
                .expectation-meets { color: #28a745; font-weight: bold; }
                .expectation-below { color: #dc3545; font-weight: bold; }
                .expectation-above { color: #007bff; font-weight: bold; }
            </style>
            </head>
            <body>
                <div class="container">
                    <h2>${data.keyStage} Assessment Results</h2>
                    <p>Dear ${data.parentName},</p>
                    <p>Here are the results for ${data.childName}'s recent assessment:</p>
        `;

        data.detailedResults.forEach((item, index) => {
            const outcomeClass = item.outcome === 'Correct' ? 'correct' : 'incorrect';
            html += `
                <div class="question-item">
                    <h4>Q${index + 1}. ${escapeHtml(item.topic || 'General Question')}</h4>
                    <p><strong>Your Answer:</strong> ${escapeHtml(item.user_answer || 'N/A')}</p>
                    <p><strong>Correct Answer:</strong> ${escapeHtml(item.correct_answer || 'N/A')}</p>
                    <p><strong>Score:</strong> ${escapeHtml(item.score || '0')}/${escapeHtml(item.max_score || '1')}</p>
                    <p><strong>Outcome:</strong> <span class="${outcomeClass}">${escapeHtml(item.outcome || 'Not available')}</span></p>
                </div>
            `;
        });

        html += `
                    <div class="score-summary">
                        <h3>Overall Score: ${data.score}/${data.totalQuestions}</h3>
                        <h3>Overall Outcome: <span class="${getExpectationClass(data.expectations)}">${data.expectations}</span></h3>
                    </div>
                    <p>If you have any questions, please reply to this email.</p>
                    <p>Best regards,<br>Mona Teaches</p>
                </div>
            </body>
            </html>
        `;
        return html;
    }

    function getExpectationClass(expectations) {
        if (expectations.includes("Above Expectations")) return "expectation-above";
        if (expectations.includes("Meets Expectations")) return "expectation-meets";
        if (expectations.includes("Below Expectations")) return "expectation-below";
        return "";
    }

    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    // --- Cloudflare Turnstile Callbacks ---
    window.turnstileSuccessCallback = function(token) {
        // You can optionally verify the token server-side (optional but recommended)
        fetch('/.netlify/functions/verify-turnstile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ turnstileToken: token })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                startAssessmentBtn.disabled = false;
            } else {
                startAssessmentBtn.disabled = true;
                console.error('Turnstile verification failed:', data.errors);
                alert('Security check failed. Please try again.');
            }
        })
        .catch(error => {
            startAssessmentBtn.disabled = true;
            console.error('Error verifying Turnstile:', error);
            alert('An error occurred during security verification. Please try again.');
        });
    };

    window.turnstileErrorCallback = function() {
        startAssessmentBtn.disabled = true;
        console.error('Turnstile widget encountered an error.');
        alert('There was an issue loading the security check. Please refresh the page.');
    };

    // Next Question Button
    nextQuestionBtn.addEventListener('click', nextQuestion);

    // Assessment Form Submission (for final submit button)
    assessmentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitAssessment();
    });
});