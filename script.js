// Filename: script.js
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
    document.getElementById('assessmentIntro').textContent = CUSTOM_CONTENT.assessmentIntro;
    document.getElementById('securityCheckText').textContent = CUSTOM_CONTENT.securityCheckText;
    document.getElementById('resultsHeading').textContent = CUSTOM_CONTENT.resultsHeading;
    // No need to set assessmentHeading here, it's dynamic.

    // --- DOM Elements ---
    const infoCollectionDiv = document.getElementById('infoCollection');
    const assessmentSectionDiv = document.getElementById('assessmentSection');
    const resultsSectionDiv = document.getElementById('results');
    const infoForm = document.getElementById('infoForm');
    const assessmentForm = document.getElementById('assessmentForm');
    const startAssessmentBtn = document.getElementById('startAssessmentBtn');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    const submitAssessmentBtn = document.getElementById('submitAssessmentBtn');
    const questionsContainer = document.getElementById('questionsContainer');
    const timerDisplay = document.getElementById('time');
    const currentQuestionNumDisplay = document.getElementById('currentQNum');
    const totalQuestionNumDisplay = document.getElementById('totalQNum');
    const sendEmailBtn = document.getElementById('sendEmailBtn');
    const emailStatusPara = document.getElementById('emailStatus');

    let parentName, childName, parentEmail;
    let questions = []; // Array to hold questions from JSON
    let userAnswers = []; // Array to hold user's answers
    let currentQuestionIndex = 0;
    let timeLeft = 15 * 60; // 15 minutes in seconds
    let timer;

    // --- Helper Functions ---

    // Function to shuffle an array (Fisher-Yates algorithm)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
    }

    // Function to fetch questions from JSON
    async function fetchQuestions() {
        try {
            const response = await fetch('questions.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            questions = await response.json();
            shuffleArray(questions); // Shuffle questions on load
            totalQuestionNumDisplay.textContent = questions.length;
        } catch (error) {
            console.error('Error fetching questions:', error);
            alert('Could not load assessment questions. Please try refreshing the page.');
        }
    }

    // Function to display a question
    function showQuestion(index) {
        if (questions.length === 0) return;

        const q = questions[index];
        questionsContainer.innerHTML = ''; // Clear previous question

        const questionBlock = document.createElement('div');
        questionBlock.className = 'question-block';

        questionBlock.innerHTML = `
            <h3>${q.topic}</h3>
            <p class="question-text-content">${q.question}</p>
            <label for="answerInput">Your Answer:</label>
            <input type="text" id="answerInput" name="answerInput" value="${userAnswers[index] || ''}" required>
        `;
        questionsContainer.appendChild(questionBlock);

        currentQuestionNumDisplay.textContent = index + 1;

        // Show/hide navigation buttons
        if (index === questions.length - 1) {
            nextQuestionBtn.style.display = 'none';
            submitAssessmentBtn.style.display = 'block';
        } else {
            nextQuestionBtn.style.display = 'block';
            submitAssessmentBtn.style.display = 'none';
        }
        document.getElementById('answerInput').focus(); // Auto-focus on the answer input
    }

    // Function to handle next question
    function nextQuestion() {
        // Save current answer before moving
        const answerInput = document.getElementById('answerInput');
        if (answerInput) {
            userAnswers[currentQuestionIndex] = answerInput.value.trim();
        }

        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            showQuestion(currentQuestionIndex);
        }
    }

    // Timer functions
    function startTimer() {
        timer = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            if (timeLeft <= 0) {
                clearInterval(timer);
                alert(CUSTOM_CONTENT.timeUpMessage);
                submitAssessment();
            }
        }, 1000);
    }

    function getExpectations(score, totalQuestions) {
        const percentage = (score / totalQuestions) * 100;
        if (percentage >= 90) {
            return CUSTOM_CONTENT.expectationsAbove; // "Above Expectations"
        } else if (percentage >= 60) {
            return CUSTOM_CONTENT.expectationsMeets; // "Meets Expectations"
        } else {
            return CUSTOM_CONTENT.expectationsBelow; // "Below Expectations"
        }
    }

    function getExpectationMessage(expectation) {
        if (expectation === CUSTOM_CONTENT.expectationsAbove) {
            return "Excellent understanding";
        } else if (expectation === CUSTOM_CONTENT.expectationsMeets) {
            return "Good understanding";
        } else {
            return "Further practice needed";
        }
    }

    // Function to submit assessment
    function submitAssessment() {
        clearInterval(timer); // Stop the timer

        // Save the last answer if assessment submitted by button before timer runs out
        const answerInput = document.getElementById('answerInput');
        if (answerInput && currentQuestionIndex === questions.length - 1) {
            userAnswers[currentQuestionIndex] = answerInput.value.trim();
        }

        // Collect all data
        const detailedResults = [];
        let score = 0; // Initialize total score
        const totalQuestions = questions.length;

        questions.forEach((q, index) => {
            const userAnswer = userAnswers[index];
            const correctAnswer = q.correctAnswer;
            // Simple string comparison, case-insensitive and trim whitespace
            const isCorrect = (userAnswer || '').toString().toLowerCase() === (correctAnswer || '').toString().toLowerCase();

            if (isCorrect) {
                score++; // Increment overall score
            }

            detailedResults.push({
                question: q.question,
                user_answer: userAnswer,
                correct_answer: correctAnswer,
                outcome: isCorrect ? 'Correct' : 'Incorrect',
                score: isCorrect ? 1 : 0, // Score for individual question
                max_score: 1
            });
        });

        const overallScoreElement = document.getElementById('overallScore');
        const overallExpectationsElement = document.getElementById('overallExpectations');
        const detailedResultsDiv = document.getElementById('detailedResults');

        // Display results
        const finalScoreText = `${score}/${totalQuestions}`;
        overallScoreElement.innerHTML = `<h3>Overall Score: ${finalScoreText}</h3>`;
        const expectations = getExpectations(score, totalQuestions);
        overallExpectationsElement.innerHTML = `<h3>Overall Outcome: <span class="expectation-${expectations.toLowerCase().replace(/ /g, '-')}" style="font-weight: bold;">${expectations} (${getExpectationMessage(expectations)})</span></h3>`;

        // Generate and display detailed results for the results section
        let detailedHtml = '';
        detailedResults.forEach(item => {
            const outcomeClass = item.outcome === 'Correct' ? 'correct' : 'incorrect';
            detailedHtml += `
                <div class="question-item">
                    <h4>${item.question}</h4>
                    <p><strong>Your Answer:</strong> ${item.user_answer || 'N/A'}</p>
                    <p><strong>Correct Answer:</strong> ${item.correct_answer || 'N/A'}</p>
                    <p><strong>Outcome:</strong> <span class="${outcomeClass}">${item.outcome || 'Not available'}</span></p>
                </div>
            `;
        });
        detailedResultsDiv.innerHTML = detailedHtml;

        // Display results section and hide assessment
        assessmentSectionDiv.style.display = 'none';
        resultsSectionDiv.style.display = 'block';
        sendEmailBtn.style.display = 'block'; // Show the send email button
        document.getElementById('detailedResults').insertAdjacentHTML('beforebegin', `<p>${CUSTOM_CONTENT.resultsEmailMessage}</p>`);


        // Send data to Netlify Function
        fetch('/.netlify/functions/save-submission', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                parentName: parentName,
                childName: childName,
                parentEmail: parentEmail,
                score: score, // Use the numerical score directly
                expectations: expectations,
                detailedResults: detailedResults,
                totalQuestions: totalQuestions // totalQuestions is already numerical
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                console.log(data.message);
            } else {
                console.error('Error saving submission:', data.error);
            }
        })
        .catch(error => {
            console.error('Network error saving submission:', error);
        });
    }

    // Function to send results email
    sendEmailBtn.addEventListener('click', async () => {
        emailStatusPara.textContent = CUSTOM_CONTENT.emailSending;
        emailStatusPara.style.color = '#0056b3';

        // Reconstruct results HTML for email
        let emailDetailedHtml = '';
        detailedResults.forEach(item => {
            const outcomeClass = item.outcome === 'Correct' ? 'correct' : 'incorrect';
            emailDetailedHtml += `
                <div class="question-item">
                    <h4>${item.question}</h4>
                    <p><strong>Your Answer:</strong> ${item.user_answer || 'N/A'}</p>
                    <p><strong>Correct Answer:</strong> ${item.correct_answer || 'N/A'}</p>
                    <p><strong>Score:</strong> ${item.score || 0}/${item.max_score || 1}</p>
                    <p><strong>Outcome:</strong> <span class="${outcomeClass}">${item.outcome || 'Not available'}</span></p>
                </div>
            `;
        });

        const overallScoreText = document.getElementById('overallScore').textContent;
        const overallExpectationsText = document.getElementById('overallExpectations').textContent;

        const emailHtmlContent = `<!DOCTYPE html>
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
                    <h2>Key Stage 2 Assessment Results</h2>
                    <p>Dear ${parentName},</p>
                    <p>Here are the assessment results for ${childName}:</p>
                    <div class="detailed-questions">
                        ${emailDetailedHtml}
                    </div>
                    <div class="score-summary">
                        <h3>${overallScoreText}</h3>
                        <h3>${overallExpectationsText}</h3>
                    </div>
                    <p>If you have any questions, please reply to this email.</p>
                    <p>Best regards,<br>Mona Teaches</p>
                </div>
            </body>
            </html>
        `;

        try {
            const response = await fetch('/.netlify/functions/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    parentName: parentName,
                    childName: childName,
                    parentEmail: parentEmail,
                    resultsText: `Overall Score: ${overallScoreText}\nOverall Outcome: ${overallExpectationsText}\n\nDetailed results are attached.`, // Simple text version
                    resultsHtml: emailHtmlContent,
                    keyStage: "Key Stage 1" // You can make this dynamic if needed
                })
            });

            const data = await response.json();
            if (response.ok) {
                emailStatusPara.textContent = CUSTOM_CONTENT.emailSentSuccess;
                emailStatusPara.style.color = 'green';
            } else {
                emailStatusPara.textContent = `${CUSTOM_CONTENT.emailFailed} ${data.error || ''}`;
                emailStatusPara.style.color = 'red';
                console.error('Error sending email:', data.error);
            }
        } catch (error) {
            emailStatusPara.textContent = CUSTOM_CONTENT.networkError;
            emailStatusPara.style.color = 'red';
            console.error('Network error sending email:', error);
        }
    });


    // --- Event Listeners ---

    // Initial fetch of questions
    fetchQuestions();

    // Info Form Submission (for Start Assessment button)
    infoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Store user info
        parentName = document.getElementById('parentName').value;
        childName = document.getElementById('childName').value;
        parentEmail = document.getElementById('parentEmail').value;

        infoCollectionDiv.style.display = 'none'; // Hide info collection
        assessmentSectionDiv.style.display = 'block'; // Show assessment section

        // Initialize and display first question
        currentQuestionIndex = 0;
        showQuestion(currentQuestionIndex);
        startTimer(); // Start the assessment timer
    });

    // Cloudflare Turnstile integration
    const startAssessmentBtn = document.getElementById('startAssessmentBtn'); // Ensure this is defined here
    startAssessmentBtn.disabled = true; // Initially disabled

    window.turnstileSuccessCallback = function(token) {
        // Verify token server-side (optional but recommended)
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