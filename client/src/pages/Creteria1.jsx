import { useEffect, useRef, useState } from "react";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import Navbar from "../components/Navbar";
import TopBar from "../components/TopBar";
import useAuthStore from "../store/authStore";
import useFilterStore from "../store/filterStore";

const API_URL = "http://localhost:5001/api";

const TOPICS = [
  { code: "1.1.3", title: "Process of Defining Vision, Mission and PEOs" },
  { code: "1.1.4", title: "Dissemination of Vision, Mission and PEOs" },
  { code: "1.2.1", title: "State the Process for Developing/Revising the Program Curriculum" },
  { code: "1.2.4.1", title: "Curriculum Design with Multidisciplinary and Interdisciplinary Programs" },
  { code: "1.2.4.2", title: "The establishment of an Academic Bank of Credits (ABC) system" },
  { code: "1.2.4.3", title: "Establishment of APAAR ID" },
];

const QUILL_FORMATS = [
  "header",
  "bold",
  "italic",
  "underline",
  "list",
  "bullet",
  "link",
  "image",
];

const getDefaultAcademicYear = () => {
  const year = new Date().getFullYear();
  return `${year}-${String(year + 1).slice(-2)}`;
};

const createInitialDrafts = () =>
  TOPICS.reduce((acc, topic) => {
    acc[topic.code] = { text: "", isSaving: false, error: "", success: "" };
    return acc;
  }, {});

const hasEditorContent = (html) => {
  const raw = String(html || "");
  const plainText = raw
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

  return plainText.length > 0 || /<img\b/i.test(raw);
};

