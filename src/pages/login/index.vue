<script setup lang="ts">
  import { ref } from "vue";
  import { useRouter } from "vue-router";
  import { toast } from "vue-sonner";
  import { useAuthStore } from "@/stores";
  import { authService } from "@/client";

  const router = useRouter();
  const authStore = useAuthStore();
  const form = ref({ email: "", password: "" });

  const login = async () => {
    authStore.loading = true;
    try {
      const data = await authService.login(form.value.email, form.value.password);
      authStore.userToken = data.token;
      authService.setToken(data.token);
      router.push("/players");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      authStore.loading = false;
    }
  };
</script>

<template>
  <div class="flex justify-center items-center pt-24">
    <div class="card w-96 bg-base-100 shadow-xl">
      <div class="card-body gap-4">
        <h2 class="card-title text-2xl">Đăng nhập</h2>
        <input
          v-model="form.email"
          type="email"
          placeholder="Email"
          class="input input-bordered w-full"
          @keyup.enter="login"
        />
        <input
          v-model="form.password"
          type="password"
          placeholder="Mật khẩu"
          class="input input-bordered w-full"
          @keyup.enter="login"
        />
        <button class="btn btn-primary w-full" :disabled="authStore.loading" @click="login">
          <span v-if="authStore.loading" class="loading loading-spinner loading-sm"></span>
          Đăng nhập
        </button>
        <p class="text-center text-sm">
          Chưa có tài khoản?
          <router-link to="/register" class="link link-primary">Đăng ký</router-link>
        </p>
      </div>
    </div>
  </div>
</template>
