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
            meets: questions.length * 0.66 // Example: 33-65% is Meets, >= 66% is Above
        };

        questions.forEach((q, index) => {
            const userAnswer = userAnswers[q.id];
            let isCorrect = false;
            let explanation = q.explanation || '';
            let userAnswerDisplay = userAnswer === '' ? 'No Answer' : userAnswer;
            let questionScore = 0; // 0 or 1 for this question

            // Correctness logic based on question type
            if (q.type === 'radio') {
                isCorrect = (userAnswer === q.correctAnswer);
            } else if (q.type === 'text') {
                // For text answers, consider case-insensitivity and trim whitespace
                isCorrect = (userAnswer.trim().toLowerCase() === q.correctAnswer.toLowerCase());
            } else if (q.type === 'number') {
                // For number answers, convert to number for comparison
                isCorrect = (parseFloat(userAnswer) === q.correctAnswer);
            }

            // Detailed results for email
            let outcomeClass = isCorrect ? 'correct' : 'incorrect';
            let outcomeText = isCorrect ? 'Correct' : 'Incorrect';
            if (userAnswer === '') {
                outcomeText = 'No Answer';
                outcomeClass = ''; // No specific outcome class for no answer
            }

            // Add to total score if correct
            if (isCorrect) {
                score += 1;
                questionScore = 1;
            }

            // Build HTML content for email (detailed results)
            resultsHtmlEmailContent += `
                <div class="question-item">
                    <h4>Q${index + 1}. ${escapeHtml(q.topicHeading)}</h4>
                    <p><strong>Question:</strong> ${escapeHtml(q.question)}</p>
                    <p><strong>Your Answer:</strong> ${escapeHtml(userAnswerDisplay)}</p>
                    ${q.correctAnswerDisplay ? `<p><strong>Correct Answer:</strong> ${escapeHtml(q.correctAnswerDisplay)}</p>` : ''}
                    ${explanation ? `<p><strong>Explanation:</strong> ${escapeHtml(explanation)}</p>` : ''}
                    <p><strong>Score:</strong> ${questionScore}/${1}</p>
                    <p><strong>Outcome:</strong> <span class="${outcomeClass}">${outcomeText}</span></p>
                </div>
            `;

            // Build plain text content for email (detailed results)
            resultsTextContent += `
Q${index + 1}. ${q.topicHeading}
  Question: ${q.question}
  Your Answer: ${userAnswerDisplay}
  ${q.correctAnswerDisplay ? `Correct Answer: ${q.correctAnswerDisplay}` : ''}
  ${explanation ? `Explanation: ${explanation}` : ''}
  Score: ${questionScore}/1
  Outcome: ${outcomeText}
--------------------
            `;
        });

        // Determine overall outcome text
        let overallOutcomeText = "";
        if (score < scoreThresholds.below) {
            overallOutcomeText = CUSTOM_CONTENT.expectationsBelow + " (Needs more practice)";
        } else if (score >= scoreThresholds.meets) {
            overallOutcomeText = CUSTOM_CONTENT.expectationsAbove + " (Excellent understanding)";
        } else {
            overallOutcomeText = CUSTOM_CONTENT.expectationsMeets + " (Good understanding)";
        }

        // Display overall score and expectations on the results page
        overallScoreElement.innerHTML = `<h3>Overall Score: ${score}/${questions.length}</h3>`;
        overallExpectationsElement.innerHTML = `<h3>Overall Outcome: <span class="${overallOutcomeText.includes('Below') ? 'expectation-below' : overallOutcomeText.includes('Above') ? 'expectation-above' : 'expectation-meets'}">${overallOutcomeText}</span></h3>`;

        // Add overall score and outcome to email content
        resultsHtmlEmailContent += `
            <div class="score-summary">
                <h3>Overall Score: ${score}/${questions.length}</h3>
                <h3>Overall Outcome: <span class="${overallOutcomeText.includes('Below') ? 'expectation-below' : overallOutcomeText.includes('Above') ? 'expectation-above' : 'expectation-meets'}">${overallOutcomeText}</span></h3>
            </div>
        `;
        resultsTextContent += `\nOverall Score: ${score}/${questions.length}\nOverall Outcome: ${overallOutcomeText}\n`;


        // Save submission to database
        try {
            const response = await fetch('/.netlify/functions/save-submission', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    parentName: parentName,
                    childName: childName,
                    parentEmail: parentEmail,
                    score: score, // Send the numerical score
                    expectations: overallOutcomeText, // Send the plain text outcome
                    detailedResults: {
                        html: resultsHtmlEmailContent,
                        plain: resultsTextContent,
                        overallScore: `${score}/${questions.length}`,
                        overallOutcome: overallOutcomeText
                    },
                    totalQuestions: questions.length
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Submission saved:', result);
        } catch (error) {
            console.error('Error saving submission:', error);
            // Optionally, show an error message to the user
        }

        // --- Email Sending Logic ---
        // Escape HTML for email subject if needed (e.g., from childName)
        const emailSubjectChildName = escapeHtml(childName);
        const emailOverallScore = `${score}/${questions.length}`;
        const emailOverallOutcome = overallOutcomeText;

        const emailRequestBody = {
            parentName: parentName,
            childName: emailSubjectChildName,
            parentEmail: parentEmail,
            subject: `${CURRENT_KEY_STAGE} Assessment Results for ${emailSubjectChildName} - Score: ${emailOverallScore}`,
            detailedResultsHtml: resultsHtmlEmailContent,
            overallScore: emailOverallScore, // This is for email template
            overallOutcome: emailOverallOutcome, // This is for email template
            resultsEmailMessage: CUSTOM_CONTENT.resultsEmailMessage // Pass custom message
        };

        const sendEmailBtn = document.getElementById('sendEmailBtn');
        sendEmailBtn.style.display = 'block'; // Show the send email button

        sendEmailBtn.onclick = async () => {
            emailStatus.textContent = CUSTOM_CONTENT.emailSending; // Show sending message
            emailStatus.style.color = '#0056b3'; // Blue for sending
            sendEmailBtn.disabled = true; // Disable button while sending

            try {
                const emailResponse = await fetch('/.netlify/functions/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(emailRequestBody)
                });

                if (emailResponse.ok) {
                    emailStatus.textContent = CUSTOM_CONTENT.emailSentSuccess;
                    emailStatus.style.color = 'green';
                } else {
                    const errorData = await emailResponse.json();
                    throw new Error(errorData.message || 'Failed to send email.');
                }
            } catch (error) {
                console.error('Error sending email:', error);
                emailStatus.textContent = CUSTOM_CONTENT.emailFailed;
                emailStatus.style.color = 'red';
            } finally {
                sendEmailBtn.disabled = false; // Re-enable button after attempt
            }
        };

        // If the assessment was auto-submitted by time, automatically send the email.
        if (assessmentSubmittedByTime) {
            sendEmailBtn.click(); // Programmatically click the send email button
        }
    }

    // Escape HTML for safe display
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    // --- Event Listeners ---

    // Info Form Submission
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

    // Start Assessment button (controlled by Turnstile)
    // Initially disabled
    startAssessmentBtn.disabled = true;

    // Callback functions for Cloudflare Turnstile
    window.onloadTurnstileCallback = function() {
        // This callback is fired once the Turnstile widget is ready.
        // You might want to enable the button here if you don't need server-side verification,
        // or keep it disabled until verification token is successfully processed.
        // For server-side verification, enable the button in the 'turnstileSuccessCallback'
    };

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