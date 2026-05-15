export const API_URL = "http://localhost:2567";
export const WS_URL = "ws://localhost:2567";
export const TURNS_PER_WAVE = 5;

export const Phase = {
  WAITING: "waiting",
  SELECTING: "selecting",
  EXECUTING: "executing",
  ENDED: "ended",
} as const;

export const PHASE_LABEL: Record<string, string> = {
  waiting: "Chờ người chơi...",
  selecting: "Chọn hành động",
  executing: "Đang thi đấu...",
  ended: "Kết thúc",
};

export const SKILL_META: Record<string, { icon: string; label: string; color: string }> = {
  attack: { icon: "⚔️", label: "Tấn Công", color: "btn-error" },
  spell: { icon: "✨", label: "Phép Thuật", color: "btn-info" },
  defense: { icon: "🛡️", label: "Phòng Thủ", color: "btn-success" },
};
