// ============================================
// DASHBOARD CHAT - FIREBASE INTEGRATION
// ============================================
// This file contains updated chat functions for Firebase Realtime Database

// Global variables
let firebaseChat = null;
let currentUserId = null;
let currentUserName = null;
let activeChatId = null;
let messageUnsubscribe = null;
let typingUnsubscribe = null;
let chatListUnsubscribe = null;
let unreadCountUnsubscribe = null;

// Initialize Firebase Chat
async function initializeFirebaseChat() {
    try {
        // Get current user from localStorage
        const userDataStr = localStorage.getItem('currentUser');
        if (!userDataStr) {
            console.log('No user logged in');
            return;
        }

        const userData = JSON.parse(userDataStr);
        
        // Check if guest mode
        if (userData.isGuest || localStorage.getItem('isGuest') === 'true') {
            console.log('Guest mode - using localStorage for chat');
            return;
        }

        currentUserId = userData.uid;
        currentUserName = userData.name || userData.username || 'User';

        // Initialize FirebaseChat
        if (window.FirebaseChat) {
            firebaseChat = new window.FirebaseChat(window.auth, window.db);
            await firebaseChat.initialize(currentUserId);
            
            console.log('✅ Firebase Chat initialized for user:', currentUserName);
            
            // Setup real-time listeners
            setupChatListeners();
        } else {
            console.error('FirebaseChat class not found');
        }
    } catch (error) {
        console.error('Error initializing Firebase Chat:', error);
    }
}

// Setup real-time listeners
function setupChatListeners() {
    if (!firebaseChat) return;

    // Listen to unread count
    unreadCountUnsubscribe = firebaseChat.listenToUnreadCount((count) => {
        updateChatCountUI(count);
    });

    // Listen to user's chats
    chatListUnsubscribe = firebaseChat.listenToUserChats((chats) => {
        renderFirebaseChatList(chats);
    });
}

