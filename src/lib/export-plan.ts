import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { TripPlan, planHTML } from "./plans";
export async function exportPlan(p: TripPlan) {
  const html = planHTML(p);
  if (Platform.OS === "web") {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync())
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: "Share TrailSafe trip plan",
    });
  else await Print.printAsync({ uri });
}
