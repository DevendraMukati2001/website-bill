// cronJobs.js
const cron = require("node-cron");
const Client = require("./models/Client");
const Bill = require("./models/Bill");
const { sendBirthdayDiscountEmail } = require("./services/emailService");


/**
 * Roz subah 9 baje check karo — aaj kiska birthday hai
 * Cron syntax: "0 9 * * *" = har din 9:00 AM
 */
const startBirthdayCron = () => {
  cron.schedule("0 9 * * *", async () => {
    console.log("🎂 Birthday cron running...");

    try {
      const today = new Date();
      const todayDay = today.getDate();
      const todayMonth = today.getMonth() + 1; // 1-12

      // Sab clients fetch karo jinke paas dob aur email dono hain
      const clients = await Client.find({
        dob: { $exists: true, $ne: null },
        email: { $exists: true, $ne: "" },
      });

      for (const client of clients) {
        const dob = new Date(client.dob);
        if (dob.getDate() === todayDay && dob.getMonth() + 1 === todayMonth) {
          // Is client ki latest bill fetch karo for context
          const latestBill = await Bill.findOne({ client: client._id })
            .sort({ createdAt: -1 })
            .select("total invoiceNumber");

          const discountAmount = latestBill ? latestBill.total * 0.05 : 0;

          await sendBirthdayDiscountEmail(
            { name: client.name, email: client.email },
            discountAmount,
            latestBill?.invoiceNumber || "",
          );
        }
      }
    } catch (err) {
      console.error("Birthday cron error:", err.message);
    }
  });

  console.log("✅ Birthday cron job scheduled (daily 9 AM)");
};

module.exports = { startBirthdayCron };
