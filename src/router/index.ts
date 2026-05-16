import { createRouter, createWebHashHistory } from "vue-router";
import LoginPage from "@/pages/login/index.vue";
import RegisterPage from "@/pages/register/index.vue";
import HistoryPage from "@/pages/history/index.vue";
import ReplayPage from "@/pages/history/replay/index.vue";
import PlayersPage from "@/pages/players/index.vue";
import LobbyPage from "@/pages/lobby/index.vue";
import QueuePage from "@/pages/queue/index.vue";
import BattlePage from "@/pages/battle/index.vue";

const routes = [
  { path: "/", redirect: "/lobby" },
  { path: "/login", name: "login", component: LoginPage },
  { path: "/register", name: "register", component: RegisterPage },
  { path: "/players", name: "players", component: PlayersPage },
  { path: "/lobby", name: "lobby", component: LobbyPage },
  { path: "/queue", name: "queue", component: QueuePage },
  { path: "/battle", name: "battle", component: BattlePage },
  { path: "/history", name: "history", component: HistoryPage },
  { path: "/history/:id", name: "replay", component: ReplayPage },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

const LS_USER_TOKEN = "slime_user_token";
const LS_PLAYER_TOKEN = "slime_player_token";

router.beforeEach((to) => {
  const hasUser = !!localStorage.getItem(LS_USER_TOKEN);
  const hasPlayer = !!localStorage.getItem(LS_PLAYER_TOKEN);

  if (!hasUser && to.name !== "login" && to.name !== "register") return { name: "login" };
  if (hasUser && !hasPlayer && to.name !== "players" && to.name !== "login" && to.name !== "history" && to.name !== "replay")
    return { name: "players" };
  if (hasUser && hasPlayer && (to.name === "login" || to.name === "players"))
    return { name: "lobby" };
});
