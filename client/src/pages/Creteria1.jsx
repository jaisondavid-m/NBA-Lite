import Navbar from "../components/Navbar";
import TopBar from "../components/TopBar";
import VisionMissionPEOsForm from "../components/VisionMissionPEOsForm";
import VisionMissionPEOsDisplay from "../components/VisionMissionPEOsDisplay";

function Creteria1() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <TopBar />

      <main className="pt-16 lg:pl-[240px] px-4 pb-6">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Criteria 1: Vision, Mission & PEOs
          </h1>
          <p className="mt-2 text-gray-600">
            Manage institutional and departmental vision, mission, and program educational objectives
          </p>
        </div>

        {/* Form Section */}
        <VisionMissionPEOsForm />

        {/* Display Section */}
        <VisionMissionPEOsDisplay />
      </main>
    </div>
  );
}

export default Creteria1;
