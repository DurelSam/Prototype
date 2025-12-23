const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../src/config/database');
const Communication = require('../src/models/Communication');
const User = require('../src/models/User');

(async () => {
  try {
    await connectDB();
    const user = await User.findOne({ email: 'durelzanfack@gmail.com' });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    const filter = { tenant_id: user.tenant_id };
    const thirtyAgo = new Date();
    thirtyAgo.setDate(thirtyAgo.getDate() - 30);
    thirtyAgo.setHours(0, 0, 0, 0);

    const agg = await Communication.aggregate([
      { $match: { ...filter, receivedAt: { $gte: thirtyAgo } } },
      { $project: { date: { $dateToString: { format: '%Y-%m-%d', date: '$receivedAt' } }, source: 1 } },
      { $group: {
          _id: '$date',
          emails: { $sum: { $cond: [{ $ne: ['$source', 'whatsapp'] }, 1, 0] } },
          whatsapp: { $sum: { $cond: [{ $eq: ['$source', 'whatsapp'] }, 1, 0] } },
        }
      },
      { $sort: { _id: 1 } },
    ]);

    const map = new Map(agg.map(i => [i._id, i]));
    const out = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const k = d.toISOString().split('T')[0];
      const v = map.get(k) || { emails: 0, whatsapp: 0 };
      out.push({ date: k, emails: v.emails, whatsapp: v.whatsapp });
    }
    console.log('Tenant:', user.tenant_id.toString());
    console.log('30d volume (date, emails, whatsapp):');
    console.table(out);
    console.log('Total emails (30d):', out.reduce((s, x) => s + (x.emails || 0), 0));
    console.log('Total whatsapp (30d):', out.reduce((s, x) => s + (x.whatsapp || 0), 0));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
