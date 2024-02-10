import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, Button, View } from "react-native";
import Intercom from "@intercom/intercom-react-native";

export default function App() {
  useEffect(() => {
    Intercom.loginUnidentifiedUser();
  }, []);

  return (
    <View style={styles.container}>
      <Button
        title="Open Intercom"
        onPress={() => {
          Intercom.present();
        }}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
