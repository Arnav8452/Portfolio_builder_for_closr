import React from "react";
import { Youtube, Github, Twitch, Twitter, Mail, FileText, Globe, Linkedin, Instagram, Activity } from "lucide-react";

type PlatformTier = {
  id: string;
  title: string;
  description: string;
  items: { name: string; icon: React.FC<any>; color: string }[];
};

const TIERS: PlatformTier[] = [
  {
    id: "tier-1",
    title: "Tier 1: OAuth Data Connections",
    description: "Absolute Trust. Deep analytics directly from the source.",
    items: [
      { name: "YouTube", icon: Youtube, color: "text-red-500" },
      { name: "GitHub", icon: Github, color: "text-gray-800 dark:text-white" },
      { name: "Twitch", icon: Twitch, color: "text-purple-500" },
      { name: "X / Twitter", icon: Twitter, color: "text-blue-400" },
    ],
  },
  {
    id: "tier-2",
    title: "Tier 2: RSS & Topological",
    description: "High Trust. Content verified via domain challenges and feeds.",
    items: [
      { name: "Substack", icon: Mail, color: "text-orange-500" },
      { name: "Medium", icon: FileText, color: "text-gray-900 dark:text-gray-100" },
      { name: "Podcasts", icon: Activity, color: "text-indigo-500" },
      { name: "Custom Domains", icon: Globe, color: "text-emerald-500" },
    ],
  },
  {
    id: "tier-3",
    title: "Tier 3: Scraped Links",
    description: "Variable Trust. Headless browsing fallback for closed platforms.",
    items: [
      { name: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
      { name: "Instagram", icon: Instagram, color: "text-pink-600" },
      { name: "Patreon", icon: Activity, color: "text-rose-500" },
    ],
  },
];

export function SupportedPlatforms() {
  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Supported Platforms
        </h2>
        <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 mx-auto">
          We categorize integrations by their cryptographic trust layer.
        </p>
      </div>

      <div className="space-y-12">
        {TIERS.map((tier) => (
          <div key={tier.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 sm:p-8">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{tier.title}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{tier.description}</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {tier.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.name} className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg transition-transform hover:scale-105">
                    <Icon className={`w-8 h-8 mb-3 ${item.color}`} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                      {item.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
