
'use client';
import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw } from 'lucide-react';

interface WebcamCaptureProps {
    onCapture: (imageSrc: string | null) => void;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture }) => {
    const webcamRef = useRef<Webcam>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(null);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        setImgSrc(imageSrc || null);
        onCapture(imageSrc || null);
    }, [webcamRef, onCapture]);

    const retake = () => {
        setImgSrc(null);
        onCapture(null);
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {imgSrc ? (
                <img src={imgSrc} alt="captured" className="rounded-lg shadow-lg border-2 border-green-500" />
            ) : (
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="rounded-lg shadow-lg border-2 border-gray-300"
                    videoConstraints={{ facingMode: "user" }}
                />
            )}

            <div className="flex gap-4">
                {!imgSrc ? (
                    <button
                        onClick={capture}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition"
                    >
                        <Camera size={20} /> Capture
                    </button>
                ) : (
                    <button
                        onClick={retake}
                        className="flex items-center gap-2 bg-gray-600 text-white px-6 py-2 rounded-full hover:bg-gray-700 transition"
                    >
                        <RefreshCw size={20} /> Retake
                    </button>
                )}
            </div>
        </div>
    );
};

export default WebcamCapture;
