<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="border-b border-border bg-card">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <NuxtLink to="/" class="text-lg font-bold">
          Cobo Core
        </NuxtLink>

        <nav class="flex items-center gap-4 text-sm font-medium">
          <NuxtLink to="/">Home</NuxtLink>
          <NuxtLink to="/about">About</NuxtLink>
          <NuxtLink to="/products">Products</NuxtLink>
          <NuxtLink to="/login">Login</NuxtLink>
          <NuxtLink to="/admin/login">Admin</NuxtLink>
        </nav>
      </div>
    </header>

    <main>
      <slot />
    </main>
  </div>
</template>
