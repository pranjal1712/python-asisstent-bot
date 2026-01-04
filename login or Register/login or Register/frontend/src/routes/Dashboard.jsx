import React, { useState, useEffect, useRef } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";
import Modal from "react-bootstrap/Modal";
import { BsPlus, BsTrash, BsArrowLeft, BsArrowRight } from "react-icons/bs";
import {
  BsGear,
  BsSend,
  BsMusicNote,
  BsPaperclip,
  BsImage,
} from "react-icons/bs";
import "./Dashboard.css";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

export default function ChatApp() {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === "true"; // string to boolean
  });


  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [file, setFile] = useState(null);
  const [g] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const messagesEndRef = useRef(null);
  const [recording, setRecording] = useState(false);

  // Edit message states
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");

  // Global search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [scrollTargetMessageId, setScrollTargetMessageId] = useState(null);
  const [highlightMsgId, setHighlightMsgId] = useState(null);

  // -----------------------
  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) return;

    fetch("http://127.0.0.1:8000/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => setUser(data))
      .catch((err) => {
        console.error("User fetch error:", err);
        setUser(null);
      });
  }, []);

  // -----------------------
  // Load from localStorage
  // -----------------------
  useEffect(() => {
    const savedConversations = localStorage.getItem("conversations");
    const savedCurrent = localStorage.getItem("currentConversation");
    const savedDark = localStorage.getItem("darkMode");

    let parsed = [];
    if (savedConversations) {
      try {
        parsed = JSON.parse(savedConversations);
      } catch {
        parsed = [];
      }
    }

    if (parsed.length === 0) {
      const newConv = { id: Date.now(), title: "New Chat", messages: [] };
      parsed = [newConv];
    }

    setConversations(parsed);

    if (savedCurrent && parsed.some((c) => c.id === Number(savedCurrent))) {
      setCurrentConversation(Number(savedCurrent));
    } else {
      setCurrentConversation(parsed[0].id);
    }

    if (savedDark) setDarkMode(savedDark === "true");
  }, []);

  // Save conversations to localStorage
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    localStorage.setItem("conversations", JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (currentConversation !== null)
      localStorage.setItem("currentConversation", String(currentConversation));
  }, [currentConversation]);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, currentConversation]);

  // Scroll to search hit + highlight
  useEffect(() => {
    if (!scrollTargetMessageId) return;
    const el = document.getElementById(`msg-${scrollTargetMessageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightMsgId(scrollTargetMessageId);
      setTimeout(() => setHighlightMsgId(null), 1500);
    }
    setScrollTargetMessageId(null);
  }, [scrollTargetMessageId, conversations, currentConversation]);

  const currentMessages = () => {
    const conv = conversations.find((c) => c.id === currentConversation);
    return conv ? conv.messages : [];
  };

  const updateConversationMessages = (convId, messages) => {
    setConversations((prev) =>
      prev.map((conv) => (conv.id === convId ? { ...conv, messages } : conv))
    );
  };

  // -----------------------
  // Recording
  // -----------------------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunksRef.current = [];

      const options = { mimeType: "audio/webm;codecs=opus" };
      const mr = new MediaRecorder(stream, options);

      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "audio/webm",
        });
        const audioFile = new File([blob], `recording_${Date.now()}.webm`, {
          type: "audio/webm",
        });
        setFile(audioFile);
        stream.getTracks().forEach((t) => t.stop()); // mic close
      };

      mr.start(); // Start recording
      setRecording(true);
    } catch (err) {
      alert("Microphone permission denied or not available.");
      console.error(err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  // -----------------------
  // Send message
  // -----------------------
  async function sendMessage() {
    if (!input.trim() && !file) return;
  const token = localStorage.getItem("access_token");

    

    const conv = conversations.find((c) => c.id === currentConversation);
    if (!conv) return;

    const previewUrl = file ? URL.createObjectURL(file) : null;
    const timestamp = new Date().toLocaleTimeString();

    const userMessage = {
      id: Date.now(),
      user: true,
      text: input.trim() || "",
      file: previewUrl,
      fileType: file?.type?.startsWith("image")
        ? "image"
        : file?.type?.startsWith("audio")
        ? "audio"
        : null,
      timestamp,
    };

    const newMessages = [...conv.messages, userMessage];
    updateConversationMessages(currentConversation, newMessages);

    if (conv.messages.length === 0 && (input.trim() || file)) {
      const titleBase =
        input.trim() ||
        (file?.type?.startsWith("image") ? "Image message" : "Audio message");
      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentConversation
            ? {
                ...c,
                title:
                  titleBase.substring(0, 30) +
                  (titleBase.length > 30 ? "..." : ""),
              }
            : c
        )
      );
    }

    setInput("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("user_id", "demo_user");
      formData.append("conversation_id", String(currentConversation));
      if (userMessage.text) formData.append("text", userMessage.text);
      if (file)
        formData.append(
          file?.type?.startsWith("image") ? "image" : "audio",
          file
        );

  const res = await fetch("/api/chat/", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

      const data = await res.json();
      const botText =
        data?.response?.response?.text || "🤖 Sorry, no response from bot.";

      const botMessage = {
        id: Date.now() + 1,
        user: false,
        text: botText,
        timestamp: new Date().toLocaleTimeString(),
      };
      updateConversationMessages(currentConversation, [
        ...newMessages,
        botMessage,
      ]);
    } catch (e) {
      console.error(e);
      updateConversationMessages(currentConversation, [
        ...newMessages,
        {
          id: Date.now() + 1,
          user: false,
          text: "⚠️ Error connecting to bot.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(null);
    }
  }

  // -----------------------
  // Edit & Delete Message
  // -----------------------
  const startEditMessage = (msg) => {
    if (msg.file) return;
    setEditingMessageId(msg.id);
    setEditText(msg.text || "");
  };
  const saveEditMessage = () => {
    if (editingMessageId == null) return;
    const conv = conversations.find((c) => c.id === currentConversation);
    if (!conv) return;
    const updated = conv.messages.map((m) =>
      m.id === editingMessageId ? { ...m, text: editText } : m
    );
    updateConversationMessages(currentConversation, updated);
    setEditingMessageId(null);
    setEditText("");
  };
  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditText("");
  };
  const deleteSingleMessage = (msgId) => {
    const conv = conversations.find((c) => c.id === currentConversation);
    if (!conv) return;
    const ok = window.confirm("Delete this message?");
    if (!ok) return;
    const filtered = conv.messages.filter((m) => m.id !== msgId);
    updateConversationMessages(currentConversation, filtered);
  };

  // -----------------------
  // Conversations CRUD
  // -----------------------
  const createNewConversation = () => {
    const newConv = { id: Date.now(), title: "New Chat", messages: [] };
    setConversations((prev) => [...prev, newConv]);
    setCurrentConversation(newConv.id);
    setSearchQuery("");
    setSearchResults([]);
  };
  const selectConversation = (id) => {
    setCurrentConversation(id);
    setSearchQuery("");
    setSearchResults([]);
  };
  const promptDeleteConversation = (id, e) => {
    e.stopPropagation();
    setConversationToDelete(id);
    setShowDeleteModal(true);
  };
  const deleteConversation = () => {
    const updated = conversations.filter((c) => c.id !== conversationToDelete);
    setConversations(updated);
    if (currentConversation === conversationToDelete)
      setCurrentConversation(updated.length > 0 ? updated[0].id : null);
    setShowDeleteModal(false);
    setConversationToDelete(null);
    setSearchResults([]);
  };
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  // -----------------------
  // Global Search across all conversations
  // -----------------------
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const results = [];
    conversations.forEach((conv) => {
      conv.messages.forEach((m) => {
        const hay = `${m.text || ""}`.toLowerCase();
        if (hay.includes(q))
          results.push({
            convId: conv.id,
            convTitle: conv.title,
            msgId: m.id,
            text: m.text || "",
            timestamp: m.timestamp || "",
          });
      });
    });
    setSearchResults(results);
  }, [searchQuery, conversations]);

  const openSearchHit = (hit) => {
    setCurrentConversation(hit.convId);
    setScrollTargetMessageId(hit.msgId);
    if (!sidebarCollapsed) setSidebarCollapsed(true);
  };

  const navigate = useNavigate();

  const handleGuestOk = () => {
    setShowGuestModal(false);
    navigate("/login"); // ✅ react-router-dom redirect
  };
  // Component ke top me

  // Function to toggle and save
  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      localStorage.setItem("darkMode", !prev); // save in localStorage
      return !prev;
    });
  };
  useEffect(() => {
    document.body.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <div className={`chat-app-container`}>
      {/* Sidebar */}
      <div className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <Button variant="primary" onClick={createNewConversation}>
            {!sidebarCollapsed ? (
              <>
                <BsPlus /> New Chat
              </>
            ) : (
              <BsPlus />
            )}
          </Button>
          <Button variant="outline-secondary" onClick={toggleSidebar}>
            {sidebarCollapsed ? <BsArrowRight /> : <BsArrowLeft />}
          </Button>
        </div>

        {/* Global Search */}
        {!sidebarCollapsed && (
          <div style={{ padding: "8px" }}>
            <Form.Control
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats."
            />
            {searchQuery && (
              <div style={{ fontSize: 12, marginTop: 6, color: "#666" }}>
                {searchResults.length} result
                {searchResults.length !== 1 ? "s" : ""} found
                <Button
                  size="sm"
                  variant="link"
                  style={{ paddingLeft: 8 }}
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Search results list */}
        {!sidebarCollapsed && searchQuery && (
          <div
            style={{ maxHeight: 160, overflowY: "auto", padding: "0 8px 8px" }}
          >
            <ListGroup>
              {searchResults.map((r) => (
                <ListGroup.Item
                  key={`${r.convId}-${r.msgId}`}
                  action
                  onClick={() => openSearchHit(r)}
                >
                  <div style={{ fontWeight: 600, fontSize: 12 }}>
                    {r.convTitle}
                  </div>
                  <div style={{ fontSize: 12, color: "#555" }} title={r.text}>
                    {r.text.length > 50 ? r.text.slice(0, 50) + "…" : r.text}
                  </div>
                  <div style={{ fontSize: 10, color: "#888" }}>
                    {r.timestamp}
                  </div>
                </ListGroup.Item>
              ))}
              {searchResults.length === 0 && (
                <ListGroup.Item disabled>No matches</ListGroup.Item>
              )}
            </ListGroup>
          </div>
        )}

        <ListGroup className="conversation-list" style={{ padding: "8px 0" }}>
          {conversations.map((conv) => (
            <ListGroup.Item
              key={conv.id}
              action
              active={conv.id === currentConversation}
              onClick={() => selectConversation(conv.id)}
              style={{
                display: "flex",
                backgroundColor:
                  conv.id === currentConversation ? "#4f6adfff" : "#fff",
                justifyContent: "space-between",
                alignItems: "center",
                borderRadius: 12,
                padding: sidebarCollapsed ? "8px" : "10px 12px",
                marginBottom: 6,
                cursor: "pointer",
                position: "relative",
              }}
              className="conversation-item"
            >
              {/* Left: Title & Timestamp */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: sidebarCollapsed ? 14 : 16,
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    color: "#000",
                  }}
                >
                  {sidebarCollapsed
                    ? conv.title.substring(0, 2) + "..."
                    : conv.title}
                </div>
                {!sidebarCollapsed && (
                  <div
                    style={{
                      fontSize: 10,
                      color: "#000000ff",
                      marginTop: 2,
                    }}
                  >
                    {conv.messages.length > 0
                      ? conv.messages[conv.messages.length - 1].timestamp
                      : ""}
                  </div>
                )}
              </div>

              {/* Right: Three-dot menu */}
              {!sidebarCollapsed && (
                <Dropdown align="end">
                  <Dropdown.Toggle
                    variant="link"
                    style={{
                      color: "#000000ff",
                      fontSize: 18,
                      padding: "0 4px",
                    }}
                  >
                    ⋮
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item
                      onClick={(e) => promptDeleteConversation(conv.id, e)}
                    >
                      Delete
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </div>
      {/* Settings Icon Bottom Left */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 10,
          width: "calc(100% - 16px)",
        }}
      >
        <Dropdown drop="up">
          <Dropdown.Toggle
            variant="outline-secondary"
            id="settings-dropdown"
            style={{
              width: "8%",
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarCollapsed ? "center" : "flex-start",
            }}
          >
            <BsGear size={18} />
            {!sidebarCollapsed && (
              <span style={{ marginLeft: 6 }}>Settings</span>
            )}
          </Dropdown.Toggle>

          <Dropdown.Menu>
            {/* Profile */}
            <Dropdown.Item onClick={() => setShowProfile(true)}>
              View Profile
            </Dropdown.Item>
            {/* Theme toggle */}
            <Dropdown.Item onClick={toggleDarkMode}>
              Theme: {darkMode ? "Dark " : "Light "}
            </Dropdown.Item>

            {/* Navigation */}
            <Dropdown.Item onClick={() => navigate("/privacy")}>
              Privacy
            </Dropdown.Item>
            <Dropdown.Item onClick={() => navigate("/terms")}>
              Terms
            </Dropdown.Item>

            <Dropdown.Divider />

            {/* Logout */}
            <Dropdown.Item
              onClick={() => {
                localStorage.removeItem("access_token"); // remove auth token or session
                localStorage.removeItem("user"); // remove stored user data
                navigate("/login");
              }}
            >
              Logout
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>


      {/* Profile Modal */}
      <Modal show={showProfile} onHide={() => setShowProfile(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>User Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {user ? (
            <>
              <img
                src={user.picture || "/avatar.png"}
                alt="profile"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  marginBottom: 12,
                }}
              />
              <h5>{user.name}</h5>
              <p>{user.email}</p>
            </>
          ) : (
            <p>Not logged in</p>
          )}
        </Modal.Body>
      </Modal>

      {/* Main Chat Area */}
      <div className="chat-area">
        <div className="messages-container">
          {currentMessages().length === 0 ? (
            <div className="empty-state">
              <h4>Start a new conversation</h4>
              <p>Ask me anything or share your thoughts</p>
            </div>
          ) : (
            currentMessages().map((msg) => {
              const isEditing = editingMessageId === msg.id;
              const isHighlight = highlightMsgId === msg.id;
              return (
                <div
                  key={msg.id}
                  id={`msg-${msg.id}`}
                  className={`message ${
                    msg.user ? "user-message" : "bot-message"
                  }`}
                  style={
                    isHighlight
                      ? { outline: "2px solid #0d6efd", borderRadius: 8 }
                      : {}
                  }
                >
                  {/* Edit mode */}
                  {isEditing ? (
                    <div style={{ width: "100%" }}>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                      />
                      <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                        <Button size="sm" onClick={saveEditMessage}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={cancelEditMessage}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {msg.text && (
                        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                          {msg.text}
                        </ReactMarkdown>
                      )}
                      {msg.file && msg.fileType === "image" && (
                        <img
                          src={msg.file}
                          alt="uploaded"
                          style={{
                            maxWidth: 260,
                            borderRadius: 8,
                            marginTop: 6,
                          }}
                        />
                      )}
                      {msg.file && msg.fileType === "audio" && (
                        <audio
                          controls
                          src={msg.file}
                          style={{ display: "block", marginTop: 6 }}
                        />
                      )}
                      {msg.timestamp && (
                        <div
                          style={{
                            fontSize: "0.7em",
                            color: "#888",
                            marginTop: 2,
                          }}
                        >
                          {msg.timestamp}
                        </div>
                      )}

                      <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                        {msg.user && !msg.file && (
                          <DropdownButton
                            id={`edit-dropdown-${msg.id}`}
                            title={
                              <img
                                src="edit.ico"
                                alt="Edit"
                                style={{ width: 10, height: 10 }}
                              />
                            }
                            variant="outline-secondary"
                          >
                            <Dropdown.Item
                              onClick={() => startEditMessage(msg)}
                            >
                              Edit Message
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() => deleteSingleMessage(msg.id)}
                            >
                              Delete Message
                            </Dropdown.Item>
                          </DropdownButton>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}

          {/* Typing indicator */}
          {loading && (
            <div
              className="message bot-message typing-indicator"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <span>Bot is typing</span>
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            if (!loading) sendMessage();
          }}
          className="message-input"
        >
          <div
            className="input-group"
            style={{
              gap: 8,
              alignItems: "center",
              padding: "8px",
              background: darkMode
                ? "linear-gradient(#2a2a2a, #1e1e1e)"
                : "linear-gradient(145deg, #ffffff, #676d73)",
              borderRadius: 12,
            }}
          >
            {/* Text Input */}
            <Form.Control
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              style={{
                borderRadius: 12,
                border: "1px solid #000000ff",
                padding: "8px 12px",
                background: darkMode ? "#4a4545ff" : "#ffffffff",
                color: darkMode ? "#000000ff" : "#000000ff",
                flex: 1,
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !loading) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />

            {/* Mic Button (next to input box) */}
            <Button
              variant={recording ? "danger" : "secondary"}
              onClick={recording ? stopRecording : startRecording}
              disabled={loading}
              style={{
                borderRadius: 12,
                marginLeft: 4,
              }}
            >
              {recording ? "⏹" : "🎤"}
            </Button>

            {/* Attach Button with Dropdown */}
            <DropdownButton
              id="attach-dropdown"
              title={<BsPaperclip size={20} />}
              variant="secondary"
              disabled={loading}
            >
              {/* Upload Image */}
              <Dropdown.Item
                onClick={() => document.getElementById("imageInput").click()}
              >
                <BsImage size={16} style={{ marginRight: 6 }} />
                Upload Image
              </Dropdown.Item>

              {/* Upload File (any type, instead of audio only) */}
              <Dropdown.Item
                onClick={() => document.getElementById("fileInput").click()}
              >
                📂 Upload File
              </Dropdown.Item>
            </DropdownButton>

            {/* Hidden Inputs */}
            <Form.Control
              id="imageInput"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />

            <Form.Control
              id="fileInput"
              type="file"
              accept="*/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
            {/* Mic Button */}

            {/* Send Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={loading || (!input.trim() && !file)}
              onClick={sendMessage}
              style={{
                borderRadius: 12,
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <BsSend size={18} />
            </Button>
          </div>
        </Form>
      </div>
      {/* Delete Conversation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete Conversation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this conversation? This cannot be
          undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteConversation}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
