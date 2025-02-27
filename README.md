# Text Memorization App

A web application that helps users memorize text by speaking it aloud. The app uses speech recognition to match spoken words against a hidden text, revealing words as they are correctly spoken.

## Features

- Paste any English text into the textbox
- Hide the text and recite it using your microphone
- Words are revealed as you speak them correctly
- Two modes available:
  - Sequential mode: Words must be spoken in the correct order
  - Non-sequential mode: Words can be spoken in any order
- Progress tracking to show how much of the text has been completed
- Simple and intuitive interface

## How to Use

1. Open `index.html` in a compatible web browser (Chrome or Edge recommended)
2. Paste or type the text you want to memorize into the textbox
3. Click "Hide Text" to begin
4. Click the microphone button and start reciting the text
5. Watch as words get revealed when you speak them correctly
6. Toggle "Words must be in sequence" to change how the app matches your speech
7. Click "Reset" to start over with new text

## Requirements

- Modern web browser with support for the Web Speech API (Chrome, Edge recommended)
- Microphone access
- Internet connection (for speech recognition)

## Technical Details

This application uses:
- HTML5, CSS3, and JavaScript (ES6+)
- Web Speech API for speech recognition
- No external dependencies or frameworks

## Privacy Note

This app processes speech locally in your browser. No audio data is sent to any server except what is required by your browser's built-in speech recognition service.