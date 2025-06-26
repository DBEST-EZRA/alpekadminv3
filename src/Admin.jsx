import React, { useEffect, useState, useRef } from "react";
import { db, auth } from "./Config"; // <- Import auth
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import {
  Container,
  Row,
  Col,
  ListGroup,
  Card,
  Spinner,
  Button,
  Badge,
  Modal,
  Form,
  Alert,
} from "react-bootstrap";
import {
  FaInbox,
  FaEnvelope,
  FaPhoneAlt,
  FaClock,
  FaArrowLeft,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

const Admin = () => {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const [user, setUser] = useState(null);

  const lastMessageCount = useRef(0);
  const audioRef = useRef(null);

  // Auth modal state
  const [showLogin, setShowLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  // Listen for auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setShowLogin(!currentUser);
    });
    return unsubscribe;
  }, []);

  // Load messages once user is logged in
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "messages"), orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (lastMessageCount.current && data.length > lastMessageCount.current) {
        audioRef.current?.play();
      }

      lastMessageCount.current = data.length;
      setMessages(data);
      setLoading(false);
    });

    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      unsubscribe();
      window.removeEventListener("resize", handleResize);
    };
  }, [user]);

  const handleSelectMessage = async (msg) => {
    setSelectedMessage(msg);
    if (!msg.read) {
      await updateDoc(doc(db, "messages", msg.id), { read: true });
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp?.toDate) return "";
    const date = timestamp.toDate();
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const messageDate = new Date(date.setHours(0, 0, 0, 0));
    const time = timestamp.toDate().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (messageDate.getTime() === today.getTime()) {
      return `Today, ${time}`;
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return `Yesterday, ${time}`;
    } else {
      return `${date.toLocaleDateString()}, ${time}`;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setResetMsg("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowLogin(false);
    } catch (err) {
      setAuthError("Invalid credentials");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setResetMsg("");
    setAuthError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMsg("Reset link sent to your email.");
    } catch (err) {
      setAuthError("Error sending reset email.");
    }
  };

  const renderChatList = () => (
    <ListGroup variant="flush">
      {messages.map((msg) => (
        <ListGroup.Item
          key={msg.id}
          action
          active={selectedMessage?.id === msg.id}
          onClick={() => handleSelectMessage(msg)}
          className="d-flex justify-content-between align-items-start"
          style={{ backgroundColor: msg.read ? "#fff" : "#ffe6e6" }}
        >
          <div>
            <strong className="text-secondary">{msg.name}</strong>
            <div className="text-muted" style={{ fontSize: "0.85rem" }}>
              {msg.phone}
            </div>
          </div>
          <div className="text-end">
            <small className="text-muted" style={{ fontSize: "0.75rem" }}>
              {formatTimestamp(msg.timestamp)}
            </small>
            {!msg.read && (
              <Badge bg="danger" className="ms-1">
                New
              </Badge>
            )}
          </div>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );

  const renderChatMessage = () => {
    if (!selectedMessage) return null;
    const { service, message, phone, email, timestamp } = selectedMessage;

    return (
      <Card className="shadow-sm">
        {isMobileView && (
          <Button
            variant="light"
            className="text-start"
            onClick={() => setSelectedMessage(null)}
          >
            <FaArrowLeft className="me-2" />
            Back to Chats
          </Button>
        )}
        <Card.Body>
          <Card.Title className="fw-bold mb-3">{service}</Card.Title>
          <Card.Text className="mb-4" style={{ fontSize: "1.1rem" }}>
            {message}
          </Card.Text>
          <div className="text-muted small">
            <p>
              <FaPhoneAlt className="me-2" />
              {phone}
            </p>
            <p>
              <FaEnvelope className="me-2" />
              {email}
            </p>
            <p>
              <FaClock className="me-2" />
              {formatTimestamp(timestamp)}
            </p>
          </div>
        </Card.Body>
      </Card>
    );
  };

  return (
    <>
      {/* Login Modal */}
      <Modal show={showLogin} centered backdrop="static">
        <Modal.Header>
          <Modal.Title>Admin Login</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleLogin}>
            <Form.Group controlId="formEmail" className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="formPassword" className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>
            {authError && <Alert variant="danger">{authError}</Alert>}
            {resetMsg && <Alert variant="success">{resetMsg}</Alert>}
            <div className="d-flex justify-content-between">
              <Button variant="secondary" onClick={handleResetPassword}>
                Reset Password
              </Button>
              <Button type="submit" disabled={authLoading}>
                {authLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Main UI */}
      <Container fluid className="p-0">
        <div
          className="d-flex align-items-center text-white px-3 py-2"
          style={{ backgroundColor: "#b30000" }}
        >
          <FaInbox className="me-2" />
          <h5 className="m-0">ALPEK CONSULTANCY</h5>
        </div>

        <audio ref={audioRef} src="/chat-pop.wav" preload="auto" />

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <Row>
            {!isMobileView || !selectedMessage ? (
              <Col
                md={2}
                style={{
                  borderRight: "1px solid #ccc",
                  maxHeight: "85vh",
                  overflowY: "auto",
                }}
              >
                {renderChatList()}
              </Col>
            ) : null}

            {(!isMobileView || selectedMessage) && (
              <Col md={10} className="p-3">
                {selectedMessage ? (
                  renderChatMessage()
                ) : (
                  <p className="text-muted">Select a message to view</p>
                )}
              </Col>
            )}
          </Row>
        )}
      </Container>
    </>
  );
};

export default Admin;
