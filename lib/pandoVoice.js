export const getPandoVoice = () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  
  const voices = window.speechSynthesis.getVoices();
  
  // Pando's unified AI voice persona
  return (
    voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel') ||
          v.name.includes('Alex'))
    ) ||
    voices.find((v) => v.lang.startsWith('en')) ||
    voices[0]
  );
};

export const PANDO_VOICE_SETTINGS = {
  rate: 0.96,
  pitch: 1.06,
};
