// src/pages/AdminPanel.tsx  (replace previous with this extended version)
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/api";
import toast from "react-hot-toast";

interface User {
  id: number;
  username: string;
  role: string;
}

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("doctor");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/users");
      return res.data as User[];
    },
  });

  // Create user
  const createUser = useMutation({
    mutationFn: async () => {
      await api.post("/users", { username, password, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setUsername("");
      setPassword("");
      toast.success("User created");
    },
    onError: () => toast.error("Failed to create user"),
  });

  // Delete user
  const deleteUser = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted");
    },
    onError: () => toast.error("Failed to delete user"),
  });

  // Upload CSV
  const uploadData = useMutation({
    mutationFn: async (formData: FormData) => {
      setUploading(true);
      const res = await api.post("/admin/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploading(false);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Uploaded ${data.inserted} rows`);
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
    onError: () => {
      setUploading(false);
      toast.error("Upload failed");
    },
  });

  // Reset data
  const resetData = useMutation({
    mutationFn: async () => {
      const res = await api.post("/admin/reset-data");
      return res.data;
    },
    onSuccess: () => {
      toast.success("Vitals cleared");
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
    onError: () => toast.error("Reset failed"),
  });

  // Seed sample
  const seedSample = useMutation({
    mutationFn: async () => {
      const res = await api.post("/admin/seed-sample");
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Seeded ${data.inserted} rows`);
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
    onError: () => toast.error("Seeding failed"),
  });

  if (isLoading) return <p>Loading users...</p>;

  return (
    <div className="w-full bg-white dark:bg-gray-800 shadow p-6 px-60 space-y-6 dark:text-white">
      <h2 className="text-2xl font-bold mb-2">👨‍⚕️ Admin Panel</h2>

      {/* Create user form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createUser.mutate();
        }}
        className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 rounded dark:bg-gray-700 dark:text-white"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded dark:bg-gray-700 dark:text-white"
          required
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border p-2 rounded dark:bg-gray-700 dark:text-white"
        >
          <option value="doctor">Doctor</option>
          <option value="nurse">Nurse</option>
        </select>
        <button
          type="submit"
          className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
        >
          ➕ Add User
        </button>
      </form>

      {/* Upload / Reset controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
          className="border p-2 rounded"
        />
        <button
          onClick={() => {
            if (!file) {
              toast.error("Pick a CSV file first");
              return;
            }
            const fd = new FormData();
            fd.append("file", file);
            uploadData.mutate(fd);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload CSV"}
        </button>

        <button
          onClick={() => {
            if (window.confirm("Are you sure? This will clear all vitals.")) {
              resetData.mutate();
            }
          }}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
        >
          Reset Data
        </button>

        <button
          onClick={() => seedSample.mutate()}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Seed Sample
        </button>
      </div>

      {/* Users table */}
      <table className="w-full border-collapse mt-4">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-700 text-left">
            <th className="p-2">ID</th>
            <th className="p-2">Username</th>
            <th className="p-2">Role</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b dark:border-gray-600">
              <td className="p-2">{u.id}</td>
              <td className="p-2">{u.username}</td>
              <td className="p-2">{u.role}</td>
              <td className="p-2">
                {u.role === "admin" && u.id === 1 ? (
                  <span className="text-gray-400 italic">Protected</span>
                ) : (
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Are you sure you want to delete user "${u.username}"?`
                        )
                      ) {
                        deleteUser.mutate(u.id);
                      }
                    }}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    🗑 Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
