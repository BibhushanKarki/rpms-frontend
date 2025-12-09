import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import { Toaster } from "react-hot-toast";

const queryClient = new QueryClient();

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));

  const handleLogin = (access_token: string, userRole: string) => {
    setToken(access_token);
    setRole(userRole);
    localStorage.setItem("token", access_token);
    localStorage.setItem("role", userRole);
  };

  const handleLogout = () => {
    setToken(null);
    setRole(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  };

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* If logged in, redirect login/register to dashboard */}
            <Route
              path="/login"
              element={
                token ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/register"
              element={
                token ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Register
                    onRegister={() => window.location.replace("/login")}
                  />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                token ? (
                  <Dashboard
                    token={token}
                    role={role || ""}
                    onLogout={handleLogout}
                  />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            {/* Default route */}
            <Route
              path="*"
              element={
                <Navigate to={token ? "/dashboard" : "/login"} replace />
              }
            />
            {role === "admin" && (
              <Route path="/admin" element={<AdminPanel />} />
            )}
          </Routes>
        </Router>
      </QueryClientProvider>
      <Toaster position="top-right" reverseOrder={false} />
    </>
  );
}

export default App;
