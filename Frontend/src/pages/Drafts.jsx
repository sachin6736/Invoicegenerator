// // src/pages/Drafts.jsx
// import { useState, useEffect } from 'react';
// import { toast } from 'sonner';
// import { format } from 'date-fns';
// import { FilePen, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

// export default function Drafts() {
//   const [drafts, setDrafts] = useState([]);
//   const [pagination, setPagination] = useState({
//     currentPage: 1,
//     totalPages: 1,
//     totalItems: 0,
//     itemsPerPage: 10,
//   });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchDrafts = async (page = 1) => {
//     setLoading(true);
//     setError(null);

//     try {
//       const res = await fetch(`http://localhost:5000/Invoice/drafts?page=${page}&limit=10`);
//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.message || 'Failed to fetch drafts');
//       }

//       setDrafts(data.invoices || []);
//       setPagination(data.pagination);
//     } catch (err) {
//       setError(err.message);
//       toast.error(err.message || 'Error loading drafts');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDrafts(1);
//   }, []);

//   const handlePageChange = (newPage) => {
//     if (newPage >= 1 && newPage <= pagination.totalPages) {
//       fetchDrafts(newPage);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center min-h-[60vh]">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="text-center p-10 text-red-600">
//         <p className="text-xl font-semibold">Error: {error}</p>
//         <button
//           onClick={() => fetchDrafts(1)}
//           className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
//         >
//           Retry
//         </button>
//       </div>
//     );
//   }

//   if (drafts.length === 0) {
//     return (
//       <div className="text-center p-10 text-gray-500">
//         <FilePen size={64} className="mx-auto mb-4 opacity-50" />
//         <h2 className="text-2xl font-semibold mb-2">No drafts yet</h2>
//         <p>Start creating invoices from the "Send Invoice" page and save as draft.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <h1 className="text-3xl font-bold text-gray-900">Drafts</h1>
//         <button
//           onClick={() => (window.location.href = '/send')}
//           className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
//         >
//           + New Invoice
//         </button>
//       </div>

//       <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Client
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Created / Issue Date
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Total Amount
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Status
//                 </th>
//                 <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Actions
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200">
//               {drafts.map((invoice) => (
//                 <tr key={invoice._id} className="hover:bg-gray-50">
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="text-sm font-medium text-gray-900">
//                       {invoice.client?.name || '—'}
//                     </div>
//                     <div className="text-sm text-gray-500">
//                       {invoice.client?.email || '—'}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     {invoice.createdAt || invoice.issueDate
//                       ? format(
//                           new Date(invoice.createdAt || invoice.issueDate),
//                           'dd MMM yyyy, hh:mm a'
//                         )
//                       : '—'}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                     ₹{invoice.totalAmount?.toFixed(2) || '0.00'}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
//                       <AlertCircle size={14} className="mr-1" />
//                       Draft
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm">
//                     <button
//                       onClick={() => alert(`TODO: Edit draft ${invoice._id}`)}
//                       className="text-blue-600 hover:text-blue-800 font-medium mr-4"
//                     >
//                       Edit
//                     </button>
//                     {/* You can add more actions later, e.g.:
//                     <button className="text-gray-600 hover:text-gray-900 mr-4">View</button>
//                     <button className="text-red-600 hover:text-red-800">Delete</button> */}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination Controls */}
//         <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 bg-gray-50">
//           <div className="text-sm text-gray-700">
//             Showing <span className="font-medium">{drafts.length}</span> of{' '}
//             <span className="font-medium">{pagination.totalItems}</span> drafts
//           </div>

//           <div className="flex items-center gap-2">
//             <button
//               onClick={() => handlePageChange(pagination.currentPage - 1)}
//               disabled={pagination.currentPage === 1}
//               className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
//             >
//               <ChevronLeft size={20} />
//             </button>

//             <span className="text-sm font-medium">
//               Page {pagination.currentPage} of {pagination.totalPages}
//             </span>

//             <button
//               onClick={() => handlePageChange(pagination.currentPage + 1)}
//               disabled={pagination.currentPage === pagination.totalPages}
//               className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
//             >
//               <ChevronRight size={20} />
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }