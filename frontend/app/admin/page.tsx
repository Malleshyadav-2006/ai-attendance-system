'use client';
import { useEffect, useState } from 'react';
import { getAttendanceHistory } from '@/utils/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Share2, MapPin, Calendar, Clock, User, CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw, Camera, Download, LogOut } from "lucide-react";

interface Record {
    id: string;
    user_id: string;
    timestamp: string;
    liveness_score: number;
    confidence: number;
    users: {
        name: string;
    };
    latitude?: number;
    longitude?: number;
}

export default function Admin() {
    const router = useRouter();
    const [stats, setStats] = useState({
        total: 0,
        presentToday: 0,
        unknown: 0,
        weeklyPercentage: 0,
        monthlyPercentage: 0,
        chartData: [] as { date: string; count: number }[]
    });
    const [records, setRecords] = useState<Record[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin/login');
            return;
        }

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [router]);

    const fetchData = async () => {
        try {
            const res = await getAttendanceHistory();
            if (res.status === 'success') {
                const history = res.records;
                setRecords(history);
                calculateStats(history);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally { // ensure loading is set to false even on error
            setLoading(false);
        }
    };

    const calculateStats = (history: Record[]) => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // Weekly range
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);

        // Monthly range
        const monthStart = new Date(now);
        monthStart.setMonth(now.getMonth() - 1);

        const todayRecords = history.filter(r => r.timestamp.startsWith(today));
        const weeklyRecords = history.filter(r => new Date(r.timestamp) >= weekStart);
        const monthlyRecords = history.filter(r => new Date(r.timestamp) >= monthStart);

        // Calculate unique users present
        const uniqueToday = new Set(todayRecords.map(r => r.user_id)).size;

        const uniqueUsersTotal = new Set(history.map(r => r.user_id)).size || 1;

        // Prepare chart data: Group by Date
        const chartMap: { [key: string]: number } = {};
        history.forEach(r => {
            const date = r.timestamp.split('T')[0];
            chartMap[date] = (chartMap[date] || 0) + 1;
        });

        const chartData = Object.keys(chartMap).map(date => ({
            date,
            count: chartMap[date]
        })).sort((a, b) => a.date.localeCompare(b.date));

        setStats({
            total: history.length,
            presentToday: uniqueToday,
            unknown: history.filter(r => !r.user_id).length,
            weeklyPercentage: Math.round((weeklyRecords.length / 7) / uniqueUsersTotal * 100) || 0,
            monthlyPercentage: Math.round((monthlyRecords.length / 30) / uniqueUsersTotal * 100) || 0,
            chartData
        });
    };

    const exportToCSV = () => {
        if (records.length === 0) {
            alert("No records to export.");
            return;
        }

        // 1. Create CSV Header
        const headers = ["ID", "Name", "Date", "Time", "Status", "Location"];

        // 2. Map Data to Rows
        const rows = records.map(record => [
            record.user_id, // Using user_id as ID
            record.users?.name || 'Unknown', // Using users.name as Name
            new Date(record.timestamp).toLocaleDateString(),
            new Date(record.timestamp).toLocaleTimeString(),
            record.liveness_score > 0.8 ? 'Verified' : 'Flagged', // Derived status
            record.latitude && record.longitude ? `${record.latitude}, ${record.longitude}` : "N/A"
        ]);

        // 3. Combine Structure
        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

        // 4. Trigger Download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "attendance_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        router.push('/admin/login');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-500 mt-1">Manage student attendance and records</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                            <Download className="h-4 w-4" />
                            Export CSV
                        </button>
                        <button
                            onClick={fetchData} // Changed from fetchRecords to fetchData
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh Data
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                        <Link href="/" className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 flex items-center gap-2">
                            Home
                        </Link>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium">Total Records</h3>
                        <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium">Present Today</h3>
                        <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.presentToday}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium">Unknown Faces</h3>
                        <p className="text-3xl font-bold text-amber-500 mt-2">{stats.unknown}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium">Weekly Attendance</h3>
                        <p className="text-3xl font-bold text-blue-600 mt-2">{stats.weeklyPercentage}%</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium">Monthly Attendance</h3>
                        <p className="text-3xl font-bold text-purple-600 mt-2">{stats.monthlyPercentage}%</p>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Attendance Trends</h2>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#8884d8" name="Attendance Count" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Detailed Logs */}
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-800">Detailed Logs</h2>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading records...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full leading-normal">
                                <thead>
                                    <tr>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Photo</th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Confidence</th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((record) => (
                                        <tr key={record.id}>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                {new Date(record.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                {(record as any).captured_image ? (
                                                    <img
                                                        src={`data:image/jpeg;base64,${(record as any).captured_image}`}
                                                        alt="Capture"
                                                        className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">N/A</div>
                                                )}
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                <div className="flex items-center">
                                                    <div className="ml-3">
                                                        <p className="text-gray-900 whitespace-no-wrap font-semibold">
                                                            {record.users?.name || 'Unknown'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${record.liveness_score > 0.8 ? 'text-green-900' : 'text-amber-900'
                                                    }`}>
                                                    <span aria-hidden className={`absolute inset-0 opacity-50 rounded-full ${record.liveness_score > 0.8 ? 'bg-green-200' : 'bg-amber-200'
                                                        }`}></span>
                                                    <span className="relative">{record.liveness_score > 0.8 ? 'Verified' : 'Flagged'}</span>
                                                </span>
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                <p className="text-gray-900 whitespace-no-wrap">
                                                    {record.confidence?.toFixed(1)}%
                                                </p>
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                {(record as any).latitude ? (
                                                    <a
                                                        href={`https://www.google.com/maps?q=${(record as any).latitude},${(record as any).longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        View
                                                    </a>
                                                ) : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
