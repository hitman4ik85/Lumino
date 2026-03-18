import { Navigate } from "react-router-dom";
import { PATHS } from "../../../routes/paths.js";

export default function AchievementsPage() {
  return <Navigate to={`${PATHS.home}?tab=achievements`} replace />;
}
