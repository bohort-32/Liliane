// Variables globales
let currentSessionId = null;
let isFirstInteraction = true;

// Éléments du DOM
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const loading = document.getElementById('loading');
const newChatBtn = document.getElementById('newChatBtn');
const chatTitle = document.getElementById('chatTitle');
const sessionInfo = document.getElementById('sessionInfo');

// Configuration de Marked.js
marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: false,
    mangle: false
});

// Fonction pour formater l'heure
function formatTime(isoDate) {
    return new Date(isoDate).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Fonction pour échapper le HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Créer une nouvelle conversation
async function createNewConversation() {
    try {
        const response = await fetch('/api/conversations/new', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.success) {
            currentSessionId = data.sessionId;
            sessionInfo.textContent = `Session: ${currentSessionId.substring(0, 8)}...`;
            
            // Réinitialiser l'interface avec les suggestions
            isFirstInteraction = true;
            resetToWelcomeScreen();
            
            // Activer l'input
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
            
            showAlert('Nouvelle conversation créée', 'success');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showAlert('Erreur lors de la création de la conversation', 'danger');
    }
}

// Réinitialiser l'écran de bienvenue
function resetToWelcomeScreen() {
    chatContainer.innerHTML = `
        <div class="welcome-section">
            <div class="text-center mb-4">
                <i class="bi bi-mortarboard-fill" style="font-size: 4rem; color: var(--saint-louis-orange);"></i>
                <h3 class="mt-3">Bienvenue sur l'assistant BTS SIO</h3>
                <p class="text-muted">Découvrez notre formation en Services Informatiques aux Organisations</p>
            </div>

            <div class="suggestions-container">
                <h6 class="text-muted mb-3">Questions fréquentes :</h6>
                <div class="row g-3">
                    <div class="col-md-6">
                        <div class="suggestion-card" data-question="Qu'est-ce que le BTS SIO ?">
                            <i class="bi bi-info-circle-fill"></i>
                            <div>
                                <strong>Présentation générale</strong>
                                <p class="mb-0 small text-muted">Qu'est-ce que le BTS SIO ?</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="suggestion-card" data-question="Quelles sont les deux options du BTS SIO ?">
                            <i class="bi bi-diagram-3-fill"></i>
                            <div>
                                <strong>Les options SISR et SLAM</strong>
                                <p class="mb-0 small text-muted">Quelles sont les différences ?</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="suggestion-card" data-question="Quels sont les débouchés professionnels après un BTS SIO ?">
                            <i class="bi bi-briefcase-fill"></i>
                            <div>
                                <strong>Débouchés</strong>
                                <p class="mb-0 small text-muted">Quels métiers après le BTS ?</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="suggestion-card" data-question="Quelles sont les conditions d'admission au BTS SIO ?">
                            <i class="bi bi-person-check-fill"></i>
                            <div>
                                <strong>Admission</strong>
                                <p class="mb-0 small text-muted">Comment intégrer la formation ?</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="suggestion-card" data-question="Quel est le programme du BTS SIO ?">
                            <i class="bi bi-book-fill"></i>
                            <div>
                                <strong>Programme</strong>
                                <p class="mb-0 small text-muted">Quelles matières étudiées ?</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="suggestion-card" data-question="Comment se déroulent les stages en BTS SIO ?">
                            <i class="bi bi-building-fill"></i>
                            <div>
                                <strong>Stages</strong>
                                <p class="mb-0 small text-muted">Durée et organisation</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    chatTitle.textContent = 'Découvrir le BTS SIO';
    
    // Réattacher les event listeners sur les suggestions
    attachSuggestionListeners();
}

// Attacher les event listeners aux cartes de suggestion
function attachSuggestionListeners() {
    const suggestionCards = document.querySelectorAll('.suggestion-card');
    suggestionCards.forEach(card => {
        card.addEventListener('click', function() {
            const question = this.getAttribute('data-question');
            userInput.value = question;
            sendMessage();
        });
    });
}

// Envoyer un message
async function sendMessage() {
    const message = userInput.value.trim();

    if (!message) return;

    if (!currentSessionId) {
        showAlert('Erreur: pas de session active', 'danger');
        return;
    }

    // Désactiver l'input pendant l'envoi
    userInput.disabled = true;
    sendBtn.disabled = true;

    // Supprimer la welcome section si c'est la première interaction
    if (isFirstInteraction) {
        const welcomeSection = chatContainer.querySelector('.welcome-section');
        if (welcomeSection) {
            welcomeSection.remove();
        }
        isFirstInteraction = false;
    }

    // Afficher le message de l'utilisateur
    addMessage(message, true);

    // Vider l'input
    userInput.value = '';

    // Afficher le loading
    loading.classList.remove('d-none');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                sessionId: currentSessionId
            })
        });

        const data = await response.json();

        // Masquer le loading
        loading.classList.add('d-none');

        if (data.success) {
            // Afficher la réponse de l'assistant
            addMessage(data.response, false);
            
            // Mettre à jour le titre si fourni
            if (data.title) {
                chatTitle.textContent = data.title;
            }
        } else {
            showAlert(data.error || 'Erreur lors de l\'envoi', 'danger');
        }
    } catch (error) {
        loading.classList.add('d-none');
        console.error('Erreur:', error);
        showAlert('Erreur de connexion au serveur', 'danger');
    } finally {
        // Réactiver l'input
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

// Fonction pour ajouter un message avec support Markdown
function addMessage(content, isUser, timestamp = null, scroll = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
    
    const time = timestamp ? formatTime(timestamp) : formatTime(new Date().toISOString());
    const icon = isUser ? 'person-fill' : 'robot';
    
    let processedContent;
    if (isUser) {
        processedContent = escapeHtml(content).replace(/\n/g, '<br>');
    } else {
        try {
            processedContent = marked.parse(content);
        } catch (e) {
            console.error('Erreur de parsing Markdown:', e);
            processedContent = escapeHtml(content).replace(/\n/g, '<br>');
        }
    }
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="bi bi-${icon}"></i>
        </div>
        <div class="message-bubble">
            <div class="message-content">${processedContent}</div>
            <div class="message-time">${time}</div>
        </div>
    `;
    
    chatContainer.appendChild(messageDiv);
    
    // Appliquer la coloration syntaxique
    if (!isUser && typeof hljs !== 'undefined') {
        messageDiv.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }
    
    if (scroll) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// Afficher une alerte
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Event listeners
newChatBtn.addEventListener('click', createNewConversation);
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Auto-ajuster la hauteur du textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 150) + 'px';
});

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('✅ Assistant IA - Saint Louis Collège chargé');
    
    // Créer automatiquement une conversation par défaut
    await createNewConversation();
    
    // Attacher les listeners aux suggestions
    attachSuggestionListeners();
});
