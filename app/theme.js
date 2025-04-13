// app/theme.js
import { DefaultTheme } from "react-native-paper";

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#6200ee",
    accent: "#03dac4",
    background: "#f5f5f5",
    surface: "#ffffff",
    error: "#B00020",
    text: "#000000",
    onSurface: "#000000",
    disabled: "rgba(0, 0, 0, 0.26)",
    placeholder: "rgba(0, 0, 0, 0.54)",
    backdrop: "rgba(0, 0, 0, 0.5)",
    notification: "#f50057",
  },
};

export default theme;
