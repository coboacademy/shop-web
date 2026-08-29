
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T> = DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>> & T

type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }> & T


export const AppRefreshingIndicator: typeof import("../app/components/AppRefreshingIndicator.vue")['default']
export const AuthButton: typeof import("../app/components/auth/AuthButton.vue")['default']
export const AuthCard: typeof import("../app/components/auth/AuthCard.vue")['default']
export const AuthInput: typeof import("../app/components/auth/AuthInput.vue")['default']
export const AdminShell: typeof import("../app/components/dashboard/AdminShell.vue")['default']
export const AppBreadcrumbs: typeof import("../app/components/dashboard/AppBreadcrumbs.vue")['default']
export const AppHeader: typeof import("../app/components/dashboard/AppHeader.vue")['default']
export const AppShell: typeof import("../app/components/dashboard/AppShell.vue")['default']
export const AppSidebar: typeof import("../app/components/dashboard/AppSidebar.vue")['default']
export const CommandPalette: typeof import("../app/components/dashboard/CommandPalette.vue")['default']
export const NotificationDropdown: typeof import("../app/components/dashboard/NotificationDropdown.vue")['default']
export const UserDropdown: typeof import("../app/components/dashboard/UserDropdown.vue")['default']
export const DeleteMenuModal: typeof import("../app/components/menus/DeleteMenuModal.vue")['default']
export const MenuFormModal: typeof import("../app/components/menus/MenuFormModal.vue")['default']
export const MenuIcon: typeof import("../app/components/menus/MenuIcon.vue")['default']
export const ImportPermissionModal: typeof import("../app/components/permissions/ImportPermissionModal.vue")['default']
export const AssignRolePermissionsModal: typeof import("../app/components/roles/AssignRolePermissionsModal.vue")['default']
export const CloneRoleModal: typeof import("../app/components/roles/CloneRoleModal.vue")['default']
export const ImportRoleModal: typeof import("../app/components/roles/ImportRoleModal.vue")['default']
export const DashboardPageMotion: typeof import("../app/components/transition/DashboardPageMotion.vue")['default']
export const MotionCard: typeof import("../app/components/transition/MotionCard.vue")['default']
export const ActionDropdown: typeof import("../app/components/ui/ActionDropdown.vue")['default']
export const AlertMessage: typeof import("../app/components/ui/AlertMessage.vue")['default']
export const AppBadge: typeof import("../app/components/ui/AppBadge.vue")['default']
export const AppButton: typeof import("../app/components/ui/AppButton.vue")['default']
export const AppCard: typeof import("../app/components/ui/AppCard.vue")['default']
export const AppDropdown: typeof import("../app/components/ui/AppDropdown.vue")['default']
export const AppInput: typeof import("../app/components/ui/AppInput.vue")['default']
export const AppModal: typeof import("../app/components/ui/AppModal.vue")['default']
export const AppSelect: typeof import("../app/components/ui/AppSelect.vue")['default']
export const AppTextarea: typeof import("../app/components/ui/AppTextarea.vue")['default']
export const ConfirmDialog: typeof import("../app/components/ui/ConfirmDialog.vue")['default']
export const DataTable: typeof import("../app/components/ui/DataTable.vue")['default']
export const EmptyState: typeof import("../app/components/ui/EmptyState.vue")['default']
export const FilterBar: typeof import("../app/components/ui/FilterBar.vue")['default']
export const OtpInput: typeof import("../app/components/ui/OtpInput.vue")['default']
export const PageHeader: typeof import("../app/components/ui/PageHeader.vue")['default']
export const PageLoadingBar: typeof import("../app/components/ui/PageLoadingBar.vue")['default']
export const PageSkeleton: typeof import("../app/components/ui/PageSkeleton.vue")['default']
export const SectionHeader: typeof import("../app/components/ui/SectionHeader.vue")['default']
export const StatsCard: typeof import("../app/components/ui/StatsCard.vue")['default']
export const TablePagination: typeof import("../app/components/ui/TablePagination.vue")['default']
export const ThemeToggle: typeof import("../app/components/ui/ThemeToggle.vue")['default']
export const ToastContainer: typeof import("../app/components/ui/ToastContainer.vue")['default']
export const CreateUserModal: typeof import("../app/components/users/CreateUserModal.vue")['default']
export const DeleteUserModal: typeof import("../app/components/users/DeleteUserModal.vue")['default']
export const EditUserModal: typeof import("../app/components/users/EditUserModal.vue")['default']
export const UserStatusBadge: typeof import("../app/components/users/UserStatusBadge.vue")['default']
export const NuxtWelcome: typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']
export const NuxtLayout: typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
export const NuxtErrorBoundary: typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
export const ClientOnly: typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']
export const DevOnly: typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']
export const ServerPlaceholder: typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const NuxtLink: typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']
export const NuxtLoadingIndicator: typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
export const NuxtTime: typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
export const NuxtRouteAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
export const NuxtAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/nuxt-announcer")['default']
export const NuxtImg: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
export const NuxtPicture: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
export const NuxtPage: typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']
export const NoScript: typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']
export const Link: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']
export const Base: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']
export const Title: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']
export const Meta: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']
export const Style: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']
export const Head: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']
export const Html: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']
export const Body: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']
export const NuxtIsland: typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']
export const LazyAppRefreshingIndicator: LazyComponent<typeof import("../app/components/AppRefreshingIndicator.vue")['default']>
export const LazyAuthButton: LazyComponent<typeof import("../app/components/auth/AuthButton.vue")['default']>
export const LazyAuthCard: LazyComponent<typeof import("../app/components/auth/AuthCard.vue")['default']>
export const LazyAuthInput: LazyComponent<typeof import("../app/components/auth/AuthInput.vue")['default']>
export const LazyAdminShell: LazyComponent<typeof import("../app/components/dashboard/AdminShell.vue")['default']>
export const LazyAppBreadcrumbs: LazyComponent<typeof import("../app/components/dashboard/AppBreadcrumbs.vue")['default']>
export const LazyAppHeader: LazyComponent<typeof import("../app/components/dashboard/AppHeader.vue")['default']>
export const LazyAppShell: LazyComponent<typeof import("../app/components/dashboard/AppShell.vue")['default']>
export const LazyAppSidebar: LazyComponent<typeof import("../app/components/dashboard/AppSidebar.vue")['default']>
export const LazyCommandPalette: LazyComponent<typeof import("../app/components/dashboard/CommandPalette.vue")['default']>
export const LazyNotificationDropdown: LazyComponent<typeof import("../app/components/dashboard/NotificationDropdown.vue")['default']>
export const LazyUserDropdown: LazyComponent<typeof import("../app/components/dashboard/UserDropdown.vue")['default']>
export const LazyDeleteMenuModal: LazyComponent<typeof import("../app/components/menus/DeleteMenuModal.vue")['default']>
export const LazyMenuFormModal: LazyComponent<typeof import("../app/components/menus/MenuFormModal.vue")['default']>
export const LazyMenuIcon: LazyComponent<typeof import("../app/components/menus/MenuIcon.vue")['default']>
export const LazyImportPermissionModal: LazyComponent<typeof import("../app/components/permissions/ImportPermissionModal.vue")['default']>
export const LazyAssignRolePermissionsModal: LazyComponent<typeof import("../app/components/roles/AssignRolePermissionsModal.vue")['default']>
export const LazyCloneRoleModal: LazyComponent<typeof import("../app/components/roles/CloneRoleModal.vue")['default']>
export const LazyImportRoleModal: LazyComponent<typeof import("../app/components/roles/ImportRoleModal.vue")['default']>
export const LazyDashboardPageMotion: LazyComponent<typeof import("../app/components/transition/DashboardPageMotion.vue")['default']>
export const LazyMotionCard: LazyComponent<typeof import("../app/components/transition/MotionCard.vue")['default']>
export const LazyActionDropdown: LazyComponent<typeof import("../app/components/ui/ActionDropdown.vue")['default']>
export const LazyAlertMessage: LazyComponent<typeof import("../app/components/ui/AlertMessage.vue")['default']>
export const LazyAppBadge: LazyComponent<typeof import("../app/components/ui/AppBadge.vue")['default']>
export const LazyAppButton: LazyComponent<typeof import("../app/components/ui/AppButton.vue")['default']>
export const LazyAppCard: LazyComponent<typeof import("../app/components/ui/AppCard.vue")['default']>
export const LazyAppDropdown: LazyComponent<typeof import("../app/components/ui/AppDropdown.vue")['default']>
export const LazyAppInput: LazyComponent<typeof import("../app/components/ui/AppInput.vue")['default']>
export const LazyAppModal: LazyComponent<typeof import("../app/components/ui/AppModal.vue")['default']>
export const LazyAppSelect: LazyComponent<typeof import("../app/components/ui/AppSelect.vue")['default']>
export const LazyAppTextarea: LazyComponent<typeof import("../app/components/ui/AppTextarea.vue")['default']>
export const LazyConfirmDialog: LazyComponent<typeof import("../app/components/ui/ConfirmDialog.vue")['default']>
export const LazyDataTable: LazyComponent<typeof import("../app/components/ui/DataTable.vue")['default']>
export const LazyEmptyState: LazyComponent<typeof import("../app/components/ui/EmptyState.vue")['default']>
export const LazyFilterBar: LazyComponent<typeof import("../app/components/ui/FilterBar.vue")['default']>
export const LazyOtpInput: LazyComponent<typeof import("../app/components/ui/OtpInput.vue")['default']>
export const LazyPageHeader: LazyComponent<typeof import("../app/components/ui/PageHeader.vue")['default']>
export const LazyPageLoadingBar: LazyComponent<typeof import("../app/components/ui/PageLoadingBar.vue")['default']>
export const LazyPageSkeleton: LazyComponent<typeof import("../app/components/ui/PageSkeleton.vue")['default']>
export const LazySectionHeader: LazyComponent<typeof import("../app/components/ui/SectionHeader.vue")['default']>
export const LazyStatsCard: LazyComponent<typeof import("../app/components/ui/StatsCard.vue")['default']>
export const LazyTablePagination: LazyComponent<typeof import("../app/components/ui/TablePagination.vue")['default']>
export const LazyThemeToggle: LazyComponent<typeof import("../app/components/ui/ThemeToggle.vue")['default']>
export const LazyToastContainer: LazyComponent<typeof import("../app/components/ui/ToastContainer.vue")['default']>
export const LazyCreateUserModal: LazyComponent<typeof import("../app/components/users/CreateUserModal.vue")['default']>
export const LazyDeleteUserModal: LazyComponent<typeof import("../app/components/users/DeleteUserModal.vue")['default']>
export const LazyEditUserModal: LazyComponent<typeof import("../app/components/users/EditUserModal.vue")['default']>
export const LazyUserStatusBadge: LazyComponent<typeof import("../app/components/users/UserStatusBadge.vue")['default']>
export const LazyNuxtWelcome: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
export const LazyNuxtLayout: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
export const LazyNuxtErrorBoundary: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
export const LazyClientOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']>
export const LazyDevOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']>
export const LazyServerPlaceholder: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
export const LazyNuxtLink: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
export const LazyNuxtLoadingIndicator: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
export const LazyNuxtTime: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
export const LazyNuxtAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-announcer")['default']>
export const LazyNuxtImg: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
export const LazyNuxtPicture: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
export const LazyNuxtPage: LazyComponent<typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']>
export const LazyNoScript: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
export const LazyLink: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']>
export const LazyBase: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']>
export const LazyTitle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']>
export const LazyMeta: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']>
export const LazyStyle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']>
export const LazyHead: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']>
export const LazyHtml: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']>
export const LazyBody: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']>
export const LazyNuxtIsland: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']>

export const componentNames: string[]
