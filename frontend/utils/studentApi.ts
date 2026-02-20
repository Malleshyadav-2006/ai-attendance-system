
const API_BASE_URL = '/api';

export async function loginWithFace(image: File) {
    const formData = new FormData();
    formData.append('image', image);

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Login failed');
        }

        return response.json();
    } catch (error: any) {
        throw error;
    }
}

export async function getStudentProfile(userId: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/student/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }
        return response.json();
    } catch (error: any) {
        throw error;
    }
}

export async function getStudentAttendance(userId: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/student/${userId}/attendance`);
        if (!response.ok) {
            throw new Error('Failed to fetch attendance history');
        }
        return response.json();
    } catch (error: any) {
        throw error;
    }
}
