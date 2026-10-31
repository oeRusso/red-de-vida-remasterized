import "server-only";
import { connectDB } from "../db";
import { Donation } from "../models";

export async function listDonations() {
  await connectDB();
  return Donation.find()
    .sort({ donationDate: -1 })
    .populate({ path: "userId", select: "firstName lastName email" })
    .populate({ path: "institutionId", select: "name institutionType address" })
    .lean();
}
