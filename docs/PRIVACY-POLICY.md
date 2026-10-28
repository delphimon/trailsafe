# Privacy Policy for TrailSafe

**Center for Adventure Leadership**  
**Effective Date:** October 27, 2026  
**Website:** [https://adventureleader.org](https://adventureleader.org)  
**Hosted Policy URL:** [https://adventureleader.org/privacy](https://adventureleader.org/privacy)

---

## 1. Our Privacy Commitment

The Center for Adventure Leadership built **TrailSafe** as an offline-first hiking preparation and wilderness emergency companion. Our mission is to train adults to be safe and effective adventure leaders for youth. 

We believe that safety tools used in the backcountry must respect personal privacy by design. **TrailSafe is built so that you do not need an account, your activity is not tracked, and your personal data never leaves your device unless you explicitly choose to share it.**

---

## 2. Information We Do NOT Collect

* **No Accounts or Logins:** You never need to create an account, register, or provide an email address, password, or phone number to use TrailSafe.
* **No Cloud Database:** We do not operate a remote user database or backend server for TrailSafe. We do not store or sync your trip plans, profile, or gear checklists to the cloud.
* **No Behavioral Analytics:** We do not use third-party behavioral analytics, event trackers, or telemetry SDKs to monitor how you navigate the app.
* **No Advertising:** TrailSafe contains no commercial advertisements, tracking pixels, or advertising identifiers (IDFA/AAID).
* **No Background Location Tracking:** TrailSafe never runs background location services or tracks your movement when the app is closed or minimized.

---

## 3. Information Handled Locally on Your Device

All information entered into or computed by TrailSafe is processed and stored strictly on your local device:

### A. Location Data (GPS)
* **How It Is Used:** TrailSafe requests foreground-only location access (`When In Use`) to acquire your current GPS coordinates. This enables coordinate display (in Decimal Degrees, Degrees Decimal Minutes, or UTM format), local magnetic declination estimates, sunrise/sunset daylight planning, and pre-filling your location in emergency text message drafts.
* **Ephemeral Processing:** Coordinates are acquired and held in transient memory only. Location fixes are **never** attached to saved trip plans, uploaded to remote servers, or saved to durable local storage.
* **Full User Control:** Location acquisition is active only while viewing screens that explicitly display or calculate location information (such as Emergency, Daylight, and Coordinate tools). GPS hardware shuts down immediately when you navigate away or background the app.

### B. Trip Plans and Reusable Profile
* **What Is Stored:** Details you choose to input—such as trip destinations, planned trails, turnaround times, check-in deadlines, party members, emergency contacts, vehicle descriptions, and gear checklist progress—are saved exclusively in local storage on your device (`AsyncStorage`).
* **Device Backups:** If you use device-level backup services provided by your operating system (such as Apple iCloud Backup or Google Android Backup), your locally stored app preferences may be included in your encrypted device backup according to your system settings.

### C. Check-in Reminders & Notifications
* TrailSafe does not use remote push notifications (Apple Push Notification service or Firebase Cloud Messaging).
* Optional return-time and check-in reminders are scheduled entirely as local on-device alarms. They do not communicate with external servers.

---

## 4. Communications and Third-Party Handoffs

TrailSafe is an offline companion, not a dispatch service. It does not automatically notify contacts, report overdue trips, or contact emergency responders.

Data is only transferred to other applications when you explicitly tap a native system action:

* **Emergency Calling (Call 911):** Tapping "CALL 911" passes the telephone number `911` to your device’s native telephone dialer (`tel:911`). You must confirm and initiate the call in the system dialer. TrailSafe does not place calls automatically.
* **Emergency Texting (Text 911):** Tapping "TEXT 911" opens your device's native SMS composer with a pre-filled draft containing your coordinates (or the last known location of a missing subject) and emergency details. You review, edit, and send the message yourself.
* **Trip Plan Sharing & PDF Export:** Exporting or sharing a trip plan generates a local document and presents your device's native OS share sheet (e.g., Mail, AirDrop, Messages). Data is transmitted solely to the recipient(s) you select.
* **Maps & External Links:** Opening external map directions or resource citations hands the URL to your system browser or map application. External websites operate under their own privacy policies.

---

## 5. Diagnostic and Crash Reporting Policy

* **Production Store Releases:** Final release builds distributed through the Apple App Store and Google Play Store have all third-party crash reporting and telemetry services (including Bugsnag) completely disabled and stripped from the application binary.
* **Pre-Release Testing Builds:** Pre-release test builds (such as internal developer previews or Apple TestFlight builds) may enable Bugsnag to capture unhandled native crashes. Pre-release crash reports are configured to redact user identifiers, sanitize stack traces, and exclude personal trip plan data.

---

## 6. Data Retention and Deletion

Because all your data is stored locally on your device, you have complete control over its retention:

* **In-App Data Reset:** You can permanently erase all saved trip plans, profile details, checklist progress, and preferences at any time by tapping **Delete all local data** in the app's **About** screen.
* **App Deletion:** Uninstalling TrailSafe from your device removes all local data stored by the application.

---

## 7. Children's Privacy

TrailSafe does not solicit or collect personal information from anyone, including children under the age of 13.

---

## 8. Updates to This Policy

We may update this Privacy Policy from time to time. Any changes will be posted at [https://adventureleader.org/privacy](https://adventureleader.org/privacy) with an updated effective date.

---

## 9. Contact Us

If you have questions about this Privacy Policy or TrailSafe's privacy practices, please contact us:

**Center for Adventure Leadership**  
Website: [https://adventureleader.org](https://adventureleader.org)  
Contact: [https://adventureleader.org/contact](https://adventureleader.org/contact)
