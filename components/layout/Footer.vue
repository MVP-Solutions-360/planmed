<template>
  <footer class="font-sans w-full py-16 md:py-24 bg-[#0C2619] text-[#D3A76A] mt-auto">
    <div class="max-w-[1200px] mx-auto px-4 md:px-12 flex flex-col md:flex-row justify-between gap-10 md:gap-12">
      <div class="mb-6 md:mb-0 max-w-xs text-center md:text-left mx-auto md:mx-0">
        <p class="text-[#D3A76A] text-sm mb-6 leading-relaxed">
          Financiamos directamente tus procedimientos médicos y estéticos, desde el 50% hasta el 100% de su valor.
        </p>
        <!-- Redes Sociales de Planmed -->
        <div class="flex items-center justify-center md:justify-start gap-5 text-[#D3A76A]">
          <a href="#" target="_blank" rel="noopener noreferrer" class="hover:opacity-80 transition-opacity duration-300" title="Instagram">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer" class="hover:opacity-80 transition-opacity duration-300" title="Facebook">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer" class="hover:opacity-80 transition-opacity duration-300" title="TikTok">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.24-2.37.59-4.84 2.27-6.52 1.71-1.7 4.2-2.47 6.55-1.97v4.12c-1.64-.53-3.64-.17-4.88 1.09-1.24 1.25-1.55 3.32-.73 4.88.82 1.55 2.62 2.5 4.39 2.18 1.77-.32 3.12-1.85 3.12-3.64 0-4.99-.02-9.98.02-14.97z"/></svg>
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer" class="hover:opacity-80 transition-opacity duration-300" title="WhatsApp">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          </a>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-16 text-center sm:text-left mx-auto md:mx-0">
        <div class="flex flex-col gap-3 md:gap-4">
          <span class="text-[#D3A76A] text-xs uppercase tracking-widest font-bold mb-2">Legal</span>
          <NuxtLink :to="'/recursos'" class="text-[#D3A76A] hover:opacity-80 transition-opacity text-sm">Documentos Legales</NuxtLink>
        </div>
        <div class="flex flex-col gap-3 md:gap-4">
          <span class="text-[#D3A76A] text-xs uppercase tracking-widest font-bold mb-2">Compañía</span>
          <NuxtLink :to="'/nosotros'" class="text-[#D3A76A] hover:opacity-80 transition-opacity text-sm">Sobre Planmed</NuxtLink>
        </div>
      </div>
    </div>
    <div class="max-w-[1200px] mx-auto px-4 md:px-12 mt-12 md:mt-16 pt-8 border-t border-[#D3A76A]/20 flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="w-full md:flex-1 flex justify-center md:justify-start">
        <img src="/images/branding/logo-blanco-transparente.png" alt="Planmed" class="h-12 md:h-16 w-auto object-contain" />
      </div>
      <div class="w-full md:flex-[2] text-center">
        <p class="text-[#D3A76A]/80 text-xs leading-relaxed">
          © 2026 Planmed. Todos los derechos reservados.
        </p>
      </div>
      <div class="hidden md:block md:flex-1"></div>
    </div>
  </footer>
</template>

<script setup>
</script>
