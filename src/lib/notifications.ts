import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { type TripPlan } from "./plans";
import {
  reconcileReminders,
  type ReminderStatus,
} from "./reminder-reconciliation";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldShowList: true,
    shouldSetBadge: false,
  }),
});
export async function reconcileTripReminders(
  plans: TripPlan[],
  requestPermission = false,
): Promise<ReminderStatus> {
  if (Platform.OS === "web")
    return plans.some((p) => p.status === "current" && p.remind)
      ? "unavailable"
      : "idle";
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync("trip-check-in", {
      name: "Trip check-in reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  return reconcileReminders(
    plans,
    {
      list: async () =>
        (await Notifications.getAllScheduledNotificationsAsync()).map((p) => ({
          identifier: p.identifier,
          data: p.content.data,
        })),
      cancel: Notifications.cancelScheduledNotificationAsync,
      permission: async (request) => {
        let p = await Notifications.getPermissionsAsync();
        if (!p.granted && request && p.canAskAgain)
          p = await Notifications.requestPermissionsAsync();
        return p.granted;
      },
      schedule: async (identifier, intent) => {
        await Notifications.scheduleNotificationAsync({
          identifier,
          content: {
            title: intent.title,
            body: intent.body,
            sound: true,
            data: {
              owner: "trailsafe",
              planId: intent.planId,
              type: intent.type,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: intent.triggerDate,
            channelId: "trip-check-in",
          },
        });
      },
    },
    requestPermission,
  );
}
