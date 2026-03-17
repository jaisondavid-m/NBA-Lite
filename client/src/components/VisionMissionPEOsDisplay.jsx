import { useState, useEffect } from "react";
import axios from "axios";

function VisionMissionPEOsDisplay() {
  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCriterion, setSelectedCriterion] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const CRITERIA_OPTIONS = [
    "Vision",
    "Mission",
    "PEOs",
    "Process of Defining",
    "Dissemination",
  ];

  useEffect(() => {
    fetchDepartments();
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedDepartment, selectedCriterion]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5001/api/criteria1/departments"
      );
      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = "http://localhost:5001/api/criteria1/vision-mission-peos?";

      if (selectedDepartment) {
        url += `departmentName=${encodeURIComponent(selectedDepartment)}&`;
      }

      if (selectedCriterion) {
        url += `criterionName=${encodeURIComponent(selectedCriterion)}&`;
      }

      const response = await axios.get(url);
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        await axios.delete(
          `http://localhost:5001/api/criteria1/vision-mission-peos/${id}`
        );
        fetchData(); // Refresh data
      } catch (error) {
        console.error("Error deleting entry:", error);
      }
    }
  };

  const getCriterionColor = (criterion) => {
    const colors = {
      Vision: "bg-blue-100 text-blue-800",
      Mission: "bg-green-100 text-green-800",
      PEOs: "bg-purple-100 text-purple-800",
      "Process of Defining": "bg-yellow-100 text-yellow-800",
      Dissemination: "bg-pink-100 text-pink-800",
    };
    return colors[criterion] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        View Data by Department
      </h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Department Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Department
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- All Departments --</option>
            {departments.map((dept) => (
              <option
                key={dept.department_name}
                value={dept.department_name}
              >
                {dept.department_name}
              </option>
            ))}
          </select>
        </div>

        {/* Criterion Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Criterion
          </label>
          <select
            value={selectedCriterion}
            onChange={(e) => setSelectedCriterion(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- All Criteria --</option>
            {CRITERIA_OPTIONS.map((criterion) => (
              <option key={criterion} value={criterion}>
                {criterion}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading data...</p>
        </div>
      )}

      {/* Data Display */}
      {!loading && data.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">
            No data found. Try changing your filters.
          </p>
        </div>
      )}

      {!loading && data.length > 0 && (
        <div className="space-y-4">
          {data.map((item) => (
            <div
              key={item.id}
              className="border border-gray-300 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div
                className="bg-gray-50 p-4 cursor-pointer flex justify-between items-start"
                onClick={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getCriterionColor(
                        item.criterion_name
                      )}`}
                    >
                      {item.criterion_name}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <strong>Department:</strong> {item.department_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Academic Year: {item.academic_year}
                  </p>
                </div>

                <div className="text-right ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Updated: {new Date(item.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === item.id && (
                <div className="bg-white border-t border-gray-300 p-4">
                  {/* Content Text */}
                  {item.content_text && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Content:
                      </h4>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {item.content_text}
                      </p>
                    </div>
                  )}

                  {/* Image Display */}
                  {item.image_url && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Image:
                      </h4>
                      <img
                        src={`http://localhost:5001${item.image_url}`}
                        alt={
                          item.image_alt_text || item.criterion_name
                        }
                        className="max-h-96 border border-gray-300 rounded-lg"
                      />
                      {item.image_alt_text && (
                        <p className="text-sm text-gray-600 mt-2">
                          {item.image_alt_text}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 border-t border-gray-200 pt-4">
                    <div>
                      <p className="font-medium">Created By:</p>
                      <p>{item.created_by || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-medium">Updated By:</p>
                      <p>{item.updated_by || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-medium">Created:</p>
                      <p>{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-medium">Updated:</p>
                      <p>{new Date(item.updated_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VisionMissionPEOsDisplay;