// Update chat count UI
function updateChatCountUI(count) {
    const chatCountElement = document.querySelector('.chat-count');
    if (chatCountElement) {
        chatCountElement.textContent = count;
        chatCountElement.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Toggle Chat (Updated for Firebase)
async function toggleChatFirebase() {
    const chatSidebar = document.getElementById('chatSidebar');
    const overlay = document.getElementById('overlay');
    const cartSidebar = document.getElementById('cartSidebar');
    
    const isActive = chatSidebar.classList.toggle('active');
    
    if (isActive) {
        // Close cart if open
        cartSidebar.classList.remove('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Load chats
        if (firebaseChat) {
            // Chats will be loaded via listener
            console.log('Loading Firebase chats...');
        } else {
            // Fallback to localStorage
            loadChatsFromStorage();
            renderChatList();
        }
    } else {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset to list view
        backToChatList();
    }
}

// Render Firebase chat list
function renderFirebaseChatList(firebaseChats) {
    const chatListContainer = document.getElementById('chatListContainer');
    
    if (!firebaseChats || firebaseChats.length === 0) {
        chatListContainer.innerHTML = `
            <div class="empty-chat">
                <i class="fas fa-comments"></i>
                <h3>Belum Ada Percakapan</h3>
                <p>Mulai chat dengan penjual dari halaman produk</p>
            </div>
        `;
        return;
    }

    chatListContainer.innerHTML = '';

    firebaseChats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-list-item';
        
        // Get other participant info
        const otherUserId = Object.keys(chat.participants).find(id => id !== currentUserId);
        const sellerName = chat.metadata?.sellerName || 'Unknown';
        const lastMessage = chat.metadata?.lastMessage || 'Belum ada pesan';
        const unreadCount = chat.unreadCount?.[currentUserId] || 0;
        
        // Format timestamp
        let timeStr = '';
        if (chat.metadata?.lastMessageTime) {
            const date = new Date(chat.metadata.lastMessageTime);
            timeStr = date.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        chatItem.onclick = () => showFirebaseChatDetail(chat.chatId, sellerName);

        chatItem.innerHTML = `
            <div class="chat-list-avatar">
                ${sellerName.charAt(0).toUpperCase()}
            </div>
            <div class="chat-online-indicator" id="online-${otherUserId}" style="display: none;"></div>
            <div class="chat-list-info">
                <div class="chat-list-name">${sellerName}</div>
                <div class="chat-list-preview">${lastMessage}</div>
            </div>
            <div class="chat-list-meta">
                <div class="chat-list-time">${timeStr}</div>
                ${unreadCount > 0 ? `<div class="chat-unread-badge">${unreadCount}</div>` : ''}
            </div>
        `;

        chatListContainer.appendChild(chatItem);

        // Listen to online status
        if (firebaseChat && otherUserId) {
            firebaseChat.listenToUserStatus(otherUserId, (status) => {
                const indicator = document.getElementById(`online-${otherUserId}`);
                if (indicator) {
                    indicator.style.display = status.online ? 'block' : 'none';
                }
            });
        }
    });
}

// Show Firebase chat detail
async function showFirebaseChatDetail(chatId, sellerName) {
    if (!firebaseChat) {
        console.error('Firebase Chat not initialized');
        return;
    }

    activeChatId = chatId;
    
    // Update UI
    document.getElementById('chatHeaderTitle').innerHTML = sellerName;
    document.getElementById('chatBackBtn').style.display = 'flex';
    document.getElementById('chatListView').style.display = 'none';
    document.getElementById('chatDetailView').classList.add('active');

    // Get other participant
    const otherParticipant = await firebaseChat.getOtherParticipant(chatId);
    
    // Render chat detail header
    const chatDetailHeader = document.getElementById('chatDetailHeader');
    chatDetailHeader.innerHTML = `
        <div class="chat-detail-avatar">
            ${sellerName.charAt(0).toUpperCase()}
        </div>
        <div class="chat-detail-info">
            <div class="chat-detail-name">${sellerName}</div>
            <div class="chat-detail-status" id="status-${otherParticipant?.userId}">
                Memeriksa status...
            </div>
        </div>
    `;

    // Listen to online status
    if (otherParticipant) {
        firebaseChat.listenToUserStatus(otherParticipant.userId, (status) => {
            const statusElement = document.getElementById(`status-${otherParticipant.userId}`);
            if (statusElement) {
                if (status.online) {
                    statusElement.textContent = 'Online';
                    statusElement.classList.remove('offline');
                } else {
                    statusElement.textContent = 'Offline';
                    statusElement.classList.add('offline');
                }
            }
        });
    }

    // Stop previous message listener
    if (messageUnsubscribe) {
        messageUnsubscribe();
    }

    // Listen to messages
    messageUnsubscribe = firebaseChat.listenToMessages(chatId, (messages) => {
        renderFirebaseMessages(messages, sellerName);
    });

    // Listen to typing status
    if (typingUnsubscribe) {
        typingUnsubscribe();
    }

    typingUnsubscribe = firebaseChat.listenToTypingStatus(chatId, (isTyping) => {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            if (isTyping) {
                typingIndicator.classList.add('active');
            } else {
                typingIndicator.classList.remove('active');
            }
        }
    });

    // Mark messages as read
    await firebaseChat.markMessagesAsRead(chatId);

    // Focus input
    setTimeout(() => {
        document.getElementById('chatInput').focus();
    }, 300);
}

// Render Firebase messages
function renderFirebaseMessages(messages, sellerName) {
    const messagesContainer = document.getElementById('chatMessagesContainer');
    
    if (!messages || messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="empty-chat-messages">
                <i class="fas fa-comments"></i>
                <p>Mulai percakapan dengan penjual</p>
            </div>
        `;
        return;
    }

    messagesContainer.innerHTML = '';

    // Add typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;

    // Group messages by date
    let currentDate = '';
    
    messages.forEach((message) => {
        if (!message.timestamp) return;

        const messageDate = new Date(message.timestamp).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        // Add date divider if date changed
        if (messageDate !== currentDate) {
            currentDate = messageDate;
            const dateDivider = document.createElement('div');
            dateDivider.className = 'chat-date-divider';
            dateDivider.innerHTML = `<span>${messageDate}</span>`;
            messagesContainer.appendChild(dateDivider);
        }

        // Create message element
        const messageEl = document.createElement('div');
        const isCurrentUser = message.sender === currentUserId;
        messageEl.className = `chat-message ${isCurrentUser ? 'user' : 'seller'}`;
        
        const timeStr = new Date(message.timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const avatarLetter = isCurrentUser ? 
            (currentUserName?.charAt(0).toUpperCase() || 'U') : 
            sellerName.charAt(0).toUpperCase();
        
        messageEl.innerHTML = `
            <div class="chat-avatar">${avatarLetter}</div>
            <div class="chat-bubble">
                <div class="chat-text">${message.text}</div>
                <div class="chat-time">
                    ${timeStr}
                    ${isCurrentUser ? `<i class="fas fa-check-double chat-status-icon ${message.read ? 'read' : ''}"></i>` : ''}
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(messageEl);
    });

    // Add typing indicator at the end
    messagesContainer.appendChild(typingIndicator);

    // Auto scroll to bottom
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
}

