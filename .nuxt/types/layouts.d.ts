import type { ComputedRef, MaybeRef } from 'vue'

type ComponentProps<T> = T extends new(...args: any) => { $props: infer P } ? NonNullable<P>
  : T extends (props: infer P, ...args: any) => any ? P
  : {}

declare module 'nuxt/app' {
  interface NuxtLayouts {
    admin: ComponentProps<typeof import("D:/GIT/github/users/coboacademy/shop-web/app/layouts/admin.vue").default>
    auth: ComponentProps<typeof import("D:/GIT/github/users/coboacademy/shop-web/app/layouts/auth.vue").default>
    dashboard: ComponentProps<typeof import("D:/GIT/github/users/coboacademy/shop-web/app/layouts/dashboard.vue").default>
    default: ComponentProps<typeof import("D:/GIT/github/users/coboacademy/shop-web/app/layouts/default.vue").default>
    public: ComponentProps<typeof import("D:/GIT/github/users/coboacademy/shop-web/app/layouts/public.vue").default>
    user: ComponentProps<typeof import("D:/GIT/github/users/coboacademy/shop-web/app/layouts/user.vue").default>
  }
  export type LayoutKey = keyof NuxtLayouts extends never ? string : keyof NuxtLayouts
  interface PageMeta {
    layout?: MaybeRef<LayoutKey | false> | ComputedRef<LayoutKey | false> | {
      [K in LayoutKey]: {
        name?: MaybeRef<K | false> | ComputedRef<K | false>
        props?: NuxtLayouts[K]
      }
    }[LayoutKey]
  }
}