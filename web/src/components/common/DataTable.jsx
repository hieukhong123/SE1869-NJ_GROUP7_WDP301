import DataTableComponent from 'datatables.net-react';
import DT from 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.min.css';

DataTableComponent.use(DT);

const DataTable = ({ data, columns, options = {} }) => {
	return (
		<div className="overflow-x-auto">
			<DataTableComponent
				columns={columns}
				data={data}
				options={options}
				className="table table-zebra w-full"
			/>
		</div>
	);
};

export default DataTable;
