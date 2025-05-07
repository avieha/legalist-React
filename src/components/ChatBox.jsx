/* eslint-disable react/prop-types */
import React from "react";

const ChatBox = ({ messages }) => {
  return (
    <div className="chat-box">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`chat-message ${msg.sender === "LegalistAI" ? "bot-message" : "user-message"}`}
        >
          <strong>{msg.sender}: </strong>
          <p
            dangerouslySetInnerHTML={{
              __html: msg.text.replace(/\n/g, "<br>"),
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default ChatBox;
