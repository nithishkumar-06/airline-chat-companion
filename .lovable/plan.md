

## Goal
Add a Voice + Text hybrid mode to the existing ChatWidget without breaking current text chat. Use browser-native Web Speech APIs (SpeechRecognition + SpeechSynthesis), English only.

## Files to create / modify

### 1. New: `src/hooks/useSpeechRecognition.ts`
Encapsulates browser SpeechRecognition with append-on-resume semantics.

- Detects `window.SpeechRecognition` / `webkitSpeechRecognition`; exposes `isSupported`.
- Config: `lang='en-US'`, `continuous=false`, `interimResults=true`.
- State: `isRecording`, `interimText`, `finalText` (accumulated across pause/resume).
- Methods:
  - `start()` — begins recognition; new finals append to `finalText`.
  - `stop()` — stops current session, keeps accumulated text (for pause).
  - `cancel()` — stops and clears all text.
  - `setFinalText(string)` — lets caller sync edits from the input box.
- On `onresult`: split results into final vs interim; append finals to `finalText`, set `interimText` from interims.

### 2. New: `src/hooks/useSpeechSynthesis.ts`
Wraps `window.speechSynthesis`.

- Picks best `en-US` voice (prefer `Google US English`, `Samantha`, `Microsoft Aria`, else first `en-US`, else default).
- `speak(text)`, `cancel()`, `isSupported`, `isSpeaking`.
- Loads voices on `voiceschanged` event.

### 3. Modify: `src/components/ChatWidget.tsx`
Add voice mode state and UI without disturbing existing text flow.

**New state:**
- `voiceMode: boolean` (default false) — toggles mic+TTS feature set.
- `ttsEnabled: boolean` (default true when voiceMode on) — speaker mute toggle.
- Use the two new hooks.

**Header additions (right side, before Online indicator):**
- Voice mode toggle button (Mic / MicOff icon) — enables/disables voice mode for the session.
- Speaker toggle button (Volume2 / VolumeX) — only visible when `voiceMode` is on; mutes/unmutes TTS. When toggled off, also call `synth.cancel()`.

**Input bar — two render branches:**

a) Normal (default, or voice mode but not recording):
   - Existing Input + Send button.
   - If `voiceMode` is on, prepend a Mic button (left of input) that calls `recognition.start()`. Also show a small "Voice mode" badge/hint under the input.
   - When mic starts, switch to recording layout (b).

b) Recording layout (voice mode + `isRecording` OR has accumulated transcript awaiting send):
   - Replace input row with three buttons + a transcript preview area showing `finalText + interimText`:
     - **[X] Cancel** (left, ghost/destructive): calls `recognition.cancel()`, clears `inputValue`, returns to normal layout.
     - **[Stop] Pause** (center): calls `recognition.stop()`. Copies `finalText` into `inputValue` so user can see/edit it, exits "recording" sub-state but stays in "transcript pending" sub-state. Mic button reappears to resume — resuming continues appending onto existing text.
     - **[Send] Send** (right, primary): calls `recognition.stop()`, takes `finalText` (or `inputValue` if user paused), calls `sendMessage()` immediately, then resets transcript.
   - Pulsing ring animation around mic icon when actively recording.

**Send flow change:**
- Extract current `sendMessage` to accept an optional `overrideText` so voice send can pass the transcript directly without waiting for state update.
- After receiving assistant reply: if `voiceMode && ttsEnabled`, call `synth.speak(data.reply)`.

**Cleanup effects:**
- When `voiceMode` flips off → `recognition.cancel()` + `synth.cancel()`.
- When widget closes (`isOpen=false`) → `synth.cancel()` and stop recording.
- When auth state changes (existing reset) → also cancel speech.

**Fallback:**
- If `!recognition.isSupported`, the voice mode toggle shows a tooltip "Voice not supported in this browser" and is disabled.
- If `!synth.isSupported`, hide speaker toggle; TTS calls become no-ops.

### 4. Types
Add minimal `src/types/speech.d.ts` declaring `SpeechRecognition` / `webkitSpeechRecognition` on `Window` to satisfy TypeScript.

## UX layout sketch

```text
Header:  [✈ Tata Airways · Customer Support]  [🎤 Voice] [🔊]  ● Online

Normal input (text mode):
  [ Type your message...                    ] [➤]

Normal input (voice mode, idle):
  [🎤] [ Type or tap mic...                 ] [➤]
       Voice mode on — tap mic to speak

Recording layout:
  ┌────────────────────────────────────────┐
  │ "I need help with my baggage..."  ●rec │
  └────────────────────────────────────────┘
  [✕ Cancel]        [■ Pause]        [➤ Send]
```

## Behavioural guarantees
- Text-only chat path is untouched when `voiceMode=false`.
- Transcript persists across pause/resume until Cancel or Send.
- Send uses identical fetch + bearer-token flow as today; backend contract unchanged.
- TTS auto-stops on: mode off, widget close, logout, new send, manual mute.
- Browser support gracefully degraded with disabled controls + hint.

