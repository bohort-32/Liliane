// Configuration
let config = {
    ollamaUrl: 'http://localhost:11434',
    model: 'llama2',
    temperature: 0.7,
    systemPrompt: "Tu es un assistant virtuel expert du BTS SIO (Services Informatiques aux Organisations) au lycée Saint-Louis de Châteaulin. Tu aides les élèves et leurs parents à comprendre la formation, les débouchés, les matières enseignées et les modalités d'inscription. Sois précis, bienveillant et professionnel."
};

// State
let currentChatId = null;
let chats = [];
let abortController = null;

// Elements
const welcomeScreen = document.getElementById('welcomeScreen');
const messagesArea = document.getElementById('messagesArea');
const messagesList = document.getElementById('messagesList');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const stopBtn = document.getElementById('stopBtn');
const newChatBtn = document.getElementById('newChatBtn');
const chatList = document.getElementById('chatList');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    loadChats();
    setupEventListeners();
    autoResizeTextarea();
});

// Load configuration from localStorage
function loadConfig() {
    const saved = localStorage.getItem('chatConfig');
    if (saved) {
        config = { ...config, ...JSON.parse(saved) };
        document.getElementById('ollamaUrl').value = config.ollamaUrl;
        document.getElementById('modelSelect').value = config.model;
        document.getElementById('temperatureSlider').value = config.temperature;
        document.getElementById('temperatureValue').textContent = config.temperature;
        document.getElementById('systemPrompt').value = config.systemPrompt;
    }
}

// Save configuration to localStorage
function saveConfig() {
    localStorage.setItem('chatConfig', JSON.stringify(config));
}

// Load chats from localStorage
function loadChats() {
    const saved = localStorage.getItem('chats');
    if (saved) {
        chats = JSON.parse(saved);
        renderChatList();
    }
}

// Save chats to localStorage
function saveChats() {
    localStorage.setItem('chats', JSON.stringify(chats));
}

// Setup event listeners
function setupEventListeners() {
    // Send message
    sendBtn.addEventListener('click', sendMessage);
    
    // Stop generation
    stopBtn.addEventListener('click', stopGeneration);
    
    // New chat
    newChatBtn.addEventListener('click', createNewChat);
    
    // Enter to send
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Suggestion cards
    document.querySelectorAll('.suggestion-card').forEach(card => {
        card.addEventListener('click', () => {
            const prompt = card.getAttribute('data-prompt');
            messageInput.value = prompt;
            sendMessage();
        });
    });
    
    // Settings
    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
        config.ollamaUrl = document.getElementById('ollamaUrl').value;
        config.model = document.getElementById('modelSelect').value;
        config.temperature = parseFloat(document.getElementById('temperatureSlider').value);
        config.systemPrompt = document.getElementById('systemPrompt').value;
        saveConfig();
        updateModelInfo();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
        modal.hide();
        
        showNotification('Paramètres sauvegardés', 'success');
    });
    
    document.getElementById('temperatureSlider').addEventListener('input', (e) => {
        document.getElementById('temperatureValue').textContent = e.target.value;
    });
    
    document.getElementById('testConnectionBtn').addEventListener('click', testConnection);
}

// Auto resize textarea
function autoResizeTextarea() {
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    });
}


// Test connection to Ollama
async function testConnection() {
    const btn = document.getElementById('testConnectionBtn');
    const status = document.getElementById('connectionStatus');
    
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Test en cours...';
    
    try {
        const response = await fetch(`${config.ollamaUrl}/api/tags`);
        if (response.ok) {
            const data = await response.json();
            status.innerHTML = `<div class="alert alert-success alert-custom">
                <i class="bi bi-check-circle-fill"></i> Connexion réussie ! 
                ${data.models.length} modèle(s) disponible(s)
            </div>`;
        } else {
            throw new Error('Erreur de connexion');
        }
    } catch (error) {
        status.innerHTML = `<div class="alert alert-danger alert-custom">
            <i class="bi bi-exclamation-triangle-fill"></i> Connexion échouée. 
            Vérifiez que Ollama est lancé.
        </div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-wifi"></i> Tester la connexion';
    }
}

// Create new chat
function createNewChat() {
    const chat = {
        id: Date.now(),
        title: 'Nouvelle conversation',
        messages: [],
        createdAt: new Date().toISOString()
    };
    
    chats.unshift(chat);
    saveChats();
    renderChatList();
    loadChat(chat.id);
}

// Load chat
function loadChat(chatId) {
    currentChatId = chatId;
    const chat = chats.find(c => c.id === chatId);
    
    if (!chat) return;
    
    welcomeScreen.style.display = 'none';
    messagesArea.style.display = 'block';
    
    messagesList.innerHTML = '';
    chat.messages.forEach(msg => {
        appendMessage(msg.role, msg.content, false);
    });
    
    // Update active state
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-chat-id="${chatId}"]`)?.classList.add('active');
    
    scrollToBottom();
}

// Render chat list
function renderChatList() {
    chatList.innerHTML = '';
    
    chats.forEach(chat => {
        const div = document.createElement('div');
        div.className = 'chat-item';
        div.setAttribute('data-chat-id', chat.id);
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <div class="chat-item-title">${chat.title}</div>
                    <div class="chat-item-date">${formatDate(chat.createdAt)}</div>
                </div>
                <button class="btn btn-sm btn-link text-danger delete-chat" data-chat-id="${chat.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        
        div.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-chat')) {
                loadChat(chat.id);
            }
        });
        
        div.querySelector('.delete-chat').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
        });
        
        chatList.appendChild(div);
    });
}

