'use client';
import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import styles from "./DashboardLayout.module.css";
import { logout } from "../../lib/apiClient";
import CircularButton from "../ui/CircularButton";
import { Tab } from "../tables";
import { SETUP_TABS, SetupTab } from "../../app/setup/setupConfig";


interface DashboardLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  userName?: string;
  userAvatarUrl?: string;
  headerAction?: React.ReactNode;
  showBackButton?: boolean;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

// Icon mapping for menu items
const MENU_ICONS: Record<string, { active: string; inactive: string }> = {
  '/dashboard': { active: 'Dashboardgreen.svg', inactive: 'Dashboard.svg' },
  '/setup': { active: 'setupactive.png', inactive: 'setupinactive.png' },
  '/user': { active: 'Residentialgreen.svg', inactive: 'Residential.png' },
  '/user-family': { active: 'Userfamilygreen.svg', inactive: 'Userfamily.svg' },
  '/vehicle': { active: 'Vehiclegreen.svg', inactive: 'Vehicle.png' },
  '/visitors': { active: 'Visitorgreen.svg', inactive: 'Visitor.png' },
  '/workers': { active: 'Workergreen.png', inactive: 'Worker.png' },
  '/luggage': { active: 'Luggagegreen.png', inactive: 'Luggage.png' },
  '/club-members': { active: 'Clubgreen.svg', inactive: 'Club.svg' },
  '/dha-x-halcon': { active: 'active.png', inactive: 'inactive.png' },
};

// Helper function to get icon based on active state
const getMenuIcon = (path: string, isActive: boolean): string => {
  const icons = MENU_ICONS[path];
  return icons ? `/icons/${icons[isActive ? 'active' : 'inactive']}` : '';
};

