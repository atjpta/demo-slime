export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:2567";
export const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:2567";
export const TURNS_PER_WAVE = 5;

export const Phase = {
  WAITING: "waiting",
  SELECTING: "selecting",
  SELECTING_ITEM: "selecting_item",
  PRE_EXECUTING: "pre_executing",
  EXECUTING: "executing",
  ENDED: "ended",
} as const;

export const MAX_ITEM_SLOTS = 3;

export const PHASE_LABEL: Record<string, string> = {
  waiting: "Chờ người chơi...",
  selecting: "Chọn hành động",
  executing: "Đang thi đấu...",
  ended: "Kết thúc",
};

import bronzeImg from "@/assets/imgs/rank/bronze.png";
import silverImg from "@/assets/imgs/rank/silver.png";
import goldImg from "@/assets/imgs/rank/gold.png";
import platinumImg from "@/assets/imgs/rank/platinum.png";
import emeraldImg from "@/assets/imgs/rank/emerald.png";
import diamondImg from "@/assets/imgs/rank/diamond.png";
import masterImg from "@/assets/imgs/rank/master.png";

export type TierCode = "bronze" | "silver" | "gold" | "platinum" | "emerald" | "diamond" | "master";

export const TIER_META: Record<TierCode, { label: string; img: string; color: string }> = {
  bronze: { label: "Đồng", img: bronzeImg, color: "text-amber-600" },
  silver: { label: "Bạc", img: silverImg, color: "text-slate-400" },
  gold: { label: "Vàng", img: goldImg, color: "text-yellow-400" },
  platinum: { label: "Bạch Kim", img: platinumImg, color: "text-cyan-300" },
  emerald: { label: "Lục Bảo", img: emeraldImg, color: "text-green-400" },
  diamond: { label: "Kim Cương", img: diamondImg, color: "text-blue-400" },
  master: { label: "Cao Thủ", img: masterImg, color: "text-purple-500" },
};

export const ITEM_TYPE_META: Record<string, { label: string; badgeClass: string }> = {
  BUFF: { label: "Buff", badgeClass: "badge-success" },
  INFO: { label: "Thông Tin", badgeClass: "badge-info" },
  BLUFF: { label: "Lừa Đảo", badgeClass: "badge-warning" },
  TEMPO: { label: "Tốc Độ", badgeClass: "badge-warning" },
  CHAOS: { label: "Hỗn Loạn", badgeClass: "badge-error" },
};

export const ITEM_META: Record<
  string,
  { icon: string; label: string; description: string; needsTurnPick?: boolean }
> = {
  heal_001: { icon: "🧪", label: "Hồi Máu", description: "Hồi phục 20% HP tối đa" },
  damage_001: {
    icon: "🔥",
    label: "Tăng Sát Thương",
    description: "Tăng sát thương ×2 cho 1 lượt được chọn",
    needsTurnPick: true,
  },
  // insight_001: {
  //   icon: "🔍",
  //   label: "Tiên Tri",
  //   description: "Xem & sửa 1 hành động của đối thủ",
  // },
  // insight_002: {
  //   icon: "👁️",
  //   label: "Tiên Tri II",
  //   description: "Làm nổi bật 3 hành động liên tiếp giống nhau",
  // },
  // insight_003: {
  //   icon: "📊",
  //   label: "Tiên Tri III",
  //   description: "Làm nổi bật loại hành động phổ biến nhất",
  // },
  // fake_intent_001: {
  //   icon: "🎭",
  //   label: "Nghi Binh",
  //   description: "Trả dữ liệu giả khi đối thủ dùng INFO",
  // },
  // mirror_001: { icon: "🪞", label: "Gương Phản", description: "Sao chép item đối thủ đang dùng" },
  push_001: {
    icon: "⏩",
    label: "Push push push!!",
    description: "Đẩy hành động đối thủ về trước 1 lượt",
  },
  shuffle_001: {
    icon: "🔀",
    label: "Xáo Trộn",
    description: "Xáo trộn các hành động của đối phương",
  },
  storm_001: {
    icon: "🌪️",
    label: "Bão Tố",
    description: "Xáo trộn hành động của cả hai người chơi",
  },
  // paradox_001: {
  //   icon: "♾️",
  //   label: "Nghịch Lý",
  //   description: "Đảo ngược luật counter trong wave này",
  // },
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
