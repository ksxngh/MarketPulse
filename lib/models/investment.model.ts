import { model, models, Schema, type InferSchemaType } from "mongoose";

const InvestmentSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    company: { type: String, required: true, trim: true },
    shares: { type: Number, required: true, min: 0 },
    averageBuyPrice: { type: Number, required: true, min: 0 },
    boughtAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

InvestmentSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export type InvestmentItem = InferSchemaType<typeof InvestmentSchema>;

export const Investment =
  models.Investment || model("Investment", InvestmentSchema);
