import  useAuth  from "../../hooks/useAuth";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="p-4 bg-blue-600 text-white flex justify-between">
      <h1>Placement Portal</h1>
      {user && (
        <button onClick={logout}>Logout</button>
      )}
    </nav>
  );
};

export default Navbar;