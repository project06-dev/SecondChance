// ============================================
// FIREBASE REALTIME CHAT MODULE
// ============================================
// Real-time chat implementation using Firebase Realtime Database

import { getDatabase, ref, push, set, onValue, update, serverTimestamp, onDisconnect, get, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

class FirebaseChat {
    constructor(auth, db) {
        this.auth = auth;
        this.rtdb = getDatabase();
        this.currentUserId = null;
        this.currentChatId = null;
        this.messageListeners = {};
        this.chatListListeners = {};
        this.onlineStatusRef = null;
        this.typingTimeouts = {};
    }

    // Initialize chat system
    async initialize(userId) {
        this.currentUserId = userId;
        await this.setupOnlineStatus();
        this.setupDisconnectHandler();
    }

    // Setup online/offline status
    async setupOnlineStatus() {
        if (!this.currentUserId) return;

        const userStatusRef = ref(this.rtdb, `users/${this.currentUserId}/status`);
        const connectedRef = ref(this.rtdb, '.info/connected');

        onValue(connectedRef, (snapshot) => {
            if (snapshot.val() === true) {
                // User is online
                set(userStatusRef, {
                    online: true,
                    lastSeen: serverTimestamp()
                });

                // When user disconnects, update status
                onDisconnect(userStatusRef).set({
                    online: false,
                    lastSeen: serverTimestamp()
                });
            }
        });

        this.onlineStatusRef = userStatusRef;
    }

    // Setup disconnect handler
    setupDisconnectHandler() {
        window.addEventListener('beforeunload', () => {
            if (this.onlineStatusRef) {
                set(this.onlineStatusRef, {
                    online: false,
                    lastSeen: serverTimestamp()
                });
            }
        });
    }

    // Generate chat ID from two user IDs
    generateChatId(userId1, userId2) {
        // Sort IDs to ensure consistent chat ID regardless of who initiates
        const ids = [userId1, userId2].sort();
        return `${ids[0]}_${ids[1]}`;
    }

    // Create or get existing chat
    async createOrGetChat(sellerId, sellerName, productName = null) {
        if (!this.currentUserId) {
            console.error('User not logged in');
            return null;
        }

        const chatId = this.generateChatId(this.currentUserId, sellerId);
        const chatRef = ref(this.rtdb, `chats/${chatId}`);

        // Check if chat exists
        const snapshot = await get(chatRef);
        
        if (!snapshot.exists()) {
            // Create new chat
            const chatData = {
                participants: {
                    [this.currentUserId]: true,
                    [sellerId]: true
                },
                metadata: {
                    createdAt: serverTimestamp(),
                    lastMessage: productName ? `Halo, saya tertarik dengan "${productName}"` : 'Chat dimulai',
                    lastMessageTime: serverTimestamp(),
                    lastMessageSender: this.currentUserId,
                    sellerName: sellerName
                },
                unreadCount: {
                    [this.currentUserId]: 0,
                    [sellerId]: 1
                }
            };

            await set(chatRef, chatData);

            // Send initial message if product name provided
            if (productName) {
                await this.sendMessage(chatId, `Halo, saya tertarik dengan "${productName}". Apakah masih tersedia?`);
            }
        }

        return chatId;
    }

    // Send message
    async sendMessage(chatId, messageText, senderName = 'User') {
        if (!this.currentUserId || !messageText.trim()) return;

        const messagesRef = ref(this.rtdb, `chats/${chatId}/messages`);
        const newMessageRef = push(messagesRef);

        const messageData = {
            sender: this.currentUserId,
            senderName: senderName,
            text: messageText.trim(),
            timestamp: serverTimestamp(),
            read: false
        };

        await set(newMessageRef, messageData);

        // Update chat metadata
        const metadataRef = ref(this.rtdb, `chats/${chatId}/metadata`);
        await update(metadataRef, {
            lastMessage: messageText.trim().substring(0, 50),
            lastMessageTime: serverTimestamp(),
            lastMessageSender: this.currentUserId
        });

        // Update unread count for other participant
        const participants = await this.getChatParticipants(chatId);
        const otherUserId = participants.find(id => id !== this.currentUserId);
        
        if (otherUserId) {
            const unreadRef = ref(this.rtdb, `chats/${chatId}/unreadCount/${otherUserId}`);
            const unreadSnapshot = await get(unreadRef);
            const currentUnread = unreadSnapshot.val() || 0;
            await set(unreadRef, currentUnread + 1);
        }

        // Clear typing indicator
        await this.setTypingStatus(chatId, false);
    }

    // Listen to messages in a chat
    listenToMessages(chatId, callback) {
        const messagesRef = ref(this.rtdb, `chats/${chatId}/messages`);
        const messagesQuery = query(messagesRef, orderByChild('timestamp'));

        const unsubscribe = onValue(messagesQuery, (snapshot) => {
            const messages = [];
            snapshot.forEach((childSnapshot) => {
                messages.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            callback(messages);
        });

        this.messageListeners[chatId] = unsubscribe;
        return unsubscribe;
    }

    // Stop listening to messages
    stopListeningToMessages(chatId) {
        if (this.messageListeners[chatId]) {
            this.messageListeners[chatId]();
            delete this.messageListeners[chatId];
        }
    }

    // Get chat participants
    async getChatParticipants(chatId) {
        const participantsRef = ref(this.rtdb, `chats/${chatId}/participants`);
        const snapshot = await get(participantsRef);
        
        if (snapshot.exists()) {
            return Object.keys(snapshot.val());
        }
        return [];
    }

    // Mark messages as read
    async markMessagesAsRead(chatId) {
        if (!this.currentUserId) return;

        const messagesRef = ref(this.rtdb, `chats/${chatId}/messages`);
        const snapshot = await get(messagesRef);

        if (snapshot.exists()) {
            const updates = {};
            snapshot.forEach((childSnapshot) => {
                const message = childSnapshot.val();
                if (message.sender !== this.currentUserId && !message.read) {
                    updates[`${childSnapshot.key}/read`] = true;
                }
            });

            if (Object.keys(updates).length > 0) {
                await update(messagesRef, updates);
            }
        }

        // Reset unread count
        const unreadRef = ref(this.rtdb, `chats/${chatId}/unreadCount/${this.currentUserId}`);
        await set(unreadRef, 0);
    }

    // Get user's chats
    async getUserChats() {
        if (!this.currentUserId) return [];

        const chatsRef = ref(this.rtdb, 'chats');
        const snapshot = await get(chatsRef);

        const userChats = [];
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const chatData = childSnapshot.val();
                if (chatData.participants && chatData.participants[this.currentUserId]) {
                    userChats.push({
                        chatId: childSnapshot.key,
                        ...chatData
                    });
                }
            });
        }

        // Sort by last message time
        userChats.sort((a, b) => {
            const timeA = a.metadata?.lastMessageTime || 0;
            const timeB = b.metadata?.lastMessageTime || 0;
            return timeB - timeA;
        });

        return userChats;
    }

    // Listen to user's chats
    listenToUserChats(callback) {
        if (!this.currentUserId) return;

        const chatsRef = ref(this.rtdb, 'chats');
        
        const unsubscribe = onValue(chatsRef, async (snapshot) => {
            const userChats = [];
            
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const chatData = childSnapshot.val();
                    if (chatData.participants && chatData.participants[this.currentUserId]) {
                        userChats.push({
                            chatId: childSnapshot.key,
                            ...chatData
                        });
                    }
                });
            }

            // Sort by last message time
            userChats.sort((a, b) => {
                const timeA = a.metadata?.lastMessageTime || 0;
                const timeB = b.metadata?.lastMessageTime || 0;
                return timeB - timeA;
            });

            callback(userChats);
        });

        this.chatListListeners['userChats'] = unsubscribe;
        return unsubscribe;
    }

    // Stop listening to user's chats
    stopListeningToUserChats() {
        if (this.chatListListeners['userChats']) {
            this.chatListListeners['userChats']();
            delete this.chatListListeners['userChats'];
        }
    }

    // Get total unread count
    async getTotalUnreadCount() {
        if (!this.currentUserId) return 0;

        const chatsRef = ref(this.rtdb, 'chats');
        const snapshot = await get(chatsRef);

        let totalUnread = 0;
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const chatData = childSnapshot.val();
                if (chatData.participants && chatData.participants[this.currentUserId]) {
                    const unread = chatData.unreadCount?.[this.currentUserId] || 0;
                    totalUnread += unread;
                }
            });
        }

        return totalUnread;
    }

    // Listen to total unread count
    listenToUnreadCount(callback) {
        if (!this.currentUserId) return;

        const chatsRef = ref(this.rtdb, 'chats');
        
        const unsubscribe = onValue(chatsRef, (snapshot) => {
            let totalUnread = 0;
            
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const chatData = childSnapshot.val();
                    if (chatData.participants && chatData.participants[this.currentUserId]) {
                        const unread = chatData.unreadCount?.[this.currentUserId] || 0;
                        totalUnread += unread;
                    }
                });
            }

            callback(totalUnread);
        });

        this.chatListListeners['unreadCount'] = unsubscribe;
        return unsubscribe;
    }

    // Check if user is online
    async isUserOnline(userId) {
        const statusRef = ref(this.rtdb, `users/${userId}/status`);
        const snapshot = await get(statusRef);
        
        if (snapshot.exists()) {
            return snapshot.val().online || false;
        }
        return false;
    }

    // Listen to user online status
    listenToUserStatus(userId, callback) {
        const statusRef = ref(this.rtdb, `users/${userId}/status`);
        
        return onValue(statusRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val());
            } else {
                callback({ online: false, lastSeen: null });
            }
        });
    }

    // Set typing status
    async setTypingStatus(chatId, isTyping) {
        if (!this.currentUserId) return;

        const typingRef = ref(this.rtdb, `chats/${chatId}/typing/${this.currentUserId}`);
        
        if (isTyping) {
            await set(typingRef, {
                typing: true,
                timestamp: serverTimestamp()
            });

            // Auto-clear typing after 3 seconds
            if (this.typingTimeouts[chatId]) {
                clearTimeout(this.typingTimeouts[chatId]);
            }

            this.typingTimeouts[chatId] = setTimeout(async () => {
                await set(typingRef, {
                    typing: false,
                    timestamp: serverTimestamp()
                });
            }, 3000);
        } else {
            await set(typingRef, {
                typing: false,
                timestamp: serverTimestamp()
            });
        }
    }

    // Listen to typing status
    listenToTypingStatus(chatId, callback) {
        const typingRef = ref(this.rtdb, `chats/${chatId}/typing`);
        
        return onValue(typingRef, (snapshot) => {
            if (snapshot.exists()) {
                const typingData = snapshot.val();
                // Check if any other user is typing
                const otherUserTyping = Object.entries(typingData).find(
                    ([userId, data]) => userId !== this.currentUserId && data.typing
                );
                callback(!!otherUserTyping);
            } else {
                callback(false);
            }
        });
    }

    // Get other participant info
    async getOtherParticipant(chatId) {
        const participants = await this.getChatParticipants(chatId);
        const otherUserId = participants.find(id => id !== this.currentUserId);
        
        if (!otherUserId) return null;

        // Get user info from Firestore or use seller name from metadata
        const chatRef = ref(this.rtdb, `chats/${chatId}/metadata`);
        const snapshot = await get(chatRef);
        
        if (snapshot.exists()) {
            const metadata = snapshot.val();
            return {
                userId: otherUserId,
                name: metadata.sellerName || 'Unknown User'
            };
        }

        return {
            userId: otherUserId,
            name: 'Unknown User'
        };
    }

    // Cleanup all listeners
    cleanup() {
        // Stop all message listeners
        Object.keys(this.messageListeners).forEach(chatId => {
            this.stopListeningToMessages(chatId);
        });

        // Stop all chat list listeners
        Object.keys(this.chatListListeners).forEach(key => {
            if (this.chatListListeners[key]) {
                this.chatListListeners[key]();
            }
        });

        // Clear typing timeouts
        Object.values(this.typingTimeouts).forEach(timeout => {
            clearTimeout(timeout);
        });

        this.messageListeners = {};
        this.chatListListeners = {};
        this.typingTimeouts = {};
    }
}

// Export for use in dashboard
window.FirebaseChat = FirebaseChat;
