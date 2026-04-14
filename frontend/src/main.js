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

const exampleButtonsContainer = document.getElementById('example-buttons');

const EXAMPLES = {
    "9d4ebb96-9d66-41f3-99a8-d4a894b377c8": [ // Méca
        { label: "✅ Parfait", content: "On sait que P = m x g. Avec m = 200 g = 0,200 kg et g = 9,81 N/kg. P = 0,200 * 9,81 = 1,96 N.", id: "bravo" },
        { label: "❌ Erreur kg", content: "P = m x g. P = 200 * 9,81 = 1962 N.", id: "oubli-kg" },
        { label: "❓ Formule", content: "P = g / m. P = 9.81 / 0.2 = 49.05 N.", id: "confusion" }
    ],
    "CHIMIE_ID": [ // Chimie (will dynamic handle)
        { label: "✅ Correct", content: "n = m / M. n = 5,4 / 27,0 = 0,20 mol.", id: "chimie-ok" },
        { label: "❌ Produit", content: "n = m * M. n = 5,4 * 27 = 145,8 mol.", id: "chimie-err" }
    ]
};

// Fetch questions on load
async function fetchQuestions() {
    try {
        const response = await fetch(`${API_BASE}/questions`);
        const questions = await response.json();
        
        if (questions.length > 0) {
            questionSelect.innerHTML = questions.map(q => 
                `<option value="${q.id}">${q.title} (${q.subject.code})</option>`
            ).join('');
            
            // Map the chemistry example to the real ID
            const chemQuestion = questions.find(q => q.title.includes("matière"));
            if (chemQuestion) {
                EXAMPLES[chemQuestion.id] = EXAMPLES["CHIMIE_ID"];
            }

            updateExampleButtons();
        }
    } catch (err) {
        console.error("Failed to fetch questions:", err);
    }
}

function updateExampleButtons() {
    const qId = questionSelect.value;
    const examples = EXAMPLES[qId] || [];
    
    exampleButtonsContainer.innerHTML = examples.map(ex => `
        <button type="button" class="example-pill" style="width: auto; padding: 4px 10px; font-size: 0.8rem; background: #eef2ff; color: var(--primary); border: 1px solid var(--primary); opacity: 0.8;">
            ${ex.label}
        </button>
    `).join('');

    // Handle clicks
    const buttons = exampleButtonsContainer.querySelectorAll('button');
    buttons.forEach((btn, index) => {
        btn.onclick = () => {
            document.getElementById('content').value = examples[index].content;
            document.getElementById('studentPseudoId').value = `eleve-${examples[index].id}`;
        };
    });
}

questionSelect.onchange = updateExampleButtons;

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

    document.getElementById('student-copy-display').textContent = evaluation.submission.content;
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
    criteriaContainer.innerHTML = evaluation.criteriaEvaluations.map(ce => {
        // Règle métier : Si tous les points sont obtenus, on masque la remédiation technique de l'IA
        const hasAllPoints = ce.score === ce.criterion.maxScore;
        
        const hasRemediation = !hasAllPoints && ce.misconceptions && 
                               ce.misconceptions !== "Aucune" && 
                               ce.misconceptions !== "Pas d'erreur identifiée" &&
                               ce.misconceptions !== "Pas d'erreur";

        return `
            <div class="criterion-item">
                <div class="criterion-name">
                    <span>${ce.criterion.name}</span>
                    <span>${ce.score} / ${ce.criterion.maxScore}</span>
                </div>
                <div class="criterion-feedback">${ce.feedback}</div>
                ${hasRemediation ? `<div class="criterion-feedback" style="color: #991b1b; font-weight: 500;">Remédiation : ${ce.misconceptions}</div>` : ''}
            </div>
        `;
    }).join('');
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
