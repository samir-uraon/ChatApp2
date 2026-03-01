"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [bgLoaded, setBgLoaded] = useState(false); // Track background load

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isLogin ? "/api/auth/login" : "/api/auth/signup";
      const { data } = await axios.post(url, formData);
      if (!isLogin) {
        toast.success("Signup successful! Please login.", { position: "top-right" });
        setIsLogin(true);
        setFormData({ ...formData, name: "", password: "" });
      } else {
        
        toast.success(`Welcome back, ${data.username}!`, { position: "top-right" });
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error(err.message, { position: "bottom-right" });
    }
  };

  // Preload background image
  useEffect(() => {
    const img = new Image();
    img.src = "/images/chat-bg.jpg";
    img.onload = () => setBgLoaded(true);
  }, []);

  return (
    <div className="relative w-screen h-screen flex justify-center items-center p-2">
 
      {!bgLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}

 
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
          bgLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundImage: "url('/images/chat-bg.jpg')" }}
      />

 
      {bgLoaded && (
        <div
          className={`relative transition-opacity duration-700 rounded-sm 
          bg-white/10 border border-white/20 shadow-xl backdrop-blur-xl 
          p-5 sm:p-6 md:p-8
          w-50% max-w-xs sm:max-w-sm md:max-w-md`}
        >
          <div className="flex flex-col text-center justify-center items-center h-full w-full">
            <h1 className="text-2xl font-extrabold font-mono">{isLogin ? "Welcome Back" : "Welcome"}</h1>
            <p className="font-light-200 text-primary">{isLogin ? "Login to continue" : "Sign up now to get started"}</p>
            <form
              onSubmit={handleSubmit}
              className="w-full py-8 gap-5 flex flex-col text-center justify-center items-center relative"
            >
              {!isLogin && (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="User Name"
                  className="border-b-2 border-black focus:border-blue-500 outline-none px-1 py-0.2 w-55 text-md valid:border-blue-500"
                />
              )}
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Email"
                className="border-b-2 border-black focus:border-blue-500 outline-none px-1 py-0.2 w-55 text-md valid:border-blue-500"
              />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                minLength={8}
                required
                placeholder="Password"
                className="border-b-2 border-black focus:border-blue-500 outline-none px-1 py-0.2 w-55 text-md valid:border-blue-500"
              />
              {isLogin && (
                <p
                  onClick={() => router.push("/api/forgot-password")}
                  className="absolute right-1 top-[52%] text-xs text-blue-700 cursor-pointer hover:underline hover:text-blue-900"
                >
                  Forgot Password?
                </p>
              )}
              <Button type="submit" className="w-full mt-4">
                {isLogin ? "Login" : "Sign Up"}
              </Button>
            </form>
            <p className="text-sm text-white">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <span
                onClick={() => setIsLogin(!isLogin)}
                className="text-purple-600 underline cursor-pointer"
              >
                {isLogin ? "Sign Up" : "Login"}
              </span>
            </p>
          </div>
        </div>
      )}
      <Toaster />
    </div>
  );
}