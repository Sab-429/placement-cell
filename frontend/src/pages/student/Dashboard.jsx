import Sidebar from "../../components/layout/Sidebar";
import Navbar from "../../components/layout/Navbar";

const Dashboard = () => (
  <div>
    <Navbar />
    <div className="flex">
      <Sidebar />
      <div className="p-6">
        <h2>Student Dashboard</h2>
      </div>
    </div>
  </div>
);

export default Dashboard;