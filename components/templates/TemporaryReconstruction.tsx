import { View, Text } from "react-native";

export default function TemporaryReconstruction () {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
        margin: 20,
      }}
    >
      <Text style={{ textAlign: "center", fontSize: 48 }}>
        🦋
      </Text>
      <Text style={{ textAlign: "center", fontSize: 20, fontWeight: "bold" }}>
        Cet écran est en reconstruction.
      </Text>
      <Text style={{ textAlign: "center" }}>
        Papillon est en train de se refaire une beauté. Reviens plus tard pour utiliser cette page !
      </Text>
    </View>
  );
}
