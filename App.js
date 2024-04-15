import React, { useCallback, useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, Button, Linking } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { InAppBrowser } from "react-native-inappbrowser-reborn";
import axios from "axios";

const CLIENT_ID = process.env.EXPO_PUBLIC_CLIENT_ID;
const LOGIN_URL = `https://auth.furo.one/login/${CLIENT_ID}`;

const Stack = createNativeStackNavigator();

export default function App() {
  const linking = {
    prefixes: ["exp://"],
    config: {
      screens: {
        Home: "*",
      },
    },
  };

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const HomeScreen = () => {
  const [accessToken, setAccessToken] = useState(null);

  const openURLFromInAppBrowserOrLinking = useCallback(async (url) => {
    try {
      if (await InAppBrowser.isAvailable()) {
        const response = await InAppBrowser.openAuth(url, "exp://", {
          /**
           * iOS Properties
           * If you want to disable the iOS system dialog, set the property `ephemeralWebSession` to `true`.
           * More info: https://github.com/proyecto26/react-native-inappbrowser?tab=readme-ov-file#ios-options
           */
          ephemeralWebSession: false,

          // Android Properties
          showTitle: false,
          enableUrlBarHiding: true,
          enableDefaultShare: false,
          showInRecents: true,
          forceCloseOnRedirection: true,
        });

        if (response.type === "success" && response.url) {
          console.log(response);
          Linking.openURL(response.url);
        }
      } else {
        Linking.openURL(url);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    const handleDeepLink = ({ url }) => {
      const code = url.split("?")[1]?.match(/code=([^&]+)/)?.[1];
      if (code) {
        authenticateWithCode(code)
          .then((response) => {
            const { access_token } = response;
            setAccessToken(access_token);
          })
          .catch((e) => {
            console.log("error: ", e.response.data);
          });
      }
    };

    Linking.addEventListener("url", handleDeepLink);

    return () => {
      Linking.removeAllListeners("url");
    };
  }, []);

  const authenticateWithCode = async (code) => {
    const { data } = await axios.post("https://api.furo.one/sessions/code/authenticate", { code });
    return data;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>[Furo] React Native Example</Text>
      <View style={styles.content}>
        {accessToken ? (
          <>
            <Text>{accessToken}</Text>
            <Button title="Clear" onPress={() => setAccessToken(null)} />
          </>
        ) : (
          <Button title="Login" onPress={() => openURLFromInAppBrowserOrLinking(LOGIN_URL)} />
        )}
      </View>
      <StatusBar style="auto" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    marginTop: 10,
    width: "80%",
    alignItems: "center",
  },
});
