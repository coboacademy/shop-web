const legacyAdminRoutes: Record<string, string> = {
  '/dashboard': '/admin/dashboard',
  '/users': '/admin/users',
  '/roles': '/admin/roles',
  '/permissions': '/admin/permissions',
  '/rbac': '/admin/rbac',
  '/menus': '/admin/menus',
  '/settings': '/admin/settings',
  '/audit-logs': '/admin/audit-logs',
  '/countries': '/admin/countries',
}

export default defineNuxtRouteMiddleware((to) => {
  if (to.path.startsWith('/admin')) {
    return
  }

  const redirectTo = legacyAdminRoutes[to.path]

  if (redirectTo) {
    return navigateTo(redirectTo, { replace: true })
  }
})
