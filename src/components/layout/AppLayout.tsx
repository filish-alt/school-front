import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import TopHeader from './TopHeader';
import SchoolBanner from './SchoolBanner';
import PersonalSettingsDialog from './PersonalSettingsDialog';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'appearance' | 'security'>('profile');

  const handleOpenSettings = (tab: 'profile' | 'appearance' | 'security' = 'profile') => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar (Desktop fixed / Mobile drawer) */}
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSettings={handleOpenSettings}
      />

      {/* Main Container */}
      <div className="flex-1 lg:ml-64 ml-0 flex flex-col min-h-screen min-w-0 w-full overflow-x-hidden">
        {/* Sticky Top Header */}
        <TopHeader
          onOpenSettings={handleOpenSettings}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        {/* Page Content */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 animate-fade-in max-w-7xl w-full min-w-0">
          <SchoolBanner />
          <Outlet />
        </main>
      </div>

      {/* Personal Settings Modal */}
      <PersonalSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        defaultTab={settingsTab}
      />
    </div>
  );
}
