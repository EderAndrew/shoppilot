import { Archive, List, User } from "@tamagui/lucide-icons-2";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="lists"
        options={{
          title: "Listas",
          headerShown: false,
          tabBarAccessibilityLabel: "Listas",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <List color={color as any} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="archived"
        options={{
          title: "Arquivados",
          headerShown: false,
          tabBarAccessibilityLabel: "Arquivados",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <Archive color={color as any} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="user"
        options={{
          title: "Usuário",
          headerShown: false,
          tabBarAccessibilityLabel: "Usuário",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <User color={color as any} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
