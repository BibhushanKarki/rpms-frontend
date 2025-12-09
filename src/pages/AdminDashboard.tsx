import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/api";

interface User {
  id: number;
  username: string;
  role: string;
}

export default function AdminDashboard({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("doctor");

  // Fetch users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data as User[];
    },
  });

  // Mutation for creating user
  const mutation = useMutation({
    mutationFn: async () => {
      await api.post(
        "/users",
        { username, password, role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setUsername("");
      setPassword("");
      setRole("doctor");
    },
  });

  if (isLoading) return <p>Loading users...</p>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 text-gray-800 dark:text-gray-100">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">👨‍⚕️ Admin Dashboard</h1>

        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New User</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            className="space-y-4"
          >
            <input
              className="w-full border p-2 rounded"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className="w-full border p-2 rounded"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <select
              className="w-full border p-2 rounded"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
            </select>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Creating..." : "Create User"}
            </button>
          </form>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Existing Users</h2>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Username</th>
                <th className="p-2 text-left">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="p-2">{user.id}</td>
                  <td className="p-2">{user.username}</td>
                  <td className="p-2">{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
