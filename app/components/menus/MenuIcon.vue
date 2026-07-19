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
  Package,
  PanelTop,
  ScrollText,
  Settings,
  ShieldCheck,
  User,
  UserCog,
  Users,
  Workflow,
} from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    name?: string | null;
    label?: string | null;
    route?: string | null;
    group?: string | null;
    size?: string;
  }>(),
  {
    name: null,
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

  // inventory
  products: Package,
  product: Package,
  countries: Globe2,
  country: Globe2,
  inventory: Package,

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
  Package,
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
