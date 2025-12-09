import { useState } from "react";
import axios from "axios";

interface RegisterProps {
  onRegister?: () => void;
}

export default function Register({ onRegister }: RegisterProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5050/register", {
        username,
        password,
      });
      alert("✅ User registered successfully! You can now log in.");
      if (onRegister) onRegister();
    } catch (err: any) {
      setError(err.response?.data?.msg || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white shadow p-6 rounded w-96">
        <h2 className="text-2xl font-bold mb-4">Register</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <form onSubmit={handleRegister}>
          <input
            className="w-full border p-2 mb-4"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="w-full border p-2 mb-4"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-green-500 text-white p-2 rounded cursor-pointer"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