export default function DashboardLayout({
  children,
  pageTitle = "Dashboard",
  userName = "Ahmed Faraz",
  userAvatarUrl,
  headerAction,
  showBackButton,
  tabs,
  activeTab,
  onTabChange
}: DashboardLayoutProps){
  const [memberTypeOpen, setMemberTypeOpen] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState('/dashboard');
  const [accounteMenuOpen, setAccountMenuOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;

    const storedSidebarState = window.localStorage.getItem('dashboardSidebarOpen');
    return storedSidebarState === null ? true : storedSidebarState === 'true';
  });
  const [displayName, setDisplayName] = useState(userName);
  const router = useRouter();
  const pathname = usePathname();
  const isSetupPage = pathname?.startsWith('/setup');
  

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem('dashboardSidebarOpen', String(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    setActiveMenuItem(pathname ?? "");
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedFullName = localStorage.getItem('fullName') || sessionStorage.getItem('fullName');
    setDisplayName(storedFullName || userName || 'User');
  }, [userName]);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className={styles.dashboardWrapper}>
      <div
        className={`${styles.sidebarOverlay} ${sidebarOpen ? styles.sidebarOverlayVisible : ''} `}
        onClick={() => setSidebarOpen(false)}
      />
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoSection}>
            <img src="/images/dha.png" alt="DHA" className={styles.logo} />
            <h4 style={{ margin: 5}}>Smart DHA - Karachi</h4>
            <p style={{ fontSize: "12px", color: "#6b7280" }}>Redefining Urban Living</p>
            <div className={styles.logoSeparator} />
          </div>
          {/* <button className={styles.closeSidebarBtn} onClick={() => setSidebarOpen(false)}>
            <X size={24} color="#27ae60" />
          </button> */}
        </div>
        <nav className={`${styles.menu} ${!sidebarOpen ? styles.menuCollapsed : ''}`}>
          <Link 
            href="/dashboard" 
            className={`${activeMenuItem === '/dashboard' ? styles.menuItemActive : ''} ${styles.menuItemGap} ${styles.menuItem}`}
          >
            <span className={styles.menuItemText}>Dashboard</span>
            <img src={getMenuIcon('/dashboard', activeMenuItem === '/dashboard')} alt="" className={styles.menuIconImg} />
          </Link>
          <Link 
            href="/setup" 
            onClick={()=>localStorage.setItem('activeTab','cp-agent')}
            className={`${activeMenuItem.includes('/setup') ? styles.menuItemActive : ''} ${styles.menuItemGap} ${styles.menuItem}`}
          >
            <span className={styles.menuItemText}>Setup</span>
            <img src={getMenuIcon('/setup', activeMenuItem.includes('/setup'))} alt="" className={styles.menuIconImg} />
          </Link>
          {sidebarOpen && (
            <div>
            <div 
              className={styles.menuSectionTitle} 
              onClick={() => setMemberTypeOpen(!memberTypeOpen)}
              style={{ cursor: 'pointer' }}
            >
              <span>Member Type</span>
              <img 
                src="/icons/Arrow.png" 
                alt="" 
                className={`${styles.menuDropdownIconImg} ${memberTypeOpen ? styles.menuDropdownIconOpen : ''}`}
              />
            </div>
              </div>
          )}
          {memberTypeOpen && (
            <>
              <Link 
                  href="/club-members" 
                  className={`${(activeMenuItem === '/club-members' || activeMenuItem.startsWith('/club-members/')) ? styles.menuItemActive : ''} ${styles.menuItem}`}
                >
                  <span className={styles.menuItemText}>Club Members</span>
                  <img src={getMenuIcon('/club-members', (activeMenuItem === '/club-members' || activeMenuItem.startsWith('/club-members/')))} alt="" className={styles.menuIconImg} />
              </Link>
              <Link 
                href="/user" 
                className={`${(activeMenuItem === '/user' || activeMenuItem.startsWith('/user/')) ? styles.menuItemActive : ''} ${styles.menuItem}`}
              >
                <span className={styles.menuItemText}>User</span>
                <img src={getMenuIcon('/user', (activeMenuItem === '/user' || activeMenuItem.startsWith('/user/')))} alt="" className={styles.menuIconImg} />
              </Link>
              <Link 
                href="/user-family" 
                className={`${(activeMenuItem === '/user-family' || activeMenuItem.startsWith('/user-family/')) ? styles.menuItemActive : ''} ${styles.menuItem}`}
              >
                <span className={styles.menuItemText}>User Family</span>
                <img src={getMenuIcon('/user-family', (activeMenuItem === '/user-family' || activeMenuItem.startsWith('/user-family/')))} alt="" className={styles.menuIconImg} />
              </Link>
              <Link 
                href="/vehicle" 
                className={`${(activeMenuItem === '/vehicle' || activeMenuItem.startsWith('/vehicle/')) ? styles.menuItemActive : ''} ${styles.menuItem}`}
              >
                <span className={styles.menuItemText}>Vehicles</span>
                <img src={getMenuIcon('/vehicle', (activeMenuItem === '/vehicle' || activeMenuItem.startsWith('/vehicle/')))} alt="" className={styles.menuIconImg} />
              </Link>
              <Link 
                href="/visitors" 
                className={`${(activeMenuItem === '/visitors' || activeMenuItem.startsWith('/visitors/')) ? styles.menuItemActive : ''} ${styles.menuItem}`}
              >
                <span className={styles.menuItemText}>Visitor</span>
                <img src={getMenuIcon('/visitors', (activeMenuItem === '/visitors' || activeMenuItem.startsWith('/visitors/')))} alt="" className={styles.menuIconImg} />
              </Link>
              <Link 
                href="/workers" 
                className={`${(activeMenuItem === '/workers' || activeMenuItem.startsWith('/workers/')) ? styles.menuItemActive : ''} ${styles.menuItem}`}
              >
                <span className={styles.menuItemText}>Workers</span>
                <img src={getMenuIcon('/workers', (activeMenuItem === '/workers' || activeMenuItem.startsWith('/workers/')))} alt="" className={styles.menuIconImg} />
              </Link>
              <Link 
                href="/luggage" 
                className={`${(activeMenuItem === '/luggage' || activeMenuItem.startsWith('/luggage/')) ? styles.menuItemActive : ''} ${styles.menuItem}`}
              >
                <span className={styles.menuItemText}>Luggage Pass</span>
                <img src={getMenuIcon('/luggage', (activeMenuItem === '/luggage' || activeMenuItem.startsWith('/luggage/')))} alt="" className={styles.menuIconImg} />
              </Link>
            </>
          )}
          <div
              className={styles.menuSectionTitle}
              onClick={() => setAccountMenuOpen(!accounteMenuOpen)}
              style={{ cursor: 'pointer' }}
              >
              <span>Account & Finance</span>
              <img 
                src="/icons/Arrow.png" 
                alt="" 
                className={`${styles.menuDropdownIconImg} ${accounteMenuOpen ? styles.menuDropdownIconOpen : ''}`}
              />
            </div>
          {accounteMenuOpen && (
            <>
              <Link 
                href="/dha-x-halcon"
                className={`${(activeMenuItem === '/dha-x-halcon' || activeMenuItem.startsWith('/dha-x-halcon/')) ? styles.menuItemActive : ''} ${styles.menuItem}`}
              >
                <span className={styles.menuItemText}>DHA x Halcon</span>  
                <img src={getMenuIcon('/dha-x-halcon', (activeMenuItem === '/dha-x-halcon' || activeMenuItem.startsWith('/dha-x-halcon/')))} alt="" className={styles.menuIconImg} />
              </Link>
              </>
          )}
          {sidebarOpen && <div className={styles.menuSeparator} />}
        </nav>
      </aside>
      <main className={`${styles.mainContent} ${sidebarOpen ? styles.mainContentShifted : ''}`}>
        <header className={styles.header}>
          <div className={styles.headerTitleWrapper}>
            {/* <button className={styles.toggleSidebarBtn} onClick={() => setSidebarOpen(!sidebarOpen)} >
              <Menu size={24} color="#27ae60" />
            </button> */}
              <CircularButton onClick={() => {
                setSidebarOpen(!sidebarOpen);
                setMemberTypeOpen(true);
              }}>
                {sidebarOpen ?
                  <ChevronLeft size={24} color="#27ae60" /> 
                  : 
                  <ChevronRight size={24} color="#27ae60" />
                }
              </CircularButton>
            {(showBackButton !== false && (activeMenuItem.match(/\//g)?.length ?? 0) >= 2) || showBackButton === true ? (
              <img 
              src="/icons/arrow-back.png" 
              alt="Back" 
              className={styles.backArrowImg} 
              onClick={() => router.back()}
            />) : null}
            <div className={styles.headerTitle}>{pageTitle}</div>
          </div>
           {isSetupPage && SETUP_TABS?.length > 0 && (
  <div className={styles.tabsWrapper}>
    <div className={styles.tabsScroll}>
      {SETUP_TABS.map((tab: SetupTab) => {
        const isActive = pathname.split('/').pop() === tab.key;

        return (
          <button
  key={tab.key}
  onClick={() => router.push(`/setup/${tab.key}`)}
  className={`${styles.tabItem} ${isActive ? styles.tabActive : ''}`}
>
  {tab.label}
</button>
        );
      })}
    </div>
  </div>
)}
          <div className={styles.headerRight}>
            <div className={styles.userInfoWrapper}>
              <div 
                className={styles.userInfo} 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <img src={userAvatarUrl || "/images/Halcon.png"} alt="User" className={styles.userAvatar} />
                <div className={styles.userTextWrapper}>
                  <span className={styles.welcomeText}>👋 Welcome Back,</span>
                  <span className={styles.userName}>{displayName}</span>
                </div>
                <img src="/icons/gridicons_dropdown.png" alt="" className={styles.userDropdownImg} />
              </div>
              {profileDropdownOpen && (
                <div className={styles.profileDropdown}>
                  <Link href="/profile" className={styles.profileDropdownItem}>
                    <span>Profile</span>
                  </Link>
                  <div className={styles.profileDropdownDivider} />
                  <div className={styles.profileDropdownItem}>
                    <span>Notifications</span>
                    <label className={styles.toggleSwitch}>
                      <input 
                        type="checkbox" 
                        checked={notificationsEnabled} 
                        onChange={() => setNotificationsEnabled(!notificationsEnabled)} 
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  <div className={styles.profileDropdownDivider} />
                  <button
                    type="button"
                    className={`${styles.profileDropdownItem} ${styles.profileDropdownLogout}`}
                    onClick={handleLogout}
                  >
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
            {headerAction && <div className={styles.headerAction}>{headerAction}</div>}
          </div>
        </header>
        <section className={styles.contentSection}>{children}</section>
      </main>
    </div>
  );
}
