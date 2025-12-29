import { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function MenuOfTheDay() {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMotd = async () => {
            try {
                const res = await axiosInstance.get('/api/menu/motd');
                if (res.data.success) {
                    setMenuItems(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch menu of the day", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMotd();
    }, []);

    if (loading) return null;
    if (!menuItems.length) return null;

    return (
        <section className="py-24 bg-gradient-to-br from-violet-50 via-teal-50 to-violet-100">
            <div className="mx-auto max-w-7xl px-4 lg:px-8">
                <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl text-gray-900">
                            Menu of the Day
                        </h2>
                        <p className="mt-2 text-gray-600">
                            Fresh picks for today, curated just for you.
                        </p>
                    </div>
                </div>

                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
                    {menuItems.map((item) => (
                        <div 
                            key={item._id} 
                            className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md cursor-pointer"
                            onClick={() => navigate(`/restaurants/${item.restaurant?._id || item.restaurant}`)}
                        >
                            <div className="aspect-square w-full overflow-hidden bg-gray-100">
                                <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                />
                            </div>
                            <div className="flex flex-1 flex-col p-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {item.name}
                                </h3>
                                <p className="text-sm text-gray-500 mb-2">
                                    {item.restaurant?.name}
                                </p>
                                <div className="mt-auto flex items-center justify-between">
                                    <span className="text-sm font-medium text-violet-600">
                                        {item.price} BDT
                                    </span>
                                    <span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700">
                                        {item.calories} cal
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
