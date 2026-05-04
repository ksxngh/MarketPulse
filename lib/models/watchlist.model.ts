import { model, models, Schema, type InferSchemaType } from "mongoose";

const WatchlistSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    company: { type: String, required: true, trim: true },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

WatchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export type WatchlistItem = InferSchemaType<typeof WatchlistSchema>;

export const Watchlist =
  models.Watchlist || model("Watchlist", WatchlistSchema);
