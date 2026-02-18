import { useTheme } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import {
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
} from "expo-camera";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function App() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const cameraRef = useRef<CameraView | null>(null);
  const theme = useTheme();

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.background, padding: 40 },
        ]}
      >
        <MaterialIcons
          name="camera-alt"
          size={64}
          color={theme.textMuted}
          style={{ marginBottom: 20 }}
        />
        <Text style={[styles.message, { color: theme.text }]}>
          We need your permission to show the camera for scanning your meals.
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: theme.tint }]}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current && !isProcessing) {
      try {
        setIsProcessing(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
        });

        if (photo) {
          router.push({
            pathname: "/meal-info",
            params: { photoUri: photo.uri },
          });
        }
      } catch (error) {
        console.error("Failed to take picture:", error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        router.push({
          pathname: "/meal-info",
          params: { photoUri: result.assets[0].uri },
        });
      }
    } catch (error) {
      console.error("Failed to pick image:", error);
    }
  };

  const toggleFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
    Haptics.selectionAsync();
  };

  const toggleFlash = () => {
    setFlash((current) => (current === "off" ? "on" : "off"));
    Haptics.selectionAsync();
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        enableTorch={flash === "on"}
      >
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.iconButton} onPress={toggleFlash}>
            <MaterialIcons
              name={flash === "on" ? "flash-on" : "flash-off"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>

        {/* Framing Guide */}
        <View style={styles.guideContainer}>
          <View style={styles.guideBox}>
            <View style={[styles.guideCorner, styles.topLeft]} />
            <View style={[styles.guideCorner, styles.topRight]} />
            <View style={[styles.guideCorner, styles.bottomLeft]} />
            <View style={[styles.guideCorner, styles.bottomRight]} />

            <View style={styles.guideTextContainer}>
              <Text style={styles.guideText}>Center your meal</Text>
            </View>
          </View>
        </View>

        {/* Bottom Controls */}
        <BlurView intensity={40} tint="dark" style={styles.bottomBlur}>
          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.sideButton} onPress={pickImage}>
              <MaterialIcons name="photo-library" size={28} color="white" />
              <Text style={styles.sideButtonText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shutterContainer}
              onPress={takePicture}
              disabled={isProcessing}
            >
              <View style={styles.shutterOuter}>
                <View
                  style={[
                    styles.shutterInner,
                    isProcessing && { opacity: 0.5 },
                  ]}
                >
                  {isProcessing && <ActivityIndicator color="black" />}
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sideButton} onPress={toggleFacing}>
              <MaterialIcons name="flip-camera-ios" size={28} color="white" />
              <Text style={styles.sideButtonText}>Flip</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  message: {
    textAlign: "center",
    fontSize: 16,
    marginBottom: 24,
    fontFamily: "medium",
    lineHeight: 24,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: "white",
    fontFamily: "bold",
    fontSize: 16,
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  topControls: {
    position: "absolute",
    top: 60,
    right: 20,
    gap: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  guideContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  guideBox: {
    width: SCREEN_WIDTH * 0.75,
    height: SCREEN_WIDTH * 0.75,
    position: "relative",
  },
  guideCorner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
  },
  guideTextContainer: {
    position: "absolute",
    bottom: -40,
    width: "100%",
    alignItems: "center",
  },
  guideText: {
    color: "white",
    fontSize: 14,
    fontFamily: "semibold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bottomBlur: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 50,
    paddingTop: 20,
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  shutterContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  sideButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
  },
  sideButtonText: {
    color: "white",
    fontSize: 12,
    marginTop: 4,
    fontFamily: "medium",
  },
});
