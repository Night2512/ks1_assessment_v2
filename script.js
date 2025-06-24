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
    document.getElementById('mainTitleReplicated').textContent = CUSTOM_CONTENT.mainTitle; // Update h1 as well
    document.getElementById('infoHeading').textContent = CUSTOM_CONTENT.infoHeading;
    document.getElementById('infoInstructions').textContent = CUSTOM_CONTENT.infoInstructions;
    document.getElementById('assessmentIntro').textContent = CUSTOM_CONTENT.assessmentIntro;
    document.getElementById('securityCheckText').textContent = CUSTOM_CONTENT.securityCheckText;
    document.getElementById('resultsHeading').textContent = CUSTOM_CONTENT.resultsHeading;


    // --- Elements ---
    const infoCollectionDiv = document.getElementById('infoCollection');
    const infoForm = document.getElementById('infoForm');
    const startAssessmentBtn = document.getElementById('startAssessmentBtn');
    const assessmentSectionDiv = document.getElementById('assessmentSection');
    const assessmentForm = document.getElementById('assessmentForm');
    const questionsContainer = document.getElementById('questionsContainer');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    const submitAssessmentBtn = document.getElementById('submitAssessmentBtn');
    const resultsDiv = document.getElementById('results');
    const detailedResultsDiv = document.getElementById('detailedResults'); // This will be cleared
    const overallScoreElement = document.getElementById('overallScore');
    const overallExpectationsElement = document.getElementById('overallExpectations');
    const timerDisplay = document.getElementById('time');
    const emailStatus = document.getElementById('emailStatus');
    const currentQNumSpan = document.getElementById('currentQNum');
    const totalQNumSpan = document.getElementById('totalQNum');


    // --- User Info Storage ---
    let parentName = '';
    let childName = '';
    let parentEmail = '';

    let assessmentTextResults = ''; // To store plain text results for emailing
    let assessmentHtmlResults = ''; // To store HTML results for emailing
    const CURRENT_KEY_STAGE = "Key Stage 1"; // Define the current Key Stage

    // --- Timer Variables ---
    const totalTime = 15 * 60; // 15 minutes in seconds
    let timeLeft = totalTime;
    let timerInterval;
    let assessmentSubmittedByTime = false; // Flag to check if submitted by timer

    // --- Assessment Data (Extracted from your index.html and corrected with your provided answers) ---
    const questions = [
        {
            id: 'q1',
            type: 'radio',
            topicHeading: "Reading Comprehension - Passage",
            question: "What is the cat's name?",
            passage: "Lily loves animals. She has a fluffy white cat named Snowdrop. Snowdrop likes to play with a red ball of yarn. Lily also has a small, brown dog called Buster. Buster loves to run in the park and chase squirrels.",
            options: { a: "Buster", b: "Snowdrop", c: "Lily" },
            correctAnswer: "b",
            correctAnswerDisplay: "Snowdrop"
        },
        {
            id: 'q2',
            type: 'radio',
            topicHeading: "Reading Comprehension - Detail",
            question: "What colour is the cat?",
            options: { a: "Brown", b: "Red", c: "White" },
            correctAnswer: "c",
            correctAnswerDisplay: "White"
        },
        {
            id: 'q3',
            type: 'text',
            topicHeading: "Grammar - Plural Nouns",
            question: "Fill in the missing word: Lily gets a second fluffy white cat. Now she has two fluffy white ____.",
            correctAnswer: "cats",
            explanation: "The plural of cat is 'cats'."
        },
        {
            id: 'q4',
            type: 'text',
            topicHeading: "Spelling - Animal Names",
            question: "Spell the word for the animal that chases squirrels in the park.",
            correctAnswer: "dog",
            explanation: "The animal that chases squirrels in the park is a dog."
        },
        {
            id: 'q5',
            type: 'text',
            topicHeading: "Sentence Structure - Reordering",
            question: "Put the words in the correct order to make a sentence: park., to, in, run, loves, Buster, the",
            correctAnswer: "Buster loves to run in the park.",
            explanation: "The correct sentence is 'Buster loves to run in the park.'"
        },
        {
            id: 'q6',
            type: 'text',
            topicHeading: "Grammar - Verbs",
            question: "What is the verb in the sentence: \"The bird flies high.\"?",
            correctAnswer: "flies",
            explanation: "The verb describes the action, which is 'flies'."
        },
        {
            id: 'q7',
            type: 'radio',
            topicHeading: "Vocabulary - Opposites",
            question: "What is the opposite of 'big'?",
            options: { a: "large", b: "small", c: "huge" },
            correctAnswer: "b",
            correctAnswerDisplay: "small"
        },
        {
            id: 'q8',
            type: 'radio',
            topicHeading: "Phonics - Rhyming Words",
            question: "Which word rhymes with 'tree'?",
            options: { a: "bee", b: "cat", c: "dog" },
            correctAnswer: "a",
            correctAnswerDisplay: "bee"
        },
        {
            id: 'q9',
            type: 'text',
            topicHeading: "Vocabulary - Sentence Completion",
            question: "Complete the sentence: \"I like to read a good _____.\"",
            correctAnswer: "book",
            explanation: "A common word to complete the sentence is 'book'."
        },
        {
            id: 'q10',
            type: 'radio',
            topicHeading: "Grammar - Nouns",
            question: "Which word is a noun?",
            options: { a: "run", b: "quickly", c: "table" },
            correctAnswer: "c",
            correctAnswerDisplay: "table"
        },
        {
            id: 'q11',
            type: 'radio',
            topicHeading: "Grammar - Past Tense",
            question: "What is the past tense of 'go'?",
            options: { a: "went", b: "go", c: "goes" },
            correctAnswer: "a",
            correctAnswerDisplay: "went"
        },
        {
            id: 'q12',
            type: 'text',
            topicHeading: "Sentence Construction - Word Usage",
            question: "Write a sentence using the word 'blue'.",
            correctAnswer: "The sky is blue.", // This is now an example, not a strict match
            explanation: "An example sentence is 'The sky is blue.' (Other grammatically correct sentences using 'blue' would also be acceptable)."
        },
        {
            id: 'q13',
            type: 'text',
            topicHeading: "Grammar - Contractions",
            question: "What is the contraction for 'I am'?",
            correctAnswer: "I'm",
            explanation: "The contraction for 'I am' is 'I'm'."
        },
        {
            id: 'q14',
            type: 'radio',
            topicHeading: "Mathematics - Counting",
            question: "How many apples are there?",
            image: "images/13_apples.jpg", // Added image path
            imageAlt: "A picture of 13 apples",
            options: { a: "11", b: "13", c: "15" },
            correctAnswer: "b",
            correctAnswerDisplay: "13"
        },
        {
            id: 'q15',
            type: 'number',
            topicHeading: "Mathematics - Addition",
            question: "What is 7 + 5?",
            correctAnswer: 12,
            explanation: "7 plus 5 equals 12."
        },
        {
            id: 'q16',
            type: 'number',
            topicHeading: "Mathematics - Subtraction",
            question: "What is 10 - 3?",
            correctAnswer: 7,
            explanation: "10 minus 3 equals 7."
        },
        {
            id: 'q17',
            type: 'number',
            topicHeading: "Mathematics - Missing Numbers",
            question: "5 + ___ = 10",
            correctAnswer: 5,
            explanation: "5 plus 5 equals 10."
        },
        {
            id: 'q18',
            type: 'radio',
            topicHeading: "Mathematics - Telling Time",
            question: "What time does the clock show?",
            image: "images/clock_3_oclock.png", // Added image path
            imageAlt: "A clock showing 3 o'clock",
            options: { a: "1 o'clock", b: "3 o'clock", c: "6 o'clock" },
            correctAnswer: "b",
            correctAnswerDisplay: "3 o'clock"
        },
        {
            id: 'q19',
            type: 'number',
            topicHeading: "Mathematics - Word Problems (Addition)",
            question: "Sarah has 6 red pens and 4 blue pens. How many pens does she have altogether?",
            correctAnswer: 10,
            explanation: "6 pens + 4 pens = 10 pens."
        },
        {
            id: 'q20',
            type: 'radio',
            topicHeading: "Mathematics - Fractions",
            question: "What fraction of the circle is shaded?",
            image: "images/shaded_circle.png", // Added image path
            imageAlt: "A circle with one-fourth shaded",
            options: { a: "1/2", b: "1/3", c: "1/4" },
            correctAnswer: "c",
            correctAnswerDisplay: "1/4"
        },
        {
            id: 'q21',
            type: 'number',
            topicHeading: "Mathematics - Geometry (Shapes)",
            question: "How many corners does a square have?",
            correctAnswer: 4,
            explanation: "A square has 4 corners."
        },
        {
            id: 'q22',
            type: 'number',
            topicHeading: "Mathematics - Repeated Addition",
            question: "What is 2 + 2 + 2?",
            correctAnswer: 6,
            explanation: "2 + 2 + 2 = 6."
        },
        {
            id: 'q23',
            type: 'number',
            topicHeading: "Mathematics - Word Problems (Subtraction)",
            question: "If you have 7 balloons and 3 pop, how many are left?",
            correctAnswer: 4,
            explanation: "7 balloons - 3 popped balloons = 4 balloons left."
        },
        {
            id: 'q24',
            type: 'number',
            topicHeading: "Mathematics - Halving",
            question: "Half of 12 is?",
            correctAnswer: 6,
            explanation: "Half of 12 is 6."
        },
        {
            id: 'q25',
            type: 'number',
            topicHeading: "Mathematics - Number Patterns",
            question: "Count by 5s: 5, 10, 15, ___?",
            correctAnswer: 20,
            explanation: "The next number in the pattern 5, 10, 15 is 20 (counting by 5s)."
        },
        {
            id: 'q26',
            type: 'text',
            topicHeading: "Mathematics - Geometry (Everyday Objects)",
            question: "What shape is a regular door?",
            correctAnswer: "rectangle",
            explanation: "A regular door is typically a rectangle."
        },
        {
            id: 'q27',
            type: 'number',
            topicHeading: "Mathematics - Time (Days in a Week)",
            question: "How many days are in a week?",
            correctAnswer: 7,
            explanation: "There are 7 days in a week."
        },
        {
            id: 'q28',
            type: 'number',
            topicHeading: "Mathematics - Subtraction",
            question: "What is 15 take away 5?",
            correctAnswer: 10,
            explanation: "15 take away 5 equals 10."
        },
        {
            id: 'q29',
            type: 'radio',
            topicHeading: "Mathematics - Measurement (Weight)",
            question: "Which is heavier, a feather or a brick?",
            options: { a: "Feather", b: "Brick" },
            correctAnswer: "b",
            correctAnswerDisplay: "Brick"
        },
        {
            id: 'q30',
            type: 'number',
            topicHeading: "Mathematics - Multiplication (Groups)",
            question: "If you have 4 groups of 2 objects, how many objects do you have in total?",
            correctAnswer: 8,
            explanation: "4 groups of 2 objects is 4 multiplied by 2, which equals 8."
        }
    ];

    let userAnswers = {};
    let currentQuestionIndex = 0;

    // --- Functions ---

    // Progress Indicator Update
    function updateProgressIndicator() {
        currentQNumSpan.textContent = currentQuestionIndex + 1;
        totalQNumSpan.textContent = questions.length;
    }

    // Format time for display
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Start Timer
    function startTimer() {
        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = formatTime(timeLeft);
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                assessmentSubmittedByTime = true;
                submitAssessment(); // Auto-submit when time runs out
            }
        }, 1000);
    }

    // Show a specific question
    function showQuestion(index) {
        questionsContainer.innerHTML = ''; // Clear previous question
        const q = questions[index];
        const questionBlock = document.createElement('div');
        questionBlock.className = 'question-block';
        questionBlock.id = q.id;

        let questionHtml = '';

        // Add passage if it exists for this question
        if (q.passage) {
            questionHtml += `<div class="passage"><p>${q.passage}</p></div>`;
        }

        // Display topic heading and then question text
        questionHtml += `<h3>Q${index + 1}. ${q.topicHeading}</h3>`;
        questionHtml += `<p class="question-text-content">${q.question}</p>`;


        // Add image if specified in question object
        if (q.image) {
            questionHtml += `<img src="${q.image}" alt="${q.imageAlt}" style="max-width: 150px; display: block; margin-bottom: 15px;">`; // Increased margin-bottom
        }

        if (q.type === 'radio') {
            for (const optionKey in q.options) {
                questionHtml += `
                    <div>
                        <label>
                            <input type="radio" name="${q.id}_answer" value="${optionKey}" ${userAnswers[q.id] === optionKey ? 'checked' : ''}>
                            ${optionKey}) ${q.options[optionKey]}
                        </label>
                    </div>
                `;
            }
        } else if (q.type === 'text') {
            questionHtml += `
                <input type="text" name="${q.id}_answer" placeholder="Enter your answer" value="${userAnswers[q.id] || ''}">
            `;
        } else if (q.type === 'number') {
            questionHtml += `
                <input type="number" name="${q.id}_answer" placeholder="Enter number" value="${userAnswers[q.id] || ''}">
            `;
        }
        questionBlock.innerHTML = questionHtml;
        questionsContainer.appendChild(questionBlock);

        // Update progress indicator
        updateProgressIndicator();

        // Manage button visibility
        if (currentQuestionIndex === questions.length - 1) {
            nextQuestionBtn.style.display = 'none';
            submitAssessmentBtn.style.display = 'block';
        } else {
            nextQuestionBtn.style.display = 'block';
            submitAssessmentBtn.style.display = 'none';
        }
    }

    // Handle moving to the next question
    function nextQuestion() {
        // Save current answer
        const currentQ = questions[currentQuestionIndex];
        let answerInput;
        if (currentQ.type === 'radio') {
            answerInput = document.querySelector(`input[name="${currentQ.id}_answer"]:checked`);
            userAnswers[currentQ.id] = answerInput ? answerInput.value : '';
        } else {
            answerInput = document.querySelector(`[name="${currentQ.id}_answer"]`);
            userAnswers[currentQ.id] = answerInput ? answerInput.value : '';
        }

        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            showQuestion(currentQuestionIndex);
        }
    }

    // Submit Assessment
    async function submitAssessment() {
        clearInterval(timerInterval); // Stop the timer

        // Save the answer for the last question
        const currentQ = questions[currentQuestionIndex];
        let answerInput;
        if (currentQ.type === 'radio') {
            answerInput = document.querySelector(`input[name="${currentQ.id}_answer"]:checked`);
            userAnswers[currentQ.id] = answerInput ? answerInput.value : '';
        } else {
            answerInput = document.querySelector(`[name="${currentQ.id}_answer"]`);
            userAnswers[currentQ.id] = answerInput ? answerInput.value : '';
        }

        assessmentSectionDiv.style.display = 'none';
        resultsDiv.style.display = 'block';

        let score = 0;
        let resultsHtmlEmailContent = ''; // This will store the detailed HTML for email
        let resultsTextContent = `Detailed Results:\n`;
        const scoreThresholds = {
            below: questions.length * 0.33, // Example: Below 33% is Below Expectations
            meets: questions.length * 0.66  // Example: 33-65% is Meets, >= 66% is Above
        };


        questions.forEach((q, index) => {
            const userAnswer = userAnswers[q.id];
            let isCorrect = false;
            let explanation = q.explanation || '';
            let userAnswerDisplay = userAnswer === '' ? 'No Answer' : userAnswer;
            let questionScore = 0; // 0 or 1 for each question

            if (q.type === 'radio') {
                isCorrect = userAnswer === q.correctAnswer;
                if (userAnswer && q.options[userAnswer]) {
                    userAnswerDisplay = q.options[userAnswer]; // Display the option text, not just the key
                }
            } else if (q.type === 'text') {
                if (q.id === 'q12') {
                    // Custom logic for Q12: Must start with a capital letter, contain 'blue', and end with a full stop
                    const trimmedAnswer = userAnswer.trim();
                    isCorrect = trimmedAnswer.length > 0 &&
                                trimmedAnswer[0] === trimmedAnswer[0].toUpperCase() &&
                                /[A-Z]/.test(trimmedAnswer[0]) && // Ensure the first char is an actual letter
                                trimmedAnswer.toLowerCase().includes('blue') &&
                                trimmedAnswer.endsWith('.');
                } else {
                    isCorrect = userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
                }
            } else if (q.type === 'number') {
                isCorrect = parseInt(userAnswer) === q.correctAnswer;
            }

            if (isCorrect) {
                score++;
                questionScore = 1;
            }

            // Prepare HTML results (for email) based on the provided sample
            resultsHtmlEmailContent += `
                <div class="question-item">
                    <h4>Q${index + 1}. ${q.topicHeading}</h4>
                    <p>${q.question}</p> <p><strong>Your Answer:</strong> ${userAnswerDisplay}</p>
                    <p><strong>Correct Answer:</strong> ${q.correctAnswerDisplay || q.correctAnswer}</p>
                    <p><strong>Score:</strong> ${questionScore}/1</p>
                    <p><strong>Outcome:</strong> <span class="${isCorrect ? 'correct' : 'incorrect'}">${isCorrect ? 'Correct' : 'Incorrect'}</span></p>
                    ${explanation ? `<p>Explanation: ${explanation}</p>` : ''}
                </div>
            `;

            // Prepare Plain Text results (for email)
            resultsTextContent += `\nQuestion ${index + 1}: ${q.topicHeading} - ${q.question}\n`;
            resultsTextContent += `Your Answer: ${userAnswerDisplay} (${isCorrect ? 'Correct' : 'Incorrect'})\n`;
            resultsTextContent += `Correct Answer: ${q.correctAnswerDisplay || q.correctAnswer}\n`;
            if (explanation) {
                resultsTextContent += `Explanation: ${explanation}\n`;
            }
        });

        // ONLY SHOW SUMMARY ON RESULTS PAGE
        detailedResultsDiv.innerHTML = `<p>${CUSTOM_CONTENT.resultsEmailMessage}</p>`; // Display custom message
        overallScoreElement.textContent = `Overall Score: ${score}/${questions.length}`;

        let overallExpectations = '';
        let expectationsClass = ''; // To apply correct CSS class in email
        if (score < scoreThresholds.below) {
            overallExpectations = CUSTOM_CONTENT.expectationsBelow;
            expectationsClass = 'expectation-below';
        } else if (score >= scoreThresholds.meets) {
            overallExpectations = CUSTOM_CONTENT.expectationsAbove;
            expectationsClass = 'expectation-above';
        } else {
            overallExpectations = CUSTOM_CONTENT.expectationsMeets;
            expectationsClass = 'expectation-meets';
        }
        overallExpectationsElement.textContent = `Overall Performance: ${overallExpectations}`;

        // Add auto-submit message if applicable
        if (assessmentSubmittedByTime) {
            const autoSubmitMessage = document.createElement('p');
            autoSubmitMessage.textContent = CUSTOM_CONTENT.timeUpMessage;
            autoSubmitMessage.style.color = '#dc3545'; // Red for emphasis
            autoSubmitMessage.style.fontWeight = 'bold';
            overallScoreElement.parentNode.insertBefore(autoSubmitMessage, overallScoreElement.nextSibling);
        }

        // Store results for emailing
        assessmentTextResults = `
Child's Name: ${childName}
Parent's Name: ${parentName}
Parent's Email: ${parentEmail}

Overall Score: ${score}/${questions.length}
Overall Performance: ${overallExpectations}

${resultsTextContent}
        `;

        // Full HTML for email based on provided sample
        assessmentHtmlResults = `
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
        <h2>${CURRENT_KEY_STAGE} Assessment Results for ${childName}</h2>
        <p><strong>Parent Name:</strong> ${parentName}</p>
        <p><strong>Parent Email:</strong> ${parentEmail}</p>
        <p><strong>Overall Score:</strong> ${score}/${questions.length}</p>
        <p><strong>Overall Performance:</strong> <span class="${expectationsClass}">${overallExpectations}</span></p>
        ${assessmentSubmittedByTime ? `<p style="color:#dc3545;font-weight:bold;">${CUSTOM_CONTENT.timeUpMessage}</p>` : ''}
        
        ${resultsHtmlEmailContent} <div class="score-summary">
            <h3>Overall Score: ${score}/${questions.length}</h3>
            <h3>Overall Outcome: <span class="${expectationsClass}">${overallExpectations}</span></h3>
        </div>
        <p>If you have any questions, please reply to this email.</p>
        <p>Best regards,<br>Mona Teaches</p>
    </div>
</body>
</html>
        `;

        // Immediately send results email and save to DB
        sendEmail(parentName, childName, parentEmail, assessmentTextResults, assessmentHtmlResults);
        saveSubmission(parentName, childName, parentEmail, score, overallExpectations, userAnswers);
    }

    // Send email function
    async function sendEmail(parentName, childName, parentEmail, resultsText, resultsHtml) {
        emailStatus.textContent = CUSTOM_CONTENT.emailSending;
        emailStatus.style.color = '#007bff'; // Blue for sending

        try {
            const response = await fetch('/.netlify/functions/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    parentName: parentName,
                    childName: childName,
                    parentEmail: parentEmail,
                    resultsText: resultsText, // Pass plain text results
                    resultsHtml: resultsHtml,
                    keyStage: CURRENT_KEY_STAGE  // Pass HTML results
                }),
            });

            if (response.ok) {
                emailStatus.textContent = CUSTOM_CONTENT.emailSentSuccess;
                emailStatus.style.color = '#28a745'; // Green for success
            } else {
                const errorData = await response.json();
                console.error('Error sending email:', errorData.message);
                emailStatus.textContent = `${CUSTOM_CONTENT.emailFailed}: ${errorData.message || 'Server error'}`;
                emailStatus.style.color = '#dc3545'; // Red for error
            }
        } catch (error) {
            console.error('Network or unexpected error:', error);
            emailStatus.textContent = `${CUSTOM_CONTENT.networkError}`;
            emailStatus.style.color = '#dc3545'; // Red for error
        }
    }

    // Save submission to database function
	async function saveSubmission(parentName, childName, parentEmail, score, expectations, userAnswers) {
		const totalQuestions = questions.length; // Add this line
		try {
			const response = await fetch('/.netlify/functions/save-submission', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					parentName,
					childName,
					parentEmail,
					score,
					expectations,
					detailedResults: userAnswers,
					totalQuestions: totalQuestions // Add this line
				}),
			});
			// ... rest of your saveSubmission function
		} catch (error) {
			// ...
		}
	}

    // --- Event Listeners ---

    // Info Form Submission
    infoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Save user info
        parentName = document.getElementById('parentName').value;
        childName = document.getElementById('childName').value;
        parentEmail = document.getElementById('parentEmail').value;

        infoCollectionDiv.style.display = 'none';
        assessmentSectionDiv.style.display = 'block';

        showQuestion(currentQuestionIndex);
        startTimer();
    });

    // Cloudflare Turnstile Callback
    window.turnstileCallback = function(token) {
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