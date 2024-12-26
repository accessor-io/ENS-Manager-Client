"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const navItems = [
    { name: 'Dashboard', path: '/' },
    {
      name: 'ENS Management',
      path: '/ens',
      subItems: [
        { name: 'Search & Lookup', path: '/ens/lookup' },
        { name: 'Registration', path: '/ens/register' },
        { name: 'Transfer', path: '/ens/transfer' },
        { name: 'Records', path: '/ens/records' },
      ]
    },
    {
      name: 'Cross-Chain',
      path: '/cross-chain',
      subItems: [
        { name: 'Resolution', path: '/cross-chain/resolve' },
        { name: 'Records', path: '/cross-chain/records' },
        { name: 'Communication', path: '/cross-chain/communicate' }
      ]
    },
    {
      name: 'Attestations',
      path: '/attestations',
      subItems: [
        { name: 'Create', path: '/attestations/create' },
        { name: 'Verify', path: '/attestations/verify' },
        { name: 'Batch Process', path: '/attestations/batch' }
      ]
    },
    { name: 'Profile', path: '/profile' },
    { name: 'Staking', path: '/staking' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-slate-900/80 backdrop-blur-lg shadow-lg shadow-slate-900/20' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="font-bold text-xl text-slate-100">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                ENS Manager
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {navItems.map((item) => (
                <div key={item.path} className="relative group">
                  <Link
                    href={item.path}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${pathname === item.path
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:text-slate-100'
                      }
                    `}
                  >
                    {item.name}
                  </Link>
                  
                  {item.subItems && (
                    <div className="absolute left-0 mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2">
                      <div className="rounded-lg shadow-lg ring-1 ring-slate-900/5 overflow-hidden">
                        <div className="relative bg-slate-900/90 backdrop-blur-lg p-2 space-y-1">
                          {item.subItems.map((subItem) => (
                            <Link
                              key={subItem.path}
                              href={subItem.path}
                              className="block px-4 py-2 text-sm text-slate-300 rounded-md hover:bg-slate-800 hover:text-slate-100 transition-colors"
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-300 hover:text-slate-100 transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`}
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`}
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:hidden absolute w-full bg-slate-900/90 backdrop-blur-lg shadow-lg`}>
        <div className="pt-2 pb-3 space-y-1 px-4">
          {navItems.map((item) => (
            <div key={item.path} className="py-1">
              <Link
                href={item.path}
                className={`block px-3 py-2 rounded-lg text-base font-medium ${
                  pathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                {item.name}
              </Link>
              {item.subItems && (
                <div className="pl-4 mt-1 space-y-1">
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.path}
                      href={subItem.path}
                      className="block px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;