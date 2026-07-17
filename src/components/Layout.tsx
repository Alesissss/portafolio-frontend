import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Layout() {
    const { usuario, logout } = useAuth();

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            {/* SIDEBAR */}
            <aside style={{ width: '250px', background: '#1e293b', color: 'white', padding: '20px' }}>
                <h3>Portafolio Backend</h3>
                <p style={{ fontSize: '14px', color: '#94a3b8' }}>{usuario?.nombres}</p>
                <hr style={{ borderColor: '#334155' }} />

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                    {/* Se usa LINK y no etiquetas <a> para que la página no se recargue */}
                    <Link to="/" style={{ color: 'white', textDecoration: 'none', padding: '10px' }}>🏠 Inicio</Link>
                    <Link to="/categorias" style={{ color: 'white', textDecoration: 'none', padding: '10px' }}>📦 Categorías</Link>
                </nav>

                <button onClick={logout} style={{ marginTop: '50px', width: '100%', padding: '10px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Cerrar Sesión
                </button>
            </aside>

            {/* CONTENIDO DE LA PÁGINA */}
            <main style={{ flex: 1, padding: '20px', background: '#f8fafc' }}>
                <Outlet />
            </main>
        </div>
    )
}