import sys
import json
import os
import whisper

# FFmpeg на Windows
FFMPEG_DIR = r"C:\ffmpeg\bin"

if os.path.isdir(FFMPEG_DIR) and FFMPEG_DIR not in os.environ.get("PATH", ""):
    os.environ["PATH"] = FFMPEG_DIR + os.pathsep + os.environ.get("PATH", "")

# ВАЖНО: говорим Python'у писать в stdout в UTF-8
# (иначе cp1251 не может закодировать emoji и странные символы)
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        # если вдруг не получилось — просто пропускаем, но на современных версиях всё ок
        pass


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "NO_PATH_PROVIDED"}))
        return

    audio_path = sys.argv[1]

    if not os.path.isfile(audio_path):
        print(json.dumps({"error": "FILE_NOT_FOUND", "path": audio_path}))
        return

    # Можно управлять моделью через переменную окружения WHISPER_MODEL
    # tiny / base / small / medium / large
    model_name = os.getenv("WHISPER_MODEL", "small")

    try:
        model = whisper.load_model(model_name)
        # language=None → автоопределение (русский, англ., нем., укр, и т.п.)
        result = model.transcribe(audio_path, language=None)
        text = (result.get("text") or "").strip()

        print(json.dumps(
            {"text": text},
            ensure_ascii=False  # оставляем Юникод как есть (русский, emoji и т.п.)
        ))
    except Exception as e:
        # Любая внутренняя ошибка whisper/ffmpeg попадёт сюда
        print(json.dumps({"error": "TRANSCRIBE_FAILED", "details": str(e)}))


if __name__ == "__main__":
    main()
