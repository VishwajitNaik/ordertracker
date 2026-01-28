import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useSocketStore } from '../../store/socketStore';

interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  message: string;
  username?: string;
  timestamp?: string;
  createdAt?: string;
}

export default function ChatComponent() {
  const { user } = useAuthStore();
  const { connect, sendMessage } = useSocketStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [otherUserId, setOtherUserId] = useState(''); // For demo, you might get this from route params

  // Connect on component mount
  useEffect(() => {
    if (user?._id) {
      connect(user._id);
    }
  }, [user?._id]);

  // Listen for incoming messages
  useEffect(() => {
    const socket = useSocketStore.getState().socket;

    const handleReceiveMessage = (messageData: Message) => {
      console.log('📨 Frontend: Received message:', messageData);
      setMessages(prev => [...prev, messageData]);
    };

    socket?.on('receiveMessage', handleReceiveMessage);

    return () => {
      socket?.off('receiveMessage', handleReceiveMessage);
    };
  }, []);

  // Fetch existing messages on mount (replace with actual user IDs)
  useEffect(() => {
    if (user?._id && otherUserId) {
      fetch(`http://localhost:3000/api/messages/direct/${user._id}/${otherUserId}`)
        .then(res => res.json())
        .then(setMessages)
        .catch(err => console.error('Failed to load messages:', err));
    }
  }, [user?._id, otherUserId]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !user || !otherUserId) return;

    sendMessage(
      user._id,
      otherUserId,
      messageInput.trim(),
      user.username
    );

    setMessageInput('');
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageBubble,
      item.senderId === user?._id ? styles.ownMessage : styles.otherMessage
    ]}>
      <Text style={styles.messageText}>
        {item.message}
      </Text>
      <Text style={styles.messageTime}>
        {new Date(item.timestamp || item.createdAt || '').toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Direct Messages</Text>

      {/* For demo: Input for other user ID */}
      <TextInput
        style={styles.userIdInput}
        placeholder="Enter other user ID"
        value={otherUserId}
        onChangeText={setOtherUserId}
      />

      <FlatList
        data={messages}
        keyExtractor={(item) => item._id || item.timestamp || Math.random().toString()}
        renderItem={renderMessage}
        style={styles.messagesList}
        inverted={false}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          value={messageInput}
          onChangeText={setMessageInput}
          placeholder="Type a message..."
          onSubmitEditing={handleSendMessage}
        />
        <Button
          title="Send"
          onPress={handleSendMessage}
          disabled={!messageInput.trim()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  userIdInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
  messagesList: {
    flex: 1,
    marginBottom: 20,
  },
  messageBubble: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    maxWidth: '80%',
  },
  ownMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
  },
  messageTime: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
});
