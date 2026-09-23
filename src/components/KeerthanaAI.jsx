import { useState } from "react";
import {
  FaPaperPlane,
  FaRobot,
  FaPrayingHands,
  FaCross,
  FaHeart,
  
  FaMusic,
  FaSun,
  FaMoon,
  FaDove,
} from "react-icons/fa";

import { askKeerthanaAI } from "../services/aiApi";

import "../assets/css/keerthana-ai.css";

const categories = [
  {
    name: "Worship",
    icon: <FaPrayingHands />,
    prompt: "Play Christian worship songs",
  },
  {
    name: "Praise",
    icon: <FaCross />,
    prompt: "Play Christian praise songs",
  },
  {
    name: "Prayer",
    icon: <FaPrayingHands />,
    prompt: "Play peaceful Christian songs for prayer",
  },
  {
    name: "Christian Love",
    icon: <FaHeart />,
    prompt: "Recommend Christian songs about God's love",
  },
  {
    name: "Scripture",
   // icon: <FaBookBible />,
    prompt: "Play Christian scripture songs",
  },
  {
    name: "Morning Worship",
    icon: <FaSun />,
    prompt: "Play Christian morning worship songs",
  },
  {
    name: "Night Prayer",
    icon: <FaMoon />,
    prompt: "Play peaceful Christian songs for night prayer",
  },
  {
    name: "Instrumental",
    icon: <FaMusic />,
    prompt: "Play Christian instrumental worship music",
  },
  {
    name: "Peace",
    icon: <FaDove />,
    prompt: "Play peaceful Christian worship songs",
  },
];

const KeerthanaAI = ({ songs = [] }) => {
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        "Hi 👋 I'm Keerthana AI. ✝️\n\n" +
        "I can help you discover Christian music, worship songs, " +
        "praise songs, prayer music and scripture songs.\n\n" +
        "What would you like to listen to today?",
    },
  ]);

  const [loading, setLoading] = useState(false);

  const sendMessage = async (customMessage = null) => {
    const text = (
      customMessage !== null ? customMessage : message
    ).trim();

    if (!text || loading) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const result = await askKeerthanaAI(text, songs);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            result?.answer ||
            "Sorry, I couldn't find a suitable response.",
        },
      ]);
    } catch (error) {
      console.error("AI request failed:", error);

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Keerthana AI is currently unavailable.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Sorry 😔 ${errorMessage}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategory = (category) => {
    sendMessage(category.prompt);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <section className="keerthana-ai">

      {/* HEADER */}
      <div className="ai-header">

        <div className="ai-icon">
          <FaRobot />
        </div>

        <div>
          <h1>Keerthana AI</h1>

          <p>
            Your personal Christian music assistant ✝️
          </p>
        </div>

      </div>

      {/* INTRO */}
      <div className="ai-intro">

        <div className="ai-cross">
          ✝️
        </div>

        <div>
          <h2>
            Find music for your moment
          </h2>

          <p>
            Discover worship, praise, prayer,
            scripture and Christian music.
          </p>
        </div>

      </div>

      {/* CATEGORIES */}
      <div className="ai-category-section">

        <h3>
          Explore Christian Music
        </h3>

        <div className="ai-categories">

          {categories.map((category) => (
            <button
              key={category.name}
              type="button"
              className="ai-category"
              onClick={() =>
                handleCategory(category)
              }
              disabled={loading}
            >
              <span className="ai-category-icon">
                {category.icon}
              </span>

              <span>
                {category.name}
              </span>
            </button>
          ))}

        </div>

      </div>

      {/* MESSAGES */}
      <div className="ai-messages">

        {messages.map((item, index) => (
          <div
            key={index}
            className={`ai-message ${
              item.role === "user"
                ? "ai-user"
                : "ai-assistant"
            }`}
          >
            <div className="ai-message-bubble">
              {item.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="ai-message ai-assistant">

            <div className="ai-message-bubble ai-loading">

              <span />
              <span />
              <span />

            </div>

          </div>
        )}

      </div>

      {/* QUICK REQUESTS */}
      <div className="ai-quick-actions">

        <button
          type="button"
          onClick={() =>
            sendMessage(
              "Play Telugu Christian worship songs"
            )
          }
        >
          🇮🇳 Telugu Worship
        </button>

        <button
          type="button"
          onClick={() =>
            sendMessage(
              "Play Christian songs about Jesus"
            )
          }
        >
          ✝️ Songs About Jesus
        </button>

        <button
          type="button"
          onClick={() =>
            sendMessage(
              "Play peaceful Christian songs for prayer"
            )
          }
        >
          🙏 Prayer Music
        </button>

      </div>

      {/* INPUT */}
      <div className="ai-input-area">

        <textarea
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder="Ask Keerthana about Christian music..."
          rows={1}
          disabled={loading}
        />

        <button
          type="button"
          className="ai-send-button"
          onClick={() => sendMessage()}
          disabled={
            loading || !message.trim()
          }
          aria-label="Send message"
        >
          <FaPaperPlane />
        </button>

      </div>

    </section>
  );
};

export default KeerthanaAI;