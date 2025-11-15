// infrastructure/services/whisperService.ts
import { spawn } from "child_process";
import path from "path";

/**
 * Какой python использовать:
 * - В dev: укажи в .env путь до python из venv, например:
 *   WHISPER_PYTHON=D:\projects\s-1\DodgerJSocial\social\server\venv\Scripts\python.exe
 * - Если переменной нет — возьмём "python" из PATH.
 */
const WHISPER_PYTHON =
  process.env.WHISPER_PYTHON || "python";

/**
 * Путь до transcribe.py:
 * - по умолчанию: <CWD>/whisper/transcribe.py
 *   (то есть если ты запускаешь server из папки social/server,
 *    то там должна быть папка whisper/transcribe.py)
 * - можно переопределить через WHISPER_SCRIPT
 */
const WHISPER_SCRIPT =
  process.env.WHISPER_SCRIPT ||
  path.resolve(process.cwd(), "whisper", "transcribe.py");

export async function transcribeWithWhisper(
  absoluteFilePath: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [WHISPER_SCRIPT, absoluteFilePath];

    console.log("[whisper] spawn:", WHISPER_PYTHON, args.join(" "));

    const child = spawn(WHISPER_PYTHON, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        // берём все текущие переменные окружения
        ...process.env,
        // и принудительно говорим Python'у писать вывод в UTF-8
        PYTHONIOENCODING: "utf-8",
      },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk) => {
      const s = chunk.toString("utf8");
      stderr += s;
      // Можно логировать ворнинги Whisper (FP16 и т.п.), но не падать.
      console.log("[whisper][stderr]", s.trim());
    });

    child.on("error", (err) => {
      console.error("[whisper] spawn error:", err);
      reject(new Error("WHISPER_PROCESS_ERROR"));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        console.error("[whisper] exit code:", code, "stderr:", stderr);
        return reject(new Error("WHISPER_EXIT_" + code));
      }

      try {
        // transcribe.py выводит JSON одной строкой:
        // {"text": "..."} или {"error": "...", "details": "..."}
        const lastLine = stdout.trim().split("\n").pop() || "";
        const parsed = JSON.parse(lastLine);

        if (parsed.error) {
          console.error("[whisper] error from script:", parsed);
          return reject(new Error(parsed.error));
        }

        if (typeof parsed.text !== "string") {
          console.error("[whisper] no text in result:", parsed);
          return reject(new Error("NO_TEXT_IN_RESULT"));
        }

        resolve(parsed.text);
      } catch (err) {
        console.error("[whisper] parse error:", err, "stdout:", stdout);
        reject(new Error("WHISPER_PARSE_ERROR"));
      }
    });
  });
}
