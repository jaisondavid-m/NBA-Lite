import { useState, useEffect } from "react";
import axios from "axios";
import useFilterStore from "../store/filterStore";

function VisionMissionPEOsForm() {
  const [formData, setFormData] = useState({
    criterionName: "",
    contentText: "",
    imageAltText: "",
    image: null,
    imagePreview: null,
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [programs, setPrograms] = useState([]);

  const { selectedProgramId, selectedProgramLabel, programs: storedPrograms } =
    useFilterStore();

  useEffect(() => {
    // Fetch programs if not already loaded
    if (storedPrograms.length === 0) {
      fetchPrograms();
    } else {
      setPrograms(storedPrograms);
    }
  }, [storedPrograms]);

  const fetchPrograms = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5001/api/institute/courses"
      );
      if (response.data.success) {
        setPrograms(response.data.data);
        useFilterStore.setState({ programs: response.data.data });
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
      setErrorMessage("Failed to load programs");
    }
  };

  const getCurrentAcademicYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    return `${year}-${String(year + 1).slice(-2)}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("Image size must be less than 10MB");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !selectedProgramId ||
      !formData.criterionName ||
      (!formData.contentText && !formData.image)
    ) {
      setErrorMessage("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const submitFormData = new FormData();
      submitFormData.append("programId", selectedProgramId);
      submitFormData.append(
        "departmentName",
        selectedProgramLabel || "Unknown"
      );
      submitFormData.append("criterionName", formData.criterionName);
      submitFormData.append("contentText", formData.contentText);
      submitFormData.append("imageAltText", formData.imageAltText);
      submitFormData.append("academicYear", getCurrentAcademicYear());
      submitFormData.append("createdBy", "admin"); // TODO: Get from auth context

      if (formData.image) {
        submitFormData.append("image", formData.image);
      }

      const response = await axios.post(
        "http://localhost:5001/api/criteria1/vision-mission-peos",
        submitFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setSuccessMessage(response.data.message);
        // Reset form
        setFormData({
          criterionName: "",
          contentText: "",
          imageAltText: "",
          image: null,
          imagePreview: null,
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrorMessage(error.response?.data?.message || "Failed to submit form");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Add Vision, Mission & PEOs Data
      </h2>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Program Selection (Read-only from filter) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department/Program
            </label>
            <input
              type="text"
              value={selectedProgramLabel || "No program selected"}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
            />
          </div>

          {/* Criterion Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Criterion <span className="text-red-500">*</span>
            </label>
            <select
              name="criterionName"
              value={formData.criterionName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select Criterion --</option>
              <option value="Vision">Vision</option>
              <option value="Mission">Mission</option>
              <option value="PEOs">Program Educational Objectives (PEOs)</option>
              <option value="Process of Defining">
                Process of Defining Vision, Mission and PEOs
              </option>
              <option value="Dissemination">
                Dissemination of Vision, Mission and PEOs
              </option>
            </select>
          </div>
        </div>

        {/* Content Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content/Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="contentText"
            value={formData.contentText}
            onChange={handleInputChange}
            rows="6"
            placeholder="Enter the text content for this criterion..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Provide detailed information about the selected criterion
          </p>
        </div>

        {/* Image Upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Image (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Max 10MB. Supported formats: JPG, PNG, GIF, WebP, SVG
            </p>
          </div>

          {/* Image Alt Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image Alt Text (Optional)
            </label>
            <input
              type="text"
              name="imageAltText"
              value={formData.imageAltText}
              onChange={handleInputChange}
              placeholder="Describe the image for accessibility..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Image Preview */}
        {formData.imagePreview && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image Preview
            </label>
            <div className="relative inline-block">
              <img
                src={formData.imagePreview}
                alt="Preview"
                className="max-h-64 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() =>
              setFormData({
                criterionName: "",
                contentText: "",
                imageAltText: "",
                image: null,
                imagePreview: null,
              })
            }
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default VisionMissionPEOsForm;
