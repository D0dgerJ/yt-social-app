import { spawn } from "child_process";
import path from "path";
import { env } from "../../config/env.js";

const WHISPER_PYTHON = env.WHISPER_PYTHON ?? "python";
const WHISPER_SCRIPT =
  env.WHISPER_SCRIPT ?? path.resolve(process.cwd(), "whisper", "transcribe.py");

export async function transcribeWithWhisper(
  absoluteFilePath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [WHISPER_SCRIPT, absoluteFilePath];

    if (!env.isProd) {
      console.log("[whisper] spawn:", WHISPER_PYTHON, args.join(" "));
    }

    const child = spawn(WHISPER_PYTHON, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        ...(env.WHISPER_MODEL ? { WHISPER_MODEL: env.WHISPER_MODEL } : {}),
      },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk) => {
      const message = chunk.toString("utf8");
      stderr += message;

      if (!env.isProd) {
        console.log("[whisper][stderr]", message.trim());
      }
    });

    child.on("error", (error) => {
      console.error("[whisper] spawn error:", error);
      reject(new Error("WHISPER_PROCESS_ERROR"));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        console.error("[whisper] exit code:", code, "stderr:", stderr);
        reject(new Error(`WHISPER_EXIT_${code}`));
        return;
      }

      try {
        const lastLine = stdout.trim().split("\n").pop() || "";
        const parsed = JSON.parse(lastLine);

        if (parsed.error) {
          console.error("[whisper] error from script:", parsed);
          reject(new Error(parsed.error));
          return;
        }

        if (typeof parsed.text !== "string") {
          console.error("[whisper] no text in result:", parsed);
          reject(new Error("NO_TEXT_IN_RESULT"));
          return;
        }

        resolve(parsed.text);
      } catch (error) {
        console.error("[whisper] parse error:", error, "stdout:", stdout);
        reject(new Error("WHISPER_PARSE_ERROR"));
      }
    });
  });
}