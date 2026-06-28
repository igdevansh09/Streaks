const { Expo } = require("expo-server-sdk");

const expo = new Expo();

const TOKEN = process.env.EXPO_TOKEN || "ExponentPushToken[REPLACE_ME]";
const HABIT_ID = process.env.HABIT_ID || "REPLACE_WITH_REAL_HABIT_ID";

async function sendPush() {
  if (!Expo.isExpoPushToken(TOKEN)) {
    console.error(`❌ Invalid Expo push token: ${TOKEN}`);
    process.exit(1);
  }

  const messages = [
    {
      to: TOKEN,
      sound: "default",
      title: "🔔 streaks Reminder",
      body: "Time to complete your habit! Tap to log it.",
      data: {
        screen: "/habit",
        habitId: HABIT_ID,
      },
      channelId: "streaks-reminders",
    },
  ];

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
      console.log("✅ Tickets received:", JSON.stringify(ticketChunk, null, 2));
    } catch (e) {
      console.error("❌ Send error:", e);
    }
  }

  const receiptIds = tickets.filter((t) => t.status === "ok").map((t) => t.id);

  if (receiptIds.length === 0) {
    console.log("No receipt IDs to check (tickets may have errored).");
    return;
  }

  const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
  for (const chunk of receiptIdChunks) {
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      for (const [id, receipt] of Object.entries(receipts)) {
        if (receipt.status === "ok") {
          console.log(`✅ Receipt ${id}: delivered`);
        } else if (receipt.status === "error") {
          console.error(`❌ Receipt ${id} error:`, receipt.message);
          if (receipt.details?.error === "DeviceNotRegistered") {
            console.warn(
              "⚠️  DeviceNotRegistered — drop this token from your DB:",
              TOKEN,
            );
          }
        }
      }
    } catch (e) {
      console.error("Receipt check error:", e);
    }
  }
}

sendPush();
