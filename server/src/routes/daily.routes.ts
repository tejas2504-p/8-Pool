import { Router, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { AuthRequest } from '../types/auth';
import { DailyReward } from '../models/DailyReward';
import { User } from '../models/User';
import { Inventory } from '../models/Inventory';

const router = Router();

export const REWARDS_CALENDAR = [
  { day: 1, coins: 100, xp: 0, item: null, title: '100 Coins', icon: '🪙' },
  { day: 2, coins: 150, xp: 0, item: null, title: '150 Coins', icon: '🪙' },
  { day: 3, coins: 200, xp: 0, item: null, title: '200 Coins', icon: '🪙' },
  { day: 4, coins: 300, xp: 100, item: null, title: '300 Coins + 100 XP', icon: '✨' },
  { day: 5, coins: 500, xp: 0, item: null, title: '500 Coins', icon: '🪙' },
  { day: 6, coins: 750, xp: 250, item: null, title: '750 Coins + 250 XP', icon: '✨' },
  { day: 7, coins: 1500, xp: 500, item: 'cue_dragon_blaze', title: '1,500 Coins + Legendary Cue', icon: '👑' },
];

router.use(protect);

/**
 * GET /api/daily-rewards/status
 * Get current daily reward claim status and 7-day calendar metadata
 */
router.get('/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    let record = await DailyReward.findOne({ user: userId });
    if (!record) {
      record = new DailyReward({ user: userId, streak: 0, lastClaimDate: null, claimedDays: [] });
      await record.save();
    }

    const now = new Date();
    let canClaimToday = true;
    let currentStreak = record.streak;

    const isDev = process.env.NODE_ENV !== 'production';
    const cooldownHours = isDev ? 0.0028 : 20; // ~10 seconds in dev, 20 hours in prod
    const streakResetHours = isDev ? 720 : 48; // 30 days in dev, 48 hours in prod

    if (record.lastClaimDate) {
      const last = new Date(record.lastClaimDate);
      const hoursDiff = (now.getTime() - last.getTime()) / (1000 * 60 * 60);

      if (hoursDiff < cooldownHours) {
        canClaimToday = false;
      } else if (hoursDiff > streakResetHours) {
        // Streak lost due to missing a day - reset
        currentStreak = 0;
        record.streak = 0;
        record.claimedDays = [];
        await record.save();
      }
    }

    res.json({
      streak: currentStreak,
      canClaimToday,
      claimedDays: record.claimedDays,
      calendar: REWARDS_CALENDAR,
      nextDayToClaim: canClaimToday ? (currentStreak >= 7 ? 1 : currentStreak + 1) : null,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch daily reward status' });
  }
});

/**
 * POST /api/daily-rewards/claim
 * Claim today's daily reward
 */
router.post('/claim', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    let record = await DailyReward.findOne({ user: userId });
    if (!record) {
      record = new DailyReward({ user: userId, streak: 0, lastClaimDate: null, claimedDays: [] });
    }

    const now = new Date();
    if (record.lastClaimDate) {
      const hoursDiff = (now.getTime() - new Date(record.lastClaimDate).getTime()) / (1000 * 60 * 60);
      const isDev = process.env.NODE_ENV !== 'production';
      const cooldownHours = isDev ? 0.0028 : 20; // ~10 seconds in dev, 20 hours in prod
      if (hoursDiff < cooldownHours) {
        res.status(400).json({ message: 'Daily reward already claimed today. Come back tomorrow!' });
        return;
      }
    }

    // Determine today's day number to claim
    let nextStreak = record.streak + 1;
    if (nextStreak > 7 || record.claimedDays.length >= 7) {
      nextStreak = 1;
      record.claimedDays = [];
    }

    const rewardObj = REWARDS_CALENDAR.find((r) => r.day === nextStreak) || REWARDS_CALENDAR[0];

    // Award user coins and XP
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.coins += rewardObj.coins;
    user.xp += rewardObj.xp;
    await user.save();

    // If day 7 has a item reward, add to inventory
    if (rewardObj.item) {
      let inventory = await Inventory.findOne({ user: userId });
      if (!inventory) {
        inventory = new Inventory({ user: userId });
      }
      if (!inventory.ownedItemIds.includes(rewardObj.item)) {
        inventory.ownedItemIds.push(rewardObj.item);
        await inventory.save();
      }
    }

    // Update DailyReward record
    record.streak = nextStreak;
    record.lastClaimDate = now;
    if (!record.claimedDays.includes(nextStreak)) {
      record.claimedDays.push(nextStreak);
    }
    await record.save();

    res.json({
      message: `Claimed Day ${nextStreak} reward!`,
      reward: rewardObj,
      streak: nextStreak,
      coins: user.coins,
      xp: user.xp,
      claimedDays: record.claimedDays,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to claim daily reward' });
  }
});

export default router;
