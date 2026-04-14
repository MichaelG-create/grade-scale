const API_BASE = 'http://localhost:3000';

const submissionSection = document.getElementById('submission-section');
const loadingSection = document.getElementById('loading-section');
const resultsSection = document.getElementById('results-section');
const submissionForm = document.getElementById('submission-form');
const questionSelect = document.getElementById('questionId');
const criteriaContainer = document.getElementById('criteria-container');
const misconceptionsSection = document.getElementById('misconceptions-section');
const misconceptionsText = document.getElementById('misconceptions-text');
const newBtn = document.getElementById('new-btn');

// Fetch questions on load
async function fetchQuestions() {
    try {
        const response = await fetch(`${API_BASE}/questions`);
        const questions = await response.json();
        
        if (questions.length > 0) {
            questionSelect.innerHTML = questions.map(q => 
                `<option value="${q.id}">${q.title} (${q.subject.code})</option>`
            ).join('');
        }
    } catch (err) {
        console.error("Failed to fetch questions:", err);
    }
}

fetchQuestions();

// Handle Form Submission
submissionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        studentPseudoId: document.getElementById('studentPseudoId').value,
        questionId: questionSelect.value,
        content: document.getElementById('content').value
    };

    try {
        setLoading(true);
        
        const response = await fetch(`${API_BASE}/submissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const { submissionId } = await response.json();
        pollResult(submissionId);
    } catch (err) {
        alert("Erreur lors de la soumission");
        setLoading(false);
    }
});

// Polling for results
async function pollResult(submissionId) {
    const interval = setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE}/evaluations/${submissionId}`);
            const evaluation = await response.json();

            if (evaluation.status === 'COMPLETED') {
                clearInterval(interval);
                showResults(evaluation);
            } else if (evaluation.status === 'FAILED') {
                clearInterval(interval);
                alert("L'évaluation a échoué.");
                setLoading(false);
            }
        } catch (err) {
            console.error("Polling error:", err);
        }
    }, 2000);
}

function showResults(evaluation) {
    setLoading(false);
    submissionSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');

    document.getElementById('total-score').textContent = `${evaluation.totalScore} pts`;
    document.getElementById('general-feedback').textContent = evaluation.generalFeedback;

    // Misconceptions
    if (evaluation.misconceptions && evaluation.misconceptions !== "Aucune" && evaluation.misconceptions !== "Pas d'erreur identifiée") {
        misconceptionsSection.classList.remove('hidden');
        misconceptionsText.textContent = evaluation.misconceptions;
    } else {
        misconceptionsSection.classList.add('hidden');
    }

    // Criteria Breakdown
    criteriaContainer.innerHTML = evaluation.criteriaEvaluations.map(ce => `
        <div class="criterion-item">
            <div class="criterion-name">
                <span>${ce.criterion.name}</span>
                <span>${ce.score} / ${ce.criterion.maxScore}</span>
            </div>
            <div class="criterion-feedback">${ce.feedback}</div>
            ${ce.misconceptions ? `<div class="criterion-feedback" style="color: #991b1b; font-weight: 500;">Remédiation : ${ce.misconceptions}</div>` : ''}
        </div>
    `).join('');
}

function setLoading(isLoading) {
    if (isLoading) {
        submissionSection.classList.add('hidden');
        loadingSection.classList.remove('hidden');
    } else {
        loadingSection.classList.add('hidden');
    }
}

newBtn.addEventListener('click', () => {
    resultsSection.classList.add('hidden');
    submissionSection.classList.remove('hidden');
    submissionForm.reset();
});
