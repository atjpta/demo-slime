import { ref, watch } from "vue";
import { defineStore } from "pinia";

const LS_PLAYER_TOKEN = "slime_player_token";

export const usePlayerStore = defineStore("player", () => {
  const playerToken = ref(localStorage.getItem(LS_PLAYER_TOKEN) ?? "");
  const myPlayer = ref<any>(null);
  const myPlayerId = ref("");

  watch(playerToken, (val) => {
    if (val) localStorage.setItem(LS_PLAYER_TOKEN, val);
    else localStorage.removeItem(LS_PLAYER_TOKEN);
  });

  return { playerToken, myPlayer, myPlayerId };
});
