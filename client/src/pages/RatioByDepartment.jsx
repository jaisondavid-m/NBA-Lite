import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import useFilterStore from "../store/filterStore";
import Navbar from "../components/Navbar";
import TopBar from "../components/TopBar";

const RatioByDepartment = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { selectedAcademicYear, selectedProgramId } = useFilterStore();

  const [tableData, setTableData] = useState(null);
  const [isLoadingTable, setIsLoadingTable] = useState(false);
  const [tableError, setTableError] = useState("");
  const [ffInputs, setFfInputs] = useState({
    CAY: "",
    CAYm1: "",
    CAYm2: "",
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const fetchTableData = async () => {
      if (!selectedProgramId || !selectedAcademicYear) {
        setTableData(null);
        setTableError("");
        return;
      }

      setIsLoadingTable(true);
      setTableError("");

      try {
        const params = new URLSearchParams({
          program_id: String(selectedProgramId),
          academicYear: String(selectedAcademicYear),
        });

        const response = await fetch(`http://localhost:5000/api/ratio/department?${params.toString()}`, {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to fetch ratio data");
        }

        setTableData(data.data);
      } catch (error) {
        console.error("Error loading ratio by department:", error);
        setTableData(null);
        setTableError(error.message || "Failed to load ratio data");
      } finally {
        setIsLoadingTable(false);
      }
    };

    fetchTableData();
  }, [selectedProgramId, selectedAcademicYear]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-10 h-10 border-[3px] border-gray-300 border-t-[#0095ff] rounded-full animate-spin"></div>
      </div>
    );
  }

  const toNonNegativeNumber = (value) => {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed;
  };

  const ffByWindow = {
    CAY: toNonNegativeNumber(ffInputs.CAY),
    CAYm1: toNonNegativeNumber(ffInputs.CAYm1),
    CAYm2: toNonNegativeNumber(ffInputs.CAYm2),
  };

  const sfrByWindow = tableData
    ? {
        CAY:
          tableData.F.CAY - ffByWindow.CAY > 0
            ? tableData.S.CAY / (tableData.F.CAY - ffByWindow.CAY)
            : null,
        CAYm1:
          tableData.F.CAYm1 - ffByWindow.CAYm1 > 0
            ? tableData.S.CAYm1 / (tableData.F.CAYm1 - ffByWindow.CAYm1)
            : null,
        CAYm2:
          tableData.F.CAYm2 - ffByWindow.CAYm2 > 0
            ? tableData.S.CAYm2 / (tableData.F.CAYm2 - ffByWindow.CAYm2)
            : null,
      }
    : { CAY: null, CAYm1: null, CAYm2: null };

  const averageSfr = useMemo(() => {
    const values = [sfrByWindow.CAY, sfrByWindow.CAYm1, sfrByWindow.CAYm2].filter(
      (value) => value !== null,
    );
    if (values.length !== 3) return null;
    return values.reduce((sum, value) => sum + value, 0) / 3;
  }, [sfrByWindow.CAY, sfrByWindow.CAYm1, sfrByWindow.CAYm2]);

  const renderNumberCell = (value) => <span className="font-semibold text-gray-900">{value}</span>;

  const renderSfrCell = (value) => (value === null ? "-" : value.toFixed(2));

  const handleFfChange = (key, value) => {
    if (value !== "" && !/^\d*(\.\d*)?$/.test(value)) {
      return;
    }
    setFfInputs((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Navbar />
      <TopBar />
      <main className="flex-1 lg:ml-[240px] overflow-x-hidden">
        <div className="p-6 pt-16 lg:pt-14">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Faculty Student Ratio by Dept.</h1>
            </div>

            <div className="overflow-x-auto">
              {!selectedProgramId || !selectedAcademicYear ? (
                <p className="text-sm text-gray-600">
                  Select both Academic Year and Program from the top filter to view the ratio table.
                </p>
              ) : isLoadingTable ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                  Loading ratio data...
                </div>
              ) : tableError ? (
                <p className="text-sm text-red-600">{tableError}</p>
              ) : !tableData ? (
                <p className="text-sm text-gray-600">No data available.</p>
              ) : (
                <table className="min-w-[980px] w-full text-sm border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-amber-100 text-gray-900">
                      <th className="border border-gray-300 p-3 text-left font-semibold w-[42%]">Description</th>
                      <th className="border border-gray-300 p-3 text-center font-semibold">CAY</th>
                      <th className="border border-gray-300 p-3 text-center font-semibold">CAYm1</th>
                      <th className="border border-gray-300 p-3 text-center font-semibold">CAYm2</th>
                    </tr>
                    <tr className="bg-amber-100 text-gray-900">
                      <th className="border border-gray-300 p-2"></th>
                      <th className="border border-gray-300 p-2 text-center font-medium">{tableData.labels.CAY}</th>
                      <th className="border border-gray-300 p-2 text-center font-medium">{tableData.labels.CAYm1}</th>
                      <th className="border border-gray-300 p-2 text-center font-medium">{tableData.labels.CAYm2}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">Total no. of Students in all UG and PG programs in the Department (DS)</td>
                      <td className="border border-gray-300 p-3 text-center">{renderNumberCell(tableData.DS.CAY)}</td>
                      <td className="border border-gray-300 p-3 text-center">{renderNumberCell(tableData.DS.CAYm1)}</td>
                      <td className="border border-gray-300 p-3 text-center">{renderNumberCell(tableData.DS.CAYm2)}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">Total no. of Students of all UG and PG programs in Allied Departments (AS)</td>
                      <td className="border border-gray-300 p-3 text-center">{renderNumberCell(tableData.AS.CAY)}</td>
                      <td className="border border-gray-300 p-3 text-center">{renderNumberCell(tableData.AS.CAYm1)}</td>
                      <td className="border border-gray-300 p-3 text-center">{renderNumberCell(tableData.AS.CAYm2)}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-semibold">Total no. of Students (S) in the Department (DS) and Allied Departments (AS)</td>
                      <td className="border border-gray-300 p-3 text-center">{renderNumberCell(tableData.S.CAY)}</td>
                      <td className="border border-gray-300 p-3 text-center">{renderNumberCell(tableData.S.CAYm1)}</td>
                      <td className="border border-gray-300 p-3 text-center">{renderNumberCell(tableData.S.CAYm2)}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">Total no. of Faculty members in the Department (DF)</td>
                      <td className="border border-gray-300 p-3 text-center">{renderNumberCell(tableData.DF.CAY)}</td>
                      <td className="border border-gray-300 p-3 text-center">{renderNumberCell(tableData.DF.CAYm1)}</td>
                      <td className="border border-gray-300 p-3 text-center">{renderNumberCell(tableData.DF.CAYm2)}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">Total no. of Faculty members in the Allied Departments (AF)</td>
                      <td className="border border-gray-300 p-3 text-center">{renderNumberCell(tableData.AF.CAY)}</td>
                      <td className="border border-gray-300 p-3 text-center">{renderNumberCell(tableData.AF.CAYm1)}</td>
                      <td className="border border-gray-300 p-3 text-center">{renderNumberCell(tableData.AF.CAYm2)}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-semibold">Total no. of Faculty members (F) in the Department (DF) and Allied Departments (AF)</td>
                      <td className="border border-gray-300 p-3 text-center">{renderNumberCell(tableData.F.CAY)}</td>
                      <td className="border border-gray-300 p-3 text-center">{renderNumberCell(tableData.F.CAYm1)}</td>
                      <td className="border border-gray-300 p-3 text-center">{renderNumberCell(tableData.F.CAYm2)}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-semibold">The Faculty members in F who have a 100% teaching load in the first year courses (FF)</td>
                      <td className="border border-gray-300 p-2 text-center">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={ffInputs.CAY}
                          onChange={(event) => handleFfChange("CAY", event.target.value)}
                          className="w-24 h-9 px-2 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={ffInputs.CAYm1}
                          onChange={(event) => handleFfChange("CAYm1", event.target.value)}
                          className="w-24 h-9 px-2 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={ffInputs.CAYm2}
                          onChange={(event) => handleFfChange("CAYm2", event.target.value)}
                          className="w-24 h-9 px-2 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-semibold">Student Faculty Ratio (SFR) = S / (F - FF)</td>
                      <td className="border border-gray-300 p-3 text-center font-semibold text-gray-900">{renderSfrCell(sfrByWindow.CAY)}</td>
                      <td className="border border-gray-300 p-3 text-center font-semibold text-gray-900">{renderSfrCell(sfrByWindow.CAYm1)}</td>
                      <td className="border border-gray-300 p-3 text-center font-semibold text-gray-900">{renderSfrCell(sfrByWindow.CAYm2)}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-semibold">Average SFR for 3 years</td>
                      <td colSpan={3} className="border border-gray-300 p-3 text-center font-semibold text-gray-900">
                        {averageSfr === null ? "-" : averageSfr.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RatioByDepartment;
