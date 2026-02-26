const db = require('../config/database');

const COUPON_VALUE_MWK = 1000;
const TARGET_COUPONS = 100;
const CLAIM_COOLDOWN_MS = 5000;

class RewardCoupon {
  static async ensureTable() {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS reward_coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        coupons_count INT NOT NULL DEFAULT 0,
        last_claimed_at DATETIME NULL,
        completed_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  }

  static buildProgress(row) {
    const coupons = row?.coupons_count || 0;
    const totalValueMwk = coupons * COUPON_VALUE_MWK;
    const remainingCoupons = Math.max(0, TARGET_COUPONS - coupons);
    return {
      coupons,
      couponValueMwk: COUPON_VALUE_MWK,
      totalValueMwk,
      targetCoupons: TARGET_COUPONS,
      targetValueMwk: TARGET_COUPONS * COUPON_VALUE_MWK,
      remainingCoupons,
      completed: coupons >= TARGET_COUPONS
    };
  }

  static async getProgress(userId) {
    await this.ensureTable();
    const [rows] = await db.execute('SELECT * FROM reward_coupons WHERE user_id = ? LIMIT 1', [userId]);
    if (!rows || rows.length === 0) {
      return this.buildProgress({ coupons_count: 0 });
    }
    return this.buildProgress(rows[0]);
  }

  static async claimCoupon(userId) {
    await this.ensureTable();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const [rows] = await conn.execute('SELECT * FROM reward_coupons WHERE user_id = ? LIMIT 1 FOR UPDATE', [userId]);
      let row = rows[0];

      if (!row) {
        await conn.execute('INSERT INTO reward_coupons (user_id, coupons_count) VALUES (?, 0)', [userId]);
        const [newRows] = await conn.execute('SELECT * FROM reward_coupons WHERE user_id = ? LIMIT 1 FOR UPDATE', [userId]);
        row = newRows[0];
      }

      const now = Date.now();
      if (row.last_claimed_at) {
        const elapsed = now - new Date(row.last_claimed_at).getTime();
        if (elapsed < CLAIM_COOLDOWN_MS) {
          await conn.rollback();
          return {
            ok: false,
            reason: 'cooldown',
            retryAfterMs: CLAIM_COOLDOWN_MS - elapsed,
            progress: this.buildProgress(row)
          };
        }
      }

      if (row.coupons_count >= TARGET_COUPONS) {
        await conn.rollback();
        return {
          ok: false,
          reason: 'completed',
          progress: this.buildProgress(row)
        };
      }

      const newCount = row.coupons_count + 1;
      const completed = newCount >= TARGET_COUPONS;
      await conn.execute(
        'UPDATE reward_coupons SET coupons_count = ?, last_claimed_at = NOW(), completed_at = ? WHERE user_id = ?',
        [newCount, completed ? new Date() : null, userId]
      );

      await conn.commit();
      const progress = this.buildProgress({ coupons_count: newCount });
      return {
        ok: true,
        progress,
        completed
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = RewardCoupon;

