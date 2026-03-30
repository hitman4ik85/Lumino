import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

export default function UserLayout() {
  const location = useLocation();

  useEffect(() => {
    const savedTheme = localStorage.getItem("lumino_theme") === "dark" ? "dark" : "light";

    document.documentElement.dataset.luminoTheme = savedTheme;
    document.body.dataset.luminoTheme = savedTheme;
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      document.documentElement.removeAttribute("data-lumino-theme");
      document.body.removeAttribute("data-lumino-theme");
    };
  }, []);

  return (
    <div>
      <Outlet />
    </div>
  );
}
