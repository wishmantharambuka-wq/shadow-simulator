import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

export const dynamic = "force-dynamic";

const PROJ_DATA = path.join(
  process.env.APPDATA || "",
  "Python",
  "Python314",
  "site-packages",
  "rasterio",
  "proj_data"
);

export async function POST() {
  const scriptPath = path.resolve(
    process.cwd(),
    "..",
    "processing",
    "process_shadows.py"
  );

  return new Promise<NextResponse>((resolve) => {
    const child = exec(
      `python "${scriptPath}"`,
      {
        env: { ...process.env, PROJ_DATA, PROJ_LIB: PROJ_DATA },
        timeout: 300000,
      },
      (error, stdout, stderr) => {
        if (error) {
          console.error("Processing failed:", stderr);
          resolve(
            NextResponse.json(
              { success: false, error: stderr || error.message, stdout },
              { status: 500 }
            )
          );
        } else {
          resolve(NextResponse.json({ success: true, output: stdout }));
        }
      }
    );
  });
}
