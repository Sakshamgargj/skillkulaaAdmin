$(document).ready(function () {

    const unreadMessageCounts = {};
    const lastMessageTimes = {};
    let activeUserId = null;

    // Initialize Socket.IO connection
    const socket = io();

    const $chatList = $('#chat-list');
    const $chatMessages = $('#chatMessages');
    const $chatForm = $('#chatForm');
    const $messageInput = $('#messageInput');

    // Authenticate admin with the server
    socket.emit('admin-authenticate');

    // Fetch unread message counts and last message times when connection is established
    socket.on('connect', function() {
        socket.emit('get-unread-message-counts');
    });

    // Handle received unread message counts and last message times
    socket.on('unread-message-counts-and-times', function(data) {
        Object.keys(data).forEach(userId => {
            unreadMessageCounts[userId] = data[userId].unreadCount;
            lastMessageTimes[userId] = new Date(data[userId].lastMessageTime);
        });
        updateUnreadCounts();
        sortUserList();
    });

    // Update unread counts in the user list
    function updateUnreadCounts() {
        $chatList.find('.chat-contact-list-item').each(function() {
            const $item = $(this);
            const userId = $item.find('input[name="userId"]').val();
            const unreadCount = unreadMessageCounts[userId] || 0;
            
            const $badge = $item.find('.badge');
            if (unreadCount > 0) {
                if ($badge.length === 0) {
                    const $newBadge = $('<span class="badge bg-label-primary rounded-pill fw-bolder"></span>');
                    $item.find('.d-flex.justify-content-between.align-items-center').append($newBadge);
                }
                $item.find('.badge').text(unreadCount).show();
            } else {
                $badge.hide();
            }
        });
    }

    // Sort user list by last message time
    function sortUserList() {
        const $users = $chatList.children('.chat-contact-list-item').get();
        $users.sort((a, b) => {
            const aId = $(a).find('input[name="userId"]').val();
            const bId = $(b).find('input[name="userId"]').val();
            const aTime = lastMessageTimes[aId] || new Date(0);
            const bTime = lastMessageTimes[bId] || new Date(0);
            return bTime - aTime;
        });
        $chatList.append($users);
    }

    // Function to select the appropriate user when the page loads
    function selectInitialUser() {
        // console.log("Selecting initial user");
        const lastSelectedUserId = localStorage.getItem('lastSelectedUserId');
        let $userToSelect;

        if (lastSelectedUserId) {
            $userToSelect = $chatList.find(`.chat-contact-list-item input[name="userId"][value="${lastSelectedUserId}"]`).closest('.chat-contact-list-item');
        }

        if (!$userToSelect || $userToSelect.length === 0) {
            $userToSelect = $chatList.find('.chat-contact-list-item:first');
        }

        if ($userToSelect.length) {
            selectUser($userToSelect);
        }
    }

    // Call selectInitialUser when the page loads
    $(window).on('load', function() {
        // console.log("Window loaded");
        selectInitialUser();
    });

    // select user from chat list
    function selectUser($userElement) {
        // console.log("Selecting user");
        $('.chat-contact-list-item').removeClass('active');
        $userElement.addClass('active');

        const $avatarContainer = $userElement.find('.avatar');
        const userName = $userElement.find('.chat-contact-name').text();
        const userEmail = $userElement.find('.chat-contact-status').text();

        // Update header with selected user information
        const $selectedUserAvatar = $('#selectedUserAvatar');
        const $selectedUserAvatarInitial = $('#selectedUserAvatarInitial');
        const $selectedUserName = $('#selectedUserName');
        const $selectedUserEmail = $('#selectedUserEmail');
        
        if ($avatarContainer.find('img').length) {
            const avatarSrc = $avatarContainer.find('img').attr('src');
            $selectedUserAvatar.attr('src', avatarSrc).show();
            $selectedUserAvatarInitial.hide();
        } else {
            const initials = $avatarContainer.find('.avatar-initial').text();
            $selectedUserAvatar.hide();
            $selectedUserAvatarInitial.text(initials).show();
        }

        $selectedUserName.text(userName);
        $selectedUserEmail.text(userEmail);

        const userId = $userElement.find('input[name="userId"]').val();

        activeUserId = userId;
        $('#receiver-user-id').val(userId);

        // Store the selected user ID in localStorage
        localStorage.setItem('lastSelectedUserId', userId);

        // Mark messages as read when selecting a user
        socket.emit('mark-messages-read', userId);
        
        // Inform server that admin has selected this user
        socket.emit('admin-select-user', userId);

        // Reset unread count for this user
        unreadMessageCounts[userId] = 0;
        updateUnreadCounts();

        fetchMessages(userId);
    }

    // fetch message from database when user is selected
    function fetchMessages(userId) {
        $.ajax({
            url: `/get-user-messages?userId=${userId}`,
            method: 'GET',
            success: function (messages) {
                $chatMessages.empty();
                if (messages.length > 0) {
                    addMessagesToChat(messages);
                    toggleNoMessageFound(false);
                    scrollToBottom(); // Scroll to bottom after adding messages
                } else {
                    toggleNoMessageFound(true);
                }
            },
            error: function (error) {
                console.error('Error fetching messages:', error);
            }
        })
    }
    
    // Add this new function to check for the first message
    function toggleNoMessageFound(show) {
        const $noMessageFound = $('#noMessageFound');
        if (show) {
            $noMessageFound.removeClass('d-none');
        } else {
            $noMessageFound.addClass('d-none');
        }
    }

    // Event delegation for user selection
    $chatList.on('click', '.chat-contact-list-item', function() {
        selectUser($(this));
    });

    const $sendMessageBtn = $('#sendMessageBtn');
    const $receiverUserId = $('#receiver-user-id');

    // send message to user
    $sendMessageBtn.on('click', function (e) {
        e.preventDefault();
        sendMessage();
    });

    // submit message to user
    $chatForm.on('submit', function (e) {
        e.preventDefault();
    });

    // submit message to user when enter key is pressed
    $messageInput.on('keypress', function (e) {
        if (e.which === 13) {
            e.preventDefault();
            sendMessage();
        }
    });

    // send message to user
    async function sendMessage() {
        const content = $messageInput.val().trim();
        const userId = $receiverUserId.val();
        const adminId = $chatForm.find('input[name="adminId"]').val();

        if (!content || !userId || !adminId) return;

        try {
            // Emit the message to the server using Socket.IO
            socket.emit('admin-send-message', { content, userId, adminId });

            // Clear the input field
            $messageInput.val('');

            // Hide the "No message found" section
            toggleNoMessageFound(false);

        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    // receive send message from admin to user
    socket.on('message-sent', (message) => {
        // console.log("Message sent:", message);
        addMessagesToChat([message]);
    });

    // Update last message time when admin sends a message
    socket.on('update-last-message-time', ({ userId, lastMessageTime }) => {
        lastMessageTimes[userId] = new Date(lastMessageTime);
        sortUserList();
    });

    // receive new message from user
    socket.on('new-message', (message) => {
        // console.log("New message received:", message);
        if (message.senderId === activeUserId) {
            toggleNoMessageFound(false);
            addMessagesToChat([message]);
        } else {
            // Only increment unread count if the message is from a user
            // and it's not the currently active chat
            if (!message.isAdmin && message.senderId !== activeUserId) {
                unreadMessageCounts[message.senderId] = (unreadMessageCounts[message.senderId] || 0) + 1;
                updateUnreadCounts();
            }
        }
        lastMessageTimes[message.senderId] = new Date(message.timestamp);
        sortUserList();
    });

    // add messages to chat
    function addMessagesToChat(messages) {
        // console.log("Adding messages to chat:", messages.length);
        messages.forEach(message => {
            const isCurrentUser = message.senderId === '<%= locals.user._id %>' || message.isAdmin;
            const messageHtml = `
                <li class="chat-message ${isCurrentUser ? 'chat-message-right' : ''}">
                    <div class="d-flex overflow-hidden">
                        ${!isCurrentUser ? `
                        <div class="user-avatar flex-shrink-0 me-4">
                            <div class="avatar avatar-sm">
                                ${message.senderAvatar ? `<img src="${message.senderAvatar}" alt="Avatar" class="rounded-circle">` : `<span class="avatar-initial rounded-circle bg-label-primary">${message.senderName.charAt(0).toUpperCase()}</span>`}
                            </div>
                        </div>
                        ` : ''}
                        <div class="chat-message-wrapper flex-grow-1">
                            <div class="chat-message-text">
                                <p class="mb-0">${message.content}</p>
                            </div>
                            <div class="text-${isCurrentUser ? 'end' : 'start'} text-muted mt-1">
                                <small>${formatTime(message.timestamp)}</small>
                            </div>
                        </div>
                        ${isCurrentUser ? `
                        <div class="user-avatar flex-shrink-0 ms-4">
                            <div class="avatar avatar-sm">
                                ${message.senderAvatar ? `<img src="${message.senderAvatar}" alt="Avatar" class="rounded-circle">` : `<span class="avatar-initial rounded-circle bg-label-primary">${message.senderName.charAt(0).toUpperCase()}</span>`}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </li>
            `;
            $chatMessages.append(messageHtml);
        });
        setTimeout(scrollToBottom, 100); // Delay scroll to ensure messages are rendered
    }

    // format time
    function formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('en-US', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    // scroll to bottom of chat
    function scrollToBottom() {
        // console.log("Attempting to scroll to bottom");
        const $chatContainer = $chatMessages.parent();
        $chatContainer.animate({ scrollTop: $chatMessages[0].scrollHeight }, 'fast', function() {
            // console.log("Scroll animation completed");
        });
    }

    // update unread message count and last message time
    socket.on('update-unread-count', ({ userId, count, lastMessageTime }) => {
        if (userId !== activeUserId) {
            unreadMessageCounts[userId] = count;
            updateUnreadCounts();
        }
        if (lastMessageTime) {
            lastMessageTimes[userId] = new Date(lastMessageTime);
            sortUserList();
        }
    });

});







