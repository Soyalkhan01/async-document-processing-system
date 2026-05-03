import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL =
  window.location.hostname ===
  "localhost"
    ? "http://127.0.0.1:8000"
    : "https://async-document-processing-system-e0oc.onrender.com";

function App() {
  const [documents, setDocuments] =
    useState<any[]>([]);

  const [file, setFile] =
    useState<File | null>(null);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [sortBy, setSortBy] =
    useState("id");

  const [selectedDocument,
    setSelectedDocument] =
    useState<any>(null);

  const [editedData,
    setEditedData] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [progressData,
    setProgressData] =
    useState<Record<number, any>>(
      {}
    );

  // ================================
  // Axios Instance
  // ================================

  const api = axios.create({
    baseURL: API_BASE_URL,
  });

  // ================================
  // Fetch Documents
  // ================================

  const fetchDocuments = async () => {
    try {
      setLoading(true);

      const response =
        await api.get(
          "/documents",
          {
            params: {
              search,
              status,
              sort_by: sortBy,
            },
          }
        );

      // Handle multiple response formats

      if (
        Array.isArray(response.data)
      ) {
        setDocuments(
          response.data
        );
      } else if (
        response.data.documents
      ) {
        setDocuments(
          response.data
            .documents
        );
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.log(error);

      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // Auto Refresh
  // ================================

  useEffect(() => {
    fetchDocuments();

    const interval =
      setInterval(() => {
        fetchDocuments();
      }, 3000);

    return () =>
      clearInterval(interval);
  }, [search, status, sortBy]);

  // ================================
  // Progress Polling
  // ================================

  useEffect(() => {
    const interval =
      setInterval(
        async () => {
          try {
            const response =
              await api.get(
                "/progress"
              );

            if (
              response.data
                .document_id
            ) {
              setProgressData(
                (
                  prev
                ) => ({
                  ...prev,

                  [response.data
                    .document_id]:
                    response.data,
                })
              );
            }
          } catch (error) {
            console.log(error);
          }
        },
        2000
      );

    return () =>
      clearInterval(interval);
  }, []);

  // ================================
  // Upload File
  // ================================

  const handleUpload =
    async () => {
      if (!file) {
        alert(
          "Please select a file"
        );

        return;
      }

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      try {
        await api.post(
          "/upload",
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

        alert(
          "File uploaded successfully"
        );

        setFile(null);

        // Delay for Render DB update

        setTimeout(() => {
          fetchDocuments();
        }, 2000);
      } catch (error: any) {
        console.log(error);

        alert(
          error?.response
            ?.data?.detail ||
            "Upload failed"
        );
      }
    };

  // ================================
  // View Detail
  // ================================

  const viewDocumentDetail =
    async (id: number) => {
      try {
        const response =
          await api.get(
            `/documents/${id}`
          );

        setSelectedDocument(
          response.data
        );

        setEditedData(
          response.data
            .extracted_data || ""
        );
      } catch (error) {
        console.log(error);

        alert(
          "Detail fetch failed"
        );
      }
    };

  // ================================
  // Update Document
  // ================================

  const updateDocument =
    async () => {
      if (!selectedDocument)
        return;

      try {
        await api.put(
          `/documents/${selectedDocument.id}`,
          {
            extracted_data:
              editedData,
          }
        );

        alert(
          "Document updated successfully"
        );

        await viewDocumentDetail(
          selectedDocument.id
        );

        fetchDocuments();
      } catch (error) {
        console.log(error);
      }
    };

  // ================================
  // Finalize Document
  // ================================

  const finalizeDocument =
    async () => {
      if (!selectedDocument)
        return;

      try {
        await api.put(
          `/documents/${selectedDocument.id}/finalize`
        );

        alert(
          "Document finalized"
        );

        await viewDocumentDetail(
          selectedDocument.id
        );

        fetchDocuments();
      } catch (error) {
        console.log(error);
      }
    };

  // ================================
  // Delete Document
  // ================================

  const deleteDocument =
    async (id: number) => {
      const confirmDelete =
        window.confirm(
          "Are you sure you want to delete this document?"
        );

      if (!confirmDelete)
        return;

      try {
        await api.delete(
          `/documents/${id}`
        );

        alert(
          "Document deleted"
        );

        if (
          selectedDocument &&
          selectedDocument.id ===
            id
        ) {
          setSelectedDocument(
            null
          );
        }

        fetchDocuments();
      } catch (error) {
        console.log(error);
      }
    };

  // ================================
  // Retry Document
  // ================================

  const retryDocument =
    async (id: number) => {
      try {
        await api.post(
          `/documents/${id}/retry`
        );

        alert(
          "Retry started"
        );

        fetchDocuments();
      } catch (error) {
        console.log(error);
      }
    };

  // ================================
  // Status Color
  // ================================

  const getStatusColor = (
    status: string
  ) => {
    if (
      status ===
      "job_completed"
    ) {
      return "green";
    }

    if (
      status === "processing"
    ) {
      return "orange";
    }

    if (
      status === "finalized"
    ) {
      return "blue";
    }

    if (
      status === "failed"
    ) {
      return "red";
    }

    return "gray";
  };

  return (
    <div
      style={{
        padding: "30px",
        fontFamily: "Arial",
        background: "#f4f4f4",
        minHeight: "100vh",
      }}
    >
      <h1>
        🚀 Document Workflow
        System
      </h1>

      {/* Upload Section */}

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "10px",
          marginBottom: "20px",
        }}
      >
        <input
          type="file"
          onChange={(e) => {
            if (
              e.target.files
            ) {
              setFile(
                e.target
                  .files[0]
              );
            }
          }}
        />

        <button
          onClick={
            handleUpload
          }
          style={{
            marginLeft:
              "10px",
            padding:
              "10px 18px",
            background:
              "#007bff",
            color: "white",
            border: "none",
            borderRadius:
              "5px",
            cursor: "pointer",
          }}
        >
          Upload
        </button>
      </div>

      {/* Search Filter */}

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "10px",
          marginBottom: "20px",
        }}
      >
        <input
          type="text"
          placeholder="Search filename..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          style={{
            padding: "10px",
            width: "250px",
            marginRight:
              "10px",
          }}
        />

        <select
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value
            )
          }
          style={{
            padding: "10px",
            marginRight:
              "10px",
          }}
        >
          <option value="">
            All Status
          </option>

          <option value="queued">
            Queued
          </option>

          <option value="processing">
            Processing
          </option>

          <option value="job_completed">
            Completed
          </option>

          <option value="finalized">
            Finalized
          </option>

          <option value="failed">
            Failed
          </option>
        </select>

        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(
              e.target.value
            )
          }
          style={{
            padding: "10px",
          }}
        >
          <option value="id">
            Latest First
          </option>

          <option value="filename">
            Filename A-Z
          </option>
        </select>
      </div>

      {/* Export */}

      <div
        style={{
          marginBottom: "20px",
        }}
      >
        <a
          href={`${API_BASE_URL}/export/json`}
          target="_blank"
        >
          <button
            style={{
              padding:
                "10px 15px",
              marginRight:
                "10px",
              background:
                "purple",
              color: "white",
              border: "none",
              borderRadius:
                "5px",
            }}
          >
            Export JSON
          </button>
        </a>

        <a
          href={`${API_BASE_URL}/export/csv`}
          target="_blank"
        >
          <button
            style={{
              padding:
                "10px 15px",
              background:
                "darkred",
              color: "white",
              border: "none",
              borderRadius:
                "5px",
            }}
          >
            Export CSV
          </button>
        </a>
      </div>

      {/* Documents */}

      <h2>
        📂 Documents (
        {documents.length})
      </h2>

      {loading ? (
        <p>
          Loading documents...
        </p>
      ) : documents.length ===
        0 ? (
        <p>
          No documents found
        </p>
      ) : (
        documents.map((doc) => (
          <div
            key={doc.id}
            style={{
              background:
                "white",
              padding: "20px",
              marginBottom:
                "15px",
              borderRadius:
                "10px",
              boxShadow:
                "0 2px 5px rgba(0,0,0,0.1)",
            }}
          >
            <h3>
              {doc.filename}
            </h3>

            <p>
              <b>ID:</b>{" "}
              {doc.id}
            </p>

            <p>
              <b>Type:</b>{" "}
              {doc.file_type}
            </p>

            <p>
              <b>Status:</b>

              <span
                style={{
                  marginLeft:
                    "10px",
                  background:
                    getStatusColor(
                      doc.status
                    ),
                  color:
                    "white",
                  padding:
                    "5px 10px",
                  borderRadius:
                    "5px",
                }}
              >
                {doc.status}
              </span>
            </p>

            <p>
              <b>
                Finalized:
              </b>{" "}
              {doc.finalized
                ? "✅ Yes"
                : "❌ No"}
            </p>

            {/* Progress */}

            {progressData[
              doc.id
            ] && (
              <div
                style={{
                  marginTop:
                    "10px",
                }}
              >
                <p>
                  Progress:{" "}
                  {
                    progressData[
                      doc.id
                    ]
                      .progress
                  }
                  %
                </p>

                <div
                  style={{
                    width:
                      "100%",
                    background:
                      "#ddd",
                    height:
                      "10px",
                    borderRadius:
                      "10px",
                  }}
                >
                  <div
                    style={{
                      width: `${progressData[doc.id].progress}%`,
                      background:
                        "green",
                      height:
                        "10px",
                      borderRadius:
                        "10px",
                    }}
                  />
                </div>

                <p>
                  Event:{" "}
                  {
                    progressData[
                      doc.id
                    ].event
                  }
                </p>
              </div>
            )}

            {/* Buttons */}

            <div
              style={{
                marginTop:
                  "10px",
              }}
            >
              <button
                onClick={() =>
                  viewDocumentDetail(
                    doc.id
                  )
                }
                style={{
                  padding:
                    "8px 15px",
                  background:
                    "black",
                  color:
                    "white",
                  border:
                    "none",
                  borderRadius:
                    "5px",
                  cursor:
                    "pointer",
                  marginRight:
                    "10px",
                }}
              >
                View Detail
              </button>

              <button
                onClick={() =>
                  deleteDocument(
                    doc.id
                  )
                }
                style={{
                  padding:
                    "8px 15px",
                  background:
                    "red",
                  color:
                    "white",
                  border:
                    "none",
                  borderRadius:
                    "5px",
                  cursor:
                    "pointer",
                }}
              >
                Delete
              </button>

              {doc.status ===
                "failed" && (
                <button
                  onClick={() =>
                    retryDocument(
                      doc.id
                    )
                  }
                  style={{
                    padding:
                      "8px 15px",
                    background:
                      "orange",
                    color:
                      "white",
                    border:
                      "none",
                    borderRadius:
                      "5px",
                    cursor:
                      "pointer",
                    marginLeft:
                      "10px",
                  }}
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        ))
      )}

      {/* Detail Panel */}

      {selectedDocument && (
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "10px",
            marginTop: "20px",
          }}
        >
          <h2>
            📄 Document Detail
          </h2>

          <button
            onClick={() =>
              setSelectedDocument(
                null
              )
            }
            style={{
              padding:
                "8px 15px",
              background:
                "red",
              color: "white",
              border: "none",
              borderRadius:
                "5px",
              cursor:
                "pointer",
              marginBottom:
                "20px",
            }}
          >
            Close
          </button>

          <p>
            <b>ID:</b>{" "}
            {
              selectedDocument.id
            }
          </p>

          <p>
            <b>Filename:</b>{" "}
            {
              selectedDocument.filename
            }
          </p>

          <p>
            <b>Status:</b>{" "}
            {
              selectedDocument.status
            }
          </p>

          <p>
            <b>
              Finalized:
            </b>{" "}
            {selectedDocument.finalized
              ? "✅ Yes"
              : "❌ No"}
          </p>

          <div>
            <b>
              Extracted Data:
            </b>

            <textarea
              value={
                editedData
              }
              onChange={(e) =>
                setEditedData(
                  e.target
                    .value
                )
              }
              rows={10}
              style={{
                width: "100%",
                marginTop:
                  "10px",
                padding:
                  "15px",
                borderRadius:
                  "10px",
              }}
            />

            <div
              style={{
                marginTop:
                  "15px",
              }}
            >
              <button
                onClick={
                  updateDocument
                }
                style={{
                  padding:
                    "10px 15px",
                  background:
                    "green",
                  color:
                    "white",
                  border:
                    "none",
                  borderRadius:
                    "5px",
                  cursor:
                    "pointer",
                  marginRight:
                    "10px",
                }}
              >
                Save Changes
              </button>

              <button
                onClick={
                  finalizeDocument
                }
                style={{
                  padding:
                    "10px 15px",
                  background:
                    "blue",
                  color:
                    "white",
                  border:
                    "none",
                  borderRadius:
                    "5px",
                  cursor:
                    "pointer",
                }}
              >
                Finalize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;