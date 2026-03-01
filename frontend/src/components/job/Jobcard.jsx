import { applyToListing } from "../../api/listingApi";

const JobCard = ({ job }) => {
  const handleApply = async () => {
    await applyToListing(job.id);
    alert("Applied Successfully!");
  };

  return (
    <div className="border p-4 rounded shadow">
      <h2>{job.title}</h2>
      <p>{job.type}</p>
      <p>Salary: {job.salary}</p>
      <button onClick={handleApply}>Apply</button>
    </div>
  );
};

export default JobCard;