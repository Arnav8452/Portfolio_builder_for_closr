"use client";

import { signOut } from "next-auth/react";

type CreatorHeaderProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id?: string;
  };
};

export function CreatorHeader({ user }: CreatorHeaderProps) {
  return (
    <header className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-3">
        {user.image ? (
          <img
            src={user.image}
            alt="Profile Picture"
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>
        )}
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900 dark:text-white">
            {user.name || "Creator"}
          </span>
          {user.id && (
            <span className="text-xs text-gray-500 font-mono">
              ID: {user.id.slice(0, 8)}...
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/creators" })}
        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
      >
        Sign Out
      </button>
    </header>
  );
}
