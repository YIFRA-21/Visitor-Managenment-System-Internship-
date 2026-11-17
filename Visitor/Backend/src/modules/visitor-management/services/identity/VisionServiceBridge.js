/**
 * VisionServiceBridge
 * Secure Node.js inter-process bridge to Python OpenCV Computer Vision Engine.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const SCRIPT_PATH = path.join(__dirname, 'vision_processor.py');

class VisionServiceBridge {
  constructor() {
    this.pythonBinary = 'python';
  }

  /**
   * Execute an action on vision_processor.py with a JSON payload
   * @param {string} action - 'quality' | 'passive_liveness' | 'match_faces' | 'extract_portrait'
   * @param {Object} payload - Image and parameter payload
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Promise<Object>}
   */
  async runVisionTask(action, payload = {}, timeoutMs = 25000) {
    return new Promise((resolve) => {
      let resolved = false;

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          try {
            pyProcess.kill();
          } catch (_) {}
          resolve({
            error: 'Vision task timed out',
            qualityPassed: false,
            overallScore: 0,
            status: 'ERROR'
          });
        }
      }, timeoutMs);

      const pyProcess = spawn(this.pythonBinary, [SCRIPT_PATH, action], {
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdoutData = '';
      let stderrData = '';

      pyProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      pyProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      pyProcess.on('close', (code) => {
        clearTimeout(timer);
        if (resolved) return;
        resolved = true;

        if (code !== 0) {
          console.warn(`[VisionServiceBridge] Python exit code ${code}. Stderr: ${stderrData}`);
          resolve({
            error: stderrData || `Vision process exited with code ${code}`,
            status: 'FAILED'
          });
          return;
        }

        try {
          const parsed = JSON.parse(stdoutData.trim());
          resolve(parsed);
        } catch (e) {
          console.warn(`[VisionServiceBridge] JSON parse failed on output: ${stdoutData}`);
          resolve({
            error: `Failed to parse vision engine output: ${e.message}`,
            status: 'FAILED'
          });
        }
      });

      pyProcess.on('error', (err) => {
        clearTimeout(timer);
        if (resolved) return;
        resolved = true;
        console.warn(`[VisionServiceBridge] Process spawn error: ${err.message}`);
        resolve({
          error: `Failed to spawn vision engine: ${err.message}`,
          status: 'ERROR'
        });
      });

      // Write payload to stdin
      try {
        pyProcess.stdin.write(JSON.stringify(payload));
        pyProcess.stdin.end();
      } catch (err) {
        clearTimeout(timer);
        if (!resolved) {
          resolved = true;
          resolve({ error: err.message, status: 'ERROR' });
        }
      }
    });
  }
}

module.exports = new VisionServiceBridge();
