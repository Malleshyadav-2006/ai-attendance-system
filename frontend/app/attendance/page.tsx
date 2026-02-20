'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { markAttendance } from '@/utils/api';
import Link from 'next/link';
import { Camera, RefreshCw } from 'lucide-react';
import { speak } from '@/utils/voice';

export default function Attendance() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);

    const webcamRef = useRef<Webcam>(null);

    useEffect(() => {
        speak("Please look at the camera to mark attendance.");

        // Get Location immediately
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.warn("Location error:", err)
            );
        }

        // Start countdown once mounted (simple auto-capture trigger)
        const timer = setTimeout(() => setCountdown(3), 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleCapture = async (file: File) => {
        console.log("📸 Starting capture process...");
        console.log("File:", file);
        console.log("Location:", location);

        setLoading(true);
        setError(null);
        setResult(null);
        setStatus("Processing...");

        try {
            console.log("🚀 Calling markAttendance API...");
            const response = await markAttendance(file, location || undefined);
            console.log("✅ API Response:", response);

            if (response.status === 'processed' || response.status === 'success') {
                const results = response.results || [response];
                const successes = results.filter((r: any) => r.status === 'success');

                if (successes.length > 0) {
                    const names = successes.map((r: any) => r.person).join(', ');
                    speak(`Attendance marked for ${names}`);
                    setStatus("Success!");
                } else {
                    speak("Attendance failed. No recognized faces.");
                    setStatus("Failed");
                }
                setResult(results);
            } else {
                speak("Attendance failed.");
                setResult(null);
                setError("Unexpected response format");
            }
        } catch (err: any) {
            console.error("❌ Capture Error:", err);
            console.error("Error details:", err.message, err.stack);
            speak("Error marking attendance.");
            setError(err.message || "Failed to fetch");
            setStatus("Error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (countdown === null) return;

        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            // Trigger capture when countdown reaches 0
            if (webcamRef.current) {
                const imageSrc = webcamRef.current.getScreenshot();
                if (imageSrc) {
                    setStatus("Processing...");
                    fetch(imageSrc)
                        .then(res => res.blob())
                        .then(blob => {
                            const file = new File([blob], "attendance_capture.jpg", { type: "image/jpeg" });
                            handleCapture(file);
                        })
                        .catch(e => {
                            console.error(e);
                            setStatus("Error capturing");
                        });
                }
            }
            setCountdown(null);
        }
    }, [countdown, webcamRef, location]);

    const capture = useCallback(async () => {
        if (!webcamRef.current) return;
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setStatus("Processing...");

        try {
            const res = await fetch(imageSrc);
            const blob = await res.blob();
            const file = new File([blob], "attendance_capture.jpg", { type: "image/jpeg" });

            await handleCapture(file);
        } catch (e) {
            console.error(e);
            setStatus("Error capturing");
        }
    }, [webcamRef, handleCapture]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <h1 className="text-3xl font-bold mb-4 text-green-700">Mark Attendance</h1>

            {!result ? (
                <div className="relative w-full max-w-lg bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: "user" }}
                        className="w-full h-auto"
                        mirrored={true}
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className={`w-64 h-64 border-2 rounded-full transition-colors duration-300 ${status === 'Processing...' ? 'border-yellow-400 animate-pulse' : 'border-white/50'
                            }`}>
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-6 text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
                                {status || "Align Face"}
                            </div>
                        </div>
                    </div>

                    {/* Countdown */}
                    {countdown !== null && countdown > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
                            <span className="text-9xl font-bold text-white animate-pulse">{countdown}</span>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 pointer-events-auto">
                        <button
                            onClick={capture}
                            disabled={loading}
                            className={`p-4 rounded-full shadow-lg transform transition active:scale-95 ${loading ? 'bg-gray-500' : 'bg-white text-violet-600 hover:bg-gray-100'
                                }`}
                        >
                            {loading ? (
                                <RefreshCw className="w-8 h-8 animate-spin" />
                            ) : (
                                <Camera className="w-8 h-8" />
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-lg w-full">
                    <div className="text-5xl mb-4">✅</div>
                    <h2 className="text-2xl font-bold text-green-700 mb-4">Processing Complete</h2>

                    <div className="space-y-4 max-h-60 overflow-y-auto">
                        {Array.isArray(result) ? result.map((res: any, idx: number) => (
                            <div key={idx} className={`p-4 rounded border ${res.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                {res.status === 'success' ? (
                                    <>
                                        <p className="font-bold text-lg">{res.person}</p>
                                        <p className="text-sm text-gray-600">Confidence: {res.confidence?.toFixed(1)}%</p>
                                    </>
                                ) : (
                                    <p className="text-red-600 font-semibold">{res.message || 'Unknown Face'}</p>
                                )}
                            </div>
                        )) : (
                            <div className="p-4 rounded bg-green-50 border border-green-200">
                                <p className="font-bold">{result.person}</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => { setResult(null); setStatus('Align Face'); setCountdown(3); }}
                        className="mt-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition w-full flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Next Person
                    </button>
                </div>
            )}

            <div className="mt-8 text-center">
                {error && <p className="text-red-600 font-semibold mb-2">{error}</p>}
                <Link href="/" className="text-blue-500 hover:underline">
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
