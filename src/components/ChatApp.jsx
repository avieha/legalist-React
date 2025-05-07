import React, { useState } from "react";
import ChatBox from "./ChatBox";
import ChatInput from "./ChatInput";
import FileUpload from "./FileUpload";

const ChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);

  const addMessage = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  return (
    <div className="chat-container">
      <ChatBox messages={messages} />
      <FileUpload files={files} setFiles={setFiles} />
      <ChatInput onSend={addMessage} />
    </div>
  );
};

export default ChatApp;
