import { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import "./Chatbot.css";

const API_URL = "https://jcs-server-1.onrender.com/api/chat";

const WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "Welcome to JCS Global! I'm your AI assistant. I can help you explore products, understand B2B purchasing, track orders, learn about merchant services, or answer general questions. What would you like to know?",
  time: new Date(),
};

const SUGGESTIONS = [
  "How does JCS Global work?",
  "Explain MOQ and bulk orders",
  "How can I become a merchant?",
  "Tell me about cloud computing",
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    const handleOpenChat = (event) => {
      setOpen(true);

      const question = event.detail?.question;
      if (question) {
        sendQuestion(question);
      }
    };

    window.addEventListener("open_chatbot", handleOpenChat);

    return () => {
      window.removeEventListener("open_chatbot", handleOpenChat);
    };
  }, []);

  const sendQuestion = async (question) => {
    const text = question.trim();

    if (!text || loading) return;

    setError("");
    setInput("");
    setLoading(true);

    const userMessage = {
      role: "user",
      content: text,
      time: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          history: updatedMessages
            .slice(-12)
            .map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok) {
        throw new Error(
          response.status === 429
            ? "Too many requests. Please wait a moment and try again."
            : response.status === 503
              ? "The AI assistant is temporarily unavailable. Please try again shortly."
              : "I couldn't get a response. Please try again."
        );
      }

      const data = await response.json();

      if (!data.reply || typeof data.reply !== "string") {
        throw new Error("The assistant returned an empty response.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.reply,
          time: new Date(),
        },
      ]);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Unable to connect to the assistant. Check your internet connection and backend deployment."
          : err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendQuestion(input);
  };

  const resetChat = () => {
    if (loading) return;
    setMessages([
      { ...WELCOME_MESSAGE, time: new Date() },
    ]);
    setError("");
  };

  const formatTime = (time) => {
    return new Date(time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {!open && (
        <button
          className="chatbot-launcher"
          onClick={() => setOpen(true)}
          aria-label="Open JCS Global AI Assistant"
        >
          <MessageCircle size={25} />
        </button>
      )}

      {open && (
        <section
          className="chatbot-window"
          aria-label="JCS Global AI Assistant"
        >
          <header className="chatbot-header">
            <div className="chatbot-brand">
              <div className="chatbot-avatar">
                <Bot size={23} />
              </div>

              <div className="chatbot-brand-text">
                <strong>JCS Global Assistant</strong>
                <span>AI-powered support</span>
              </div>
            </div>

            <div className="chatbot-header-actions">
              <button
                type="button"
                onClick={resetChat}
                disabled={loading}
                aria-label="Start a new conversation"
                title="New conversation"
              >
                <RotateCcw size={17} />
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Minimize chatbot"
                title="Minimize"
              >
                <ChevronDown size={22} />
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chatbot"
                title="Close"
              >
                <X size={19} />
              </button>
            </div>
          </header>

          <div className="chatbot-intro">
            <div className="chatbot-intro-icon">
              <Sparkles size={15} />
            </div>
            <div>
              <strong>How can I help you?</strong>
              <p>Ask about JCS Global or any general topic.</p>
            </div>
          </div>

          <main className="chatbot-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div
                key={`${index}-${message.role}`}
                className={`chatbot-message-row ${
                  message.role === "user" ? "is-user" : "is-assistant"
                }`}
              >
                <div className="chatbot-message-avatar">
                  {message.role === "user" ? (
                    <User size={16} />
                  ) : (
                    <Bot size={17} />
                  )}
                </div>

                <div className="chatbot-message-content">
                  <div className="chatbot-message-label">
                    {message.role === "user" ? "You" : "JCS Assistant"}
                  </div>

                  <div className="chatbot-bubble">
                    {message.content}
                  </div>

                  <time className="chatbot-message-time">
                    {formatTime(message.time)}
                  </time>
                </div>
              </div>
            ))}

            {messages.length === 1 && !loading && (
              <div className="chatbot-suggestions">
                <span>TRY ASKING</span>
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    onClick={() => sendQuestion(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="chatbot-message-row is-assistant">
                <div className="chatbot-message-avatar">
                  <Bot size={17} />
                </div>
                <div className="chatbot-message-content">
                  <div className="chatbot-message-label">
                    JCS Assistant
                  </div>
                  <div className="chatbot-bubble chatbot-typing">
                    <span />
                    <span />
                    <span />
                    <small>Preparing your answer...</small>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="chatbot-error" role="alert">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() =>
                    sendQuestion(
                      messages.filter((m) => m.role === "user").at(-1)
                        ?.content || ""
                    )
                  }
                  disabled={loading}
                >
                  Try again
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </main>

          <form className="chatbot-composer" onSubmit={handleSubmit}>
            <div className="chatbot-input-wrap">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask anything..."
                aria-label="Your message"
                maxLength={2000}
                disabled={loading}
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>

            <p className="chatbot-disclaimer">
              AI can make mistakes. Verify important information.
            </p>
          </form>
        </section>
      )}
    </>
  );
}