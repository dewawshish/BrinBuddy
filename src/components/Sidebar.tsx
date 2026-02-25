import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Brain,
  Search,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, path: '/dashboard' },
  { id: 'ai', label: 'BrainBuddy AI', icon: <Brain className="h-5 w-5" />, path: '/ai' },
  { id: 'notes', label: 'Notes Generator', icon: <FileText className="h-5 w-5" />, path: '/notes-generator' },
  { id: 'search', label: 'Video Search', icon: <Search className="h-5 w-5" />, path: '/video-search' },
  { id: 'topics', label: 'Subjects', icon: <BookOpen className="h-5 w-5" />, path: '/subjects' },
  { id: 'profile', label: 'My Profile', icon: <User className="h-5 w-5" />, path: '/my-profile' },
  { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" />, path: '/settings' },
];

interface SidebarProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open: controlledOpen, onOpenChange, isCollapsed, onCollapsedChange }) => {
  const [internalOpen, setInternalOpen] = useState(true);
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Controlled or uncontrolled open state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  // Controlled or uncontrolled collapsed state
  const collapsed = isCollapsed !== undefined ? isCollapsed : internalCollapsed;
  const setCollapsed = onCollapsedChange || setInternalCollapsed;

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = globalThis.innerWidth < 768;
      setIsMobile(newIsMobile);
      if (newIsMobile) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    handleResize();
    globalThis.addEventListener('resize', handleResize);
    return () => globalThis.removeEventListener('resize', handleResize);
  }, [setCollapsed]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-40 md:hidden"
          onClick={toggleOpen}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      )}

      {/* Sidebar Overlay (Mobile) */}
      {isMobile && isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-gradient-to-b from-background to-background/95 border-r border-border/50 backdrop-blur-sm z-30 transition-all duration-300 ease-in-out',
          collapsed ? 'w-20' : 'w-64',
          !isOpen && isMobile && '-translate-x-full',
          'md:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border/50">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold text-sm">BrainBuddy</span>
            </div>
          )}
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleCollapsed}
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto pt-4 px-2 space-y-2">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
                'hover:bg-primary/10 hover:text-primary',
                isActive(item.path)
                  ? 'bg-primary/20 text-primary font-medium'
                  : 'text-muted-foreground hover:text-primary'
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="flex-1 text-left text-sm">
                  {item.label}
                  {item.badge && <span className="ml-auto text-xs bg-primary px-2 py-0.5 rounded-full">{item.badge}</span>}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer - Logout */}
        <div className="border-t border-border/50 p-2">
          <Button
            variant="ghost"
            className={cn('w-full flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-destructive')}
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content Spacer */}
      <div className={cn('transition-all duration-300', collapsed ? 'md:ml-20' : 'md:ml-64')} />
    </>
  );
};

export default Sidebar;
