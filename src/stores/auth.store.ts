import { ref, watch } from "vue";
import { defineStore } from "pinia";

const LS_USER_TOKEN = "slime_user_token";

export const useAuthStore = defineStore("auth", () => {
  const loading = ref(false);
  const userToken = ref(localStorage.getItem(LS_USER_TOKEN) ?? "");

  watch(userToken, (val) => {
    if (val) localStorage.setItem(LS_USER_TOKEN, val);
    else localStorage.removeItem(LS_USER_TOKEN);
  });

  return { loading, userToken };
});
