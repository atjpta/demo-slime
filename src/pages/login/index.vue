<script setup lang="ts">
  import { ref } from "vue";
  import { toast } from "vue-sonner";
  import { useBattleStore } from "@/store";
  import { http } from "@/api";

  const store = useBattleStore();
  const form = ref({ email: "", password: "" });

  const login = async () => {
    store.loading = true;
    try {
      const data = await http("POST", "/auth/login", form.value);
      store.userToken = data.token;
      store.step = "players";
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      store.loading = false;
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
        <button class="btn btn-primary w-full" :class="{ loading: store.loading }" @click="login">
          Đăng nhập
        </button>
      </div>
    </div>
  </div>
</template>
