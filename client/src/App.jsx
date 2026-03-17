import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import useAuthStore from "./store/authStore";
import "./App.css";
import Creteria1 from "./pages/Creteria1.jsx";

function App() {
  const { fetchUser, isLoading } = useAuthStore();

  useEffect(() => {
    // Check if user is already logged in on app load
    fetchUser();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex justify-center items-center min-h-screen text-2xl text-[#333]">Loading...</div>
      </div>
    );
  }

  return (
    <Router future={{ v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/criteria1" element={<Creteria1 />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;