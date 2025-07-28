import pyaudio
import json
import time
from vosk import Model, KaldiRecognizer

# Load model
model_path = r"C:\C300 Programs\vosk-model-small-en-us-0.15\vosk-model-small-en-us-0.15"
model = Model(model_path)
recognizer = KaldiRecognizer(model, 16000)

# Initialize microphone
mic = pyaudio.PyAudio()
stream = mic.open(format=pyaudio.paInt16, channels=1, rate=16000,
                  input=True, frames_per_buffer=8192)
stream.start_stream()

log_file = "voice_log.txt"

def log_to_file(text):
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(text + "\n")

print("Listening... Press Ctrl+C to stop.")
start_time = None
partial_text = ""

try:
    while True:
        data = stream.read(8192, exception_on_overflow=False)
        if recognizer.AcceptWaveform(data):
            result = json.loads(recognizer.Result())
            text = result.get("text", "")
            if text:
                print("You said:", text)

                # Save only the latest final transcription to JSON
                with open("transcriptions.json", "w", encoding="utf-8") as f:
                    json.dump({"latest_transcription": text}, f, indent=2)

                partial_text = ""
                start_time = None  # reset timer

        else:
            partial = json.loads(recognizer.PartialResult()).get("partial", "")
            if partial:
                if not start_time:
                    start_time = time.time()
                partial_text = partial

                # Check if 2 seconds have passed since speech began
                if time.time() - start_time >= 2:
                    print("You (partial):", partial_text)
                    log_to_file(partial_text + " (partial)")
                    partial_text = ""
                    start_time = None

except KeyboardInterrupt:
    print("\nStopped.")

finally:
    stream.stop_stream()
    stream.close()
    mic.terminate()