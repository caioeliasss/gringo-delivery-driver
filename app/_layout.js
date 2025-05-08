// app/_layout.js
import { Stack } from "expo-router";
import { AuthProvider } from "./context/AuthContext";
import {
  SuccessAnimationProvider,
  SuccessAnimationConnector,
} from "./services/successAnimationService";

export default function RootLayout() {
  return (
    <AuthProvider>
      <SuccessAnimationProvider>
        <SuccessAnimationConnector />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: "#EB2E3E", // Gringo red color
            },
            headerTintColor: "#FFFFFF",
            headerTitleStyle: {
              fontWeight: "bold",
            },
            headerShown: false,
          }}
        />
      </SuccessAnimationProvider>
    </AuthProvider>
  );
}
