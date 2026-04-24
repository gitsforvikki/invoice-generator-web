'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, FilePlus2, Package, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white/70 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl group-hover:opacity-90 transition-opacity">
                H
              </div>
              <span className="font-extrabold text-xl tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors">
                HealthyCafe
              </span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              href="/"
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            >
              <FilePlus2 className="w-4 h-4 mr-2" />
              Create Invoice
            </Link>
            <Link 
              href="/dashboard"
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
            <Link 
              href="/inventory"
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-md shadow-indigo-200"
            >
              <Package className="w-4 h-4 mr-2" />
              Inventory
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 hover:text-indigo-600 focus:outline-none p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 absolute w-full left-0 top-16 shadow-2xl pb-4 animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 pt-4 pb-3 space-y-3">
            <Link 
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            >
              <FilePlus2 className="w-5 h-5 mr-3" />
              Create Invoice
            </Link>
            <Link 
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Dashboard
            </Link>
            <Link 
              href="/inventory"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-3 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-200"
            >
              <Package className="w-5 h-5 mr-3" />
              Inventory
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
