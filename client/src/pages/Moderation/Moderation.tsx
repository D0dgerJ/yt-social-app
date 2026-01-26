import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import Navbar from "@/components/Navbar/Navbar";
import Sidebar from "@/components/Sidebar/Sidebar";
import ModerationTable from "@/components/Moderation/ModerationTable";

const ALLOWED = new Set(["MODERATOR", "ADMIN", "SUPER_ADMIN"]);

export default function Moderation() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const role = (user as any)?.role;
    if (!user || !ALLOWED.has(role)) navigate("/");
  }, [user, navigate]);

  return (
    <>
      <Navbar />
      <div style={{ display: "flex" }}>
        <Sidebar />
        <div style={{ flex: 1, padding: 16 }}>
          <ModerationTable />
        </div>
      </div>
    </>
  );
}
