import { useEffect, useMemo, useState } from "react";
import foodImage from "/foodImage.webp";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState("What is in this image?");
  const [loading, setLoading] = useState(false);
  const [serverResult, setServerResult] = useState(null);
  const [error, setError] = useState("");

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    function onPaste(e) {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageItem = Array.from(items).find((i) =>
        i.type.startsWith("image/"),
      );
      if (!imageItem) return;

      const blob = imageItem.getAsFile();
      const ext = blob.type.split("/")[1] || "png";

      const pastedFile = new File([blob], `pasted.${ext}`, { type: blob.type });
      setFile(pastedFile);
      setError("");
      setServerResult(null);
    }

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  async function handleAnalyze() {
    setError("");
    setServerResult(null);

    if (!file) {
      setError("Please choose an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("prompt", prompt);

    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Backend error ${res.status}: ${text}`);
      }

      const data = await res.json();
      setServerResult(data);
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div>
        <img src={foodImage} className="logo" alt="logo" />
      </div>

      <h1>Food App with image tracking</h1>

      <div className="card" style={{ display: "grid", gap: "12px" }}>
        {/* ⭐ Professional upload box (click + drag + paste) */}
        <div
          onClick={() => document.getElementById("fileInput").click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f && f.type.startsWith("image/")) setFile(f);
          }}
          style={{
            border: "2px dashed #aaa",
            padding: 14,
            borderRadius: 12,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <strong>Upload image</strong>
          <div style={{ fontSize: 14, opacity: 0.8 }}>
            Click to choose, drag & drop, or paste (Ctrl+V)
          </div>

          <input
            id="fileInput"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Preview */}
        {previewUrl && (
          <div style={{ display: "grid", gap: "6px" }}>
            <span style={{ textAlign: "left" }}>Preview</span>
            <img
              src={previewUrl}
              alt="preview"
              style={{ maxWidth: "320px", borderRadius: "12px" }}
            />
          </div>
        )}

        {/* Analyze button */}
        <button onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>

        {/* Error */}
        {error && (
          <p style={{ color: "crimson", textAlign: "left" }}>{error}</p>
        )}

        {/* Result */}
        {serverResult && (
          <pre style={{ textAlign: "left", whiteSpace: "pre-wrap" }}>
            {serverResult.result}
          </pre>
        )}
      </div>
    </>
  );
}

export default App;
