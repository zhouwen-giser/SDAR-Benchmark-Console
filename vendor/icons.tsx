import type { HTMLAttributes } from "react";

function makeIcon(glyph: string) {
  return function Icon({ className = "", ...props }: HTMLAttributes<HTMLSpanElement>) {
    return <span {...props} className={`anticon ${className}`} aria-hidden="true">{glyph}</span>;
  };
}

export const AlertOutlined = makeIcon("◈");
export const ApiOutlined = makeIcon("⌘");
export const AreaChartOutlined = makeIcon("⌁");
export const ArrowRightOutlined = makeIcon("→");
export const BarChartOutlined = makeIcon("▥");
export const BgColorsOutlined = makeIcon("◐");
export const CheckCircleFilled = makeIcon("●");
export const ClockCircleOutlined = makeIcon("◷");
export const CloseCircleFilled = makeIcon("⊗");
export const CloudSyncOutlined = makeIcon("↻");
export const DatabaseOutlined = makeIcon("▤");
export const DiffOutlined = makeIcon("⇄");
export const ExclamationCircleFilled = makeIcon("!");
export const ExperimentOutlined = makeIcon("◇");
export const EyeOutlined = makeIcon("◉");
export const FileTextOutlined = makeIcon("▧");
export const FilterFilled = makeIcon("▼");
export const FilterOutlined = makeIcon("▽");
export const FundProjectionScreenOutlined = makeIcon("▦");
export const LeftOutlined = makeIcon("←");
export const LinkOutlined = makeIcon("↗");
export const MenuFoldOutlined = makeIcon("≪");
export const MenuUnfoldOutlined = makeIcon("≫");
export const RadarChartOutlined = makeIcon("◎");
export const ReloadOutlined = makeIcon("↻");
export const SafetyCertificateOutlined = makeIcon("◆");
export const SettingOutlined = makeIcon("⚙");
export const SwapOutlined = makeIcon("⇆");
export const WarningFilled = makeIcon("▲");
