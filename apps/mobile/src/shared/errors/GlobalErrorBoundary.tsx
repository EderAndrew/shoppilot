import { Component, type ErrorInfo, type ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[GlobalErrorBoundary]", error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Crash detectado</Text>
        <Text style={styles.name}>{error.name}: {error.message}</Text>
        <ScrollView style={styles.scroll}>
          <Text style={styles.stack}>{error.stack}</Text>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", padding: 20, paddingTop: 60 },
  title: { color: "#e94560", fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  name: { color: "#fff", fontSize: 14, marginBottom: 12 },
  scroll: { flex: 1 },
  stack: { color: "#aaa", fontSize: 11, lineHeight: 18, fontFamily: "monospace" },
});
