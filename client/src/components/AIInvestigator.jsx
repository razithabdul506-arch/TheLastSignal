import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../api';

export default function AIInvestigator({ participantName, onGuiltUpdate }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await chatAPI.getHistory();
        const userMessages = response.data.filter(m => m.role === 'user' || m.role === 'assistant');
        setMessages(userMessages);
      } catch (err) {
        console.error('Error loading chat history:', err);
      }
    };

    loadHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', message: userMessage }]);
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage(userMessage);

      setMessages(prev => [...prev, {
        role: 'assistant',
        message: response.data.response
      }]);

      if (response.data.updatedGuilt !== undefined) {
        onGuiltUpdate(response.data.updatedGuilt);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        message: 'Error processing message. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-investigator">
      <div className="ai-header">
        <h3>🔍 AI INVESTIGATOR</h3>
        <p className="ai-subtitle">Ask anything about the investigation</p>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="initial-message">
            <p>Welcome to the investigation, {participantName}.</p>
            <p>I am here to evaluate your defense and guide your investigation.</p>
            <p>Ask me about the evidence, the timeline, or your theories.</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <span className="role-icon">
              {msg.role === 'user' ? '👤' : '🔍'}
            </span>
            <span className="message-text">{msg.message}</span>
          </div>
        ))}

        {loading && (
          <div className="message assistant typing">
            <span className="role-icon">🔍</span>
            <span className="typing-indicator">
              <span></span><span></span><span></span>
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about evidence, timeline, or theory..."
          disabled={loading}
          className="chat-input"
        />
        <button type="submit" disabled={loading} className="send-button">
          Send
        </button>
      </form>
    </div>
  );
}
