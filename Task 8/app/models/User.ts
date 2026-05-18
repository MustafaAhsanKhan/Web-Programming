import { Model, Schema, model, models } from "mongoose";

export interface IUser {
	email: string;
	password: string;
}

const UserSchema = new Schema<IUser>(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		password: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

const User = (models.User as Model<IUser>) || model<IUser>("User", UserSchema);

export default User;
