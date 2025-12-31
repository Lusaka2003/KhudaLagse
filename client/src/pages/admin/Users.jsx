// pages/admin/Users.jsx
import { useEffect, useState, useMemo } from 'react';
import axiosInstance from '../../api/axios';

export default function Users() {
	const [users, setUsers] = useState([]);
	const [error, setError] = useState('');
	const [busyId, setBusyId] = useState(null);
	const [loading, setLoading] = useState(true);

	const roleOptions = useMemo(
		() => ['customer', 'restaurant', 'deliveryStaff'],
		[]
	);

	useEffect(() => {
		loadUsers();
	}, []);

	const loadUsers = async () => {
		setError('');
		setLoading(true);
		try {
			const res = await axiosInstance.get('/api/admin/users?limit=50');
			setUsers(res.data.data.items || []);
		} catch (err) {
			setError(
				err.response?.data?.message ||
					err.message ||
					'Failed to load users'
			);
		} finally {
			setLoading(false);
		}
	};

	const updateUserField = async (id, payload) => {
		setBusyId(id);
		setError('');
		try {
			await axiosInstance.patch(`/api/admin/users/${id}`, payload);
			await loadUsers();
		} catch (err) {
			setError(
				err.response?.data?.message ||
					err.message ||
					'Failed to update user'
			);
		} finally {
			setBusyId(null);
		}
	};

	if (loading) {
		return (
			<div className="rounded-xl border border-gray-100 bg-white p-6 text-center">
				<div className="text-gray-600">Loading users...</div>
			</div>
		);
	}

	return (
		<div>
			{error && (
				<div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
					{error}
				</div>
			)}
			
			<div className="rounded-xl border border-gray-100 bg-white shadow-sm">
				<div className="overflow-x-auto">
					<table className="min-w-full text-left text-sm">
						<thead className="border-b border-gray-100 bg-gray-50 text-gray-600">
							<tr>
								<th className="px-4 py-3 font-semibold">Name</th>
								<th className="px-4 py-3 font-semibold">Email</th>
								<th className="px-4 py-3 font-semibold">Role</th>
								<th className="px-4 py-3 font-semibold">Status</th>
							</tr>
						</thead>
						<tbody>
							{users.map((u) => (
								<tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50">
									<td className="px-4 py-3 font-semibold text-gray-900">
										{u.name}
									</td>
									<td className="px-4 py-3 text-gray-700">
										{u.email}
									</td>
									<td className="px-4 py-3">
										<select
											disabled={busyId === u._id}
											value={u.role}
											onChange={(e) =>
												updateUserField(u._id, {
													role: e.target.value,
												})
											}
											className="rounded-lg border border-gray-200 bg-white px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											{roleOptions.map((r) => (
												<option key={r} value={r}>
													{r}
												</option>
											))}
										</select>
									</td>
									<td className="px-4 py-3">
										<button
											disabled={busyId === u._id}
											onClick={() =>
												updateUserField(u._id, {
													isActive: !u.isActive,
												})
											}
											className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
												u.isActive
													? 'bg-green-100 text-green-700 hover:bg-green-200'
													: 'bg-red-100 text-red-700 hover:bg-red-200'
											}`}
										>
											{u.isActive ? 'Active' : 'Disabled'}
										</button>
									</td>
								</tr>
							))}
							{users.length === 0 && (
								<tr>
									<td
										className="px-4 py-8 text-center text-gray-600"
										colSpan={4}
									>
										No users found.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}