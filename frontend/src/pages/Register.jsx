"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/authApi";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Register() {
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      role: "student",
    },
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const redirectUser = (role) => {
    const routes = {
      student: "/student/dashboard",
      recruiter: "/recruiter/dashboard",
      admin: "/admin/dashboard",
    };

    navigate(routes[role] || "/");
  };

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      await registerUser(data);

      toast.success(`You successfully registered as ${data.role}`);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      const message = err.message || "Registration failed";
      toast.error(message);
      form.setError("email", {
        type: "manual",
        message: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-gray-500 mt-2">Join Placement Portal</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              rules={{ required: "Email is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              rules={{ required: "Password is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Register As</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full p-2 border rounded-md">
                      <option value="student">Student</option>
                      <option value="recruiter">Recruiter</option>
                      <option value="admin">Admin</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Register"}
            </Button>
            <p>
              Already have account?{" "}
              <Link to="/login" className="text-blue-600 hover:text-blue-800">
                Login
              </Link>
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
}
