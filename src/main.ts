import { createApp } from "vue";
import { MotionPlugin } from "@vueuse/motion";

import { createPinia } from "pinia";
import { router } from "./router";
import App from "./App.vue";
import "./style.css";

if (import.meta.env.DEV) {
  await import("@colyseus/sdk/debug");
}

createApp(App).use(createPinia()).use(router).use(MotionPlugin).mount("#app");
