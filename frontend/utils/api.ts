
const API_BASE_URL = '/api';

export async function registerUser(name: string, image: File, email?: string, phone?: string) {
    console.log('🔵 registerUser called:', { name, imageSize: image.size, imageType: image.type, email, phone });

    const formData = new FormData();
    formData.append('name', name);
    formData.append('image', image);
    if (email) formData.append('email', email);
    if (phone) formData.append('phone', phone);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
        console.log('🚀 Sending registration request to:', `${API_BASE_URL}/register`);
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        console.log('✅ Response received:', response.status, response.statusText);

        if (!response.ok) {
            const text = await response.text();
            console.error('❌ Registration error response:', text);
            let errorMessage = `Server Error: ${response.status} ${response.statusText}`;
            try {
                const errorData = JSON.parse(text);
                errorMessage = errorData.detail || errorMessage;
            } catch (parseError) {
                // Response wasn't JSON, use the raw text
                errorMessage += ` - ${text.substring(0, 200)}`;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('📦 Registration response data:', data);
        return data;
    } catch (error: any) {
        clearTimeout(timeoutId);
        console.error('❌ registerUser error:', error);
        if (error.name === 'AbortError') {
            throw new Error('Registration timed out. Please try again.');
        }
        throw error;
    }
}

export async function markAttendance(image: File, location?: { lat: number; lng: number }) {
    console.log("🔵 markAttendance called with:", { imageSize: image.size, imageType: image.type, location });

    const formData = new FormData();
    formData.append('file', image);

    if (location) {
        formData.append('latitude', location.lat.toString());
        formData.append('longitude', location.lng.toString());
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
        console.log("🚀 Sending request to:", `${API_BASE_URL}/mark_attendance`);

        const response = await fetch(`${API_BASE_URL}/mark_attendance`, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
            mode: 'cors', // Explicitly set CORS mode
        });

        clearTimeout(timeoutId);
        console.log("✅ Response received:", response.status, response.statusText);

        if (!response.ok) {
            const text = await response.text();
            try {
                const errorData = JSON.parse(text);
                throw new Error(errorData.detail || `Server error: ${response.status}`);
            } catch (e) {
                throw new Error(`Server Error: ${response.status} ${response.statusText} - ${text.substring(0, 100)}`);
            }
        }

        const data = await response.json();
        console.log("📦 Response data:", data);
        return data;
    } catch (error: any) {
        clearTimeout(timeoutId);
        console.error("❌ markAttendance error:", error);

        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Backend may be slow or down.');
        }

        if (error.message.includes('fetch')) {
            throw new Error('Cannot connect to backend server. Is it running on port 8000?');
        }

        throw error;
    }
}

export async function getAttendanceHistory() {
    const response = await fetch(`${API_BASE_URL}/attendance/history`);
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch attendance history: ${response.status} ${response.statusText} - ${text.substring(0, 100)}`);
    }
    return response.json();
}
