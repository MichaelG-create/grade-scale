const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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
const questionPreview = document.getElementById('question-preview');
const questionPreviewText = document.getElementById('question-preview-text');

let allQuestions = [];

const EXAMPLES_DATA = {
    "Le mouvement d'un palet": [
        { label: "✅ Parfait", content: "On sait que P = m x g. Avec m = 200 g = 0,200 kg et g = 9,81 N/kg. P = 0,200 * 9,81 = 1,96 N.", id: "bravo" },
        { label: "❌ Erreur kg", content: "P = m x g. P = 200 * 9,81 = 1962 N.", id: "oubli-kg" },
        { label: "❓ Formule", content: "P = g / m. P = 9.81 / 0.2 = 49.05 N.", id: "confusion" }
    ],
    "Quantité de matière": [
        { label: "✅ Correct", content: "n = m / M. n = 5,4 / 27,0 = 0,20 mol.", id: "chimie-ok" },
        { label: "❌ Produit", content: "n = m * M. n = 5,4 * 27 = 145,8 mol.", id: "chimie-err" }
    ]
};

const EXAMPLES_MAP = {};

// Fetch questions on load
async function fetchQuestions() {
    try {
        const response = await fetch(`${API_BASE}/questions`);
        const questions = await response.json();
        allQuestions = questions;
        
        if (questions && questions.length > 0) {
            questionSelect.innerHTML = questions.map(q => 
                `<option value="${q.id}">${q.title}</option>`
            ).join('');
            
            // Map examples by question ID
            allQuestions.forEach(q => {
                // Find matching example set by title (case insensitive and trimmed)
                const titleKey = Object.keys(EXAMPLES_DATA).find(k => k.trim().toLowerCase() === q.title.trim().toLowerCase());
                if (titleKey) {
                    EXAMPLES_MAP[q.id] = EXAMPLES_DATA[titleKey];
                }
            });

            console.log("Mapped Examples:", EXAMPLES_MAP);
            updateQuestionDisplay();
        }
    } catch (err) {
        console.error("Failed to fetch questions:", err);
    }
}

function updateQuestionDisplay() {
    updateExampleButtons();
    updateQuestionPreview();
}

function updateQuestionPreview() {
    const qId = questionSelect.value;
    const question = allQuestions.find(q => q.id === qId);
    
    if (question && question.content) {
        questionPreview.classList.remove('hidden');
        questionPreviewText.textContent = question.content;
    } else {
        questionPreview.classList.add('hidden');
    }
}

function updateExampleButtons() {
    const qId = questionSelect.value;
    const examples = EXAMPLES_MAP[qId] || [];
    
    if (examples.length === 0) {
        exampleButtonsContainer.innerHTML = '<span style="color: var(--text-muted); font-size: 0.8rem;">Aucune suggestion pour cette question.</span>';
        return;
    }

    exampleButtonsContainer.innerHTML = examples.map((ex, index) => `
        <button type="button" class="example-pill" data-index="${index}">
            ${ex.label}
        </button>
    `).join('');

    // Handle clicks
    const buttons = exampleButtonsContainer.querySelectorAll('button');
    buttons.forEach((btn) => {
        btn.onclick = () => {
            const index = btn.getAttribute('data-index');
            document.getElementById('content').value = examples[index].content;
            document.getElementById('studentPseudoId').value = `eleve-${examples[index].id}`;
            // Petit feedback visuel
            btn.style.borderColor = "var(--secondary)";
            setTimeout(() => btn.style.borderColor = "", 500);
        };
    });
}

questionSelect.onchange = updateQuestionDisplay;

// Start app
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

        if (!response.ok) throw new Error("Submission failed");

        const { submissionId } = await response.json();
        pollResult(submissionId);
    } catch (err) {
        alert("Erreur lors de la soumission. Vérifiez que le serveur backend est lancé.");
        setLoading(false);
    }
});

// Polling for results
async function pollResult(submissionId) {
    let attempts = 0;
    const interval = setInterval(async () => {
        attempts++;
        if (attempts > 30) { // Timeout 1 min
            clearInterval(interval);
            alert("L'évaluation prend plus de temps que prévu.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/evaluations/${submissionId}`);
            if (!response.ok) return;

            const evaluation = await response.json();

            if (evaluation.status === 'COMPLETED') {
                clearInterval(interval);
                showResults(evaluation);
            } else if (evaluation.status === 'FAILED') {
                clearInterval(interval);
                alert("L'évaluation a échoué. Détails : " + (evaluation.generalFeedback || "Erreur inconnue"));
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
    
    const question = evaluation.submission.question;
    let maxPossibleScore = 0;
    if (question && question.rubrics?.[0]?.criteria) {
        maxPossibleScore = question.rubrics[0].criteria.reduce((sum, c) => sum + (+c.maxScore), 0);
    }

    document.getElementById('total-score').textContent = `${evaluation.totalScore} / ${maxPossibleScore}`;
    document.getElementById('general-feedback').textContent = evaluation.generalFeedback;

    // Assignment Context Display
    if (question) {
        document.getElementById('assignment-context').classList.remove('hidden');
        const subjectTag = question.subject ? `[${question.subject.name}] ` : '';
        document.getElementById('assignment-text').textContent = `${subjectTag}${question.content}`;
        
        const rubric = question.rubrics?.[0];
        if (rubric && rubric.criteria) {
            document.getElementById('full-rubric').innerHTML = rubric.criteria.map(c => 
                `• <strong>${c.name}</strong> (${c.maxScore} pts)`
            ).join('<br>');
        }
    }

    // Misconceptions
    if (evaluation.misconceptions && !["Aucune", "Pas d'erreur", "N/A"].includes(evaluation.misconceptions)) {
        misconceptionsSection.classList.remove('hidden');
        misconceptionsText.textContent = evaluation.misconceptions;
    } else {
        misconceptionsSection.classList.add('hidden');
    }

    // Criteria Breakdown
    criteriaContainer.innerHTML = evaluation.criteriaEvaluations.map(ce => {
        const hasAllPoints = ce.score >= ce.criterion.maxScore;
        const hasRemediation = !hasAllPoints && ce.misconceptions && 
                               !["Aucune", "Pas d'erreur"].includes(ce.misconceptions);

        return `
            <div class="criterion-item">
                <div class="criterion-header">
                    <span>${ce.criterion.name}</span>
                    <span style="color: ${hasAllPoints ? 'var(--secondary)' : 'var(--accent)'}">${ce.score} / ${ce.criterion.maxScore}</span>
                </div>
                <div style="font-size: 0.9rem; opacity: 0.8;">${ce.feedback}</div>
                ${hasRemediation ? `<div class="remediation-badge">💡 Conseil : ${ce.misconceptions}</div>` : ''}
            </div>
        `;
    }).join('');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setLoading(isLoading) {
    if (isLoading) {
        submissionSection.classList.add('hidden');
        resultsSection.classList.add('hidden');
        loadingSection.classList.remove('hidden');
    } else {
        loadingSection.classList.add('hidden');
    }
}

newBtn.addEventListener('click', () => {
    resultsSection.classList.add('hidden');
    document.getElementById('assignment-context').classList.add('hidden');
    submissionSection.classList.remove('hidden');
    submissionForm.reset();
    updateQuestionDisplay();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});
