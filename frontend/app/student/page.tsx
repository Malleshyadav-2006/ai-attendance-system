
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithFace } from '@/utils/studentApi';

export default function StudentLoginPage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturing, setCapturing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setStream(mediaStream);
            setError(null);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Could not access camera. Please allow permissions.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleLogin = async () => {
        if (!videoRef.current || !canvasRef.current || loading) return;

        setLoading(true);
        setError(null);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // Capture frame
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
            if (!blob) {
                setError("Failed to capture image");
                setLoading(false);
                return;
            }

            const file = new File([blob], "login_face.jpg", { type: "image/jpeg" });
            try {
                const data = await loginWithFace(file);
                // Redirect to dashboard with ID
                router.push(`/student/dashboard?id=${data.user_id}`);
            } catch (err: any) {
                setError(err.message || "Login failed");
                setLoading(false);
            }
        }, 'image/jpeg');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Student Portal Login</h1>

            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md flex flex-col items-center">
                <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-6">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm w-full text-center">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleLogin}
                    disabled={loading || !stream}
                    className={`w-full py-3 px-6 rounded-lg font-semibold text-white shadow-md transition-all
                        ${loading || !stream
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:scale-95'
                        }`}
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Verifying Face...
                        </span>
                    ) : (
                        "Login with Face"
                    )}
                </button>
            </div>
            <p className="mt-6 text-sm text-gray-500">
                Register first if you haven't already.
            </p>
        </div>
    );
}