// Send Firebase message
async function sendFirebaseChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message || !activeChatId || !firebaseChat) return;

    try {
        await firebaseChat.sendMessage(activeChatId, message, currentUserName);
        
        // Clear input
        input.value = '';
        input.style.height = '40px';
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Gagal mengirim pesan');
    }
}

// Open chat with seller (Updated for Firebase)
async function openChatWithSellerFirebase(sellerName, productName = null) {
    // Open chat sidebar if not already open
    const chatSidebar = document.getElementById('chatSidebar');
    const overlay = document.getElementById('overlay');
    
    if (!chatSidebar.classList.contains('active')) {
        chatSidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    if (!firebaseChat) {
        console.log('Firebase Chat not available, using localStorage');
        // Fallback to original function
        openChatWithSeller(sellerName, productName);
        return;
    }

    try {
        // Generate seller ID from name
        const sellerId = sellerName.replace(/\s+/g, '_').toLowerCase();
        
        // Create or get chat
        const chatId = await firebaseChat.createOrGetChat(sellerId, sellerName, productName);
        
        if (chatId) {
            // Show chat detail
            await showFirebaseChatDetail(chatId, sellerName);
        }
    } catch (error) {
        console.error('Error opening chat:', error);
        showNotification('Gagal membuka chat');
    }
}

// Handle chat input typing
let typingTimeout = null;
function handleFirebaseChatInput() {
    if (!firebaseChat || !activeChatId) return;

    // Set typing status
    firebaseChat.setTypingStatus(activeChatId, true);

    // Clear previous timeout
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }

    // Auto-clear typing after 1 second of no input
    typingTimeout = setTimeout(() => {
        firebaseChat.setTypingStatus(activeChatId, false);
    }, 1000);
}

// Handle Enter key press
function handleFirebaseChatKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendFirebaseChatMessage();
    }
}

// Back to chat list
function backToFirebaseChatList() {
    // Stop listeners
    if (messageUnsubscribe) {
        messageUnsubscribe();
        messageUnsubscribe = null;
    }

    if (typingUnsubscribe) {
        typingUnsubscribe();
        typingUnsubscribe = null;
    }

    activeChatId = null;

    // Update UI
    document.getElementById('chatHeaderTitle').innerHTML = '<i class="fas fa-comments"></i> Chat';
    document.getElementById('chatBackBtn').style.display = 'none';
    document.getElementById('chatListView').style.display = 'block';
    document.getElementById('chatDetailView').classList.remove('active');
    document.getElementById('quickReplies').style.display = 'none';
}

// Send quick reply
async function sendFirebaseQuickReply(message) {
    const input = document.getElementById('chatInput');
    input.value = message;
    await sendFirebaseChatMessage();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (firebaseChat) {
        firebaseChat.cleanup();
    }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebaseChat);
} else {
    initializeFirebaseChat();
}

console.log('✅ Dashboard Chat Firebase module loaded');
