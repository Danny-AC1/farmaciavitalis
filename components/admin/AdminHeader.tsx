import React, { useRef, useEffect, useState } from 'react';
import { Menu, Bell, Layout, Volume2, VolumeX } from 'lucide-react';
import { Order, Product, ServiceBooking, User } from '../../types';
import { SupportChat } from '../../services/db.support';
import { notificationAudio } from '../../services/notificationAudioService';
import { DeviceNotificationSettingsModal } from '../notifications/DeviceNotificationSettingsModal';
import VitalisToastEngine, { VitalisToast } from '../notifications/VitalisToastEngine';
import { AnimatePresence } from 'framer-motion';
import { PwaInstallButton } from '../PwaInstallButton';
import { useAdminHeaderNotifications } from './header/useAdminHeaderNotifications';
import { AdminNotificationDropdown } from './header/AdminNotificationDropdown';

interface AdminHeaderProps {
  onMenuClick: () => void;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  pendingOrders: Order[];
  lowStockItems: Product[];
  pendingBookings: ServiceBooking[];
  unreadChats?: SupportChat[];
  onSelectChat?: (chatId: string) => void;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  currentUserRole?: User['role'];
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  onMenuClick, showNotifications, setShowNotifications, pendingOrders,
  lowStockItems, pendingBookings, unreadChats = [], onSelectChat,
  setActiveTab, onLogout, currentUserRole
}) => {
  const notificationRef = useRef<HTMLDivElement>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('vitalis_admin_sound');
    return saved !== 'false';
  });

  const {
    toasts,
    removeToast,
    pushPermission,
    showDeviceModal,
    setShowDeviceModal,
    handleEnablePush,
    activeOrders,
    activeLowStock,
    activeBookings,
    activeChats,
    totalNotifications,
    dismissNotification,
    dismissAllNotifications
  } = useAdminHeaderNotifications({
    pendingOrders,
    lowStockItems,
    pendingBookings,
    unreadChats,
    soundEnabled
  });

  useEffect(() => {
    localStorage.setItem('vitalis_admin_sound', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowNotifications]);

  const handleToastAction = (toast: VitalisToast) => {
    if (toast.type === 'SUMMARY') {
      setShowNotifications(true);
      if (toast.tab && setActiveTab) setActiveTab(toast.tab);
    } else if (toast.type === 'CHAT' && toast.chatId && onSelectChat) {
      onSelectChat(toast.chatId);
    } else if (toast.tab && setActiveTab) {
      setActiveTab(toast.tab);
    }
    removeToast(toast.id);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('vitalis_admin_sound', String(next));
    notificationAudio.setSoundEnabled(next);
    if (next) notificationAudio.playOrderChime();
  };

  return (
    <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-10 shrink-0 z-30 shadow-sm relative font-sans">
      <VitalisToastEngine 
        toasts={toasts}
        onDismiss={removeToast}
        onDismissAll={() => {}}
        onAction={handleToastAction}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />

      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"><Menu size={24}/></button>
        <div className="flex items-center gap-3">
          <div className="bg-teal-600 p-2 rounded-xl hidden sm:block"><Layout className="text-white" size={20}/></div>
          <div>
            <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">Vitalis <span className="text-teal-600">Admin</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Panel de Control Premium v2.8</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 md:gap-5 relative" ref={notificationRef}>
        <PwaInstallButton variant="navbar" />

        <button 
          onClick={toggleSound}
          className={`p-2 rounded-xl transition-all cursor-pointer ${soundEnabled ? 'text-teal-600 bg-teal-50 hover:bg-teal-100' : 'text-slate-400 bg-slate-50 hover:bg-slate-100'}`}
          title={soundEnabled ? "Silenciar alertas" : "Activar sonido de alertas"}
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>

        <button 
          onClick={() => setShowNotifications(!showNotifications)} 
          className={`relative p-2 rounded-xl transition-all group cursor-pointer ${showNotifications ? 'bg-teal-50 text-teal-600' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'}`}
        >
          <Bell size={22} className={totalNotifications > 0 ? "animate-swing origin-top" : ""} />
          {totalNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-pulse flex items-center justify-center">
              <span className="h-1 w-1 bg-white rounded-full"></span>
            </span>
          )}
        </button>

        <AnimatePresence>
          {showNotifications && (
            <AdminNotificationDropdown
              totalNotifications={totalNotifications}
              activeOrders={activeOrders}
              activeLowStock={activeLowStock}
              activeBookings={activeBookings}
              activeChats={activeChats}
              pushPermission={pushPermission}
              onEnablePush={handleEnablePush}
              onOpenDeviceModal={() => setShowDeviceModal(true)}
              onDismissNotification={dismissNotification}
              onDismissAll={dismissAllNotifications}
              onSelectTab={setActiveTab}
              onSelectChat={onSelectChat}
              onClose={() => setShowNotifications(false)}
            />
          )}
        </AnimatePresence>

        <button onClick={onLogout} className="h-10 w-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg border-2 border-white hover:bg-slate-850 transition-colors cursor-pointer">{currentUserRole?.charAt(0) || 'A'}</button>
      </div>

      <DeviceNotificationSettingsModal 
        isOpen={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
        userId="admin"
        userRole="ADMIN"
      />
    </header>
  );
};

export default AdminHeader;
