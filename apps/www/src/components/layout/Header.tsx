"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Search, Menu, X, Moon, Sun, LogOut, ChevronDown, Plus, Building } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { useTheme } from "next-themes"
import { useAuth } from "@workspace/auth/contexts/auth-context"
import { useOrganizationContext } from "@/contexts/organization-context"
import { OrganizationSwitcher } from "@/components/organization-switcher"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

interface Notification {
  id: string
  title: string
  message: string
  type: "success" | "warning" | "error" | "info"
  read: boolean
  createdAt: string
}

export function Header() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { user, loading, signOut } = useAuth()
  const { isLoading: isLoadingOrgs } = useOrganizationContext()


  const handleSignOut = async () => {
    try {
      await signOut()
      // No need for navigation as middleware will handle redirection
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and branding */}
          <div className="flex-shrink-0 flex items-center space-x-4">
            <Link href="/" className="flex items-center">
              <div className="bg-primary text-white p-2 rounded-lg mr-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                  <path d="M2 17L12 22L22 17" fill="currentColor" />
                  <path d="M2 12L12 17L22 12" fill="currentColor" />
                </svg>
              </div>
              <span className="font-semibold text-xl text-neutral-900 dark:text-white">Daboa Loyalty</span>
            </Link>
            
            {/* Organization Switcher - Using our improved component */}
            {user && !isLoadingOrgs && (
              <div className="hidden md:block ml-4">
                <OrganizationSwitcher />
              </div>
            )}
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-8">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-400 px-3 py-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/projects"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-400 px-3 py-2 text-sm font-medium"
                >
                  Projects
                </Link>
                <Link
                  href="/dashbord/billing"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-400 px-3 py-2 text-sm font-medium"
                >
                  Billing
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-400 px-3 py-2 text-sm font-medium"
                >
                  Settings
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/features"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-400 px-3 py-2 text-sm font-medium"
                >
                  Features
                </Link>
                <Link
                  href="/pricing"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-400 px-3 py-2 text-sm font-medium"
                >
                  Pricing
                </Link>
                <Link
                  href="/docs"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-400 px-3 py-2 text-sm font-medium"
                >
                  Documentation
                </Link>
              </>
            )}
          </nav>

          {/* Right-aligned items */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-neutral-500 dark:text-neutral-400"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </Button>

            {user ? (
              <>
                <Button variant="ghost" size="icon" className="text-neutral-500 dark:text-neutral-400" aria-label="Search">
                  <Search size={20} />
                </Button>

                {/* Create New Project Button */}
                <Button size="sm" asChild className="flex items-center gap-2">
                  <Link href="/dashboard/projects/new">
                    <Plus size={16} />
                    <span>New Project</span>
                  </Link>
                </Button>

                {/* Notifications */}
                {/* <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-neutral-500 dark:text-neutral-400 relative"
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    aria-label="Notifications"
                  >
                    <Bell size={20} />
                    {unreadNotifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {unreadNotifications.length}
                      </span>
                    )}
                  </Button>

                  <AnimatePresence>
                    {isNotificationsOpen && (
                      <motion.div
                        className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-800 rounded-2xl shadow-lg py-2 z-50 border border-neutral-200 dark:border-neutral-700"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
                          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Notifications</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {mockNotifications.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">No notifications</div>
                          ) : (
                            mockNotifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-750 ${
                                  !notification.read ? "bg-primary-50 dark:bg-primary-900/20" : ""
                                }`}
                              >
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 mr-3">
                                    <Badge
                                      variant={
                                        notification.type === "success"
                                          ? "default"
                                          : notification.type === "warning"
                                            ? "secondary"
                                            : notification.type === "error"
                                              ? "destructive"
                                              : "outline"
                                      }
                                      className="h-2 w-2 p-0"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                      {notification.title}
                                    </p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                                      {new Date(notification.createdAt)?.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        {mockNotifications.length > 0 && (
                          <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-700">
                            <Button variant="link" className="text-primary-500 hover:text-primary-600 text-sm p-0">
                              Mark all as read
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div> */}

                {/* User Profile */}
                <div className="relative flex items-center justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="p-0 h-8 w-8 rounded-full overflow-hidden">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={user.user_metadata?.avatar_url || "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"}
                            alt="User Profile"
                            className="h-full w-full object-cover"
                          />
                          <AvatarFallback>{user.email?.substring(0, 2).toUpperCase() || "US"}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>
                        {user.email}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/profile">Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/settings">Settings</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-red-500 dark:text-red-400">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Login</Link>
                </Button>
                
                  <Link href="/auth/signup"><Button asChild>Get Started
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-neutral-500 dark:text-neutral-400"
                aria-label="Open menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {user ? (
                <>
                  {/* Organization Switcher for Mobile - improved version */}
                  {!isLoadingOrgs && (
                    <div className="px-3 py-2 mb-2">
                      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">Current Organization</p>
                      <OrganizationSwitcher align="start" className="w-full" />
                    </div>
                  )}

                  <div className="mt-2 border-t border-neutral-200 dark:border-neutral-800 pt-2">
                    <Link
                      href="/dashboard"
                      className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/projects"
                      className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      Projects
                    </Link>
                    <Link
                      href="/dashboard/billing"
                      className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      Billing
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/features"
                    className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    Features
                  </Link>
                  <Link
                    href="/pricing"
                    className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/docs"
                    className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    Documentation
                  </Link>
                  <Link
                    href="/auth/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block px-3 py-2 rounded-md text-base font-medium bg-primary text-white py-2 px-3 rounded-md hover:bg-primary-600"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
