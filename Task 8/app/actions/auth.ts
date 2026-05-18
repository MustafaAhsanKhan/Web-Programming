"use server";

import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";

export type AuthActionState = {
	error?: string;
};

function readCredentials(formData: FormData) {
	const email = String(formData.get("email") ?? "").trim().toLowerCase();
	const password = String(formData.get("password") ?? "").trim();

	if (!email || !password) {
		return { error: "Email and password are required." };
	}

	if (password.length < 6) {
		return { error: "Password must be at least 6 characters." };
	}

	return { email, password };
}

export async function signup(
	_prevState: AuthActionState,
	formData: FormData
): Promise<AuthActionState> {
	const parsed = readCredentials(formData);
	if ("error" in parsed) {
		return { error: parsed.error };
	}

	await connectDB();

	const existingUser = await User.findOne({ email: parsed.email }).lean();
	if (existingUser) {
		return { error: "An account with this email already exists." };
	}

	const hashedPassword = await bcrypt.hash(parsed.password, 10);
	await User.create({ email: parsed.email, password: hashedPassword });

	redirect("/login");
}

export async function login(
	_prevState: AuthActionState,
	formData: FormData
): Promise<AuthActionState> {
	const parsed = readCredentials(formData);
	if ("error" in parsed) {
		return { error: parsed.error };
	}

	await connectDB();

	const user = await User.findOne({ email: parsed.email }).lean();
	if (!user) {
		return { error: "No account found for this email." };
	}

	const isMatch = await bcrypt.compare(parsed.password, user.password);
	if (!isMatch) {
		return { error: "Invalid email or password." };
	}

	const cookieStore = await cookies();
	cookieStore.set("session_user", user.email, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: 60 * 60 * 24,
	});

	redirect("/dashboard");
}

export async function logout() {
	const cookieStore = await cookies();
	cookieStore.delete("session_user");

	redirect("/login");
}
