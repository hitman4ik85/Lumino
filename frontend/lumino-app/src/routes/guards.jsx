import { Navigate } from "react-router-dom";
import { PATHS } from "./paths.js";
import { authStorage } from "../services/authStorage.js";

export function AuthGuard({ children }) {
  if (!authStorage.isAuthed()) {
    return <Navigate to={PATHS.login} replace />;
  }

  return children;
}

export function AdminGuard({ children }) {
  if (!authStorage.isAuthed()) {
    return <Navigate to={PATHS.login} replace />;
  }

  if (!authStorage.isAdmin()) {
    return <Navigate to={PATHS.home} replace />;
  }

  return children;
}

export function UserGuard({ children }) {
  if (authStorage.isGuestPreview()) {
    return children;
  }

  if (!authStorage.isAuthed()) {
    return <Navigate to={PATHS.login} replace />;
  }

  if (authStorage.isAdmin()) {
    return <Navigate to={PATHS.admin} replace />;
  }

  return children;
}

export function DefaultRouteGuard() {
  if (authStorage.isGuestPreview()) {
    return <Navigate to={PATHS.home} replace />;
  }

  if (!authStorage.isAuthed()) {
    return <Navigate to={PATHS.start} replace />;
  }

  if (authStorage.isAdmin()) {
    return <Navigate to={PATHS.admin} replace />;
  }

  return <Navigate to={PATHS.home} replace />;
}
