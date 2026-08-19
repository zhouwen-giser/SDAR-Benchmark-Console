import { theme, type ThemeConfig } from "antd";
import tokenSource from "../../design/design-tokens.json";

const colors = tokenSource.colors;

export const darkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: colors.accentBlue,
    colorBgBase: colors.canvas,
    colorBgContainer: colors.surface1,
    colorBgElevated: colors.surface2,
    colorBorder: colors.border,
    colorText: colors.textPrimary,
    colorTextSecondary: colors.textSecondary,
    colorTextTertiary: colors.textMuted,
    colorSuccess: colors.positive,
    colorWarning: colors.warning,
    colorError: colors.danger,
    borderRadius: tokenSource.layout.cardRadius,
    fontFamily: tokenSource.typography.fontFamily.join(", "),
    fontSize: 13,
    controlHeight: 30,
    wireframe: false,
  },
  components: {
    Button: {
      defaultBg: colors.surface2,
      defaultBorderColor: colors.border,
      defaultColor: colors.textPrimary,
    },
    Card: {
      colorBgContainer: colors.surface1,
      headerBg: "transparent",
      paddingLG: 12,
    },
    Table: {
      headerBg: "#0f1f2d",
      headerColor: colors.textSecondary,
      rowHoverBg: "#10263a",
      borderColor: "#1b3044",
      cellPaddingBlock: 9,
      cellPaddingInline: 10,
    },
    Drawer: {
      colorBgElevated: "#081522",
    },
    Select: {
      selectorBg: colors.surface1,
      optionSelectedBg: "#173a61",
    },
    Segmented: {
      itemSelectedBg: "#1b4f85",
      trackBg: colors.surface1,
    },
  },
};

export const chartPalette = {
  canvas: colors.canvas,
  surface: colors.surface1,
  border: colors.border,
  text: colors.textPrimary,
  muted: colors.textSecondary,
  blue: colors.accentBlue,
  positive: colors.positive,
  warning: colors.warning,
  orange: colors.orange,
  danger: colors.danger,
  fatal: colors.fatal,
  notReady: colors.notReady,
  diagnostic: colors.diagnostic,
};
