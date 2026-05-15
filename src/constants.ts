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
  "attack-001": { icon: "⚔️", label: "Tấn Công", color: "btn-error" },
  "spell-001": { icon: "✨", label: "Phép Thuật", color: "btn-info" },
  "defense-001": { icon: "🛡️", label: "Phòng Thủ", color: "btn-success" },
};

export enum SkillType {
  ATTACK = "attack",
  SPELL = "spell",
  DEFENSE = "defense",
}

const genKeyMapCounter = (skillTypes: SkillType[]) => {
  return skillTypes.join("_vs_");
};

// key = "mySkillType_vs_opponentSkillType"
// win: true = tôi counter được đối phương, false = tôi bị counter
export const SKILL_COUNTER: Record<
  string,
  { icon: string; label: string; color: string; win: boolean }
> = {
  // Tôi thắng
  [genKeyMapCounter([SkillType.DEFENSE, SkillType.ATTACK])]: {
    icon: "🔄",
    label: "Parry",
    color: "badge-success",
    win: true,
  },
  [genKeyMapCounter([SkillType.ATTACK, SkillType.SPELL])]: {
    icon: "⚡",
    label: "Interrupt",
    color: "badge-success",
    win: true,
  },
  [genKeyMapCounter([SkillType.SPELL, SkillType.DEFENSE])]: {
    icon: "💥",
    label: "Break",
    color: "badge-success",
    win: true,
  },
  // Tôi thua
  [genKeyMapCounter([SkillType.ATTACK, SkillType.DEFENSE])]: {
    icon: "🔄",
    label: "Parried",
    color: "badge-error",
    win: false,
  },
  [genKeyMapCounter([SkillType.SPELL, SkillType.ATTACK])]: {
    icon: "⚡",
    label: "Interrupted",
    color: "badge-error",
    win: false,
  },
  [genKeyMapCounter([SkillType.DEFENSE, SkillType.SPELL])]: {
    icon: "💥",
    label: "Broken",
    color: "badge-error",
    win: false,
  },
};
