import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRobot,
  faBolt,
  faClock,
  faExclamationTriangle,
  faKey,
  faFileContract,
  faToggleOn,
  faToggleOff,
  faPlus,
  faTrash,
  faSave,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/AutomationRules.css";

function AutomationRules() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ai-confidence");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");

  // AI Confidence Settings
  const [confidenceSettings, setConfidenceSettings] = useState({
    summaryConfidence: 85,
    sentimentConfidence: 80,
    priorityConfidence: 75,
    autoAcceptThreshold: 95,
    autoRejectThreshold: 50,
  });

  // Auto-Assignment Rules
  const [assignmentRules, setAssignmentRules] = useState([]);

  // Escalation Rules
  const [escalationRules, setEscalationRules] = useState([]);

  // Keyword Triggers
  const [keywordTriggers, setKeywordTriggers] = useState([]);

  // SLA Rules
  const [slaRules, setSlaRules] = useState([]);

  // Form Data for modals
  const [formData, setFormData] = useState({});

  useEffect(() => {
    // Mock data - Replace with actual API call
    const mockAssignmentRules = [
      {
        id: 1,
        name: "High Priority to Senior Team",
        condition: "priority",
        value: "High",
        assignTo: "Senior Support Team",
        isActive: true,
      },
      {
        id: 2,
        name: "Sales Keywords to Sales Team",
        condition: "keyword",
        value: "quote, pricing, purchase",
        assignTo: "Sales Team",
        isActive: true,
      },
      {
        id: 3,
        name: "Technical Issues to Tech Team",
        condition: "keyword",
        value: "bug, error, crash, issue",
        assignTo: "Technical Support",
        isActive: true,
      },
    ];

    const mockEscalationRules = [
      {
        id: 1,
        name: "Urgent Response Escalation",
        trigger: "No response within 2 hours",
        escalateTo: "Upper Admin",
        isActive: true,
        timeLimit: 120,
      },
      {
        id: 2,
        name: "VIP Customer Escalation",
        trigger: "VIP customer tag detected",
        escalateTo: "Manager",
        isActive: true,
        timeLimit: 30,
      },
      {
        id: 3,
        name: "Critical Priority Escalation",
        trigger: "Critical priority detected",
        escalateTo: "Senior Team Lead",
        isActive: false,
        timeLimit: 60,
      },
    ];

    const mockKeywordTriggers = [
      {
        id: 1,
        keywords: "urgent, emergency, asap",
        action: "Set Priority to High",
        notify: "Manager",
        isActive: true,
      },
      {
        id: 2,
        keywords: "complaint, unhappy, dissatisfied",
        action: "Flag for Review",
        notify: "Customer Success Team",
        isActive: true,
      },
      {
        id: 3,
        keywords: "cancel, refund, unsubscribe",
        action: "Escalate to Retention Team",
        notify: "Retention Specialist",
        isActive: true,
      },
    ];

    const mockSlaRules = [
      {
        id: 1,
        name: "Standard Response SLA",
        firstResponse: 4,
        resolution: 24,
        priority: "Medium",
        isActive: true,
      },
      {
        id: 2,
        name: "High Priority SLA",
        firstResponse: 1,
        resolution: 8,
        priority: "High",
        isActive: true,
      },
      {
        id: 3,
        name: "Low Priority SLA",
        firstResponse: 8,
        resolution: 48,
        priority: "Low",
        isActive: true,
      },
    ];

    setTimeout(() => {
      setAssignmentRules(mockAssignmentRules);
      setEscalationRules(mockEscalationRules);
      setKeywordTriggers(mockKeywordTriggers);
      setSlaRules(mockSlaRules);
      setLoading(false);
    }, 300);
  }, []);

  const handleConfidenceChange = (field, value) => {
    setConfidenceSettings((prev) => ({
      ...prev,
      [field]: parseInt(value),
    }));
  };

  const handleSaveConfidence = async () => {
    try {
      // TODO: API call to save confidence settings
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage({
        type: "success",
        text: "AI confidence settings saved successfully!",
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to save settings. Please try again.",
      });
    }
  };

  const handleToggleRule = (type, id) => {
    switch (type) {
      case "assignment":
        setAssignmentRules((prev) =>
          prev.map((rule) =>
            rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
          )
        );
        break;
      case "escalation":
        setEscalationRules((prev) =>
          prev.map((rule) =>
            rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
          )
        );
        break;
      case "keyword":
        setKeywordTriggers((prev) =>
          prev.map((trigger) =>
            trigger.id === id
              ? { ...trigger, isActive: !trigger.isActive }
              : trigger
          )
        );
        break;
      case "sla":
        setSlaRules((prev) =>
          prev.map((rule) =>
            rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
          )
        );
        break;
      default:
        break;
    }
  };

  const handleDeleteRule = (type, id) => {
    if (!window.confirm("Are you sure you want to delete this rule?")) return;

    switch (type) {
      case "assignment":
        setAssignmentRules((prev) => prev.filter((rule) => rule.id !== id));
        break;
      case "escalation":
        setEscalationRules((prev) => prev.filter((rule) => rule.id !== id));
        break;
      case "keyword":
        setKeywordTriggers((prev) =>
          prev.filter((trigger) => trigger.id !== id)
        );
        break;
      case "sla":
        setSlaRules((prev) => prev.filter((rule) => rule.id !== id));
        break;
      default:
        break;
    }

    setMessage({ type: "success", text: "Rule deleted successfully!" });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const openCreateModal = (type) => {
    setModalType(type);
    setFormData({});
    setShowModal(true);
  };

  const handleCreateRule = async () => {
    // TODO: Validate and create rule via API
    setShowModal(false);
    setMessage({ type: "success", text: "Rule created successfully!" });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  if (loading) {
    return (
      <div className="automation-rules-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading automation rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="automation-rules-page">
      <div className="automation-header">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
        <h1 className="page-title">Automation Rules</h1>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      {/* Tabs Navigation */}
      <div className="automation-tabs">
        <button
          className={`tab-button ${
            activeTab === "ai-confidence" ? "active" : ""
          }`}
          onClick={() => setActiveTab("ai-confidence")}
        >
          <FontAwesomeIcon icon={faRobot} /> AI Confidence
        </button>
        <button
          className={`tab-button ${
            activeTab === "auto-assignment" ? "active" : ""
          }`}
          onClick={() => setActiveTab("auto-assignment")}
        >
          <FontAwesomeIcon icon={faBolt} /> Auto-Assignment
        </button>
        <button
          className={`tab-button ${activeTab === "escalation" ? "active" : ""}`}
          onClick={() => setActiveTab("escalation")}
        >
          <FontAwesomeIcon icon={faExclamationTriangle} /> Escalation
        </button>
        <button
          className={`tab-button ${activeTab === "keywords" ? "active" : ""}`}
          onClick={() => setActiveTab("keywords")}
        >
          <FontAwesomeIcon icon={faKey} /> Keyword Triggers
        </button>
        <button
          className={`tab-button ${activeTab === "sla" ? "active" : ""}`}
          onClick={() => setActiveTab("sla")}
        >
          <FontAwesomeIcon icon={faFileContract} /> SLA Rules
        </button>
      </div>

      {/* Tab Content */}
      <div className="automation-content">
        {/* AI Confidence Tab */}
        {activeTab === "ai-confidence" && (
          <div className="tab-panel">
            <div className="panel-header">
              <h2>AI Confidence Thresholds</h2>
              <p>
                Configure minimum confidence levels for AI analysis features
              </p>
            </div>

            <div className="confidence-settings">
              <div className="setting-card">
                <div className="setting-info">
                  <h3>Summary Confidence</h3>
                  <p>Minimum confidence for email/message summarization</p>
                </div>
                <div className="setting-control">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={confidenceSettings.summaryConfidence}
                    onChange={(e) =>
                      handleConfidenceChange(
                        "summaryConfidence",
                        e.target.value
                      )
                    }
                    className="confidence-slider"
                  />
                  <span className="confidence-value">
                    {confidenceSettings.summaryConfidence}%
                  </span>
                </div>
              </div>

              <div className="setting-card">
                <div className="setting-info">
                  <h3>Sentiment Analysis Confidence</h3>
                  <p>Minimum confidence for sentiment detection</p>
                </div>
                <div className="setting-control">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={confidenceSettings.sentimentConfidence}
                    onChange={(e) =>
                      handleConfidenceChange(
                        "sentimentConfidence",
                        e.target.value
                      )
                    }
                    className="confidence-slider"
                  />
                  <span className="confidence-value">
                    {confidenceSettings.sentimentConfidence}%
                  </span>
                </div>
              </div>

              <div className="setting-card">
                <div className="setting-info">
                  <h3>Priority Detection Confidence</h3>
                  <p>Minimum confidence for priority classification</p>
                </div>
                <div className="setting-control">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={confidenceSettings.priorityConfidence}
                    onChange={(e) =>
                      handleConfidenceChange(
                        "priorityConfidence",
                        e.target.value
                      )
                    }
                    className="confidence-slider"
                  />
                  <span className="confidence-value">
                    {confidenceSettings.priorityConfidence}%
                  </span>
                </div>
              </div>

              <div className="setting-card highlight">
                <div className="setting-info">
                  <h3>Auto-Accept Threshold</h3>
                  <p>Auto-accept AI summaries above this confidence level</p>
                </div>
                <div className="setting-control">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={confidenceSettings.autoAcceptThreshold}
                    onChange={(e) =>
                      handleConfidenceChange(
                        "autoAcceptThreshold",
                        e.target.value
                      )
                    }
                    className="confidence-slider"
                  />
                  <span className="confidence-value success">
                    {confidenceSettings.autoAcceptThreshold}%
                  </span>
                </div>
              </div>

              <div className="setting-card highlight">
                <div className="setting-info">
                  <h3>Auto-Reject Threshold</h3>
                  <p>Auto-reject AI summaries below this confidence level</p>
                </div>
                <div className="setting-control">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={confidenceSettings.autoRejectThreshold}
                    onChange={(e) =>
                      handleConfidenceChange(
                        "autoRejectThreshold",
                        e.target.value
                      )
                    }
                    className="confidence-slider"
                  />
                  <span className="confidence-value danger">
                    {confidenceSettings.autoRejectThreshold}%
                  </span>
                </div>
              </div>
            </div>

            <button className="save-button" onClick={handleSaveConfidence}>
              <FontAwesomeIcon icon={faSave} /> Save Confidence Settings
            </button>
          </div>
        )}

        {/* Auto-Assignment Tab */}
        {activeTab === "auto-assignment" && (
          <div className="tab-panel">
            <div className="panel-header">
              <h2>Auto-Assignment Rules</h2>
              <p>Automatically assign communications based on conditions</p>
              <button
                className="create-button"
                onClick={() => openCreateModal("assignment")}
              >
                <FontAwesomeIcon icon={faPlus} /> Create Rule
              </button>
            </div>

            <div className="rules-list">
              {assignmentRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`rule-card ${!rule.isActive ? "inactive" : ""}`}
                >
                  <div className="rule-header">
                    <h3>{rule.name}</h3>
                    <div className="rule-actions">
                      <button
                        className={`toggle-btn ${
                          rule.isActive ? "active" : ""
                        }`}
                        onClick={() => handleToggleRule("assignment", rule.id)}
                      >
                        <FontAwesomeIcon
                          icon={rule.isActive ? faToggleOn : faToggleOff}
                        />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteRule("assignment", rule.id)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                  <div className="rule-details">
                    <div className="rule-detail-row">
                      <span className="label">Condition:</span>
                      <span className="value">
                        {rule.condition === "priority" ? "Priority" : "Keyword"}
                      </span>
                    </div>
                    <div className="rule-detail-row">
                      <span className="label">Value:</span>
                      <span className="value">{rule.value}</span>
                    </div>
                    <div className="rule-detail-row">
                      <span className="label">Assign To:</span>
                      <span className="value highlight">{rule.assignTo}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Escalation Tab */}
        {activeTab === "escalation" && (
          <div className="tab-panel">
            <div className="panel-header">
              <h2>Escalation Rules</h2>
              <p>Define when and how communications should be escalated</p>
              <button
                className="create-button"
                onClick={() => openCreateModal("escalation")}
              >
                <FontAwesomeIcon icon={faPlus} /> Create Rule
              </button>
            </div>

            <div className="rules-list">
              {escalationRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`rule-card ${!rule.isActive ? "inactive" : ""}`}
                >
                  <div className="rule-header">
                    <h3>{rule.name}</h3>
                    <div className="rule-actions">
                      <button
                        className={`toggle-btn ${
                          rule.isActive ? "active" : ""
                        }`}
                        onClick={() => handleToggleRule("escalation", rule.id)}
                      >
                        <FontAwesomeIcon
                          icon={rule.isActive ? faToggleOn : faToggleOff}
                        />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteRule("escalation", rule.id)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                  <div className="rule-details">
                    <div className="rule-detail-row">
                      <span className="label">Trigger:</span>
                      <span className="value">{rule.trigger}</span>
                    </div>
                    <div className="rule-detail-row">
                      <span className="label">Escalate To:</span>
                      <span className="value highlight">{rule.escalateTo}</span>
                    </div>
                    <div className="rule-detail-row">
                      <span className="label">Time Limit:</span>
                      <span className="value">
                        <FontAwesomeIcon icon={faClock} /> {rule.timeLimit}{" "}
                        minutes
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Keyword Triggers Tab */}
        {activeTab === "keywords" && (
          <div className="tab-panel">
            <div className="panel-header">
              <h2>Keyword Triggers</h2>
              <p>Trigger actions when specific keywords are detected</p>
              <button
                className="create-button"
                onClick={() => openCreateModal("keyword")}
              >
                <FontAwesomeIcon icon={faPlus} /> Create Trigger
              </button>
            </div>

            <div className="rules-list">
              {keywordTriggers.map((trigger) => (
                <div
                  key={trigger.id}
                  className={`rule-card ${!trigger.isActive ? "inactive" : ""}`}
                >
                  <div className="rule-header">
                    <div className="keywords-tags">
                      {trigger.keywords.split(",").map((keyword, idx) => (
                        <span key={idx} className="keyword-tag">
                          {keyword.trim()}
                        </span>
                      ))}
                    </div>
                    <div className="rule-actions">
                      <button
                        className={`toggle-btn ${
                          trigger.isActive ? "active" : ""
                        }`}
                        onClick={() => handleToggleRule("keyword", trigger.id)}
                      >
                        <FontAwesomeIcon
                          icon={trigger.isActive ? faToggleOn : faToggleOff}
                        />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteRule("keyword", trigger.id)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                  <div className="rule-details">
                    <div className="rule-detail-row">
                      <span className="label">Action:</span>
                      <span className="value">{trigger.action}</span>
                    </div>
                    <div className="rule-detail-row">
                      <span className="label">Notify:</span>
                      <span className="value highlight">{trigger.notify}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SLA Rules Tab */}
        {activeTab === "sla" && (
          <div className="tab-panel">
            <div className="panel-header">
              <h2>SLA Rules</h2>
              <p>
                Service Level Agreement rules for response and resolution times
              </p>
              <button
                className="create-button"
                onClick={() => openCreateModal("sla")}
              >
                <FontAwesomeIcon icon={faPlus} /> Create SLA Rule
              </button>
            </div>

            <div className="rules-list">
              {slaRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`rule-card ${!rule.isActive ? "inactive" : ""}`}
                >
                  <div className="rule-header">
                    <h3>{rule.name}</h3>
                    <div className="rule-actions">
                      <button
                        className={`toggle-btn ${
                          rule.isActive ? "active" : ""
                        }`}
                        onClick={() => handleToggleRule("sla", rule.id)}
                      >
                        <FontAwesomeIcon
                          icon={rule.isActive ? faToggleOn : faToggleOff}
                        />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteRule("sla", rule.id)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                  <div className="rule-details">
                    <div className="rule-detail-row">
                      <span className="label">Priority Level:</span>
                      <span
                        className={`priority-badge ${rule.priority.toLowerCase()}`}
                      >
                        {rule.priority}
                      </span>
                    </div>
                    <div className="rule-detail-row">
                      <span className="label">First Response Time:</span>
                      <span className="value">
                        <FontAwesomeIcon icon={faClock} /> {rule.firstResponse}{" "}
                        hours
                      </span>
                    </div>
                    <div className="rule-detail-row">
                      <span className="label">Resolution Time:</span>
                      <span className="value">
                        <FontAwesomeIcon icon={faClock} /> {rule.resolution}{" "}
                        hours
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Rule Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                Create New{" "}
                {modalType === "assignment"
                  ? "Assignment"
                  : modalType === "escalation"
                  ? "Escalation"
                  : modalType === "keyword"
                  ? "Keyword Trigger"
                  : "SLA"}{" "}
                Rule
              </h2>
              <button
                className="close-button"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Form implementation for {modalType} rule creation</p>
            </div>
            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button className="submit-button" onClick={handleCreateRule}>
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AutomationRules;
