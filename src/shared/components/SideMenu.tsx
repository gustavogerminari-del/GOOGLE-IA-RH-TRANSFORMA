import React from 'react';

export interface MenuItemConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
}

export interface SideMenuProps {
  items: MenuItemConfig[];
  activeItemId: string;
  onSelectKey: (id: string) => void;
  footerContent?: React.ReactNode;
}

export const SideMenu: React.FC<SideMenuProps> = ({
  items,
  activeItemId,
  onSelectKey,
  footerContent,
}) => {
  return (
    <aside className="w-full sm:w-64 bg-[#123657] border-r border-[#082747] text-white flex flex-col shrink-0 p-3 sm:p-4 space-y-4">
      <nav className="space-y-1 flex-1">
        {items.map((item) => {
          const isActive = activeItemId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectKey(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1D4F7A] text-white shadow-xs border border-white/10'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : 'text-[#EAF2F8]'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-[#082747] text-white' : 'bg-white/15 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {footerContent && (
        <div className="border-t border-white/10 pt-3">
          {footerContent}
        </div>
      )}
    </aside>
  );
};
