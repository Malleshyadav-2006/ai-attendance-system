
'use client';
import { useState } from 'react';
import WebcamCapture from '@/components/WebcamCapture';
import { registerUser } from '@/utils/api';
import { useRouter } from 'next/navigation';

import { speak } from '@/utils/voice';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const router = useRouter();

    const handleCapture = (src: string | null) => {
        setImageSrc(src);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !imageSrc) {
            alert('Please provide name and capture an image');
            speak("Please provide your name and capture an image.");
            return;
        }

        setLoading(true);
        speak("Registering user...");
        try {
            console.log('📝 Starting registration for:', name);
            // Convert base64 to File
            const res = await fetch(imageSrc);
            const blob = await res.blob();
            console.log('📸 Image blob size:', blob.size, 'type:', blob.type);
            const file = new File([blob], "capture.jpg", { type: "image/jpeg" });

            const response = await registerUser(name, file, email, phone);
            console.log('✅ Registration successful:', response);
            speak(`Registration successful. Welcome, ${name}.`);
            router.push(`/student/dashboard?id=${response.user_id}`);
        } catch (error: any) {
            console.error('❌ Registration failed:', error);
            speak("Registration failed.");
            alert(`Registration Failed: ${error.message || error}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <h1 className="text-3xl font-bold mb-8 text-blue-700">User Registration</h1>

            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
                    <input
                        type="text"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Email (Optional)</label>
                    <input
                        type="email"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="For notifications"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Phone (Optional)</label>
                    <input
                        type="tel"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="For SMS alerts"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                </div>

                <div className="mb-6 flex justify-center">
                    <WebcamCapture onCapture={handleCapture} />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading || !imageSrc}
                    className={`w-full font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition
            ${loading || !imageSrc ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}
          `}
                >
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </div>
        </div>
    );
}
