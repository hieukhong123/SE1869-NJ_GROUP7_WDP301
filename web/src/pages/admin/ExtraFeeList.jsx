import { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { Link } from 'react-router-dom';

const ExtraFeeList = () => {
  const [extraFees, setExtraFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExtraFees = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get('/extra-fees');
        setExtraFees(response);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExtraFees();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this extra fee?')) {
      try {
        await axiosClient.delete(`/extra-fees/${id}`);
        setExtraFees(extraFees.filter((fee) => fee._id !== id));
      } catch (err) {
        setError(err);
      }
    }
  };

  const columns = [
    { accessorKey: 'extraName', header: 'Name' },
    { accessorKey: 'extraPrice', header: 'Price' },
    { accessorKey: 'hotelId.name', header: 'Hotel' },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Link to={`/admin/extra-fees/${row.original._id}/edit`} className="btn btn-sm btn-warning">Edit</Link>
          <button onClick={() => handleDelete(row.original._id)} className="btn btn-sm btn-error">Delete</button>
        </div>
      ),
    },
  ];

  if (loading) return <div className="text-center py-8">Loading extra fees...</div>;
  if (error) return <div className="text-center py-8 text-error">Error: {error.message}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Extra Fee List</h1>
        <Link to="/admin/extra-fees/new" className="btn btn-primary">Add Extra Fee</Link>
      </div>
      <Table data={extraFees} columns={columns} />
    </div>
  );
};

export default ExtraFeeList;