function Criteria1() {
  const { user } = useAuthStore();
  const { selectedProgramId, selectedProgramLabel, selectedAcademicYear } = useFilterStore();
  const [entriesByTopic, setEntriesByTopic] = useState({});
  const [drafts, setDrafts] = useState(createInitialDrafts);
  const [editingCode, setEditingCode] = useState(null);
  const quillRefs = useRef({});

  const activeAcademicYear = selectedAcademicYear || getDefaultAcademicYear();

  const loadEntries = async () => {
    if (!selectedProgramLabel) return;
    try {
      const query = new URLSearchParams({ departmentName: selectedProgramLabel, academicYear: activeAcademicYear });
      const response = await fetch(`${API_URL}/criteria1/vision-mission-peos?${query}`, { credentials: "include" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message);

      const mapped = data.data.reduce((acc, entry) => {
        acc[entry.criterion_name] = entry;
        return acc;
      }, {});

      setEntriesByTopic(mapped);

      setDrafts(
        TOPICS.reduce((acc, topic) => {
          acc[topic.code] = { text: mapped[topic.code]?.content_text || "", isSaving: false, error: "", success: "" };
          return acc;
        }, {})
      );
    } catch (error) {
      console.error("Error loading entries:", error);
    }
  };

  useEffect(() => { loadEntries(); }, [selectedProgramLabel, selectedProgramId, activeAcademicYear]);

  const updateDraft = (code, updates) =>
    setDrafts((curr) => ({ ...curr, [code]: { ...curr[code], ...updates } }));

  const handleEdit = (topic) => {
    const entry = entriesByTopic[topic.code];
    updateDraft(topic.code, {
      text: entry?.content_text || "",
      error: "",
      success: "",
    });
    setEditingCode(topic.code);
    
    // Focus editor after state updates
    setTimeout(() => {
      const quill = quillRefs.current[topic.code]?.getEditor();
      quill?.focus();
    }, 0);
  };

  const handleCancel = (topicCode) => {
    setEditingCode(null);
    updateDraft(topicCode, { error: "", success: "" });
  };

  const handleEditorImageUpload = async (topicCode) => {
    if (!selectedProgramId || !selectedProgramLabel) {
      updateDraft(topicCode, {
        error: "Select a department before uploading an image.",
        success: "",
      });
      return;
    }

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";

    fileInput.onchange = async () => {
      const file = fileInput.files?.[0];
      if (!file) {
        return;
      }

      updateDraft(topicCode, { error: "", success: "" });

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("attachment", file);
        formData.append("programId", selectedProgramId);
        formData.append("departmentName", selectedProgramLabel);
        formData.append("criterionName", topicCode);
        formData.append("academicYear", activeAcademicYear);
        formData.append("createdBy", user?.name || user?.email || "system");

        const response = await fetch(`${API_URL}/criteria1/vision-mission-peos`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to upload image");
        }

        const uploadedUrl = data.attachmentUrl || data.imageUrl || data.url;
        if (!uploadedUrl) {
          throw new Error("Image URL missing in upload response");
        }

        const imageUrl = uploadedUrl.startsWith("http")
          ? uploadedUrl
          : `http://localhost:5001${uploadedUrl}`;

        const quill = quillRefs.current[topicCode]?.getEditor();
        if (!quill) {
          return;
        }

        const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
        quill.insertEmbed(range.index, "image", imageUrl);
        quill.setSelection(range.index + 1, 0);

        updateDraft(topicCode, { text: quill.root.innerHTML, success: "Image inserted.", error: "" });
      } catch (error) {
        updateDraft(topicCode, {
          error: error.message || "Failed to upload image",
          success: "",
        });
      }
    };

    fileInput.click();
  };

  const getEditorModules = (topicCode) => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
      ],
      handlers: {
        image: () => {
          void handleEditorImageUpload(topicCode);
        },
      },
    },
  });

  const handleSave = async (topic) => {
    const draft = drafts[topic.code];
    if (!selectedProgramId || !selectedProgramLabel) return updateDraft(topic.code, { error: "Select a department before saving.", success: "" });
    if (!hasEditorContent(draft.text)) return updateDraft(topic.code, { error: "Enter content before saving.", success: "" });

    updateDraft(topic.code, { isSaving: true, error: "", success: "" });
    try {
      const formData = new FormData();
      formData.append("programId", selectedProgramId);
      formData.append("departmentName", selectedProgramLabel);
      formData.append("criterionName", topic.code);
      formData.append("contentText", draft.text);
      formData.append("academicYear", activeAcademicYear);
      formData.append("createdBy", user?.name || user?.email || "system");

      const response = await fetch(`${API_URL}/criteria1/vision-mission-peos`, { method: "POST", body: formData, credentials: "include" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message);

      updateDraft(topic.code, { isSaving: false, success: "Saved successfully." });
      setEditingCode(null);
      await loadEntries();
    } catch (error) {
      updateDraft(topic.code, { isSaving: false, error: error.message || "Failed to save.", success: "" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <TopBar />

      <main className="pt-16 lg:pl-[240px] px-4 pb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Criteria 1</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter topic content for the department selected in the top bar.
          </p>
        </div>

        <div className="space-y-6">
          {TOPICS.map((topic) => {
            const draft = drafts[topic.code] || createInitialDrafts()[topic.code];
            const hasSavedEntry = Boolean(entriesByTopic[topic.code]);
            const isEditing = editingCode === topic.code;

            return (
              <section key={topic.code} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 px-5 py-4 bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-blue-700">{topic.code}</div>
                      <h2 className="text-lg font-semibold text-gray-900">{topic.title}</h2>
                    </div>

                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => handleEdit(topic)}
                        className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Text content</label>
                        <div className="rounded-lg border border-gray-300 overflow-hidden [&_.ql-editor]:min-h-[200px]">
                          <ReactQuill
                            ref={(instance) => {
                              if (instance) {
                                quillRefs.current[topic.code] = instance;
                              }
                            }}
                            theme="snow"
                            value={draft.text}
                            onChange={(value) => updateDraft(topic.code, { text: value, error: "", success: "" })}
                            modules={getEditorModules(topic.code)}
                            formats={QUILL_FORMATS}
                            placeholder="Type or paste the topic content here."
                          />
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">
                        Use the editor toolbar image button to upload and insert images.
                      </div>

                      {draft.error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{draft.error}</div>}
                      {draft.success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{draft.success}</div>}

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleCancel(topic.code)}
                          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSave(topic)}
                          disabled={draft.isSaving}
                          className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                        >
                          {draft.isSaving ? "Saving..." : `Save ${topic.code}`}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {hasSavedEntry && hasEditorContent(draft.text) ? (
                        <div className="prose max-w-none prose-img:max-w-full">
                          <div dangerouslySetInnerHTML={{ __html: draft.text }} />
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No content added yet. Click Edit to add content.</p>
                      )}
                    </>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default Criteria1;