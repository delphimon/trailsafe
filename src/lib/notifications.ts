import * as Notifications from 'expo-notifications';
import { TripPlan } from './plans';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldShowList: true,
    shouldSetBadge: false,
  }),
});

function parseDateTime(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr) return null;
  const d = new Date(`${dateStr}T${timeStr}:00`);
  return isNaN(d.getTime()) ? null : d;
}

export async function scheduleTripReminders(plan: TripPlan) {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const returnDate = parseDateTime(plan.returnDate, plan.returnTime);
  if (returnDate && returnDate.getTime() > Date.now()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Expected Return Time",
        body: `You are scheduled to be back from ${plan.title || "your trip"} now. Remember to text your contact to let them know you're safe.`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: returnDate,
      },
    });
  }

  const overdueDate = parseDateTime(plan.overdueDate, plan.overdueTime);
  if (overdueDate && overdueDate.getTime() > Date.now()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Trip Overdue",
        body: `Your trip is now overdue. If you are safe, contact your designated emergency contact immediately before they notify 911.`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: overdueDate,
      },
    });
  }
}

export async function cancelTripReminders() {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
