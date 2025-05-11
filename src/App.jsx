import React from "react";
import { useRef, useEffect, useState } from "react";
import { sendFilesToServer, sendMessageToServer, getFileSummary } from "./API";
import ChatMessage from "./components/ChatMessage";
import FileSummaryModal from "./components/FileSummaryModal";
import "./App.css";

const chatStates = {
  mainMenu: {
    message:
      "שלום! אני LegalistAI, נא להשיב בהודעה את מספר הפעולה שברצונך לבצע:\n1️⃣ סיווג הקובץ לפי נושא\n2️⃣ מציאת סתירות בחקירות המשטרתיות\nבכל שלב ניתן לשלוח את הספרה 4️⃣ ולחזור לתפריט הראשי.",
    options: ["1", "2", "4"],
    nextState: (choice) => {
      switch (choice) {
        case "1":
          return "uploadFiles";
        case "2":
          return "chooseTopic";
        default:
          return "mainMenu";
      }
    },
  },
  uploadFiles: {
    message:
      "גרור לכאן או השתמש בכפתור ה ➕ כדי להעלות את הקובץ שעליו תרצה לשאול\nשים לב! ניתן להעלות קבצי PDF בלבד.",
    options: ["4"],
    nextState: () => "moreInfo",
  },
  moreInfo: {
    message: "מהי שאלתך?",
    options: ["4"],
    nextState: () => "mainMenu",
  },
  chooseTopic: {
    message: "בחר נושא:\n1️⃣ הערבויות\n2️⃣ ההלוואה\n3️⃣ רכישת בניין הדואר",
    options: ["1", "2", "3", "4"],
    nextState: () => "firstGroup",
  },
  firstGroup: {
    message: "צרף בבקשה את קבוצת הקבצים הראשונה.",
    options: ["4"],
    nextState: () => "secondGroup",
  },
  secondGroup: {
    message: "הקבצים נקלטו, צרף בבקשה את קבוצת הקבצים השנייה.",
    options: ["4"],
    nextState: () => "mainMenu",
  },
};

