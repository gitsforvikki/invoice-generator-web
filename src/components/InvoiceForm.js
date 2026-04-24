'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, FileText, Percent, IndianRupee } from 'lucide-react';
import { calculateRowTotal, calculateTotals } from '../utils/calculations';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import axios from 'axios';

// Some mock items if backend isn't seeded yet
const MOCK_ITEMS = [
  { _id: '507f1f77bcf86cd799439011', name: 'Web Development Services', basePrice: 1500 },
  { _id: '507f1f77bcf86cd799439012', name: 'UI/UX Design', basePrice: 800 },
  { _id: '507f1f77bcf86cd799439013', name: 'SEO Optimization', basePrice: 500 },
  { _id: '507f1f77bcf86cd799439014', name: 'Hosting & Maintenance', basePrice: 300 }
];

export default function InvoiceForm() {
  const [customerDetails, setCustomerDetails] = useState({ name: '', email: '', phone: '', address: '' });
  const [lineItems, setLineItems] = useState([
    { itemId: '', name: '', quantity: 1, basePrice: 0, discountType: 'FIXED', discountValue: 0, variant: null }
  ]);
  const [gstPercentage, setGstPercentage] = useState(18);
  const [availableItems, setAvailableItems] = useState(MOCK_ITEMS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [savedInvoiceData, setSavedInvoiceData] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});

  // Fetch items from backend
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/items');
        if (res.data && res.data.length > 0) {
          setAvailableItems(res.data);
        }
      } catch (err) {
        console.warn('Backend not reachable or no items, using mock data.');
      }
    };
    fetchItems();
  }, []);

  const handleCustomerChange = (e) => {
    setCustomerDetails({ ...customerDetails, [e.target.name]: e.target.value });
  };

  const handleLineItemChange = (index, field, value) => {
    const newItems = [...lineItems];
    newItems[index][field] = value;
    
    // Auto-fill price and name if item selected
    if (field === 'itemId') {
      const selectedItem = availableItems.find(item => item._id === value);
      if (selectedItem) {
        newItems[index].basePrice = selectedItem.basePrice;
        newItems[index].name = selectedItem.name;
        newItems[index].variant = null; // Reset variant when item changes
      }
    }

    if (field === 'variant') {
      const selectedItem = availableItems.find(item => item._id === newItems[index].itemId);
      if (selectedItem && selectedItem.variants) {
        const selectedVariant = selectedItem.variants.find(v => v._id === value || v.name === value);
        newItems[index].variant = selectedVariant || null;
      }
    }
    
    setLineItems(newItems);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { itemId: '', name: '', quantity: 1, basePrice: 0, discountType: 'FIXED', discountValue: 0, variant: null }]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length > 1) {
      const newItems = lineItems.filter((_, i) => i !== index);
      setLineItems(newItems);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Customer Validation
    if (!customerDetails.name.trim()) newErrors.name = 'Client name is required';
    if (customerDetails.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerDetails.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (customerDetails.phone && !/^\+?[\d\s-]{10,13}$/.test(customerDetails.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone number (10-13 digits)';
    }

    // Line Items Validation
    const itemErrors = [];
    let hasItemError = false;
    
    lineItems.forEach((item, index) => {
      const rowErrors = {};
      if (!item.itemId) {
        rowErrors.itemId = 'Required';
        hasItemError = true;
      }
      if (item.quantity <= 0) {
        rowErrors.quantity = 'Must be > 0';
        hasItemError = true;
      }
      if (item.basePrice < 0) {
        rowErrors.basePrice = 'Invalid';
        hasItemError = true;
      }
      
      const selectedItem = availableItems.find(opt => opt._id === item.itemId);
      if (selectedItem?.variants?.length > 0 && !item.variant) {
        rowErrors.variant = 'Please select a variant';
        hasItemError = true;
      }
      
      itemErrors[index] = rowErrors;
    });

    if (hasItemError) newErrors.lineItems = itemErrors;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMsg('');
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const payload = {
        customerDetails,
        lineItems,
        gstPercentage
      };
      
      const res = await axios.post('http://localhost:5000/api/invoices', payload);
      setSuccessMsg(`Invoice ${res.data.invoiceNumber} created successfully!`);
      setSavedInvoiceData(res.data);
      // Reset form
      setCustomerDetails({ name: '', email: '', phone: '', address: '' });
      setLineItems([{ itemId: '', name: '', quantity: 1, basePrice: 0, discountType: 'FIXED', discountValue: 0, variant: null }]);
    } catch (err) {
      console.error(err);
      alert('Error creating invoice. Please check the console.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePDF = () => {
    if (!validateForm()) {
      alert('Please fix the errors in the form before previewing the PDF.');
      return;
    }
    
    const currentInvoiceData = {
      customerDetails,
      lineItems,
      gstPercentage,
      totals: calculateTotals(lineItems, gstPercentage)
    };
    setPreviewUrl(generateInvoicePDF(currentInvoiceData, 'blobUrl'));
  };

  const totals = calculateTotals(lineItems, gstPercentage);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-2xl rounded-2xl border border-gray-100 my-10 relative overflow-hidden">
      {/* Decorative background blob */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-indigo-100 to-purple-50 rounded-full blur-3xl opacity-50 z-0"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-end border-b border-gray-200 pb-6 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
              Invoice Generator
            </h1>
            <p className="text-gray-500 mt-2 font-medium">Create beautiful, professional invoices in seconds.</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={generatePDF}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
            >
              <FileText className="w-4 h-4 mr-2" />
              Preview PDF
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-md font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Invoice'}
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              {successMsg}
            </div>
            {savedInvoiceData && (
              <button
                onClick={() => generateInvoicePDF(savedInvoiceData, 'download')}
                className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors shadow-sm"
              >
                <FileText className="w-4 h-4 mr-1.5" />
                Download PDF
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="col-span-2 space-y-8">
            
            {/* Customer Details Section */}
            <section className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <div className="w-8 h-8 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 text-sm">01</div>
                Client Information
              </h2>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input type="text" name="name" value={customerDetails.name} onChange={handleCustomerChange} className={`w-full px-4 py-2.5 rounded-lg border ${errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none`} placeholder="John Doe" required />
                  {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                  <input type="email" name="email" value={customerDetails.email} onChange={handleCustomerChange} className={`w-full px-4 py-2.5 rounded-lg border ${errors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none`} placeholder="john@example.com" />
                  {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input type="tel" name="phone" value={customerDetails.phone} onChange={handleCustomerChange} maxLength="15" className={`w-full px-4 py-2.5 rounded-lg border ${errors.phone ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none`} placeholder="+91 98765 43210" />
                  {errors.phone && <p className="text-red-500 text-xs mt-1 font-medium">{errors.phone}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Billing Address</label>
                  <input type="text" name="address" value={customerDetails.address} onChange={handleCustomerChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none" placeholder="123 Main St, City, Country" />
                </div>
              </div>
            </section>

            {/* Line Items Section */}
            <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
               <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center mr-3 text-sm">02</div>
                  Line Items
                </div>
              </h2>
              
              <div className="space-y-4">
                {/* Header Row */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-4">Item</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-2 text-center">Discount</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                {lineItems.map((item, index) => (
                  <div key={index} className="group relative grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-gray-50 md:bg-transparent p-4 md:p-0 rounded-lg md:rounded-none border border-gray-200 md:border-none md:border-b md:pb-4 transition-all hover:bg-gray-50">
                    <div className="col-span-1 md:col-span-4 px-0 md:px-4">
                      <label className="md:hidden text-xs font-semibold text-gray-500 uppercase mb-1 block">Item</label>
                      <select 
                        value={item.itemId} 
                        onChange={(e) => handleLineItemChange(index, 'itemId', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${errors.lineItems?.[index]?.itemId ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none bg-white font-medium mb-2`}
                      >
                        <option value="">Select an Item...</option>
                        {availableItems.map(opt => (
                          <option key={opt._id} value={opt._id}>{opt.name}</option>
                        ))}
                      </select>

                      {/* Variant Selection */}
                      {item.itemId && availableItems.find(opt => opt._id === item.itemId)?.variants?.length > 0 && (
                        <div>
                          <select
                            value={item.variant ? item.variant._id || item.variant.name : ''}
                            onChange={(e) => handleLineItemChange(index, 'variant', e.target.value)}
                            className={`w-full px-3 py-1.5 rounded-lg border ${errors.lineItems?.[index]?.variant ? 'border-red-500 ring-1 ring-red-500' : 'border-indigo-100'} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none bg-indigo-50/50 text-xs font-bold text-indigo-700`}
                          >
                            <option value="">No Variant selected</option>
                            {availableItems.find(opt => opt._id === item.itemId).variants.map((v, i) => (
                              <option key={i} value={v._id || v.name}>
                                {v.type}: {v.name} ({v.priceAdjustment >= 0 ? '+' : ''}₹{v.priceAdjustment})
                              </option>
                            ))}
                          </select>
                          {errors.lineItems?.[index]?.variant && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.lineItems[index].variant}</p>}
                        </div>
                      )}
                    </div>
                    
                    <div className="col-span-1 md:col-span-2">
                      <label className="md:hidden text-xs font-semibold text-gray-500 uppercase mb-1 block">Quantity</label>
                      <input 
                        type="number" 
                        min="1"
                        value={item.quantity} 
                        onChange={(e) => handleLineItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        className={`w-full px-3 py-2 rounded-lg border ${errors.lineItems?.[index]?.quantity ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-500 outline-none text-center font-medium`}
                      />
                    </div>
                    
                    <div className="col-span-1 md:col-span-2">
                      <label className="md:hidden text-xs font-semibold text-gray-500 uppercase mb-1 block">Price</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">₹</span>
                        <input 
                          type="number" 
                          value={item.basePrice} 
                          onChange={(e) => handleLineItemChange(index, 'basePrice', parseFloat(e.target.value) || 0)}
                          className={`w-full pl-8 pr-3 py-2 rounded-lg border ${errors.lineItems?.[index]?.basePrice ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-500 outline-none text-right font-medium`}
                        />
                      </div>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 flex items-center space-x-1">
                      <label className="md:hidden text-xs font-semibold text-gray-500 uppercase mb-1 block w-full">Discount</label>
                      <div className="flex w-full bg-white border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                        <input 
                          type="number" 
                          value={item.discountValue} 
                          onChange={(e) => handleLineItemChange(index, 'discountValue', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-2 outline-none text-right text-sm font-medium"
                        />
                        <button 
                          onClick={() => handleLineItemChange(index, 'discountType', item.discountType === 'FIXED' ? 'PERCENTAGE' : 'FIXED')}
                          className="bg-gray-100 px-2 py-2 text-gray-600 font-bold border-l border-gray-300 hover:bg-gray-200 transition-colors text-xs w-10 flex items-center justify-center"
                        >
                          {item.discountType === 'FIXED' ? '₹' : '%'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-end md:pr-4">
                      <label className="md:hidden text-xs font-semibold text-gray-500 uppercase block">Total</label>
                      <span className="font-bold text-gray-800 text-lg">
                        ₹{calculateRowTotal(item.quantity, item.basePrice, item.discountType, item.discountValue, gstPercentage, item.variant?.priceAdjustment || 0).toFixed(2)}
                      </span>
                    </div>

                    <button 
                      onClick={() => removeLineItem(index)}
                      className={`absolute -right-3 -top-3 md:right-0 md:top-1/2 md:-translate-y-1/2 md:translate-x-full md:ml-2 p-1.5 bg-red-100 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm ${lineItems.length === 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-100 md:opacity-0 group-hover:opacity-100'}`}
                      disabled={lineItems.length === 1}
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button 
                onClick={addLineItem}
                className="mt-6 flex items-center text-indigo-600 font-semibold hover:text-indigo-800 transition-colors text-sm px-4 py-2 rounded-lg hover:bg-indigo-50"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Another Item
              </button>
            </section>
          </div>

          {/* Totals Section */}
          <div className="col-span-1">
            <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-2xl p-6 shadow-xl sticky top-6">
              <h3 className="text-lg font-bold text-gray-200 mb-6 border-b border-gray-700 pb-4">Invoice Summary</h3>
              
              <div className="space-y-4 text-sm font-medium">
                <div className="flex justify-between items-center text-gray-300">
                  <span>Subtotal</span>
                  <span className="text-gray-100">₹{totals.subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-300">
                  <span>Total Discount</span>
                  <span className="text-red-400">-₹{totals.totalDiscount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-gray-300 pt-2 border-t border-gray-700/50">
                  <div className="flex items-center">
                    <span>Tax (GST)</span>
                    <input 
                      type="number" 
                      value={gstPercentage}
                      onChange={(e) => setGstPercentage(parseFloat(e.target.value) || 0)}
                      className="ml-2 w-16 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-center focus:outline-none focus:border-indigo-500 text-xs"
                    />
                    <span className="ml-1">%</span>
                  </div>
                  <span className="text-gray-100">₹{totals.gstAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-700">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Grand Total</span>
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                    ₹{totals.grandTotal.toFixed(2)}
                  </span>
                </div>
                <p className="text-right text-xs text-gray-500">Includes all taxes and discounts</p>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all transform active:scale-95 flex justify-center items-center"
              >
                {isSubmitting ? 'Processing...' : 'Complete Invoice'}
              </button>
            </div>
          </div>
        </div>
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
