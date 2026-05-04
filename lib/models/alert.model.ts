import { model, models, Schema, type InferSchemaType } from "mongoose";

export type AlertDirection = "above" | "below";
export type AlertStatus = "active" | "fired" | "paused";

const AlertSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true, index: true },
    company: { type: String, required: true, trim: true },
    direction: { type: String, enum: ["above", "below"], required: true },
    targetPrice: { type: Number, required: true, min: 0 },
    lastCheckedPrice: { type: Number },
    status: { type: String, enum: ["active", "fired", "paused"], default: "active", index: true },
    firedAt: { type: Date },
  },
  { timestamps: true }
);

AlertSchema.index({ userId: 1, symbol: 1, status: 1 });

export type AlertItem = InferSchemaType<typeof AlertSchema>;

export const Alert = models.Alert || model("Alert", AlertSchema);
