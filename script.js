document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const textInput = document.getElementById('textInput');
    const hideTextBtn = document.getElementById('hideTextBtn');
    const startRecordingBtn = document.getElementById('startRecordingBtn');
    const sequenceToggle = document.getElementById('sequenceToggle');
    const resetBtn = document.getElementById('resetBtn');
    const hiddenTextDisplay = document.getElementById('hiddenTextDisplay');
    const statusMessage = document.getElementById('statusMessage');
    
    // Add debug info logging
    const logDebug = (message) => {
        console.log(message);
    };
    
    // Check for speech recognition support
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        console.log('Speech recognition is supported in this browser.');
    } else {
        console.log('Speech recognition is NOT supported in this browser. Please use Chrome or Edge.');
    }

    // App State
    let isTextHidden = false;
    let isRecording = false;
    let recognition = null;
    let words = [];
    let currentWordIndex = 0;
    let revealedWords = new Set();

    // Initialize Speech Recognition
    function initSpeechRecognition() {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            logDebug('Initializing speech recognition');
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            
            // Additional parameters that might help
            recognition.maxAlternatives = 1;

            // Handle speech recognition results
            recognition.onresult = handleSpeechResult;
            
            // Handle speech recognition errors
            recognition.onerror = (event) => {
                logDebug(`Speech recognition error: ${event.error}`);
                
                if (event.error === 'not-allowed') {
                    updateStatus('Microphone permission denied. Please allow microphone access and try again.');
                    logDebug('Microphone permission was denied by the user or system');
                } else if (event.error === 'no-speech') {
                    logDebug('No speech detected, this is normal');
                    // This is normal, we just restart recognition
                    if (isRecording) {
                        updateStatus('No speech detected. Please speak louder or check your microphone.');
                        try {
                            setTimeout(() => {
                                if (isRecording) {
                                    logDebug('Restarting recognition after no-speech error');
                                    recognition.start();
                                }
                            }, 300);
                        } catch (e) {
                            logDebug(`Error restarting after no-speech: ${e.message}`);
                        }
                    }
                    return;
                } else if (event.error === 'aborted') {
                    logDebug('Speech recognition was aborted');
                } else if (event.error === 'network') {
                    updateStatus('Network error occurred. Check your internet connection.');
                    logDebug('A network error occurred during recognition');
                } else {
                    updateStatus(`Error: ${event.error}. Please try again.`);
                    logDebug(`Unknown error during recognition: ${event.error}`);
                }
                
                if (event.error !== 'no-speech') {
                    isRecording = false;
                    startRecordingBtn.innerHTML = '<span class="mic-icon">🎤</span> Start Recording';
                    startRecordingBtn.classList.remove('recording');
                }
            };
            
            // Handle speech recognition end
            recognition.onend = () => {
                logDebug('Speech recognition ended');
                if (isRecording) {
                    try {
                        logDebug('Attempting to restart recognition after end event');
                        setTimeout(() => {
                            if (isRecording) {
                                recognition.start();
                                logDebug('Recognition restarted successfully');
                            }
                        }, 300);
                    } catch (e) {
                        logDebug(`Error restarting speech recognition: ${e.message}`);
                        isRecording = false;
                        startRecordingBtn.innerHTML = '<span class="mic-icon">🎤</span> Start Recording';
                        startRecordingBtn.classList.remove('recording');
                        updateStatus('Error restarting recording. Please try again.');
                    }
                }
            };
            
            // Additional event handlers for better debugging
            recognition.onstart = () => {
                logDebug('Recognition started successfully');
            };
            
            recognition.onaudiostart = () => {
                logDebug('Audio capturing started');
            };
            
            recognition.onaudioend = () => {
                logDebug('Audio capturing ended');
            };
            
            recognition.onsoundstart = () => {
                logDebug('Sound detected');
            };
            
            recognition.onsoundend = () => {
                logDebug('Sound ended');
            };
            
            recognition.onspeechstart = () => {
                logDebug('Speech detected');
            };
            
            recognition.onspeechend = () => {
                logDebug('Speech ended');
            };
            
            return true;
        } else {
            updateStatus('Speech recognition is not supported in this browser. Try Chrome or Edge.');
            logDebug('Speech recognition is not available in this browser');
            return false;
        }
    }

    // Handle Hide Text Button
    hideTextBtn.addEventListener('click', () => {
        if (!isTextHidden) {
            const text = textInput.value.trim();
            if (text === '') {
                updateStatus('Please enter some text first.');
                return;
            }
            hideText(text);
        } else {
            showText();
        }
    });

    // Handle Start Recording Button
    startRecordingBtn.addEventListener('click', () => {
        if (!isTextHidden) {
            updateStatus('Please hide the text first before starting recording.');
            return;
        }

        if (!isRecording) {
            if (!recognition && !initSpeechRecognition()) {
                return;
            }
            startRecording();
        } else {
            stopRecording();
        }
    });

    // Handle Reset Button
    resetBtn.addEventListener('click', () => {
        resetApp();
    });

    // Hide the original text and prepare the hidden display
    function hideText(text) {
        // Clean and tokenize text
        words = text.trim()
            .replace(/[^\w\s']/g, '') // Remove punctuation except apostrophes
            .replace(/\s+/g, ' ')     // Normalize spaces
            .toLowerCase()
            .split(' ')
            .filter(word => word.length > 0);

        if (words.length === 0) {
            updateStatus('Please enter valid text with words.');
            return;
        }

        // Clear previous content
        hiddenTextDisplay.innerHTML = '';
        
        // Create hidden word spans
        words.forEach(word => {
            const wordSpan = document.createElement('span');
            wordSpan.textContent = word;
            wordSpan.className = 'hidden-word';
            hiddenTextDisplay.appendChild(wordSpan);
            
            // Add space after each word
            hiddenTextDisplay.appendChild(document.createTextNode(' '));
        });

        // Update UI state
        textInput.style.display = 'none';
        hiddenTextDisplay.style.display = 'block';
        hideTextBtn.textContent = 'Show Text';
        isTextHidden = true;
        currentWordIndex = 0;
        revealedWords.clear();
        updateStatus('Text hidden. Press the microphone button to start reciting.');
    }

    // Show the original text
    function showText() {
        textInput.style.display = 'block';
        hiddenTextDisplay.style.display = 'none';
        hideTextBtn.textContent = 'Hide Text';
        isTextHidden = false;
        if (isRecording) {
            stopRecording();
        }
        updateStatus('Text revealed. Edit your text and press "Hide Text" to begin again.');
    }

    // Start speech recognition
    function startRecording() {
        try {
            logDebug('Starting recording process');
            
            // Reset recognition if it already exists
            if (recognition) {
                try {
                    recognition.stop();
                    logDebug('Stopped existing recognition instance');
                } catch (e) {
                    logDebug(`Error stopping existing recognition: ${e.message}`);
                }
                recognition = null;
            }
            
            // Initialize new recognition instance
            if (!initSpeechRecognition()) {
                logDebug('Failed to initialize speech recognition');
                return; // Failed to initialize
            }
            
            // Update UI before starting
            isRecording = true;
            startRecordingBtn.innerHTML = '<span class="mic-icon">🎤</span> Stop Recording';
            startRecordingBtn.classList.add('recording');
            updateStatus('Listening... Speak the text clearly.');
            
            // Start speech recognition - the browser will automatically request microphone permission
            // when needed, no need to explicitly request it beforehand
            try {
                logDebug('Starting speech recognition');
                recognition.start();
            } catch (e) {
                if (e.name === 'InvalidStateError') {
                    // Recognition is already started, which is fine
                    logDebug('Recognition was already running');
                } else {
                    logDebug(`Error starting recognition: ${e.message}`);
                    updateStatus(`Error starting speech recognition: ${e.message}. Please try again.`);
                    isRecording = false;
                    startRecordingBtn.innerHTML = '<span class="mic-icon">🎤</span> Start Recording';
                    startRecordingBtn.classList.remove('recording');
                }
            }
        } catch (error) {
            logDebug(`General error starting recognition: ${error.message}`);
            updateStatus(`Error starting speech recognition: ${error.message}. Please try again.`);
            isRecording = false;
            startRecordingBtn.innerHTML = '<span class="mic-icon">🎤</span> Start Recording';
            startRecordingBtn.classList.remove('recording');
        }
    }

    // Stop speech recognition
    function stopRecording() {
        logDebug('Stopping recording');
        isRecording = false;
        
        if (recognition) {
            try {
                recognition.stop();
                logDebug('Recognition stopped successfully');
            } catch (e) {
                logDebug(`Error stopping recognition: ${e.message}`);
            }
        }
        
        startRecordingBtn.innerHTML = '<span class="mic-icon">🎤</span> Start Recording';
        startRecordingBtn.classList.remove('recording');
        updateStatus('Recording stopped. Press the microphone button to continue.');
    }

    // Handle speech recognition results
    function handleSpeechResult(event) {
        logDebug(`Speech recognition result received: ${event.resultIndex} / ${event.results.length} results`);
        const results = event.results;
        const sequenceRequired = sequenceToggle.checked;
        
        for (let i = event.resultIndex; i < results.length; i++) {
            const transcript = results[i][0].transcript.trim().toLowerCase();
            const confidence = results[i][0].confidence;
            logDebug(`Processing transcript: "${transcript}" (confidence: ${Math.round(confidence * 100)}%)`);
            
            // Split the transcript into words
            const spokenWords = transcript.split(/\s+/);
            logDebug(`Words detected: ${spokenWords.join(', ')}`);
            
            if (sequenceRequired) {
                logDebug('Checking words in sequence');
                checkWordsInSequence(spokenWords);
            } else {
                logDebug('Checking words in any order');
                checkWordsInAnyOrder(spokenWords);
            }
        }
        
        // Update status with progress
        if (words.length > 0) {
            const progress = Math.round((revealedWords.size / words.length) * 100);
            updateStatus(`Progress: ${progress}% (${revealedWords.size}/${words.length} words)`);
            
            // Check if all words have been revealed
            if (revealedWords.size === words.length) {
                updateStatus('Congratulations! You have recited all the text correctly.');
                logDebug('All words have been revealed, stopping recording');
                stopRecording();
            }
        }
    }

    // Check words when they must be in sequence
    function checkWordsInSequence(spokenWords) {
        for (let i = 0; i < spokenWords.length; i++) {
            const spokenWord = spokenWords[i].replace(/[^\w']/g, '').toLowerCase();
            
            if (spokenWord && currentWordIndex < words.length) {
                const expectedWord = words[currentWordIndex];
                
                logDebug(`Comparing spoken word "${spokenWord}" with expected "${expectedWord}" at index ${currentWordIndex}`);
                
                if (spokenWord === expectedWord && !revealedWords.has(currentWordIndex)) {
                    logDebug(`Match found! Revealing word at index ${currentWordIndex}`);
                    revealWord(currentWordIndex);
                    currentWordIndex++;
                } else if (spokenWord !== expectedWord) {
                    logDebug(`No match for "${spokenWord}" vs "${expectedWord}"`);
                }
            }
        }
    }

    // Check words when they can be in any order
    function checkWordsInAnyOrder(spokenWords) {
        for (let i = 0; i < spokenWords.length; i++) {
            const spokenWord = spokenWords[i].replace(/[^\w']/g, '').toLowerCase();
            
            if (!spokenWord) continue;
            
            logDebug(`Checking non-sequential word: "${spokenWord}"`);
            let found = false;
            
            for (let j = 0; j < words.length; j++) {
                if (spokenWord === words[j] && !revealedWords.has(j)) {
                    logDebug(`Found match for "${spokenWord}" at index ${j}`);
                    revealWord(j);
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                logDebug(`No match found for "${spokenWord}" in any position`);
            }
        }
    }

    // Reveal a word in the display
    function revealWord(index) {
        if (index >= 0 && index < words.length) {
            const wordElements = hiddenTextDisplay.querySelectorAll('.hidden-word');
            if (index < wordElements.length) {
                wordElements[index].classList.add('revealed-word');
                revealedWords.add(index);
                
                logDebug(`Revealed word "${words[index]}" at index ${index}`);
                
                // Update status with progress
                const progress = Math.round((revealedWords.size / words.length) * 100);
                updateStatus(`Progress: ${progress}% (${revealedWords.size}/${words.length} words)`);
            }
        }
    }

    // Reset the application state
    function resetApp() {
        logDebug('Resetting application');
        
        if (isRecording) {
            stopRecording();
        }
        
        // Clear any existing speech recognition instance
        if (recognition) {
            try {
                recognition.stop();
            } catch (e) {
                logDebug(`Error stopping recognition during reset: ${e.message}`);
            }
            recognition = null;
        }
        
        showText();
        textInput.value = '';
        hiddenTextDisplay.innerHTML = '';
        currentWordIndex = 0;
        revealedWords.clear();
        words = [];
        updateStatus('App reset. Enter new text to begin again.');
        logDebug('Application reset complete');
    }

    // Update status message
    function updateStatus(message) {
        statusMessage.textContent = message;
        logDebug(`Status updated: ${message}`);
    }
});
