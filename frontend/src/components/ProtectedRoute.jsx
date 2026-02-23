import { Navigate, Outlet } from "react-router-dom";

/**
 * ProtectedRoute
 * Checks if a JWT token exists in localStorage.
 * If it does, render the child route. Otherwise redirect to /auth.
 * 
 * The token's actual validity is verified server-side on each API call.
 * If it's expired, the axios 401 interceptor will clear it and redirect.
 */
export default function ProtectedRoute() {
    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/auth" replace />;
    }

    return <Outlet />;
}
