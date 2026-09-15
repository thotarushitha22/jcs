import { useState } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import "./Chatbot.css";

function getBotReply(message) {
  const text = message.toLowerCase();

  if (text.includes("hello") || text.includes("hi")) {
    return "Hello! 👋 Welcome to JCS Global. How can I help you?";
  }

  if (text.includes("moq")) {
    return "MOQ means Minimum Order Quantity. It is the minimum number of units you need to purchase for a product.";
  }

  if (text.includes("merchant") || text.includes("sell")) {
    return "You can become a JCS Global merchant by registering and accessing the Merchant Dashboard, where you can manage products, stock and orders.";
  }

  if (text.includes("gst")) {
    return "JCS Global is a B2B marketplace designed for GST-related business purchasing. GST details may vary by product and order.";
  }

  if (text.includes("order")) {
    return "You can check your orders from My Account → My Orders. Select an order to view its details and status.";
  }

  if (text.includes("cart")) {
    return "You can add products to your cart and review quantities before proceeding to checkout.";
  }

  if (
    text.includes("smartphone") ||
    text.includes("phone") ||
    text.includes("laptop") ||
    text.includes("tv")
  ) {
    return "You can browse Smartphones, Laptops, TVs and Accessories from the JCS Global marketplace. You can also use the search bar to find a specific product.";
  }

  if (text.includes("support") || text.includes("contact")) {
    return "For support, please use the Help & Support section of JCS Global.";
  }

  return "I'm the JCS Global Assistant. I can help with products, MOQ, GST, orders, cart, merchant accounts and website navigation. Try asking me one of these.";
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! 👋 I'm the JCS Global Assistant. How can I help you today?",
    },
  ]);

  const [input, setInput] = useState("");

  const sendMessage = () => {
    const text = input.trim();

    if (!text) return;

    const reply = getBotReply(text);

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: text,
      },
      {
        role: "assistant",
        content: reply,
      },
    ]);

    setInput("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <>
      {!open && (
        <button
          className="chatbot-button"
          onClick={() => setOpen(true)}
          aria-label="Open JCS Global Assistant"
        >
          <MessageCircle size={26} />
        </button>
      )}

      {open && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <div className="chatbot-avatar">
                <Bot size={20} />
              </div>

              <div>
                <strong>JCS Global Assistant</strong>
                <span>Online</span>
              </div>
            </div>

            <button
              className="chatbot-close"
              onClick={() => setOpen(false)}
              aria-label="Close chatbot"
            >
              <X size={20} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === "user"
                    ? "chat-message user-message"
                    : "chat-message bot-message"
                }
              >
                {message.content}
              </div>
            ))}
          </div>

          <form className="chatbot-input" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask JCS Assistant..."
            />

            <button type="submit" disabled={!input.trim()}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}