import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { GlobalErrorBoundary } from "../shared/errors/GlobalErrorBoundary";
import { AppProviders } from "../shared/providers/AppProviders";
import { envInitError } from "../shared/config/env";

export default function RootLayout() {
  if (envInitError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Env init error</Text>
        <Text style={styles.name}>{envInitError.message}</Text>
        <ScrollView>
          <Text style={styles.stack}>{envInitError.stack}</Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <GlobalErrorBoundary>
      <AppProviders>
        <StatusBar style="dark" />
        <Slot />
      </AppProviders>
    </GlobalErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", padding: 20, paddingTop: 60 },
  title: { color: "#e94560", fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  name: { color: "#fff", fontSize: 14, marginBottom: 12 },
  stack: { color: "#aaa", fontSize: 11, lineHeight: 18, fontFamily: "monospace" },
});
