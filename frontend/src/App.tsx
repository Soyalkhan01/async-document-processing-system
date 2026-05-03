import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://127.0.0.1:8000"
    : "https://YOUR-RENDER-BACKEND-URL.onrender.com";

function App() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("id");

  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [editedData, setEditedData] = useState("");

  const [progressData, setProgressData] = useState<any>({});

  // =========================
  // FETCH (manual only)
  // =========================
  const fetchDocuments = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/documents?search=${search}&status=${status}&sort_by=${sortBy}`
      );
      setDocuments(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [search, status, sortBy]);

  // =========================
  // PROGRESS POLLING
  // =========================
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/progress`);

        if (res.data?.document_id) {
          setProgressData((prev: any) => ({
            ...prev,
            [res.data.document_id]: res.data,
          }));
        }
      } catch (err) {
        console.log(err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // =========================
  // UPLOAD (FIXED POPUP)
  // =========================
  const handleUpload = async () => {
    if (!file) {
      alert("❌ Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 60000,
        }
      );

      if (res.status === 200 || res.status === 201) {
        alert("✅ Upload Successful");
        setFile(null);
        fetchDocuments();
      } else {
        alert("⚠️ Upload completed but response not OK");
      }
    } catch (err: any) {
      console.log(err);
      alert("❌ Upload Failed");
    }
  };

  // =========================
  // DETAIL
  // =========================
  const viewDocumentDetail = async (id: number) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/documents/${id}`);
      setSelectedDocument(res.data);
      setEditedData(res.data.extracted_data || "");
    } catch (err) {
      alert("Detail fetch failed");
    }
  };

  // =========================
  // UPDATE
  // =========================
  const updateDocument = async () => {
    if (!selectedDocument) return;

    await axios.put(
      `${API_BASE_URL}/documents/${selectedDocument.id}`,
      { extracted_data: editedData }
    );

    fetchDocuments();
    alert("Updated successfully");
  };

  // =========================
  // FINALIZE
  // =========================
  const finalizeDocument = async () => {
    if (!selectedDocument) return;

    await axios.put(
      `${API_BASE_URL}/documents/${selectedDocument.id}/finalize`
    );

    fetchDocuments();
    alert("Finalized successfully");
  };

  // =========================
  // DELETE
  // =========================
  const deleteDocument = async (id: number) => {
    await axios.delete(`${API_BASE_URL}/documents/${id}`);
    fetchDocuments();
    alert("Deleted");
  };

  // =========================
  // RETRY
  // =========================
  const retryDocument = async (id: number) => {
    await axios.post(`${API_BASE_URL}/documents/${id}/retry`);
    fetchDocuments();
    alert("Retry started");
  };

  // =========================
  // UI
  // =========================
  return (
    <div style={{ padding: 30, fontFamily: "Arial", background: "#f4f4f4" }}>
      <h1>🚀 Document Workflow System</h1>

      {/* Upload */}
      <div style={{ background: "white", padding: 20 }}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button onClick={handleUpload}>Upload</button>
      </div>

      {/* Filters */}
      <div style={{ marginTop: 20 }}>
        <input
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="processing">Processing</option>
          <option value="job_completed">Completed</option>
          <option value="failed">Failed</option>
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="id">Latest</option>
          <option value="filename">A-Z</option>
        </select>
      </div>

      {/* Documents */}
      <h2>Documents ({documents.length})</h2>

      {documents.map((doc) => (
        <div key={doc.id} style={{ background: "white", padding: 10, margin: 10 }}>
          <h3>{doc.filename}</h3>
          <p>Status: {doc.status}</p>

          {progressData[doc.id] && (
            <p>Progress: {progressData[doc.id].progress}%</p>
          )}

          <button onClick={() => viewDocumentDetail(doc.id)}>View</button>
          <button onClick={() => deleteDocument(doc.id)}>Delete</button>

          {doc.status === "failed" && (
            <button onClick={() => retryDocument(doc.id)}>Retry</button>
          )}
        </div>
      ))}

      {/* Detail */}
      {selectedDocument && (
        <div style={{ background: "white", padding: 20, marginTop: 20 }}>
          <h2>Detail</h2>

          <textarea
            value={editedData}
            onChange={(e) => setEditedData(e.target.value)}
            rows={8}
            style={{ width: "100%" }}
          />

          <button onClick={updateDocument}>Save</button>
          <button onClick={finalizeDocument}>Finalize</button>
        </div>
      )}
    </div>
  );
}

export default App;