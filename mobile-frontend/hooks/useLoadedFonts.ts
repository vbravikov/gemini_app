import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_400Regular_Italic,
  Poppins_500Medium,
  Poppins_500Medium_Italic,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { useFonts } from "expo-font";

export function useLoadedFonts() {
  const [loaded, error] = useFonts({
    bold: Poppins_700Bold,
    light: Poppins_300Light,
    medium: Poppins_500Medium,
    semibold: Poppins_600SemiBold,
    italics: Poppins_400Regular_Italic,
    "semibold-italics": Poppins_500Medium_Italic,
    Poppins: Poppins_400Regular,
  });

  return [loaded, error];
}
