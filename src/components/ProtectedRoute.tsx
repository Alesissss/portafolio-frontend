import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute(){
    const { estaAutenticado } = useAuth();

    // Si no está auatenticado, regresa al login
    if (!estaAutenticado){
        return <Navigate to="/login" replace />;
    }

    // Si está autenticado, renderiza la ruta
    return <Outlet />;

}