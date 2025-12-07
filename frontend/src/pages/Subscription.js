import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Subscription.css";

function Subscription() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const currentPlan = {
    name: "Trial",
    price: 0,
    period: "Trial",
    status: "Active",
    startDate: new Date("2024-11-01"),
    endDate: new Date("2024-12-01"),
    autoRenew: false,
  };

  const plans = [
    {
      id: "trial",
      name: "Trial",
      description: "Try out all features for free",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        "50 communications/month",
        "Basic AI analysis",
        "1 user",
        "Email support",
        "7 days data retention",
      ],
      recommended: false,
      accentColor: "#6b7280",
    },
    {
      id: "basic",
      name: "Basic",
      description: "Perfect for small teams",
      monthlyPrice: 29,
      yearlyPrice: 290,
      features: [
        "500 communications/month",
        "Advanced AI analysis",
        "Up to 5 users",
        "Email & chat support",
        "30 days data retention",
        "Outlook + WhatsApp",
      ],
      recommended: false,
      accentColor: "#3b82f6",
    },
    {
      id: "pro",
      name: "Pro",
      description: "For growing businesses",
      monthlyPrice: 79,
      yearlyPrice: 790,
      features: [
        "Unlimited communications",
        "Premium AI analysis",
        "Up to 20 users",
        "Priority 24/7 support",
        "90 days data retention",
        "All integrations + API",
        "Custom reports",
      ],
      recommended: true,
      accentColor: "#8b5cf6",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "For large organizations",
      monthlyPrice: 199,
      yearlyPrice: 1990,
      features: [
        "Everything in Pro",
        "Unlimited users & storage",
        "Dedicated manager",
        "Custom AI training",
        "White-label + On-premise",
        "SLA & Custom integrations",
      ],
      recommended: false,
      accentColor: "#14b8a6",
    },
  ];

  const usage = {
    communications: 127,
    limit: 500,
    users: 3,
    userLimit: 5,
    storage: "2.4 GB",
    storageLimit: "10 GB",
  };

  const billingHistory = [
    {
      id: 1,
      date: new Date("2024-11-01"),
      description: "Trial Plan",
      amount: 0,
      status: "Active",
    },
  ];

  const formatDate = (date) =>
    date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const handleUpgrade = async (planId) => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    await new Promise((r) => setTimeout(r, 1500));
    setMessage({ type: "success", text: "Redirecting to secure checkout..." });
    setTimeout(() => alert("Payment gateway would open here"), 1000);
    setLoading(false);
  };

  return (
    <div className="subscription-page">
      <header className="page-header">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
        <h1 className="page-title">Subscription & Billing</h1>
      </header>

      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      {/* Current Plan */}
      <section className="current-plan-card">
        <div className="current-header">
          <h2>Current Plan</h2>
          <span className="plan-badge trial">Trial Active</span>
        </div>
        <div className="plan-details">
          <div className="plan-main">
            <h3>Trial Plan</h3>
            <div className="price-large">
              $0<span className="period">/forever (30 days)</span>
            </div>
          </div>
          <div className="dates-grid">
            <div>
              <span>Started:</span> {formatDate(currentPlan.startDate)}
            </div>
            <div>
              <span>Ends:</span> {formatDate(currentPlan.endDate)}
            </div>
          </div>
        </div>

        <div className="usage-grid">
          <div className="usage-item">
            <div className="usage-label">Communications</div>
            <div className="usage-bar">
              <div className="fill" style={{ width: "25%" }}></div>
            </div>
            <div className="usage-text">127 / 500</div>
          </div>
          <div className="usage-item">
            <div className="usage-label">Users</div>
            <div className="usage-bar">
              <div className="fill" style={{ width: "60%" }}></div>
            </div>
            <div className="usage-text">3 / 5</div>
          </div>
          <div className="usage-item">
            <div className="usage-label">Storage</div>
            <div className="usage-bar">
              <div className="fill" style={{ width: "24%" }}></div>
            </div>
            <div className="usage-text">2.4 GB / 10 GB</div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="plans-section">
        <div className="section-header">
          <h2>Choose Your Plan</h2>
          <div className="billing-toggle">
            <button
              className={billingPeriod === "monthly" ? "active" : ""}
              onClick={() => setBillingPeriod("monthly")}
            >
              Monthly
            </button>
            <button
              className={billingPeriod === "yearly" ? "active" : ""}
              onClick={() => setBillingPeriod("yearly")}
            >
              Yearly <span className="save-badge">Save up to 20%</span>
            </button>
          </div>
        </div>

        <div className="plans-grid">
          {plans.map((plan) => {
            const price =
              billingPeriod === "monthly"
                ? plan.monthlyPrice
                : plan.yearlyPrice;
            const isCurrent = currentPlan.name === plan.name;

            return (
              <div
                key={plan.id}
                className={`plan-card ${plan.recommended ? "recommended" : ""}`}
                style={{ "--accent": plan.accentColor }}
              >
                {plan.recommended && (
                  <div className="recommended-badge">Most Popular</div>
                )}
                <h3>{plan.name}</h3>
                <div className="price">
                  ${price}
                  <span className="period">
                    /{billingPeriod === "monthly" ? "mo" : "yr"}
                  </span>
                </div>
                {billingPeriod === "yearly" && plan.monthlyPrice > 0 && (
                  <div className="yearly-save">
                    Save ${(plan.monthlyPrice * 12 - price).toFixed(0)}/yr
                  </div>
                )}
                <p>{plan.description}</p>
                <ul className="features">
                  {plan.features.map((f, i) => (
                    <li key={i}>✓ {f}</li>
                  ))}
                </ul>
                <button
                  className={`plan-btn ${isCurrent ? "current" : ""}`}
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || loading}
                >
                  {isCurrent ? "Current Plan" : "Upgrade Now"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Billing History */}
      <section className="billing-history">
        <h2>Billing History</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {billingHistory.map((t) => (
                <tr key={t.id}>
                  <td>{formatDate(t.date)}</td>
                  <td>{t.description}</td>
                  <td>${t.amount.toFixed(2)}</td>
                  <td>
                    <span className="status active">{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Subscription;
