import Navbar from "../components/Navbar";
import TopBar from "../components/TopBar";

function Creteria1() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <TopBar />

      <main className="pt-16 lg:pl-[240px] px-4 pb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">Criteria 1</h1>
          <p className="mt-2 text-sm text-gray-600">Sidebar and top navigation are now active for this page.</p>
        </div>
      </main>
    </div>
  );
}

export default Creteria1;
