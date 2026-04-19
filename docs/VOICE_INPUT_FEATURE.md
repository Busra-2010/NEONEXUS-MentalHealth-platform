# Voice Input Feature for Mood Journaling

## What’s New

The Student Dashboard now includes voice input functionality for mood journaling notes, allowing students to express their thoughts using speech-to-text input.

---

## Key Features

### Voice-to-Text Input

* Speech recognition powered by the Web Speech API
* Real-time transcription with interim results
* Multi-language support
* Automatically appends transcribed text to existing input

---

## Language Support

* English (US) — `en-US`
* English (UK) — `en-GB`
* Hindi — `hi-IN`
* Urdu — `ur-PK`
* Spanish — `es-ES`
* French — `fr-FR`
* German — `de-DE`

---

## Visual Feedback

* Microphone button indicates recording state
* Active recording indicator with “Listening” status
* Real-time preview of spoken text
* Clear error messages for unsupported scenarios

---

## How It Works

### Step 1: Access Voice Input

```id="9qg6gi"
Mood Form → Select Mood → Notes Section → Microphone Button
```

### Step 2: Choose Language

* Select preferred language from the dropdown
* Language preference persists during the session

### Step 3: Voice Recording

1. Activate the microphone
2. Grant permission if prompted
3. Speak naturally
4. View real-time transcription
5. Stop recording manually

### Step 4: Review and Submit

* Transcribed text is inserted into the input field
* User can edit text before submission
* Submit the mood entry as usual

---

## User Interface

```id="1zbl0p"
Notes Section
[Text input area with transcription]

Character count displayed
Language selector available
```

### Recording State

```id="c9s8hp"
Listening status displayed
Interim transcription shown in real time
```

---

## Technical Features

### Browser Compatibility

* Supported: Chrome, Edge, Safari (recent versions)
* Fallback for unsupported browsers
* Text input remains available as default

### Error Handling

* Microphone permission handling
* No speech detection prompts
* Network and audio capture error handling

### Performance

* Lazy initialization of speech recognition
* Cleanup on component unmount
* Optimized state updates for smooth transcription

---

## User Experience Benefits

### Accessibility

* Supports users with limited typing ability
* Useful for users who prefer speaking over writing
* Enables multilingual expression

### Convenience

* Faster input compared to typing
* More natural expression of thoughts
* Optimized for mobile usage

### Engagement

* Reduces friction in journaling
* Encourages more detailed input
* Improves consistency of daily usage

---

## Privacy and Security

* Speech processing handled on the client side
* No audio data is stored
* Transcription exists only in session state
* Full user control over recording

---

## Usage Examples

### Example 1

```id="kz1gdn"
"Feeling good today, completed my tasks successfully."
```

### Example 2

```id="r7r7b2"
"I feel slightly anxious about tomorrow's presentation, but I have prepared well."
```

### Example 3

```id="0m4g8k"
Hindi input: "आज मैं अच्छा महसूस कर रहा हूँ"
```

---

## Future Enhancements

* Voice-based emotion analysis
* Voice command support
* Offline speech recognition
* Analysis of speech patterns for behavioral insights

---

This feature improves accessibility and usability by enabling natural, voice-based interaction within mood journaling.
