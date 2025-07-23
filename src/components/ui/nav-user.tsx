import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useMemo } from "react"

// More flexible user type that handles edge cases
export interface UserData {
  name?: string | null
  email?: string | null
  avatar?: string | null
  id?: string | number
}

// Safe string helper
const safeString = (value: any): string => {
  if (value === null || value === undefined) return ""
  return String(value).trim()
}

// Safe URL helper
const safeUrl = (url: any): string => {
  if (!url || typeof url !== 'string') return ""
  const trimmed = url.trim()
  if (trimmed.length === 0) return ""
  
  // Basic URL validation
  try {
    new URL(trimmed)
    return trimmed
  } catch {
    // If not a valid URL, assume it's a relative path
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  }
}

// Generate initials from name
const generateInitials = (name: string): string => {
  if (!name || name.length === 0) return "U"
  
  const words = name.split(/\s+/).filter(word => word.length > 0)
  if (words.length === 0) return "U"
  
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase()
  }
  
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
}

export function NavUser({
  user,
}: {
  user?: UserData | null
}) {
  // Memoize processed user data to prevent unnecessary re-renders
  const processedUser = useMemo(() => {
    if (!user || typeof user !== 'object') {
      return {
        name: "Unknown User",
        email: "No email",
        avatar: "",
        initials: "U"
      }
    }

    const safeName = safeString(user.name)
    const safeEmail = safeString(user.email)
    const safeAvatar = safeUrl(user.avatar)
    
    return {
      name: safeName || "Unknown User",
      email: safeEmail || "No email",
      avatar: safeAvatar,
      initials: generateInitials(safeName)
    }
  }, [user])

  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                {processedUser.avatar && (
                  <AvatarImage 
                    src={processedUser.avatar} 
                    alt={processedUser.name}
                    onError={(e) => {
                      // Handle image loading errors gracefully
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                )}
                <AvatarFallback className="rounded-lg">
                  {processedUser.initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium" title={processedUser.name}>
                  {processedUser.name}
                </span>
                <span 
                  className="text-muted-foreground truncate text-xs" 
                  title={processedUser.email}
                >
                  {processedUser.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {processedUser.avatar && (
                    <AvatarImage 
                      src={processedUser.avatar} 
                      alt={processedUser.name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  )}
                  <AvatarFallback className="rounded-lg">
                    {processedUser.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium" title={processedUser.name}>
                    {processedUser.name}
                  </span>
                  <span 
                    className="text-muted-foreground truncate text-xs"
                    title={processedUser.email}
                  >
                    {processedUser.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconUserCircle />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconCreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconNotification />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}