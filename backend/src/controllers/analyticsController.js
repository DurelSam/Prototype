const mongoose = require('mongoose');
const { User } = require('../models');
const Communication = require('../models/Communication');

function toHours(ms) {
  if (!ms || ms <= 0) return 0;
  return Math.round((ms / (1000 * 60 * 60)) * 10) / 10;
}

exports.getAdminsPerformance = async (req, res) => {
  try {
    const user = req.user;
    const tenantId = (user.tenant_id && user.tenant_id._id) ? user.tenant_id._id : user.tenant_id;
    const now = new Date();
    const daysParam = parseInt(req.query.days || '30', 10);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (isNaN(daysParam) ? 30 : daysParam));
    startDate.setHours(0, 0, 0, 0);

    let admins = [];
    if (user.role === 'UpperAdmin') {
      admins = await User.find({ tenant_id: tenantId, role: 'Admin' }).select('_id firstName lastName email');
    } else if (user.role === 'Admin') {
      admins = await User.find({ _id: user._id }).select('_id firstName lastName email');
    } else {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    const members = [];
    let overallDailyMap = new Map();
    let overallSummaries = 0;
    let overallProcessed = 0;
    let overallReceived = 0;
    let responseTimeSumMs = 0;
    let responseTimeCount = 0;
    let onTimeCount = 0;

    for (const admin of admins) {
      const employees = await User.find({ managedBy: admin._id }).select('_id');
      const userIds = [admin._id, ...employees.map(e => e._id)];

      const match = {
        tenant_id: tenantId,
        userId: { $in: userIds },
        receivedAt: { $gte: startDate, $lte: now },
      };

      const pipeline = [
        { $match: match },
        {
          $project: {
            receivedAt: 1,
            slaDueDate: 1,
            status: 1,
            'ai_analysis.summary': 1,
            'ai_analysis.sentiment': 1,
            hasBeenReplied: 1,
            autoResponseSentAt: 1,
            repliedAt: 1,
            'manualResponse.sentAt': 1,
            senderEmail: { $ifNull: ['$sender.email', null] },
            senderPhone: { $ifNull: ['$sender.phone', null] },
            processed: {
              $or: [
                { $eq: ['$hasBeenReplied', true] },
                { $in: ['$status', ['Validated', 'Closed', 'Archived']] },
              ],
            },
            responseAt: {
              $cond: [
                { $ne: ['$repliedAt', null] }, '$repliedAt',
                {
                  $cond: [
                    { $ne: ['$autoResponseSentAt', null] }, '$autoResponseSentAt', '$manualResponse.sentAt'
                  ]
                }
              ]
            },
          },
        },
        {
          $project: {
            receivedAt: 1,
            slaDueDate: 1,
            processed: 1,
            aiSummaryExists: { $cond: [{ $ne: ['$ai_analysis.summary', null] }, 1, 0] },
            sentiment: '$ai_analysis.sentiment',
            senderKey: { $ifNull: ['$senderEmail', '$senderPhone'] },
            responseTimeMs: {
              $cond: [
                { $and: [{ $ne: ['$responseAt', null] }, { $ne: ['$receivedAt', null] }] },
                { $subtract: ['$responseAt', '$receivedAt'] },
                null
              ]
            },
            onTime: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$processed', true] },
                    { $ne: ['$slaDueDate', null] },
                    { $ne: ['$responseAt', null] },
                    { $lte: ['$responseAt', '$slaDueDate'] },
                  ]
                },
                1,
                0
              ]
            },
            dateStr: { $dateToString: { format: '%Y-%m-%d', date: '$receivedAt' } },
          },
        },
      ];

      const docs = await Communication.aggregate(pipeline);
      const received = docs.length;
      const processed = docs.reduce((s, d) => s + (d.processed ? 1 : 0), 0);
      const aiSummariesCount = docs.reduce((s, d) => s + (d.aiSummaryExists || 0), 0);
      const sentiments = {
        Positive: docs.filter(d => d.sentiment === 'Positive').length,
        Neutral: docs.filter(d => d.sentiment === 'Neutral').length,
        Negative: docs.filter(d => d.sentiment === 'Negative').length,
      };
      const responseTimes = docs.filter(d => d.responseTimeMs != null).map(d => d.responseTimeMs);
      const avgResponseTimeHours = responseTimes.length ? toHours(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0;
      const onTimeFollowUpRate = received ? Math.round((docs.reduce((s, d) => s + (d.onTime || 0), 0) / received) * 100) : 0;
      const efficiency = received ? Math.round((processed / received) * 100) : 0;

      const dailyMap = new Map();
      for (const d of docs) {
        const entry = dailyMap.get(d.dateStr) || { dateStr: d.dateStr, received: 0, processed: 0 };
        entry.received += 1;
        if (d.processed) entry.processed += 1;
        dailyMap.set(d.dateStr, entry);

        const oEntry = overallDailyMap.get(d.dateStr) || { received: 0, processed: 0 };
        oEntry.received += 1;
        if (d.processed) oEntry.processed += 1;
        overallDailyMap.set(d.dateStr, oEntry);
      }

      const topSendersMap = new Map();
      for (const d of docs) {
        const key = d.senderKey || 'Unknown';
        topSendersMap.set(key, (topSendersMap.get(key) || 0) + 1);
      }
      const topSenders = Array.from(topSendersMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      members.push({
        adminId: admin._id,
        name: admin.firstName && admin.lastName ? `${admin.firstName} ${admin.lastName}` : admin.email,
        totals: { received, processed, efficiency, aiSummariesCount },
        avgResponseTimeHours,
        onTimeFollowUpRate,
        sentiment: sentiments,
        topSenders,
        daily: Array.from(dailyMap.values()).sort((a, b) => a.dateStr.localeCompare(b.dateStr)).map(e => ({
          date: new Date(e.dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
          received: e.received,
          processed: e.processed,
        })),
      });

      // Overall accumulations
      overallSummaries += aiSummariesCount;
      overallProcessed += processed;
      overallReceived += received;
      responseTimeSumMs += responseTimes.reduce((a, b) => a + b, 0);
      responseTimeCount += responseTimes.length;
      onTimeCount += docs.reduce((s, d) => s + (d.onTime || 0), 0);
    }

    const overallDaily = Array.from(overallDailyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([dateStr, e]) => ({
        date: new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        efficiency: e.received ? Math.round((e.processed / e.received) * 100) : 0,
      }));

    const result = {
      success: true,
      data: {
        overall: {
          totalSummaries: overallSummaries,
          avgResponseTimeHours: responseTimeCount ? toHours(responseTimeSumMs / responseTimeCount) : 0,
          onTimeFollowUpRate: overallReceived ? Math.round((onTimeCount / overallReceived) * 100) : 0,
          productivity: overallDaily,
        },
        members,
        period: { start: startDate, end: now, days: daysParam || 30 },
      },
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error('Erreur getAdminsPerformance:', error);
    return res.status(500).json({ success: false, message: 'Erreur analytics performance', error: error.message });
  }
};

exports.getActionItemsStatus = async (req, res) => {
  try {
    const user = req.user;
    const tenantId = (user.tenant_id && user.tenant_id._id) ? user.tenant_id._id : user.tenant_id;
    const now = new Date();
    const daysParam = parseInt(req.query.days || '30', 10);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (isNaN(daysParam) ? 30 : daysParam));
    startDate.setHours(0, 0, 0, 0);

    const base = { tenant_id: tenantId, receivedAt: { $gte: startDate, $lte: now } };
    let scope = {};
    if (user.role === 'Employee') {
      scope = { userId: user._id };
    } else if (user.role === 'Admin') {
      const employees = await User.find({ managedBy: user._id }).select('_id');
      const ids = [user._id, ...employees.map(e => e._id)];
      scope = { userId: { $in: ids } };
    }

    const completedFilter = {
      ...base,
      ...scope,
      $or: [
        { hasBeenReplied: true },
        { status: { $in: ['Validated', 'Closed', 'Archived'] } },
      ],
    };
    const inProgressFilter = {
      ...base,
      ...scope,
      status: 'To Validate',
      'ai_analysis.requiresResponse': true,
    };
    const pendingFilter = {
      ...base,
      ...scope,
      status: 'To Validate',
      'ai_analysis.requiresResponse': false,
    };

    const [completed, inProgress, pending] = await Promise.all([
      Communication.countDocuments(completedFilter),
      Communication.countDocuments(inProgressFilter),
      Communication.countDocuments(pendingFilter),
    ]);

    return res.status(200).json({
      success: true,
      data: { actionItemsStatus: { completed, inProgress, pending } },
    });
  } catch (error) {
    console.error('Erreur getActionItemsStatus:', error);
    return res.status(500).json({ success: false, message: 'Erreur action items', error: error.message });
  }
};
