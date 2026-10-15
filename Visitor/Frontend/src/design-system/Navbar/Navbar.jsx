/**
 * VMS Design System — Navbar Component
 * ─────────────────────────────────────
 * Sticky top navbar with global search, notifications, languages, profile dropdown, and theme toggle.
 */
import { useState, useRef, useEffect } from 'react';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageDropdown from '../../components/common/LanguageDropdown';
import { resolvePhotoUrl } from '../../utils/photoUtils';
export default function Navbar({ collapsed = false, onCollapseToggle = () => { }, onMobileToggle = () => { }, user = null, notifications = [], unreadMessageCount, unreadNotificationCount, onMarkAllRead = () => { }, onNotificationClick = () => { }, onViewAllNotifications = () => { }, onMessagesClick = () => { }, onProfileClick = () => { }, onLogout = () => { }, searchQuery = '', onSearchChange = () => { }, searchResults = [], onResultClick = () => { }, onRefreshNotifications = () => { }, }) {
    // Dropdown states
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const { t } = useLanguage();
    const profileRef = useRef(null);
    const notificationsRef = useRef(null);
    // Click outside handlers
    useEffect(() => {
        function handleClickOutside(event) {
            const target = event.target;
            if (profileRef.current && !profileRef.current.contains(target)) {
                setIsProfileOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(target)) {
                setIsNotificationsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const unreadCount = notifications.filter((n) => !n.read).length;
    const calcUnreadNotif = unreadNotificationCount !== undefined ? unreadNotificationCount : unreadCount;
    const calcUnreadMsg = unreadMessageCount !== undefined ? unreadMessageCount : 0;
    return (<header className="vms-navbar">
      {/* Left panel: Sidebar toggles & search */}
      <div className="vms-navbar__left">
        {/* Toggle sidebar button (Desktop) */}
        <button onClick={onCollapseToggle} className="vms-navbar__toggle d-none d-lg-flex" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-label="Toggle Sidebar">
          <i className="bi bi-list"></i>
        </button>

        {/* Toggle sidebar button (Mobile) */}
        <button onClick={onMobileToggle} className="vms-navbar__toggle d-flex d-lg-none" aria-label="Open Navigation Menu">
          <i className="bi bi-list"></i>
        </button>

        {/* Global Search Bar */}
        <div className="vms-navbar__search">
          <i className="bi bi-search vms-navbar__search-icon"></i>
          <input type="text" placeholder={t('nav.searchModule')} value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="vms-navbar__search-input"/>

          {/* Floating Search Results */}
          {searchQuery && (<div className="vms-navbar__search-results shadow-lg">
              {searchResults.length === 0 ? (<div className="vms-navbar__search-empty">{t('nav.noModulesFound')}</div>) : (searchResults.map((res) => (<button key={res.view} onClick={() => {
                    onResultClick(res.view);
                    onSearchChange('');
                }} className="vms-navbar__search-result-item">
                    <span className="fw-semibold">{res.label}</span>
                    <span className="vms-navbar__search-result-category">{res.category}</span>
                  </button>)))}
            </div>)}
        </div>
      </div>

      {/* Right panel: Actions, Dropdowns */}
      <div className="vms-navbar__right">
        {/* Language selector with USA & Ethiopian flags */}
        <LanguageDropdown variant="auto"/>

        {/* Global Theme Toggle */}
        <ThemeToggle />

        {/* Messages Direct Link Button with Unread Message Count Badge */}
        <button onClick={onMessagesClick} className="vms-navbar__action-btn position-relative" title={t('nav.messageCenter')} aria-label="View Messages">
          <i className="bi bi-chat-dots"></i>
          {calcUnreadMsg > 0 && (
            <span className="vms-navbar__action-btn__badge animate-pulse" style={{ backgroundColor: '#ef4444' }}>
              {calcUnreadMsg > 99 ? '99+' : calcUnreadMsg}
            </span>
          )}
        </button>

        {/* Notifications Button - Directly Redirects to Notification Center */}
        <div className="position-relative">
          <button id="vms-notification-bell-btn" onClick={onViewAllNotifications} className="vms-navbar__action-btn position-relative" aria-label={`View alerts${calcUnreadNotif > 0 ? ` (${calcUnreadNotif} unread)` : ''}`} title={t('nav.notifications')}>
            <i className="bi bi-bell"></i>
            {calcUnreadNotif > 0 && (<span className="vms-navbar__action-btn__badge animate-pulse">
                {calcUnreadNotif > 99 ? '99+' : calcUnreadNotif}
              </span>)}
          </button>

          {isNotificationsOpen && (<div className="vms-navbar__dropdown vms-navbar__dropdown--wide mt-2 shadow-lg">
              <div className="vms-navbar__dropdown__header">
                <span className="vms-navbar__dropdown__title">{t('nav.alertCenter')}</span>
                {(calcUnreadNotif > 0 || unreadCount > 0) && (<button onClick={() => {
                    onMarkAllRead();
                    setIsNotificationsOpen(false);
                }} className="vms-btn--link fw-bold" style={{ fontSize: 'var(--vms-tiny)' }}>
                    {t('nav.markAllRead')}
                  </button>)}
              </div>
              <div className="vms-navbar__dropdown__body">
                {notifications.length === 0 ? (<div className="p-4 text-center text-muted" style={{ fontSize: 'var(--vms-small)' }}>
                    {t('nav.noAlerts')}
                  </div>) : (notifications.map((notif) => (<button key={notif.id} onClick={() => {
                    onNotificationClick(notif.id);
                    setIsNotificationsOpen(false);
                }} className={`vms-navbar__notif-item ${!notif.read ? 'unread' : ''}`}>
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="vms-navbar__notif-item__title d-flex align-items-center gap-1.5">
                          {!notif.read && (<span className="d-inline-block rounded-circle bg-primary" style={{ width: 6, height: 6 }}/>)}
                          {notif.title}
                        </span>
                        <span className="vms-navbar__notif-item__time">{notif.time}</span>
                      </div>
                      <p className="vms-navbar__notif-item__desc mb-0">{notif.desc}</p>
                    </button>)))}
              </div>
              <div className="vms-navbar__dropdown__footer">
                <button onClick={() => {
                onViewAllNotifications();
                setIsNotificationsOpen(false);
            }} className="vms-btn--link fw-bold text-uppercase w-100" style={{ fontSize: 'var(--vms-tiny)', letterSpacing: '0.05em' }}>
                  {t('nav.viewAllAlerts')}
                </button>
              </div>
            </div>)}
        </div>

        {/* Profile Dropdown */}
        <div ref={profileRef} className="position-relative">
          <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="vms-navbar__profile-btn" aria-label="User menu">
            <div className="vms-navbar__profile-avatar shadow-sm">
              {user?.avatarUrl ? (<img src={resolvePhotoUrl(user.avatarUrl)} alt="Profile"/>) : (user?.fullName?.charAt(0).toUpperCase() || 'U')}
            </div>
            <i className="bi bi-chevron-down text-slate-400 ms-1" style={{ fontSize: '0.7rem', opacity: 0.8 }}></i>
          </button>

          {isProfileOpen && (<div className="vms-navbar__dropdown mt-2 shadow-lg">
              <div className="vms-navbar__dropdown__user-info">
                <div className="vms-navbar__dropdown__user-name">{user?.fullName || 'User'}</div>
                <div className="vms-navbar__dropdown__user-email">{user?.email || ''}</div>
              </div>

              <button onClick={() => {
                onProfileClick('profile');
                setIsProfileOpen(false);
            }} className="vms-navbar__dropdown__item">
                <i className="bi bi-person"></i> {t('nav.myProfile')}
              </button>
              <button onClick={() => {
                onProfileClick('change_password');
                setIsProfileOpen(false);
            }} className="vms-navbar__dropdown__item">
                <i className="bi bi-key"></i> {t('nav.changePassword')}
              </button>


              <div className="vms-navbar__dropdown__divider"/>

              <button onClick={onLogout} className="vms-navbar__dropdown__item vms-navbar__dropdown__item--danger">
                <i className="bi bi-box-arrow-right"></i> {t('nav.signOut')}
              </button>
            </div>)}
        </div>
      </div>
    </header>);
}
