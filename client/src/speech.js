/**
 * Text-to-speech client helper using the browser SpeechSynthesis API.
 */
let currentUtterance = null;

export const speech = {
  speak: (text, onStart, onEnd, onError) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (onError) onError(new Error("Text-to-speech is not supported in this browser."));
      return;
    }

    // Cancel any active speech first
    window.speechSynthesis.cancel();

    // Clean text: strip markdown characters like *, _, #, and url links
    const cleanText = text
      .replace(/[\*\#\_]/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .trim();

    currentUtterance = new SpeechSynthesisUtterance(cleanText);

    // Fetch and assign an Indian-accented English voice or standard English voice if available
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(v => v.lang === 'en-IN' || v.lang === 'hi-IN');
    const genericEnglishVoice = voices.find(v => v.lang.startsWith('en'));
    
    if (indianVoice) {
      currentUtterance.voice = indianVoice;
    } else if (genericEnglishVoice) {
      currentUtterance.voice = genericEnglishVoice;
    }

    currentUtterance.onstart = () => {
      if (onStart) onStart();
    };

    currentUtterance.onend = () => {
      if (onEnd) onEnd();
      currentUtterance = null;
    };

    currentUtterance.onerror = (e) => {
      if (e.error !== 'interrupted') {
        if (onError) onError(e);
      }
      currentUtterance = null;
    };

    window.speechSynthesis.speak(currentUtterance);
  },

  stop: () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      currentUtterance = null;
    }
  },

  isSpeaking: () => {
    return (typeof window !== 'undefined' && window.speechSynthesis) 
      ? window.speechSynthesis.speaking 
      : false;
  }
};

// Ensure voices are loaded asynchronously in some browsers
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {};
}
