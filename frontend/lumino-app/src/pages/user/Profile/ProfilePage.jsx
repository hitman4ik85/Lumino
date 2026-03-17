import { Navigate } from "react-router-dom";
import { PATHS } from "../../../routes/paths.js";

export default function ProfilePage() {
  return <Navigate to={`${PATHS.home}?tab=profile`} replace />;
}
