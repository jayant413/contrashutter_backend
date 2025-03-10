import mongoose, { Schema, Document } from 'mongoose';

interface IService extends Document {
  name: string;
  events: mongoose.Types.ObjectId[]; // Array of Event IDs
}

const ServiceSchema: Schema = new Schema({
  name: { type: String, required: true },
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }] // References multiple Events
});

const Service = mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);

export default Service;