// Delete chat
function deleteChat(chatId) {
    if (confirm('Voulez-vous vraiment supprimer cette conversation ?')) {
        chats = chats.filter(c => c.id !== chatId);
        saveChats();
        renderChatList();
        
        if (currentChatId === chatId) {
            currentChatId = null;
            welcomeScreen.style.display = 'flex';
            messagesArea.style.display = 'none';
        }
    }
}

// Send message
async function sendMessage() {
    const content = messageInput.value.trim();
    if (!content) return;
    
    // Create chat if doesn't exist
    if (!currentChatId) {
        createNewChat();
    }
    
    const chat = chats.find(c => c.id === currentChatId);
    if (!chat) return;
    
    // Add user message
    chat.messages.push({
        role: 'user',
        content: content
    });
    
    // Update chat title if first message
    if (chat.messages.length === 1) {
        chat.title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
        renderChatList();
    }
    
    appendMessage('user', content);
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    saveChats();
    
    // Show typing indicator
    showTypingIndicator();
    
    // Disable input
    messageInput.disabled = true;
    sendBtn.style.display = 'none';
    stopBtn.style.display = 'inline-block';
    
    try {
        await generateResponse(chat);
    } catch (error) {
        console.error('Error:', error);
        hideTypingIndicator();
        appendMessage('assistant', '❌ Erreur: Impossible de se connecter à Ollama. Vérifiez que le serveur est lancé.');
    } finally {
        messageInput.disabled = false;
        sendBtn.style.display = 'inline-block';
        stopBtn.style.display = 'none';
    }
}

// Generate response from Ollama
async function generateResponse(chat) {
    abortController = new AbortController();
    
    // Prepare messages with system prompt
    const messages = [
        {
            role: 'system',
            content: config.systemPrompt
        },
        ...chat.messages
    ];
    
    try {
        const response = await fetch(`${config.ollamaUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: config.model,
                messages: messages,
                stream: true,
                options: {
                    temperature: config.temperature
                }
            }),
            signal: abortController.signal
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        hideTypingIndicator();
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = '';
        let messageElement = null;
        
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                try {
                    const json = JSON.parse(line);
                    if (json.message?.content) {
                        assistantMessage += json.message.content;
                        
                        if (!messageElement) {
                            messageElement = appendMessage('assistant', assistantMessage, true);
                        } else {
                            updateMessage(messageElement, assistantMessage);
                        }
                        
                        scrollToBottom();
                    }
                } catch (e) {
                    console.error('Error parsing JSON:', e);
                }
            }
        }
        
        // Save assistant message
        chat.messages.push({
            role: 'assistant',
            content: assistantMessage
        });
        
        saveChats();
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Generation stopped by user');
        } else {
            throw error;
        }
    }
}

// Stop generation
function stopGeneration() {
    if (abortController) {
        abortController.abort();
        hideTypingIndicator();
        messageInput.disabled = false;
        sendBtn.style.display = 'inline-block';
        stopBtn.style.display = 'none';
    }
}

// Append message to chat
function appendMessage(role, content, isStreaming = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <div class="message-avatar ${role}-avatar">
                ${role === 'user' ? '<i class="bi bi-person-fill"></i>' : '<i class="bi bi-robot"></i>'}
            </div>
            <span class="message-name">${role === 'user' ? 'Vous' : 'Assistant BTS SIO'}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">
            ${role === 'assistant' ? marked.parse(content) : escapeHtml(content)}
        </div>
        ${role === 'assistant' && !isStreaming ? `
            <div class="message-actions">
                <button onclick="copyMessage(this)" title="Copier">
                    <i class="bi bi-clipboard"></i>
                </button>
                <button onclick="regenerateMessage(this)" title="Régénérer">
                    <i class="bi bi-arrow-clockwise"></i>
                </button>
            </div>
        ` : ''}
    `;
    
    messagesList.appendChild(messageDiv);
    scrollToBottom();
    
    return messageDiv;
}

// Update message content (for streaming)
function updateMessage(messageElement, content) {
    const contentDiv = messageElement.querySelector('.message-content');
    contentDiv.innerHTML = marked.parse(content);
    scrollToBottom();
}

// Show typing indicator
function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'message assistant-message';
    indicator.innerHTML = `
        <div class="message-header">
            <div class="message-avatar assistant-avatar">
                <i class="bi bi-robot"></i>
            </div>
            <span class="message-name">Assistant BTS SIO</span>
        </div>
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    messagesList.appendChild(indicator);
    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// Copy message to clipboard
function copyMessage(button) {
    const content = button.closest('.message').querySelector('.message-content').textContent;
    navigator.clipboard.writeText(content).then(() => {
        showNotification('Message copié !', 'success');
    });
}

// Regenerate message
function regenerateMessage(button) {
    // TODO: Implement regeneration logic
    showNotification('Fonctionnalité à venir', 'info');
}

// Scroll to bottom
function scrollToBottom() {
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
        return "Aujourd'hui";
    } else if (days === 1) {
        return "Hier";
    } else if (days < 7) {
        return `Il y a ${days} jours`;
    } else {
        return date.toLocaleDateString('fr-FR');
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show notification
function showNotification(message, type = 'info') {
    // Simple alert for now - you can implement a better notification system
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-custom position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}
