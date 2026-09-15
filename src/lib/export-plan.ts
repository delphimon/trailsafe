/**
 * @file export-plan.ts
 * @description Cross-platform PDF generation and system sharing for trip plans.
 *
 * On Web: Invokes the browser's native print preview dialog.
 * On iOS/Android: Renders HTML to a local PDF file, then presents the native OS share sheet.
 */

import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { TripPlan, planHTML } from "./plans";

/**
 * Generates and shares a formatted PDF representation of a trip plan.
 *
 * @param p The TripPlan to export.
 */
export async function exportPlan(p: TripPlan): Promise<void> {
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
