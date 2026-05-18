This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.











Step 4: User Model
// app/models/User.js

import mongoose from "mongoose"

// Define structure of user document
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,     // Email is required
    unique: true,       // No duplicate emails allowed
  },
  password: {
    type: String,
    required: true,     // Password is required
  },
})

// Export model (avoid re-creating model in dev)
export default mongoose.models.User || mongoose.model("User", UserSchema)
Step 5: Authentication Logic (Server Actions)
// app/actions/auth.js

"use server" // This ensures code runs on server only

import { connectDB } from "../lib/db"
import User from "../models/User"
import bcrypt from "bcrypt"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// ---------------- SIGNUP ----------------
export async function signup(formData) {

  // Get form values
  const email = formData.get("email")
  const password = formData.get("password")

  // Connect to database
  await connectDB()

  // Check if user already exists
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw new Error("User already exists")
  }

  // Hash password before saving (important for security)
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create new user in database
  await User.create({
    email,
    password: hashedPassword,
  })

  // Redirect to login page after signup
  redirect("/login")
}

// ---------------- LOGIN ----------------
export async function login(formData) {

  // Get form values
  const email = formData.get("email")
  const password = formData.get("password")

  // Connect to database
  await connectDB()

  // Find user by email
  const user = await User.findOne({ email })

  // If user not found, throw error
  if (!user) {
    throw new Error("User not found")
  }

  // Compare entered password with hashed password
  const isMatch = await bcrypt.compare(password, user.password)

  // If password does not match
  if (!isMatch) {
    throw new Error("Invalid password")
  }

  // Store user email in cookies (simple session)
  cookies().set("user", user.email)

  // Redirect to dashboard
  redirect("/dashboard")
}

// ---------------- LOGOUT ----------------
export async function logout() {

  // Remove user cookie
  cookies().delete("user")

  // Redirect to login page
  redirect("/login")
}
Step 6: Signup Page
// app/signup/page.js

import { signup } from "../actions/auth"

export default function SignupPage() {
  return (
    <form action={signup}>
      <h1>Signup</h1>

      {/* Email input */}
      <input name="email" placeholder="Email" required />

      {/* Password input */}
      <input name="password" type="password" required />

      {/* Submit button */}
      <button type="submit">Signup</button>
    </form>
  )
}
Step 7: Login Page
// app/login/page.js

import { login } from "../actions/auth"

export default function LoginPage() {
  return (
    <form action={login}>
      <h1>Login</h1>

      {/* Email input */}
      <input name="email" placeholder="Email" required />

      {/* Password input */}
      <input name="password" type="password" required />

      {/* Submit button */}
      <button type="submit">Login</button>
    </form>
  )
}
Step 8: Protected Dashboard
// app/dashboard/page.js

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { logout } from "../actions/auth"

export default function Dashboard() {

  // Get user cookie
  const user = cookies().get("user")

  // If no user is logged in, redirect to login
  if (!user) {
    redirect("/login")
  }

  return (
    <div>
      {/* Show logged-in user's email */}
      <h1>Welcome {user.value}</h1>

      {/* Logout button */}
      <form action={logout}>
        <button type="submit">Logout</button>
      </form>
    </div>
  )
}

Build a complete authentication system using Next.js and MongoDB that allows users to:
Create an account (signup)
Log in securely
View a protected dashboard
Log out safely
Tech Stack Requirements
You must use:
Next.js (App Router)
MongoDB
Mongoose
bcrypt (password hashing)
Server Actions
Cookies for session handling
Task Breakdown + Rubric1. Project SetupRequirements
Create a Next.js project
Install dependencies:
mongoose
bcrypt
Connect MongoDB using .env.localRubric (10 marks)
4 marks: Project runs without errors
3 marks: MongoDB connection correctly configured
3 marks: Dependencies installed and used properly
2. User ModelRequirements
Create a Mongoose User schema with:
email (string, unique, required)
password (string, required)
Rubric (10 marks)
4 marks: Correct schema structure
3 marks: Email uniqueness enforced 
3 marks: Proper Mongoose model setup
3. Signup PageRequirements
Form with email and password inputs
Hash password using bcrypt
Save user to MongoDB
Redirect to login page after success
Prevent duplicate email registration
Rubric (20 marks)
5 marks: Form works correctly
5 marks: Password hashing implemented
5 marks: User saved in database
3 marks: Duplicate email prevention
2 marks: Proper redirection
4. Login PageRequirements
Form with email and password
Validate user exists in database
Compare hashed password using bcrypt
If valid:
Store user session in cookies
Redirect to dashboard
Show error message on failureRubric (20 marks)
5 marks: Login form functional
5 marks: Correct password comparison
5 marks: Cookie/session handling works
3 marks: Error handling implemented
2 marks: Proper redirection flow
5. Dashboard (Protected Route)Requirements
Check if user cookie exists
If not logged in → redirect to login page
If logged in → show dashboard
Display logged-in user email
Include logout button
The footer shows your unique logo with copyright
Rubric (20 marks)
5 marks: Route protection works
5 marks: Correct redirection logic
5 marks: User data displayed properly
5 marks: UI works without errors
6. Logout FeatureRequirements
Remove user cookie
Redirect to login page
Ensure session is fully cleared
Rubric (10 marks)
4 marks: Cookie cleared properly
3 marks: Redirect works
3 marks: No session leakage
7. UI & UX (Mandatory Upgrade Section)Requirements
Basic styling (CSS or Tailwind)
Loading states for forms
Clean layout for all pages
Rubric (10 marks)
4 marks: Clean and readable UI
3 marks: Loading states implemented
3 marks: Consistent design across pages
Final Rubric Summary
Setup: 10
User Model: 10
Signup: 20
Login: 20
Dashboard: 20
Logout: 10
UI/UX: 10
Total: 100 MarksLearning Outcome
Full authentication flow in real applications
Secure password handling with bcrypt
Session management using cookies
Protected routes in Next.js
MongoDB user storage design
Note: All marks will be given on viva basis and 
50 marks will be deducted if the footer is not shows your unique logo with copyright

