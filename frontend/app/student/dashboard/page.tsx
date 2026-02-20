'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getStudentProfile, getStudentAttendance } from '@/utils/studentApi';
import { markAttendance } from '@/utils/api';
import { Camera, X } from 'lucide-react';

export default function StudentDashboard() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const userId = searchParams.get('id');

    const [profile, setProfile] = useState<any>(null);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check-in State
    const [showCamera, setShowCamera] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [processing, setProcessing] = useState(false);
    const [checkInStatus, setCheckInStatus] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            router.push('/student'); // Redirect to login if no ID
            return;
        }
        fetchData(userId);
    }, [userId]);

    const fetchData = async (id: string) => {
        try {
            const [profileData, attendanceData] = await Promise.all([
                getStudentProfile(id),
                getStudentAttendance(id)
            ]);
            setProfile(profileData);
            setAttendance(attendanceData);
        } catch (err: any) {
            setError(err.message || "Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const startCheckIn = async () => {
        setShowCamera(true);
        setCheckInStatus(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            alert("Camera access denied");
            setShowCamera(false);
        }
    };

    const closeCheckIn = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop());
        }
        setCameraStream(null);
        setShowCamera(false);
    };

    const captureAndMark = async () => {
        if (!videoRef.current || !canvasRef.current || processing) return;

        setProcessing(true);
        setCheckInStatus("Processing...");

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        canvas.toBlob(async (blob) => {
            if (!blob) return;
            const file = new File([blob], "attendance.jpg", { type: "image/jpeg" });

            try {
                // Get location
                let loc = undefined;
                if (navigator.geolocation) {
                    try {
                        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
                            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
                        );
                        loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    } catch (e) {
                        console.warn("Location failed", e);
                    }
                }

                const response = await markAttendance(file, loc);

                // Verify the marked person is THIS user
                const successResults = response.results?.filter((r: any) => r.status === 'success');
                const myMatch = successResults?.find((r: any) => r.user_id === userId);

                if (myMatch) {
                    setCheckInStatus("✅ Success! Attendance Marked.");
                    // Refresh data
                    await fetchData(userId!);
                    setTimeout(closeCheckIn, 2000);
                } else if (successResults && successResults.length > 0) {
                    setCheckInStatus(`❌ Identified as ${successResults[0].person}, not you!`);
                } else {
                    setCheckInStatus("❌ Face not recognized. Try again.");
                }

            } catch (err: any) {
                setCheckInStatus(`❌ Error: ${err.message}`);
            } finally {
                setProcessing(false);
            }
        }, 'image/jpeg');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <p className="text-red-600 text-lg font-semibold mb-4">{error}</p>
                <button
                    onClick={() => router.push('/student')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                    Back to Login
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6 font-sans relative">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header / Profile Card */}
                <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-100 shadow-sm flex-shrink-0 z-10">
                        {/* Placeholder for now if no photo url in profile, or use first attendance photo? */}
                        {/* We don't store profile photo URL in users yet, but we have face_encoding. 
                             Let's use a generic avatar or initials. */}
                        <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-4xl text-white font-bold">
                            {profile?.name?.charAt(0).toUpperCase()}
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left z-10">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile?.name}</h1>
                        <div className="space-y-1 text-gray-600">
                            <p className="flex items-center justify-center md:justify-start gap-2">
                                <span className="font-medium">Student ID:</span> {profile?.id.slice(0, 8)}...
                            </p>
                            {profile?.email && <p>Email: {profile.email}</p>}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 z-10 w-full md:w-auto">
                        <button
                            onClick={startCheckIn}
                            className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition flex items-center justify-center gap-2"
                        >
                            <Camera className="w-5 h-5" /> Check In
                        </button>
                        <button
                            onClick={() => router.push('/student')}
                            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                        >
                            Sign Out
                        </button>
                    </div>

                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full translate-x-1/3 -translate-y-1/3 opacity-50"></div>
                </div>

                {/* Attendance History */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Attendance History</h2>
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            Total: {attendance.length}
                        </span>
                    </div>

                    {attendance.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            No attendance records found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                                        <th className="p-4 font-semibold border-b">Date & Time</th>
                                        <th className="p-4 font-semibold border-b">Status</th>
                                        <th className="p-4 font-semibold border-b">Confidence</th>
                                        <th className="p-4 font-semibold border-b">Capture</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {attendance.map((record) => {
                                        const date = new Date(record.timestamp);
                                        return (
                                            <tr key={record.id} className="hover:bg-gray-50 transition">
                                                <td className="p-4 text-gray-800">
                                                    <div className="font-medium">{date.toLocaleDateString()}</div>
                                                    <div className="text-xs text-gray-500">{date.toLocaleTimeString()}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                        Present
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-600 text-sm">
                                                    {record.confidence ? `${record.confidence.toFixed(1)}%` : 'N/A'}
                                                </td>
                                                <td className="p-4">
                                                    {record.captured_image ? (
                                                        <img
                                                            src={`data:image/jpeg;base64,${record.captured_image}`}
                                                            alt="Proof"
                                                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                                                            N/A
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Check-In Modal */}
            {showCamera && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden relative shadow-2xl">
                        <button
                            onClick={closeCheckIn}
                            className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full z-10 transition"
                        >
                            <X className="w-6 h-6 text-gray-700" />
                        </button>

                        <div className="p-4 border-b">
                            <h3 className="text-lg font-bold text-gray-800 text-center">Mark Attendance</h3>
                        </div>

                        <div className="relative aspect-video bg-black">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover transform scale-x-[-1]"
                            />
                            <canvas ref={canvasRef} className="hidden" />

                            {checkInStatus && (
                                <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white p-3 text-center text-sm font-semibold">
                                    {checkInStatus}
                                </div>
                            )}
                        </div>

                        <div className="p-6 flex justify-center">
                            <button
                                onClick={captureAndMark}
                                disabled={processing}
                                className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transform transition active:scale-95
                                    ${processing
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 hover:shadow-green-200/50'
                                    }`}
                            >
                                {processing ? "Processing..." : "Capture & Verify"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
