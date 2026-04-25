'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Calendar, IndianRupee, User, Search, ArrowRight, Activity, Download, Eye } from 'lucide-react';
import Link from 'next/link';
import { generateInvoicePDF } from '../../utils/pdfGenerator';

export default function Dashboard() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/invoices`);
        setInvoices(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch invoices:', err);
        setError('Failed to load invoices. Please ensure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(invoice => 
    invoice.customerDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (invoice.invoiceNumber && invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totals?.grandTotal || 0), 0);
  const totalInvoices = invoices.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 md:flex md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            <Activity className="w-8 h-8 text-indigo-600 mr-3" />
            Invoices Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-500">Manage and view all your generated invoices.</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full md:w-64 outline-none transition-shadow"
            />
          </div>
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Create New
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200 p-6 flex items-center">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600 mr-4">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 truncate">Total Invoices</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{totalInvoices}</p>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200 p-6 flex items-center">
          <div className="p-3 rounded-lg bg-green-50 text-green-600 mr-4">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 truncate">Total Revenue</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">${totalRevenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 overflow-hidden relative">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64 text-red-500">
            <p>{error}</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileText className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium">No invoices found</p>
            <p className="text-sm">Try adjusting your search or create a new invoice.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Invoice Info
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                          {invoice.invoiceNumber ? invoice.invoiceNumber.substring(0, 3) : '#'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.invoiceNumber || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {invoice.lineItems?.length || 0} items
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">{invoice.customerDetails.name}</div>
                      </div>
                      <div className="text-xs text-gray-500 ml-6">{invoice.customerDetails.email || 'No email'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400" />
                        {new Date(invoice.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        ${invoice.totals?.grandTotal?.toFixed(2) || '0.00'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button 
                        onClick={() => setPreviewUrl(generateInvoicePDF(invoice, 'blobUrl'))}
                        className="text-indigo-600 hover:text-indigo-900 inline-flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Preview PDF"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => generateInvoicePDF(invoice, 'download')}
                        className="text-green-600 hover:text-green-900 inline-flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Download PDF"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PDF Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                Invoice Preview
              </h3>
              <button 
                onClick={() => setPreviewUrl(null)}
                className="text-gray-500 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-50"
              >
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-grow p-0 bg-gray-100">
              <iframe src={previewUrl} className="w-full h-full border-none" title="PDF Preview" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
