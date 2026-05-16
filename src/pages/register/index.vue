<script setup lang="ts">
  import { ref } from "vue";
  import { useRouter } from "vue-router";
  import { toast } from "vue-sonner";
  import { useAuthStore } from "@/stores";
  import { authService } from "@/client";

  const router = useRouter();
  const authStore = useAuthStore();
  const form = ref({ email: "", password: "", confirmPassword: "" });

  const register = async () => {
    if (form.value.password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (form.value.password !== form.value.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    authStore.loading = true;
    try {
      await authService.register(form.value.email, form.value.password);
      toast.success("Đăng ký thành công! Hãy đăng nhập.");
      router.push("/login");
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
        <h2 class="card-title text-2xl">Đăng ký</h2>
        <input
          v-model="form.email"
          type="email"
          placeholder="Email"
          class="input input-bordered w-full"
        />
        <input
          v-model="form.password"
          type="password"
          placeholder="Mật khẩu (tối thiểu 6 ký tự)"
          class="input input-bordered w-full"
        />
        <input
          v-model="form.confirmPassword"
          type="password"
          placeholder="Xác nhận mật khẩu"
          class="input input-bordered w-full"
          @keyup.enter="register"
        />
        <button
          class="btn btn-primary w-full"
          :class="{ loading: authStore.loading }"
          @click="register"
        >
          Đăng ký
        </button>
        <p class="text-center text-sm">
          Đã có tài khoản?
          <router-link to="/login" class="link link-primary">Đăng nhập</router-link>
        </p>
      </div>
    </div>
  </div>
</template>
