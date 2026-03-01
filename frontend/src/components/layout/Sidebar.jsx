import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-200 p-4">
      <ul className="space-y-2">
        <li><Link to="/student/dashboard">Dashboard</Link></li>
        <li><Link to="/student/profile">Profile</Link></li>
        <li><Link to="/student/applications">Applications</Link></li>
      </ul>
    </div>
  );
};

export default Sidebar;