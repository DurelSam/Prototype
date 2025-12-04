import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Subscription.css';

function Subscription() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' or 'yearly'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Current subscription
  const currentPlan = {
    name: 'Trial',
    price: 0,
    period: 'Trial',
    status: 'Active',
    startDate: new Date('2024-11-01'),
    endDate: new Date('2024-12-01'),
    autoRenew: false
  };

  // Available plans
  const plans = [
    {
      id: 'trial',
      name: 'Trial',
      description: 'Try out all features for free',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        '50 communications/month',
        'Basic AI analysis',
        '1 user',
        'Email support',
        '7 days data retention'
      ],
      recommended: false,
      color: '#9ca3af'
    },
    {
      id: 'basic',
      name: 'Basic',
      description: 'Perfect for small teams',
      monthlyPrice: 29,
      yearlyPrice: 290,
      features: [
        '500 communications/month',
        'Advanced AI analysis',
        'Up to 5 users',
        'Email & chat support',
        '30 days data retention',
        'Outlook integration',
        'WhatsApp integration'
      ],
      recommended: false,
      color: '#3b82f6'
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For growing businesses',
      monthlyPrice: 79,
      yearlyPrice: 790,
      features: [
        'Unlimited communications',
        'Premium AI analysis',
        'Up to 20 users',
        'Priority support 24/7',
        '90 days data retention',
        'All integrations',
        'Custom reports',
        'API access',
        'Advanced analytics'
      ],
      recommended: true,
      color: '#8b5cf6'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large organizations',
      monthlyPrice: 199,
      yearlyPrice: 1990,
      features: [
        'Everything in Pro',
        'Unlimited users',
        'Dedicated account manager',
        'Custom AI training',
        'Unlimited data retention',
        'Custom integrations',
        'SLA guarantee',
        'On-premise deployment option',
        'White-label solution'
      ],
      recommended: false,
      color: '#00c6ff'
    }
  ];

  // Usage statistics
  const usage = {
    communications: 127,
    limit: 500,
    users: 3,
    userLimit: 5,
    storage: '2.4 GB',
    storageLimit: '10 GB'
  };

  // Billing history
  const billingHistory = [
    {
      id: 1,
      date: new Date('2024-11-01'),
      description: 'Trial Plan - Monthly',
      amount: 0,
      status: 'Paid'
    }
  ];

  const handleUpgrade = async (planId) => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // TODO: API call to upgrade subscription
      await new Promise(resolve => setTimeout(resolve, 2000));

      setMessage({
        type: 'success',
        text: 'Subscription upgraded successfully! Redirecting to payment...'
      });

      setTimeout(() => {
        // Redirect to payment page
        alert('Payment page would open here');
      }, 1500);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upgrade. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // TODO: API call to cancel subscription
      await new Promise(resolve => setTimeout(resolve, 1500));

      setMessage({
        type: 'success',
        text: 'Subscription cancelled. You can continue using until the end of your billing period.'
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to cancel. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateSavings = (monthly, yearly) => {
    const monthlyTotal = monthly * 12;
    const savings = monthlyTotal - yearly;
    const percentage = Math.round((savings / monthlyTotal) * 100);
    return { amount: savings, percentage };
  };

  return (
    <div className="subscription-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1 className="page-title">Subscription & Billing</h1>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Current Plan Section */}
      <div className="current-plan-section">
        <div className="section-header">
          <h2>Current Plan</h2>
          <span className={`plan-status ${currentPlan.status.toLowerCase()}`}>
            {currentPlan.status}
          </span>
        </div>

        <div className="current-plan-card">
          <div className="plan-info">
            <h3>{currentPlan.name}</h3>
            <div className="plan-price">
              <span className="price">${currentPlan.price}</span>
              <span className="period">/{currentPlan.period}</span>
            </div>
          </div>

          <div className="plan-dates">
            <div className="date-item">
              <span className="date-label">Start Date:</span>
              <span className="date-value">{formatDate(currentPlan.startDate)}</span>
            </div>
            <div className="date-item">
              <span className="date-label">End Date:</span>
              <span className="date-value">{formatDate(currentPlan.endDate)}</span>
            </div>
            <div className="date-item">
              <span className="date-label">Auto-Renew:</span>
              <span className="date-value">{currentPlan.autoRenew ? 'Yes' : 'No'}</span>
            </div>
          </div>

          {currentPlan.name !== 'Enterprise' && (
            <button className="cancel-button" onClick={handleCancelSubscription}>
              Cancel Subscription
            </button>
          )}
        </div>

        {/* Usage Stats */}
        <div className="usage-stats">
          <h3>Usage This Month</h3>
          <div className="usage-items">
            <div className="usage-item">
              <div className="usage-header">
                <span className="usage-label">Communications</span>
                <span className="usage-value">
                  {usage.communications} / {usage.limit}
                </span>
              </div>
              <div className="usage-bar">
                <div
                  className="usage-fill"
                  style={{ width: `${(usage.communications / usage.limit) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="usage-item">
              <div className="usage-header">
                <span className="usage-label">Users</span>
                <span className="usage-value">
                  {usage.users} / {usage.userLimit}
                </span>
              </div>
              <div className="usage-bar">
                <div
                  className="usage-fill"
                  style={{ width: `${(usage.users / usage.userLimit) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="usage-item">
              <div className="usage-header">
                <span className="usage-label">Storage</span>
                <span className="usage-value">
                  {usage.storage} / {usage.storageLimit}
                </span>
              </div>
              <div className="usage-bar">
                <div className="usage-fill" style={{ width: '24%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Plans Section */}
      <div className="plans-section">
        <div className="section-header">
          <h2>Available Plans</h2>
          <div className="billing-toggle">
            <button
              className={`toggle-btn ${billingPeriod === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingPeriod('monthly')}
            >
              Monthly
            </button>
            <button
              className={`toggle-btn ${billingPeriod === 'yearly' ? 'active' : ''}`}
              onClick={() => setBillingPeriod('yearly')}
            >
              Yearly
              <span className="savings-badge">Save up to 20%</span>
            </button>
          </div>
        </div>

        <div className="plans-grid">
          {plans.map((plan) => {
            const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
            const savings =
              billingPeriod === 'yearly' && plan.monthlyPrice > 0
                ? calculateSavings(plan.monthlyPrice, plan.yearlyPrice)
                : null;

            return (
              <div
                key={plan.id}
                className={`plan-card ${plan.recommended ? 'recommended' : ''}`}
                style={{ '--plan-color': plan.color }}
              >
                {plan.recommended && <div className="recommended-badge">Recommended</div>}

                <div className="plan-header">
                  <h3>{plan.name}</h3>
                  <p className="plan-description">{plan.description}</p>
                  <div className="plan-pricing">
                    <span className="plan-price">${price}</span>
                    <span className="plan-period">
                      /{billingPeriod === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                  {savings && (
                    <div className="savings-info">
                      Save ${savings.amount}/year ({savings.percentage}% off)
                    </div>
                  )}
                </div>

                <ul className="plan-features">
                  {plan.features.map((feature, index) => (
                    <li key={index}>
                      <span className="feature-icon">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={`plan-button ${
                    currentPlan.name === plan.name ? 'current' : ''
                  }`}
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={currentPlan.name === plan.name || loading}
                >
                  {currentPlan.name === plan.name ? 'Current Plan' : `Upgrade to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing History */}
      <div className="billing-history-section">
        <h2>Billing History</h2>
        <div className="billing-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {billingHistory.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{formatDate(transaction.date)}</td>
                  <td>{transaction.description}</td>
                  <td className="amount">${transaction.amount.toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${transaction.status.toLowerCase()}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td>
                    <button className="invoice-button" disabled={transaction.amount === 0}>
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQs */}
      <div className="faqs-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faqs-grid">
          <div className="faq-item">
            <h4>Can I change my plan anytime?</h4>
            <p>
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect
              immediately, and we'll prorate any charges.
            </p>
          </div>

          <div className="faq-item">
            <h4>What payment methods do you accept?</h4>
            <p>
              We accept all major credit cards (Visa, MasterCard, American Express) and PayPal.
              Enterprise customers can also pay via bank transfer.
            </p>
          </div>

          <div className="faq-item">
            <h4>Is there a free trial?</h4>
            <p>
              Yes! All new accounts start with a 30-day free trial of our Pro plan. No credit card
              required.
            </p>
          </div>

          <div className="faq-item">
            <h4>What happens if I cancel?</h4>
            <p>
              You can continue using your current plan until the end of your billing period. Your
              data will be retained for 90 days after cancellation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Subscription;
