/* eslint-disable react/prop-types */
import React from "react";

function ChatMessage({
  sender,
  text,
  isCopyable = false,
  loading = false,
  loadingType = "message",
  isServerResponse = false,
  fileName = null,
  onShowSummary = () => {},
}) {
  const className = sender === "LegalistAI" ? "bot-message" : "user-message";

  // Format text: bold lines ending with ':' and replace newlines with <br>
  const formatText = (text) => {
    if (!text) return "";
    // Highlight lines ending with a colon (optionally starting with numbers)
    let formatted = text.replace(
      /^(?:\d+\.?\s*)?.+?:$/gm,
      "<strong>$&</strong>",
    );
    // Replace line breaks with <br>
    formatted = formatted.replace(/\n/g, "<br>");
    return formatted;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      alert("הטקסט הועתק ללוח");
    } catch (err) {
      console.error("לא הצלחנו להעתיק", err);
      alert("שגיאה בהעתקה ללוח");
    }
  };

  return (
    <div className={`chat-message ${className}`}>
      <strong>{sender}:</strong>
      {loading ? (
        <p>
          <span className="loading-icon">⌛</span>{" "}
          {loadingType === "file"
            ? "הקבצים התקבלו ונמצאים בבדיקה..."
            : "ממתין לתגובה..."}
        </p>
      ) : (
        <p
          dangerouslySetInnerHTML={{
            __html: isServerResponse
              ? formatText(text)
              : text.replace(/\n/g, "<br>"),
          }}
        />
      )}
      {!loading && isCopyable && (
        <button type="button" className="copy-btn" onClick={handleCopy}>
          העתק
        </button>
      )}
      {!loading && fileName && isServerResponse && (
        <button
          type="button"
          className="show-file-button"
          onClick={() => onShowSummary(fileName)}
        >
          סיכום הקובץ
        </button>
      )}
    </div>
  );
}

export default ChatMessage;
