// backfill-due-dates.js
import mongoose from 'mongoose';
import Invoice from './Models/Invoice.js'; 
import dotenv from 'dotenv';

dotenv.config();

async function backfillDueDates() {
  await mongoose.connect(process.env.MONGO_URI);

  // Find all sent invoices without dueDate
  const invoices = await Invoice.find({
    status: 'sent',
    dueDate: { $exists: false }
  }).select('issueDate sentAt');

  console.log(`Found ${invoices.length} invoices to update`);

  let updated = 0;
  for (const inv of invoices) {
    const baseDate = inv.sentAt || inv.issueDate || new Date();
    const dueDate = new Date(baseDate);
    dueDate.setHours(dueDate.getHours() + 48);

    await Invoice.updateOne(
      { _id: inv._id },
      { $set: { dueDate } }
    );
    updated++;
    if (updated % 100 === 0) console.log(`Updated ${updated}...`);
  }

  console.log(`Done. Updated ${updated} invoices.`);
  process.exit(0);
}

backfillDueDates().catch(err => {
  console.error(err);
  process.exit(1);
});