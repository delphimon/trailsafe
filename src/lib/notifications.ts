import * as Notifications from 'expo-notifications';
import { TripPlan, computeTripReminderIntents } from './plans';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldShowList: true,
    shouldSetBadge: false,
  }),
});

export async function scheduleTripReminders(plan: TripPlan) {
  if (Platform.OS === "web") return;
  
  // Cancel previous reminders specifically for this plan
  await cancelTripReminders(plan.id);
  
  const intents = computeTripReminderIntents(plan);
  if (intents.length === 0) return;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  for (const intent of intents) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: intent.title,
        body: intent.body,
        sound: true,
        data: { planId: intent.planId, type: intent.type },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: intent.triggerDate,
      },
    });
  }
}

export async function cancelTripReminders(planId?: string) {
  if (Platform.OS === "web") return;
  if (!planId) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return;
  }
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const item of scheduled) {
      if (item.content?.data?.planId === planId) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    }
  } catch {
    // Non-fatal if notification query fails on device
  }
}