function App() {
  const [state, setState] = useState("mainMenu");
  const [chat, setChat] = useState([
    { sender: "LegalistAI", text: chatStates.mainMenu.message },
  ]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState([]);
  const [fileHint, setFileHint] = useState("");
  const [summaryContent, setSummaryContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [groupStage, setGroupStage] = useState("first");
  const bottomRef = useRef(null);
  // --- ADD refs for first group files and choice ---
  const firstGroupFilesRef = useRef([]);
  const firstGroupChoiceRef = useRef("");

  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Helper to format server responses: bold titles and line breaks
  function formatResponse(responseText) {
    if (!responseText) return "";
    let formatted = responseText.replace(
      /^(?:\d+\.?\s*)?.+?:$/gm,
      "<strong>$&</strong>",
    );
    formatted = formatted.replace(/\n/g, "<br>");
    return formatted;
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setFileHint(
      selectedFiles.length > 0 ? `${selectedFiles.length} קבצים נוספו` : "",
    );
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
    setFileHint(`${droppedFiles.length} קבצים נוספו`);
  };

  const handleFileUploadOnly = async () => {
    console.log("handleFileUploadOnly");
    setFileHint("");
    setChat((prev) => [
      ...prev,
      { sender: "LegalistAI", text: "", loading: true, loadingType: "file" },
    ]);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    await sendFilesToServer(formData);

    setChat((prev) => {
      const updated = [...prev];
      const lastIndex = updated.findLastIndex((m) => m.loading);

      updated[lastIndex] = {
        sender: "LegalistAI",
        text: formatResponse("✅ מעולה, הקבצים נקלטו!"),
      };
      return updated;
    });

    const next = chatStates[state].nextState();
    setState(next);
    setChat((prev) => [
      ...prev,
      { sender: "LegalistAI", text: chatStates[next].message },
    ]);
  };

  const handleFileGroups = async () => {
    console.log("handleFileGroups");
    setFileHint("");
    const formData = new FormData();

    if (groupStage === "second") {
      // Second submission: submit both groups now
      const secondGroupFiles = [...files];
      secondGroupFiles.forEach((file) => formData.append("second", file));

      if (firstGroupFilesRef.current.length > 0) {
        firstGroupFilesRef.current.forEach((file) =>
          formData.append("first", file),
        );
      }

      if (firstGroupChoiceRef.current) {
        formData.append("choice", firstGroupChoiceRef.current);
      }

      await uploadAndRespond(formData);
      setFiles([]);
    } else {
      // Save the first group files and choice for the next phase
      firstGroupFilesRef.current = [...files];

      // Move to secondGroup state
      const next = chatStates[state].nextState();
      setState(next);
      setChat((prev) => [
        ...prev,
        { sender: "LegalistAI", text: chatStates[next].message },
      ]);
      // Clear files and wait for second group
      setFiles([]);
    }
    setGroupStage("second");
  };

  async function uploadAndRespond(formData) {
    console.log("uploadAndRespond");
    // Always finish all actions before final state change
    setChat((prev) => [
      ...prev,
      { sender: "LegalistAI", text: "", loading: true, loadingType: "file" },
    ]);
    const serverResponse = await sendFilesToServer(formData);

    if (serverResponse.result) {
      setChat((prev) => {
        const updated = [...prev];
        const lastIndex = updated.findLastIndex((m) => m.loading);
        if (lastIndex !== -1) {
          updated[lastIndex] = {
            sender: "LegalistAI",
            text: formatResponse(serverResponse.result),
            isCopyable: true,
            isServerResponse: true,
            fileName: files[0]?.name || null,
          };
        }
        return updated;
      });
    }

    // After second group is done, change state quietly (do NOT push mainMenu message)
    setState(chatStates["secondGroup"].nextState());
    setGroupStage("first");
    firstGroupFilesRef.current = [];
    firstGroupChoiceRef.current = "";
  }

  const handleTextInputOnly = async (trimmed) => {
    console.log("handleTextInputOnly");
    setInput("");
    const current = chatStates[state];
    setChat((prev) => [...prev, { sender: "אתה", text: trimmed }]);

    // contradictions state
    if (state === "chooseTopic" && current.options.includes(trimmed)) {
      firstGroupChoiceRef.current = trimmed;
      const next = chatStates[state].nextState();
      setState(next);
      setChat((prev) => [
        ...prev,
        { sender: "LegalistAI", text: chatStates[next].message },
      ]);
    } else if (current.options.includes(trimmed)) {
      const next = current.nextState(trimmed);
      setState(next);

      if (next === "mainMenu") {
        setFiles([]);
        setGroupStage("first");
        firstGroupFilesRef.current = [];
        firstGroupChoiceRef.current = "";
      }
      setChat((prev) => [
        ...prev,
        { sender: "LegalistAI", text: chatStates[next].message },
      ]);
    }

    // prompts state
    else if (state === "moreInfo") {
      const formData = new FormData();
      const file_name = files[0]?.name;

      formData.append("filename", file_name);
      formData.append("message", trimmed);

      setChat((prev) => [
        ...prev,
        {
          sender: "LegalistAI",
          text: "",
          loading: true,
          loadingType: "message",
        },
      ]);
      const response = await sendMessageToServer(formData);

      setChat((prev) => {
        const updated = [...prev];
        const lastIndex = updated.findLastIndex((m) => m.loading);
        updated[lastIndex] = {
          sender: "LegalistAI",
          text: formatResponse(response.message),
          isCopyable: true,
          isServerResponse: true,
          fileName: file_name,
        };
        return updated;
      });
    } else {
      setChat((prev) => [
        ...prev,
        { sender: "LegalistAI", text: "⚠️ בחירה לא תקינה, נסה שנית." },
      ]);
    }

    setFileHint("");
  };

  const handleInput = async () => {
    console.log("handleInput");
    setFileHint("");
    setIsLoading(true);
    const trimmed = input.trim();
    if (!trimmed && files.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      if (firstGroupChoiceRef.current) {
        await handleFileGroups();
      } else if (files.length > 0 && trimmed === "") {
        await handleFileUploadOnly();
      } else if (trimmed) {
        await handleTextInputOnly(trimmed);
      }
    } catch {
      setChat((prev) => [
        ...prev,
        { sender: "LegalistAI", text: "❌ אירעה שגיאה." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h1 className="app-title">legalistAI</h1>
      <div
        className={`chat-container ${dragOver ? "drag-over" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {summaryContent && (
          <FileSummaryModal
            content={summaryContent}
            onClose={() => setSummaryContent(null)}
          />
        )}
        <div className="chat-box">
          {chat.map((msg, index) => (
            <ChatMessage
              key={index}
              sender={msg.sender}
              text={msg.text}
              loading={msg.loading}
              isCopyable={msg.isCopyable}
              fileName={msg.fileName}
              isServerResponse={msg.isServerResponse}
              onShowSummary={async (fileName) => {
                try {
                  const response = await getFileSummary(fileName);
                  const claims = response.claims
                    .trim()
                    .split("\n")
                    .map((line) => line.replace(/^- /, "").trim())
                    .filter((line) => line);
                  setSummaryContent(claims);
                } catch {
                  alert("⚠️ לא ניתן להציג את סיכום הקובץ.");
                }
              }}
            />
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="input-container">
          {fileHint && <div className="hint">{fileHint}</div>}
          <input
            id="file-upload-btn"
            type="file"
            multiple
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload-btn" className="file-upload-btn">
            ➕
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleInput();
            }}
            placeholder="הקלד את הבחירה שלך..."
            autoComplete="off"
          />
          <button
            className="send-button"
            onClick={handleInput}
            disabled={isLoading}
          >
            שלח
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
