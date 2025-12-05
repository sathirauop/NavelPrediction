"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { usePathname } from "next/navigation";

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    if (!user) return null;

    return (
        <header className="bg-gray-900/90 backdrop-blur-md shadow-sm border-b border-gray-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-8">
                        <div>
                            <Link href="/" className="flex items-center gap-2">
                                <div className="bg-blue-600 p-1.5 rounded-lg">
                                    <svg
                                        className="w-6 h-6 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 10V3L4 14h7v7l9-11h-7z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    {/* <h1 className="text-xl font-bold text-white leading-none">
                                        Naval Predictions
                                    </h1> */}
                                    <h1 className="text-xs text-blue-200 font-light tracking-wide">
                                        AI Powered Marine Machinery Oil Analyzing System
                                    </h1>
                                </div>
                            </Link>
                        </div>

                        <nav className="hidden md:flex space-x-4">
                            <Link
                                href="/"
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === "/"
                                    ? "bg-blue-900/50 text-blue-200"
                                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                                    }`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/history"
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === "/history"
                                    ? "bg-blue-900/50 text-blue-200"
                                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                                    }`}
                            >
                                History & Trends
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-sm font-medium text-white">
                                {user.name}
                            </span>
                            <span className="text-xs text-gray-400 uppercase tracking-wider">
                                {user.role}
                            </span>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                            title="Sign Out"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
