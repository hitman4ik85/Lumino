import { Navigate } from "react-router-dom";
import { PATHS } from "../../../routes/paths.js";

export default function VocabularyPage() {
  return <Navigate to={`${PATHS.home}?tab=dictionary`} replace />;
}
