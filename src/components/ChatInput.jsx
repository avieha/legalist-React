/* eslint-disable react/prop-types */
import React, { useRef } from "react";

const ChatInput = ({ onSend, onFileSelect, disabled }) => {
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSend = () => {
    const message = inputRef.current.value.trim();
    if (message) {
      onSend(message);
      inputRef.current.value = "";
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e) => {
    onFileSelect(Array.from(e.target.files));
    e.target.value = ""; // reset so same file can be selected again
  };

  return (
    <div className="chat-input">
      <input
        type="text"
        placeholder="הקלד הודעה..."
        onKeyPress={handleKeyPress}
        ref={inputRef}
        disabled={disabled}
      />
      <input
        type="file"
        multiple
        style={{ display: "none" }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <button onClick={() => fileInputRef.current.click()}>➕</button>
      <button onClick={handleSend} disabled={disabled}>
        שלח
      </button>
    </div>
  );
};

export default ChatInput;
