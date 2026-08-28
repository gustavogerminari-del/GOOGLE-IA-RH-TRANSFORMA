import React from 'react';
import { TopNavbar, TopNavbarProps } from './TopNavbar';
import { SideMenu, SideMenuProps } from './SideMenu';

export interface AppLayoutProps {
  navbarProps: TopNavbarProps;
  sideMenuProps: SideMenuProps;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  navbarProps,
  sideMenuProps,
  children,
}) => {
  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0F172A] flex flex-col font-sans antialiased">
      <TopNavbar {...navbarProps} />
      <div className="flex flex-1 overflow-hidden">
        <SideMenu {...sideMenuProps} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F7F9FC]">
          {children}
        </main>
      </div>
    </div>
  );
};
