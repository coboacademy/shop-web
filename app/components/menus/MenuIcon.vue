<script setup lang="ts">
import {
  Activity,
  BarChart3,
  Bell,
  Circle,
  Component,
  Database,
  FileClock,
  FileText,
  Gauge,
  Globe2,
  Home,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  PanelTop,
  ScrollText,
  Settings,
  ShieldCheck,
  User,
  UserCog,
  Users,
  Workflow,
} from "lucide-vue-next";
import * as LucideIcons from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    name?: string | null;
    icon?: string | null;
    label?: string | null;
    route?: string | null;
    group?: string | null;
    size?: string;
  }>(),
  {
    name: null,
    icon: null,
    label: null,
    route: null,
    group: null,
    size: "h-5 w-5",
  }
);

const iconMap: Record<string, any> = {
  // fallback / generic
  default: LayoutDashboard,
  circle: Circle,

  // dashboard
  dashboard: LayoutDashboard,
  home: Home,
  main: Home,
  gauge: Gauge,

  // management / RBAC
  users: Users,
  user: Users,
  "user-management": Users,
  roles: ShieldCheck,
  role: ShieldCheck,
  permissions: KeyRound,
  permission: KeyRound,
  rbac: Workflow,
  management: UserCog,

  // inventory (product icons removed)
  countries: Globe2,
  country: Globe2,

  // system
  menus: PanelTop,
  menu: PanelTop,
  settings: Settings,
  setting: Settings,
  notifications: Bell,
  notification: Bell,
  "audit-logs": FileClock,
  audit: FileClock,
  logs: ScrollText,
  system: Component,
  profile: User,
  security: LockKeyhole,

  // old icon-name support
  Activity,
  BarChart3,
  Bell,
  Component,
  Database,
  FileText,
  Gauge,
  Globe2,
  Home,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  PanelTop,
  ScrollText,
  Settings,
  ShieldCheck,
  User,
  UserCog,
  Users,
  Workflow,
};

const normalize = (value?: string | null) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .split("/")[0]
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");
};

const pascalKey = computed(() => {
  return String(props.name || "").trim();
});

const explicitIcon = computed(() => {
  const iconName = String(props.icon || "").trim();
  if (!iconName) return null;

  const pascalIconName = iconName
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  const iconExports = LucideIcons as unknown as Record<string, unknown>;
  const candidate = iconExports[iconName] || iconExports[pascalIconName];

  if (!candidate || iconName === "createLucideIcon") return null;
  return candidate;
});

const resolvedKey = computed(() => {
  return (
    normalize(props.route) ||
    normalize(props.name) ||
    normalize(props.label) ||
    normalize(props.group) ||
    "default"
  );
});

const iconComponent = computed(() => {
  if (explicitIcon.value) return explicitIcon.value;

  // Support old usage: <MenuIcon name="LayoutDashboard" />
  if (pascalKey.value && iconMap[pascalKey.value]) {
    return iconMap[pascalKey.value];
  }

  // New usage: <MenuIcon route="/countries" />
  return iconMap[resolvedKey.value] || Circle;
});
</script>

<template>
  <component :is="iconComponent" :class="size" />
</template>
