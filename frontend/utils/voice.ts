export const speak = (text: string) => {
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        // Optional: Select a specific voice if desired, or let browser default
        // const voices = window.speechSynthesis.getVoices();
        // utterance.voice = voices[0]; 

        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        window.speechSynthesis.speak(utterance);
    } else {
        console.warn("Text-to-speech not supported in this browser.");
    }
};
