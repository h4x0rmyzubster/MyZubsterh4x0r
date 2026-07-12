import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        console.log('📦 User da localStorage:', userData);
        
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                console.log('👤 Utente parsato:', parsedUser);
                setUser(parsedUser);
            } catch (e) {
                console.error('❌ Errore parsing user:', e);
                setUser(null);
            }
        } else {
            console.log('⚠️ Nessun utente in localStorage');
            setUser(null);
        }
        setLoading(false);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <p className="text-gray-600">Caricamento...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                <h1 className="text-4xl font-bold text-blue-600 mb-4">MyZubster</h1>
                
                {user ? (
                    <>
                        <p className="text-gray-600 mb-2">Benvenuto, <span className="font-semibold">{user.name}</span>!</p>
                        <p className="text-gray-600 mb-6">Scambio di competenze con Monero</p>
                        
                        {/* PULSANTE PROFILO */}
                        <Link to="/profile" className="block w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition mb-2">
                            Profilo
                        </Link>
                        
                        <button
                            onClick={handleLogout}
                            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <p className="text-gray-600 mb-6">Scambio di competenze con Monero</p>
                        <div className="space-y-2">
                            <Link to="/register" className="block w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                                Registrati
                            </Link>
                            <Link to="/login" className="block w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition">
                                Accedi
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Home;