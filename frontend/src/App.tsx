import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("id");

  const [selectedDocument, setSelectedDocument] =
    useState<any>(null);

  const [editedData, setEditedData] = useState("");

  const [loading, setLoading] = useState(false);

  const [progressData, setProgressData] =
    useState<any>({});

  const fetchDocuments = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/documents?search=${search}&status=${status}&sort_by=${sortBy}`
      );

      setDocuments(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();

    const interval = setInterval(() => {
      fetchDocuments();
    }, 3000);

    return () => clearInterval(interval);
  }, [search, status, sortBy]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(
          `${API_URL}/progress`
        );

        if (response.data.document_id) {
          setProgressData((prev: any) => ({
            ...prev,
            [response.data.document_id]:
              response.data,
          }));
        }
      } catch (error) {
        console.log(error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();

    formData.append("file", file);

    try {
      await axios.post(
        `${API_URL}/upload`,
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      alert("File uploaded successfully");

      setFile(null);

      fetchDocuments();
    } catch (error) {
      console.log(error);
    }
  };

  const viewDocumentDetail = async (
    id: number
  ) => {
    try {
      const response = await axios.get(
        `${API_URL}/documents/${id}`
      );

      setSelectedDocument(response.data);

      setEditedData(
        response.data.extracted_data || ""
      );
    } catch (error) {
      console.log(error);

      alert("Detail fetch failed");
    }
  };

  const updateDocument = async () => {
    if (!selectedDocument) return;

    try {
      await axios.put(
        `${API_URL}/documents/${selectedDocument.id}`,
        {
          extracted_data: editedData,
        }
      );

      alert("Document updated successfully");

      await viewDocumentDetail(
        selectedDocument.id
      );

      fetchDocuments();
    } catch (error) {
      console.log(error);
    }
  };

  const finalizeDocument = async () => {
    if (!selectedDocument) return;

    try {
      await axios.put(
        `${API_URL}/documents/${selectedDocument.id}/finalize`
      );

      alert("Document finalized");

      await viewDocumentDetail(
        selectedDocument.id
      );

      fetchDocuments();
    } catch (error) {
      console.log(error);
    }
  };

  const deleteDocument = async (
    id: number
  ) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this document?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(
        `${API_URL}/documents/${id}`
      );

      alert("Document deleted");

      if (
        selectedDocument &&
        selectedDocument.id === id
      ) {
        setSelectedDocument(null);
      }

      fetchDocuments();
    } catch (error) {
      console.log(error);
    }
  };

  const retryDocument = async (
    id: number
  ) => {
    try {
      await axios.post(
        `${API_URL}/documents/${id}/retry`
      );

      alert("Retry started");

      fetchDocuments();
    } catch (error) {
      console.log(error);
    }
  };

  const getStatusColor = (
    status: string
  ) => {
    if (status === "job_completed") {
      return "green";
    }

    if (status === "processing") {
      return "orange";
    }

    if (status === "finalized") {
      return "blue";
    }

    if (status === "failed") {
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
        🚀 Async Document Workflow
        System
      </h1>

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
            if (e.target.files) {
              setFile(e.target.files[0]);
            }
          }}
        />

        <button
          onClick={handleUpload}
          style={{
            marginLeft: "10px",
            padding: "10px 18px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Upload
        </button>
      </div>

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
            setSearch(e.target.value)
          }
          style={{
            padding: "10px",
            width: "250px",
            marginRight: "10px",
          }}
        />

        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value)
          }
          style={{
            padding: "10px",
            marginRight: "10px",
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

          <option value="failed">
            Failed
          </option>

          <option value="finalized">
            Finalized
          </option>
        </select>

        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value)
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

      <div
        style={{
          marginBottom: "20px",
        }}
      >
        <a
          href={`${API_URL}/export/json`}
          target="_blank"
        >
          <button
            style={{
              padding: "10px 15px",
              marginRight: "10px",
              background: "purple",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Export JSON
          </button>
        </a>

        <a
          href={`${API_URL}/export/csv`}
          target="_blank"
        >
          <button
            style={{
              padding: "10px 15px",
              background: "darkred",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Export CSV
          </button>
        </a>
      </div>

      <h2>
        📂 Documents (
        {documents.length})
      </h2>

      {loading ? (
        <p>Loading documents...</p>
      ) : documents.length === 0 ? (
        <p>No documents found</p>
      ) : (
        documents.map((doc) => (
          <div
            key={doc.id}
            style={{
              background: "white",
              padding: "20px",
              marginBottom: "15px",
              borderRadius: "10px",
              boxShadow:
                "0 2px 5px rgba(0,0,0,0.1)",
            }}
          >
            <h3>{doc.filename}</h3>

            <p>
              <b>ID:</b> {doc.id}
            </p>

            <p>
              <b>Type:</b>{" "}
              {doc.file_type}
            </p>

            <p>
              <b>Status:</b>

              <span
                style={{
                  marginLeft: "10px",
                  background:
                    getStatusColor(
                      doc.status
                    ),
                  color: "white",
                  padding: "5px 10px",
                  borderRadius: "5px",
                }}
              >
                {doc.status}
              </span>
            </p>

            <p>
              <b>Finalized:</b>{" "}
              {doc.finalized
                ? "✅ Yes"
                : "❌ No"}
            </p>

            {progressData[doc.id] && (
              <div
                style={{
                  marginTop: "10px",
                }}
              >
                <p>
                  Progress:{" "}
                  {
                    progressData[
                      doc.id
                    ].progress
                  }
                  %
                </p>

                <div
                  style={{
                    width: "100%",
                    background: "#ddd",
                    height: "10px",
                    borderRadius: "10px",
                  }}
                >
                  <div
                    style={{
                      width: `${progressData[doc.id].progress}%`,
                      background: "green",
                      height: "10px",
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

            <div
              style={{
                marginTop: "10px",
              }}
            >
              <button
                onClick={() =>
                  viewDocumentDetail(
                    doc.id
                  )
                }
                style={{
                  padding: "8px 15px",
                  background: "black",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  marginRight: "10px",
                }}
              >
                View Detail
              </button>

              <button
                onClick={() =>
                  deleteDocument(doc.id)
                }
                style={{
                  padding: "8px 15px",
                  background: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  marginRight: "10px",
                }}
              >
                Delete
              </button>

              {doc.status === "failed" && (
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
                    color: "white",
                    border: "none",
                    borderRadius:
                      "5px",
                    cursor: "pointer",
                  }}
                >
                  Retry
                </button>
              )}
            </div>

            {selectedDocument &&
              selectedDocument.id ===
                doc.id && (
                <div
                  style={{
                    marginTop: "20px",
                    background:
                      "#f8f8f8",
                    padding: "20px",
                    borderRadius:
                      "10px",
                    border:
                      "1px solid #ddd",
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
                    <b>
                      Filename:
                    </b>{" "}
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
                      Extracted
                      Data:
                    </b>

                    <textarea
                      value={
                        editedData
                      }
                      onChange={(
                        e
                      ) =>
                        setEditedData(
                          e.target
                            .value
                        )
                      }
                      rows={10}
                      style={{
                        width:
                          "100%",
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
                        Save
                        Changes
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
        ))
      )}
    </div>
  );
}

export default App;